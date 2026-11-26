import type { ZodType } from "zod";
import type { RecordRef } from "../context/contextProvider";

/**
 * LLM provider contract. Orchestration depends only on this, so Gemini can be
 * replaced without touching data access, conversation handling or the UI.
 */
export type LlmMessage = { role: "user" | "model"; text: string };

export type LlmRequest = {
  system: string;
  messages: LlmMessage[];
  maxOutputTokens?: number;
  temperature?: number;
};

export type LlmUsage = { inputTokens: number; outputTokens: number; calls: number };

/** A function the model may call; `parameters` is JSON Schema. */
export type ToolDefinition = { name: string; description: string; parameters: Record<string, unknown> };
export type ToolCall = { id?: string; name: string; args: Record<string, unknown> };
export type ToolResult = {
  ok: boolean;
  /** Returned to the model verbatim. */
  response: Record<string, unknown>;
  /** Records disclosed to the model by this call (allowed as card ids / sources). */
  records: RecordRef[];
};

export type ToolSet = {
  definitions: ToolDefinition[];
  execute: (call: ToolCall) => Promise<ToolResult>;
  /** Max model<->tool round trips before the model must answer. */
  maxRounds: number;
};

export type ToolCallLog = { name: string; args: Record<string, unknown>; ok: boolean };

export type StructuredResult<T> = {
  /** Parsed JSON; validated field-by-field by the caller even when `parsed` failed. */
  raw: unknown;
  parsed: { success: true; data: T } | { success: false; error: string };
  usage: LlmUsage;
  toolCalls: ToolCallLog[];
  /** Model that produced the answer (may be a fallback model). */
  model: string;
};

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  generateResponse(request: LlmRequest): Promise<{ text: string; usage: LlmUsage }>;
  generateStructuredResponse<T>(
    request: LlmRequest & { schema: ZodType<T>; jsonSchema: Record<string, unknown>; tools?: ToolSet }
  ): Promise<StructuredResult<T>>;
}

export type LlmErrorKind =
  | "not_configured"
  | "auth"
  | "quota"
  | "rate_limit"
  | "timeout"
  | "unavailable"
  | "invalid_response"
  | "blocked"
  | "unknown";

export class LlmError extends Error {
  constructor(
    readonly kind: LlmErrorKind,
    message: string,
    readonly status?: number,
    /** Provider's original error text, for server logs only (never sent to visitors). */
    readonly detail?: string
  ) {
    super(message);
    this.name = "LlmError";
  }

  /** Worth trying again later (vs. a configuration problem). */
  get retryable() {
    return ["rate_limit", "timeout", "unavailable", "quota"].includes(this.kind);
  }
}
