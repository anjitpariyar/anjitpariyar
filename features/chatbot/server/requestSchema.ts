import { z } from "zod";

export const MAX_MESSAGE_CHARS = 500;

/** POST /api/chat body. Context is validated again against real records. */
export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is empty").max(MAX_MESSAGE_CHARS, "Message is too long"),
  /** Random per-conversation id from the browser, used only to group chat logs. */
  sessionId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).optional().catch(undefined),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(4_000) }))
    .max(40)
    .default([]),
  context: z.unknown().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
