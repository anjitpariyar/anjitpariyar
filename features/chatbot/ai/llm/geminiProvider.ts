import { ApiError, GoogleGenAI, type Content, type GenerateContentConfig, type ThinkingLevel } from "@google/genai";
import type { ZodType } from "zod";
import {
  LlmError,
  type LlmProvider,
  type LlmRequest,
  type LlmUsage,
  type StructuredResult,
  type ToolCallLog,
  type ToolSet,
} from "./llmProvider";

type Options = {
  apiKey: string;
  model: string;
  /** Tried in order when the primary model is overloaded or rate limited. */
  fallbackModels?: string[];
  timeoutMs: number;
  thinkingLevel?: string | null;
};

/** Retries per call for transient errors (503 overload, 500, 429 rate limit, a hung call). */
const RETRIES_PER_CALL = 1;
/**
 * How the JSON answer is obtained:
 *  native   = Gemini structured output (responseMimeType + responseJsonSchema);
 *  prompted = schema written into the system prompt, JSON parsed from plain text.
 * Observed Nov 2026: during load spikes native JSON requests got 503s while
 * plain-text requests succeeded, so "prompted" is the fallback. Both are
 * validated by the same Zod schema and response validator downstream.
 */
type JsonStyle = "native" | "prompted";
const PREFER_PROMPTED_MS = 10 * 60_000;
/** A single attempt is abandoned after this, so a hung call can't eat the whole budget. */
const ATTEMPT_TIMEOUT_MS = 9_000;
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), reject(signal.reason)), { once: true });
  });
const isTransient = (e: LlmError) => e.kind === "unavailable" || e.kind === "rate_limit";

/** Map SDK / network failures onto provider-neutral error kinds. */
export function handleProviderError(err: unknown): LlmError {
  if (err instanceof LlmError) return err;
  const e = err as { name?: string; message?: string; status?: number };
  const detail = (e?.message ?? String(err)).slice(0, 500);
  if (e?.name === "AbortError" || e?.name === "TimeoutError" || /aborted|timed? ?out/i.test(e?.message ?? "")) {
    return new LlmError("timeout", "The language model took too long to respond.", undefined, detail);
  }
  const status = err instanceof ApiError ? err.status : e?.status;
  const message = e?.message ?? "Unknown provider error";
  const make = (kind: LlmError["kind"], text: string) => new LlmError(kind, text, status, detail);
  if (status === 400 && /api key/i.test(message)) return make("auth", "Invalid Gemini API key.");
  if (status === 401 || status === 403) return make("auth", "Gemini rejected the credentials.");
  if (status === 429) {
    return /quota|exhausted|billing/i.test(message) ? make("quota", "Gemini quota exhausted.") : make("rate_limit", "Gemini rate limit reached.");
  }
  if (status === 404) return make("not_configured", "Model not found.");
  if (status && status >= 500) return make("unavailable", "Gemini is temporarily unavailable.");
  return make("unknown", "Unexpected provider error.");
}

/** 400 saying function calling can't be combined with JSON output for this model. */
const isToolsPlusJsonUnsupported = (err: unknown) => {
  const e = err as { status?: number; message?: string };
  const status = err instanceof ApiError ? err.status : e?.status;
  return (
    status === 400 &&
    /(function|tool)[\s\S]*(json|mime|schema|structured)|(json|mime|schema|structured)[\s\S]*(function|tool)/i.test(e?.message ?? "")
  );
};

/** JSON object from model text: tolerates code fences or prose around it. */
export function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  return start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
}

