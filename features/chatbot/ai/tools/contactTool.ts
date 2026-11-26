import { z } from "zod";
import type { HistoryItem } from "../../engine/conversationManager";
import type { ToolCall, ToolDefinition, ToolResult } from "../llm/llmProvider";

/**
 * The one tool that writes: it sends a visitor's message to Anjit's inbox.
 * The model only proposes the call; the server decides whether it runs:
 *   - the email must have been typed by the visitor (no invented addresses),
 *   - the previous assistant turn must have read the email back, i.e. the
 *     model showed a summary and the visitor answered it (confirmation step),
 *   - one message per chat turn; the sender applies the per-IP limit and
 *     spam checks shared with POST /api/contact.
 */
export const CONTACT_TOOL_NAME = "sendMessageToAnjit";

export type ContactMessage = { name: string; email: string; message: string };

export type ContactSender = {
  /** Throws when the message is refused; an error with `reason: "rate_limited"` means too many. */
  send: (msg: ContactMessage) => Promise<void>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ARGS = z
  .object({
    name: z.string().trim().min(1).max(100).describe("The visitor's name, as they gave it"),
    email: z.string().trim().max(200).regex(EMAIL_RE, "not a valid email").describe("The visitor's email, exactly as they typed it"),
    message: z
      .string()
      .trim()
      .min(5)
      .max(3000)
      .describe("The visitor's message to Anjit, in their words (lightly tidied, never invented)"),
  })
  .strict();

const jsonSchema = (() => {
  const s = z.toJSONSchema(ARGS) as Record<string, unknown>;
  delete s.$schema;
  return s;
})();

export const CONTACT_TOOL_DEFINITION: ToolDefinition = {
  name: CONTACT_TOOL_NAME,
  description:
    "Send the visitor's message to Anjit's inbox. Call ONLY after you have collected name, email and message, " +
    "read them back to the visitor, and the visitor has clearly confirmed (e.g. 'yes', 'send it') in their latest message.",
  parameters: jsonSchema,
};

const fail = (error: string): ToolResult => ({ ok: false, response: { sent: false, error }, records: [] });

export function createContactExecutor(input: { sender: ContactSender; history: HistoryItem[]; currentMessage: string }) {
  const visitorText = [...input.history.filter((h) => h.role === "user").map((h) => h.text), input.currentMessage]
    .join("\n")
    .toLowerCase();
  const lastAssistant = [...input.history].reverse().find((h) => h.role === "assistant")?.text.toLowerCase() ?? "";
  let used = false;

  return async function execute(call: ToolCall): Promise<ToolResult> {
    const parsed = ARGS.safeParse(call.args ?? {});
    if (!parsed.success) {
      return fail(`Invalid details: ${parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ")}. Ask the visitor for the missing or invalid detail.`);
    }
    const msg = parsed.data;
    const email = msg.email.toLowerCase();

    if (used) return fail("A message was already sent this turn.");
    if (!visitorText.includes(email)) {
      return fail("The visitor has not typed this email address. Ask them for their email; never guess it.");
    }
    if (!lastAssistant.includes(email)) {
      return fail("Not confirmed yet. Read the name, email and message back to the visitor and ask them to confirm before sending.");
    }
    used = true;
    try {
      await input.sender.send(msg);
      return { ok: true, response: { sent: true, to: "Anjit", replyTo: msg.email }, records: [] };
    } catch (err) {
      used = false;
      const reason = (err as { reason?: string }).reason;
      if (reason === "rate_limited") {
        return fail("Too many messages from this visitor recently. Suggest emailing Anjit directly using the contact card.");
      }
      if (reason) return fail(`Refused: ${(err as Error).message} Tell the visitor and help them fix it.`);
      console.error("[chat] contact message failed:", (err as Error).message);
      return fail("The inbox is temporarily unavailable. Apologise briefly and show the contact card so they can email directly.");
    }
  };
}
