import type { NextApiRequest, NextApiResponse } from "next";
import { getAiConfig } from "features/chatbot/ai/config";
import { checkBotGuard } from "features/chatbot/server/botGuard";
import { clientIp } from "features/chatbot/server/clientIp";
import { ContactInputSchema, submitContact } from "features/chatbot/server/contactService";

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };

/**
 * POST /api/contact  { name, email, message, website?, startedAt? }
 * Same bot guard as /api/chat (origin, X-Chat-Client header, JSON, UA),
 * then honeypot, time trap, spam and per-IP checks in submitContact.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const guard = checkBotGuard(req.headers, getAiConfig().botGuard);
  if (!guard.ok) {
    console.warn(JSON.stringify({ event: "contact_blocked", reason: guard.reason }));
    return res.status(guard.status).json({ error: "Please send your message from the website." });
  }

  const parsed = ContactInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });

  const ip = clientIp(req.headers, req.socket.remoteAddress);
  try {
    const result = await submitContact(parsed.data, ip, "contact-page");
    if (!result.ok) {
      console.warn(JSON.stringify({ event: "contact_rejected", reason: result.reason }));
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[contact] save failed:", (err as Error).message);
    return res.status(500).json({ error: "Couldn't send right now. Please try again later." });
  }
}
