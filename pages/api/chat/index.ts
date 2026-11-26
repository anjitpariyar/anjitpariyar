import type { NextApiRequest, NextApiResponse } from "next";
import { getAiConfig } from "features/chatbot/ai/config";
import { handleChat } from "features/chatbot/server/chatService";
import { getKnowledge } from "features/chatbot/server/knowledgeStore";
import { getLlmProvider } from "features/chatbot/server/providers";
import { createRateLimiter } from "features/chatbot/server/rateLimit";
import { ChatRequestSchema } from "features/chatbot/server/requestSchema";

export const config = {
  api: { bodyParser: { sizeLimit: "32kb" } },
  maxDuration: 30,
};

const limiter = createRateLimiter(getAiConfig().rateLimit);

function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "unknown";
}

/**
 * POST /api/chat
 * Body: { message: string, history?: {role, text}[], context?: object }
 * Returns: { reply, context, meta }. Visitor messages are not stored.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const limit = limiter(clientIp(req));
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res.status(429).json({
      error: "You're sending messages a bit quickly. Please wait a moment and try again.",
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
  }

  try {
    const config = getAiConfig();
    const body = await handleChat(parsed.data, {
      getKnowledge,
      llm: getLlmProvider(),
      config,
      log: (event) => console.info(JSON.stringify(event)),
    });
    return res.status(200).json(body);
  } catch (err) {
    console.error("[chat] unhandled error:", (err as Error).message);
    return res.status(500).json({ error: "Something went wrong on our side. Please try again." });
  }
}
