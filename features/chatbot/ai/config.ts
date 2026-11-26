/**
 * Server-side AI configuration. Read lazily from the environment so nothing
 * is captured at build time; never imported by client components.
 */

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export type ContextMode = "auto" | "full" | "overview";

export type AiConfig = ReturnType<typeof getAiConfig>;

export function getAiConfig() {
  const env = process.env;
  const mode = env.CHAT_CONTEXT_MODE;
  return {
    geminiApiKey: env.GEMINI_API_KEY || null,
    /** Any current Gemini text model; Google recommends Flash-Lite for low cost/latency. */
    geminiModel: env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    /**
     * Optional, comma-separated; tried in order when the primary stays overloaded
     * (503), rate limited or unresponsive after retries. Empty by default.
     */
    geminiFallbackModels: (env.GEMINI_FALLBACK_MODELS ?? "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
    /** Optional: MINIMAL | LOW | MEDIUM | HIGH, only for models that support thinking levels. */
    geminiThinkingLevel: env.GEMINI_THINKING_LEVEL || null,
    /** Overall budget per message, including retries, tool rounds and fallback models. */
    llmTimeoutMs: num(env.GEMINI_TIMEOUT_MS, 20_000),
    maxOutputTokens: num(env.GEMINI_MAX_OUTPUT_TOKENS, 1_500),

    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",

    context: {
      /**
       * full     = every published record's details go in the prompt (best for a small portfolio);
       * overview = a compact catalog only, details fetched through tools (scales to larger data);
       * auto     = full while the portfolio text fits in `fullContextMaxChars`, else overview.
       */
      mode: (mode === "full" || mode === "overview" ? mode : "auto") as ContextMode,
      fullContextMaxChars: num(env.CHAT_FULL_CONTEXT_MAX_CHARS, 40_000),
      /** Upper bound on tool-call rounds per message. */
      maxToolRounds: num(env.CHAT_MAX_TOOL_ROUNDS, 3),
    },

    rateLimit: {
      perMinute: num(env.CHAT_RATE_LIMIT_PER_MINUTE, 10),
      perHour: num(env.CHAT_RATE_LIMIT_PER_HOUR, 60),
    },
  };
}
