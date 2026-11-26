import { getAiConfig } from "../ai/config";
import { GeminiProvider } from "../ai/llm/geminiProvider";
import type { LlmProvider } from "../ai/llm/llmProvider";
import { assertServer } from "./guard";

assertServer("providers");

let llm: LlmProvider | null | undefined;

/** The one place that picks the concrete LLM; swap providers here. */
export function getLlmProvider(): LlmProvider | null {
  if (llm === undefined) {
    const c = getAiConfig();
    llm = c.geminiApiKey
      ? new GeminiProvider({
          apiKey: c.geminiApiKey,
          model: c.geminiModel,
          fallbackModels: c.geminiFallbackModels,
          timeoutMs: c.llmTimeoutMs,
          thinkingLevel: c.geminiThinkingLevel,
        })
      : null;
  }
  return llm;
}
