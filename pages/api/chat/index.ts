import type { NextApiRequest, NextApiResponse } from "next";
import { waitUntil } from "@vercel/functions";
import { getAiConfig } from "features/chatbot/ai/config";
import { handleChat } from "features/chatbot/server/chatService";
import { logChat, type ChatLogEntry } from "features/chatbot/server/chatLog";
import { getKnowledge } from "features/chatbot/server/knowledgeStore";
import { checkBotGuard, createDailyCap } from "features/chatbot/server/botGuard";
import { clientIp } from "features/chatbot/server/clientIp";
import { createContactSender } from "features/chatbot/server/contactService";
import { getLlmProvider } from "features/chatbot/server/providers";
import { createRateLimiter } from "features/chatbot/server/rateLimit";
import { ChatRequestSchema } from "features/chatbot/server/requestSchema";

export const config = {
  api: { bodyParser: { sizeLimit: "32kb" } },
  maxDuration: 30,
};

const limiter = createRateLimiter(getAiConfig().rateLimit);
const aiDailyCap = createDailyCap(getAiConfig().botGuard.aiDailyLimit);
/** Rejected requests are logged at most this often per IP, so a flood can't fill the table. */
const rejectedLogLimiter = createRateLimiter({ perMinute: 5, perHour: 30 });

const header = (req: NextApiRequest, name: string) => {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v) ?? null;
};

/**
 * Logs after the response is sent, so the visitor never waits on Supabase.
 * waitUntil keeps the Vercel function alive until the write finishes; off
 * Vercel it's a no-op and the promise just runs. logChat never throws.
 */
const logAfter = (entry: ChatLogEntry) => waitUntil(logChat(entry));

/** Best-effort read of fields from a body that may not have passed validation. */
function bodyField(req: NextApiRequest, name: "message" | "sessionId"): string | null {
  const value = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>)[name] : null;
  return typeof value === "string" ? value : null;
}

/**
 * POST /api/chat
 * Body: { message: string, sessionId?: string, history?: {role, text}[], context?: object }
 * Returns: { reply, context, meta }. Each request is logged to chat_logs when
 * SUPABASE_SERVICE_ROLE_KEY is set (see features/chatbot/server/chatLog.ts).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const started = Date.now();
  const ip = clientIp(req.headers, req.socket.remoteAddress);
  const base: Omit<ChatLogEntry, "status"> = {
    ip,
    country: header(req, "x-vercel-ip-country") ?? header(req, "cf-ipcountry"),
    userAgent: header(req, "user-agent"),
    sessionId: bodyField(req, "sessionId"),
    message: bodyField(req, "message"),
  };
  const logRejected = (entry: Pick<ChatLogEntry, "status" | "blockReason">) => {
    if (rejectedLogLimiter(ip).ok) logAfter({ ...base, ...entry, latencyMs: Date.now() - started });
  };

  const guard = checkBotGuard(req.headers, getAiConfig().botGuard);
  if (!guard.ok) {
    console.warn(JSON.stringify({ event: "chat_blocked", reason: guard.reason }));
    logRejected({ status: "blocked", blockReason: guard.reason });
    return res.status(guard.status).json({ error: "This endpoint is only available from the chat page." });
  }

  const limit = limiter(ip);
  if (!limit.ok) {
    logRejected({ status: "rate_limited" });
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res.status(429).json({
      error: "You're sending messages a bit quickly. Please wait a moment and try again.",
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "Invalid request";
    logRejected({ status: "invalid", blockReason: error });
    return res.status(400).json({ error });
  }

  try {
    const config = getAiConfig();
    const body = await handleChat(parsed.data, {
      getKnowledge,
      // Past the daily cap, answer with the free rule-based engine.
      llm: aiDailyCap() ? getLlmProvider() : null,
      config,
      log: (event) => console.info(JSON.stringify(event)),
      contact: createContactSender(ip, parsed.data.sessionId ?? null),
    });
    res.status(200).json(body);
    logAfter({ ...base, status: "answered", message: parsed.data.message, response: body });
    return;
  } catch (err) {
    console.error("[chat] unhandled error:", (err as Error).message);
    res.status(500).json({ error: "Something went wrong on our side. Please try again." });
    logAfter({ ...base, status: "error", blockReason: (err as Error).message.slice(0, 200), latencyMs: Date.now() - started });
    return;
  }
}