export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";
  readonly model: string;
  private readonly fallbackModels: string[];
  private readonly client: GoogleGenAI;
  private readonly timeoutMs: number;
  private readonly thinkingLevel: string | null;
  /** Per model: accepts tools and a response schema in the same call? (learned on first use) */
  private readonly toolsWithJson = new Map<string, boolean>();
  /** Per model: use prompted JSON first until this time (after native JSON failed transiently). */
  private readonly preferPromptedUntil = new Map<string, number>();

  constructor({ apiKey, model, fallbackModels = [], timeoutMs, thinkingLevel }: Options) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
    this.fallbackModels = fallbackModels.filter((m) => m && m !== model);
    this.timeoutMs = timeoutMs;
    this.thinkingLevel = thinkingLevel ?? null;
  }

  private baseConfig(request: LlmRequest, deadline: AbortSignal): GenerateContentConfig {
    return {
      systemInstruction: request.system,
      temperature: request.temperature ?? 0.3,
      maxOutputTokens: request.maxOutputTokens,
      abortSignal: deadline,
      ...(this.thinkingLevel ? { thinkingConfig: { thinkingLevel: this.thinkingLevel as ThinkingLevel } } : {}),
    };
  }

  private toContents(request: LlmRequest): Content[] {
    return request.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
  }

  /** One API call, retried with backoff on transient errors while the overall deadline allows. */
  private async call(model: string, contents: Content[], config: GenerateContentConfig, deadline: AbortSignal) {
    for (let attempt = 0; ; attempt++) {
      const attemptSignal = AbortSignal.any([deadline, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)]);
      try {
        return await this.client.models.generateContent({ model, contents, config: { ...config, abortSignal: attemptSignal } });
      } catch (err) {
        if (deadline.aborted) throw err; // overall budget spent
        const e = handleProviderError(err);
        const retryable = isTransient(e) || e.kind === "timeout"; // timeout here = this attempt only
        if (!retryable || attempt >= RETRIES_PER_CALL) throw err;
        await sleep(300 * (attempt + 1) + Math.random() * 300, deadline);
      }
    }
  }

  /** Run `fn` with the primary model, moving to fallback models while errors are transient. */
  private async withModelFallback<R>(deadline: AbortSignal, fn: (model: string) => Promise<R>): Promise<R> {
    const models = [this.model, ...this.fallbackModels];
    for (let i = 0; ; i++) {
      try {
        return await fn(models[i]);
      } catch (err) {
        const e = handleProviderError(err);
        const moveOn = isTransient(e) || (e.kind === "timeout" && !deadline.aborted);
        if (!moveOn || i === models.length - 1 || deadline.aborted) throw e;
        console.warn(`[chat] ${models[i]} ${e.kind} (${e.status ?? "-"}), trying ${models[i + 1]}`);
      }
    }
  }

  async generateResponse(request: LlmRequest) {
    const deadline = AbortSignal.timeout(this.timeoutMs);
    return this.withModelFallback(deadline, async (model) => {
      const response = await this.call(model, this.toContents(request), this.baseConfig(request, deadline), deadline);
      const text = response.text;
      if (!text) throw new LlmError("invalid_response", "Empty response.");
      return {
        text,
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
          calls: 1,
        },
      };
    });
  }

  /**
   * Structured answer with optional function calling:
   *   model -> (function calls -> server executes -> results back)* -> JSON answer
   * One timeout covers everything, including retries and fallback models.
   * Tools are read-only, so restarting an exchange on another model is safe.
   * The model's own turns are sent back unchanged so thought signatures survive.
   */
  async generateStructuredResponse<T>(
    request: LlmRequest & { schema: ZodType<T>; jsonSchema: Record<string, unknown>; tools?: ToolSet }
  ): Promise<StructuredResult<T>> {
    const deadline = AbortSignal.timeout(this.timeoutMs);
    const usage: LlmUsage = { inputTokens: 0, outputTokens: 0, calls: 0 };
    try {
      return await this.withModelFallback(deadline, async (model) => {
        const preferPrompted = (this.preferPromptedUntil.get(model) ?? 0) > Date.now();
        const styles: JsonStyle[] = preferPrompted ? ["prompted", "native"] : ["native", "prompted"];
        for (let i = 0; ; i++) {
          try {
            const result = await this.exchange(model, request, deadline, usage, styles[i]);
            if (styles[i] === "prompted" && !preferPrompted) {
              this.preferPromptedUntil.set(model, Date.now() + PREFER_PROMPTED_MS);
              console.warn(`[chat] ${model}: native JSON mode failing, using prompted JSON for ${PREFER_PROMPTED_MS / 60_000} min`);
            }
            if (styles[i] === "native") this.preferPromptedUntil.delete(model);
            return result;
          } catch (err) {
            const e = handleProviderError(err);
            const transient = isTransient(e) || (e.kind === "timeout" && !deadline.aborted);
            if (!transient || i === styles.length - 1 || deadline.aborted) throw err;
          }
        }
      });
    } catch (err) {
      throw handleProviderError(err);
    }
  }

  private async exchange<T>(
    model: string,
    request: LlmRequest & { schema: ZodType<T>; jsonSchema: Record<string, unknown>; tools?: ToolSet },
    deadline: AbortSignal,
    usage: LlmUsage,
    style: JsonStyle
  ): Promise<StructuredResult<T>> {
    const contents = this.toContents(request);
    const toolCalls: ToolCallLog[] = [];
    const tools = request.tools?.definitions.length ? request.tools : undefined;
    const prompted = style === "prompted";
    if (prompted) {
      request = {
        ...request,
        system: `${request.system}\n\nRESPONSE FORMAT\nWhen you give your final answer, reply with exactly one JSON object (no prose, no code fences) that matches this JSON Schema:\n${JSON.stringify(request.jsonSchema)}`,
      };
    }
    // Native: ask Gemini for JSON. Prompted: plain text, JSON extracted from it.
    const json = prompted ? {} : { responseMimeType: "application/json", responseJsonSchema: request.jsonSchema };
    const count = (r: { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }) => {
      usage.calls++;
      usage.inputTokens += r.usageMetadata?.promptTokenCount ?? 0;
      usage.outputTokens += r.usageMetadata?.candidatesTokenCount ?? 0;
    };

    for (let round = 0; ; round++) {
      const toolsAllowed = !!tools && round < tools.maxRounds;
      // Combined mode: tools + schema together. Two-step mode: tools first, schema on the final call.
      // (Prompted JSON has no response schema, so tools can always be combined with it.)
      const wantJson = prompted || !toolsAllowed || this.toolsWithJson.get(model) !== false;
      const config: GenerateContentConfig = {
        ...this.baseConfig(request, deadline),
        ...(toolsAllowed
          ? {
              tools: [
                {
                  functionDeclarations: tools!.definitions.map((d) => ({
                    name: d.name,
                    description: d.description,
                    parametersJsonSchema: d.parameters,
                  })),
                },
              ],
            }
          : {}),
        ...(wantJson ? json : {}),
      };

      let response;
      try {
        response = await this.call(model, contents, config, deadline);
      } catch (err) {
        if (!prompted && toolsAllowed && wantJson && !this.toolsWithJson.has(model) && isToolsPlusJsonUnsupported(err)) {
          this.toolsWithJson.set(model, false);
          round--; // retry this round in two-step mode
          continue;
        }
        throw err;
      }
      if (!prompted && toolsAllowed && wantJson) this.toolsWithJson.set(model, true);
      count(response);

      const finish = response.candidates?.[0]?.finishReason;
      if (finish && /SAFETY|BLOCKLIST|PROHIBITED/.test(String(finish))) {
        throw new LlmError("blocked", `Response blocked (${finish}).`);
      }

      const calls = response.functionCalls ?? [];
      if (toolsAllowed && calls.length) {
        const modelTurn = response.candidates?.[0]?.content;
        if (modelTurn) contents.push(modelTurn);
        const results = await Promise.all(
          calls.map(async (c) => {
            const call = { id: c.id, name: c.name ?? "", args: (c.args ?? {}) as Record<string, unknown> };
            const result = await tools!.execute(call);
            toolCalls.push({ name: call.name, args: call.args, ok: result.ok });
            return { functionResponse: { id: c.id, name: call.name, response: result.response } };
          })
        );
        contents.push({ role: "user", parts: results });
        continue;
      }

      if (!wantJson) {
        // Two-step mode: the model answered in prose; ask once more for the JSON answer, tools off.
        const final = await this.call(model, contents, { ...this.baseConfig(request, deadline), ...json }, deadline);
        count(final);
        return { ...this.parse(final.text, request.schema), usage, toolCalls, model };
      }
      return { ...this.parse(response.text, request.schema), usage, toolCalls, model };
    }
  }

  private parse<T>(text: string | undefined, schema: ZodType<T>) {
    if (!text) throw new LlmError("invalid_response", "Empty response.");
    let raw: unknown;
    try {
      raw = JSON.parse(extractJson(text));
    } catch {
      throw new LlmError("invalid_response", "Model returned invalid JSON.");
    }
    const result = schema.safeParse(raw);
    return {
      raw,
      parsed: result.success
        ? ({ success: true, data: result.data } as const)
        : ({ success: false, error: result.error.message } as const),
    };
  }
}
