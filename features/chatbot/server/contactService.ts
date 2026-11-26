import { z } from "zod";
import type { ContactSender } from "../ai/tools/contactTool";
import { saveContactMessage } from "./contactInbox";
import { assertServer } from "./guard";
import { createRateLimiter } from "./rateLimit";

assertServer("contactService");

/**
 * The single path a message takes to Anjit's inbox, used by POST /api/contact
 * (the /contact page form) and by the chat AI's sendMessageToAnjit tool.
 *
 * Anti-bot, on top of the route's bot guard (origin, client header, UA):
 *   - per-IP limit, shared by both entry points,
 *   - honeypot field: real people never see or fill it,
 *   - time trap: a form submitted under 3 s after render is a script,
 *   - content checks: link-stuffed or duplicate messages are rejected.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ContactInputSchema = z.object({
  name: z.string().trim().min(1, "Please add your name").max(100),
  email: z.string().trim().max(200).regex(EMAIL_RE, "Please enter a valid email"),
  message: z.string().trim().min(5, "Please write a short message").max(3000),
  /** Honeypot: hidden input, must stay empty. No max: any value gets the fake success, never a 400. */
  website: z.string().optional(),
  /** ms timestamp when the form was rendered (form only). */
  startedAt: z.number().optional(),
});
export type ContactInput = z.infer<typeof ContactInputSchema>;

export type ContactSource = "contact-page" | "chatbot-ai";
export type SubmitResult = { ok: true } | { ok: false; status: number; error: string; reason: string };

const limiter = createRateLimiter({ perMinute: 1, perHour: 3 });
const recent = new Map<string, number>(); // message fingerprint -> time
const MIN_FILL_MS = 3_000;
const MAX_LINKS = 2;

const fingerprint = (i: Pick<ContactInput, "email" | "message">) => `${i.email.toLowerCase()}|${i.message.toLowerCase().replace(/\s+/g, " ")}`;

export async function submitContact(
  input: ContactInput,
  ip: string,
  source: ContactSource,
  now = Date.now(),
  sessionId: string | null = null
): Promise<SubmitResult> {
  // Bots get a fake success so they don't learn what tripped them.
  if (input.website) return { ok: true };
  if (source === "contact-page" && (!input.startedAt || now - input.startedAt < MIN_FILL_MS)) {
    return { ok: false, status: 400, error: "Please take a moment and try again.", reason: "too_fast" };
  }
  if ((input.message.match(/https?:\/\/|www\./gi) ?? []).length > MAX_LINKS) {
    return { ok: false, status: 400, error: "Please include fewer links in your message.", reason: "too_many_links" };
  }

  const fp = fingerprint(input);
  for (const [k, t] of recent) if (now - t > 3_600_000) recent.delete(k);
  if (recent.has(fp)) return { ok: true }; // duplicate: already delivered

  if (!limiter(ip).ok) {
    return { ok: false, status: 429, error: "Too many messages. Please try again later or email directly.", reason: "rate_limited" };
  }

  await saveContactMessage({ name: input.name, email: input.email, message: input.message, source, sessionId });
  recent.set(fp, now);
  console.info(JSON.stringify({ event: "contact_sent", source }));
  return { ok: true };
}

/** Sender for the chat AI tool, bound to the visitor's IP and chat session. */
export function createContactSender(ip: string, sessionId: string | null = null): ContactSender {
  return {
    send: async (msg) => {
      const r = await submitContact(msg, ip, "chatbot-ai", Date.now(), sessionId);
      if (!r.ok) throw new ContactRejected(r.error, r.reason);
    },
  };
}

export class ContactRejected extends Error {
  constructor(message: string, readonly reason: string) {
    super(message);
  }
}
