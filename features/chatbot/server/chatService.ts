import type { AiConfig } from "../ai/config";
import { PortfolioSnapshotContext, type ContextProvider, type RecordRef } from "../ai/context/contextProvider";
import { SnapshotPortfolioRepository, type PortfolioRepository } from "../ai/data/portfolioRepository";
import { LlmError, type LlmProvider, type ToolCallLog } from "../ai/llm/llmProvider";
import { buildRecentContext, buildSystemPrompt, buildUserTurn, historyToMessages, PROMPT_VERSION } from "../ai/llm/prompts";
import { modelOutputJsonSchema, ModelOutputSchema } from "../ai/llm/responseSchema";
import { executePortfolioTool, PORTFOLIO_TOOL_DEFINITIONS } from "../ai/tools/portfolioTools";
import type { ChatEngine } from "../engine";
import {
  boundHistory,
  nextChatContext,
  projectIdsOf,
  sanitizeChatContext,
  type ChatContextState,
} from "../engine/conversationManager";
import { validateModelResponse, type SourceRef } from "../engine/responseValidator";
import type { ChatBlock, Intent, KnowledgeBase } from "../engine/types";
import type { ChatRequest } from "./requestSchema";

export type ChatMode = "ai" | "fallback";

export type ChatReply = {
  blocks: ChatBlock[];
  suggestions: string[];
  intent: Intent;
  sources: SourceRef[];
  basis: "confirmed" | "interpretation" | "insufficient" | null;
  mode: ChatMode;
};

export type ChatResponseBody = {
  reply: ChatReply;
  context: ChatContextState;
  meta: {
    timings: { contextMs: number; llmMs: number; totalMs: number };
    model: string | null;
    promptVersion: string;
    contextMode: "full" | "overview" | null;
    toolCalls: string[];
    fallbackReason: string | null;
  };
};

export type ChatDeps = {
  /** Cached, published-only knowledge base plus the rule engine (fallback). */
  getKnowledge: () => Promise<{ kb: KnowledgeBase; engine: ChatEngine }>;
  llm: LlmProvider | null;
  config: Pick<AiConfig, "maxOutputTokens" | "context">;
  /** Overridable for tests or a future SQL / RAG implementation. */
  createRepository?: (engine: ChatEngine) => PortfolioRepository;
  createContextProvider?: (repo: PortfolioRepository) => ContextProvider;
  log?: (event: Record<string, unknown>) => void;
};

function fallbackReply(engine: ChatEngine, message: string, context: ChatContextState) {
  const turn = engine.respond(message, context.rule);
  const next: ChatContextState = {
    ...nextChatContext(context, {
      intent: turn.response.intent,
      projectIds: projectIdsOf(turn.response.blocks),
      technology: turn.context.lastTechnology,
      sourceKeys: [],
    }),
    rule: turn.context,
  };
  const reply: ChatReply = {
    blocks: turn.response.blocks,
    suggestions: turn.response.suggestions,
    intent: turn.response.intent,
    sources: [],
    basis: null,
    mode: "fallback",
  };
  return { reply, context: next };
}

/**
 * One chat turn:
 *   published portfolio data -> system prompt + recent context -> Gemini
 *   (with read-only tools) -> validated structured response -> card blocks.
 * Provider problems never surface as errors: the deterministic engine
 * answers from the same data instead.
 */
export async function handleChat(request: ChatRequest, deps: ChatDeps): Promise<ChatResponseBody> {
  const started = Date.now();
  const { kb, engine } = await deps.getKnowledge();
  const index = engine.index;
  const context = sanitizeChatContext(request.context, index);
  const history = boundHistory(request.history);
  const timings = { contextMs: 0, llmMs: 0, totalMs: 0 };
  let toolCalls: ToolCallLog[] = [];
  let answeredBy: string | null = null;
  let contextMode: "full" | "overview" | null = null;

  const finish = (reply: ChatReply, nextContext: ChatContextState, fallbackReason: string | null, rejected = 0): ChatResponseBody => {
    timings.totalMs = Date.now() - started;
    deps.log?.({
      event: "chat_turn",
      mode: reply.mode,
      intent: reply.intent,
      basis: reply.basis,
      contextMode,
      model: answeredBy,
      tools: toolCalls.map((t) => `${t.name}${t.ok ? "" : "!"}`),
      rejected,
      fallbackReason,
      ...timings,
    });
    return {
      reply,
      context: nextContext,
      meta: {
        timings,
        model: reply.mode === "ai" ? answeredBy : null,
        promptVersion: PROMPT_VERSION,
        contextMode,
        toolCalls: toolCalls.map((t) => t.name),
        fallbackReason,
      },
    };
  };

  const fallback = (reason: string) => {
    const { reply, context: next } = fallbackReply(engine, request.message, context);
    return finish(reply, next, reason);
  };

  if (!deps.llm) return fallback("llm_not_configured");

  // 1. Portfolio context (published data only)
  const t0 = Date.now();
  const repo = deps.createRepository?.(engine) ?? new SnapshotPortfolioRepository(index);
  const provider =
    deps.createContextProvider?.(repo) ??
    new PortfolioSnapshotContext(repo, {
      mode: deps.config.context.mode,
      fullContextMaxChars: deps.config.context.fullContextMaxChars,
    });
  const portfolio = await provider.build({ message: request.message, history, focusProjectIds: context.lastProjectIds });
  contextMode = portfolio.mode;
  timings.contextMs = Date.now() - t0;

  // Records the model has seen: the context, plus anything tools return this turn.
  const disclosed: RecordRef[] = [...portfolio.records];

  // 2. Gemini, with read-only tools
  let raw: unknown;
  try {
    const t1 = Date.now();
    const result = await deps.llm.generateStructuredResponse({
      system: buildSystemPrompt(kb.profile?.fullName ?? "Anjit Pariyar", portfolio),
      messages: [
        ...historyToMessages(history),
        { role: "user", text: buildUserTurn(buildRecentContext(index, context.lastProjectIds), request.message) },
      ],
      maxOutputTokens: deps.config.maxOutputTokens,
      temperature: 0.3,
      schema: ModelOutputSchema,
      jsonSchema: modelOutputJsonSchema(),
      tools: {
        definitions: PORTFOLIO_TOOL_DEFINITIONS,
        maxRounds: deps.config.context.maxToolRounds,
        execute: async (call) => {
          const result = await executePortfolioTool(repo, call);
          disclosed.push(...result.records);
          return result;
        },
      },
    });
    timings.llmMs = Date.now() - t1;
    toolCalls = result.toolCalls;
    answeredBy = result.model;
    raw = result.raw;
    if (!result.parsed.success) console.warn("[chat] model output failed strict schema, salvaging:", result.parsed.error.slice(0, 300));
  } catch (err) {
    const e = err instanceof LlmError ? err : new LlmError("unknown", (err as Error).message);
    console.error(`[chat] LLM error (${e.kind}${e.status ? ` ${e.status}` : ""}): ${e.message}${e.detail ? ` | ${e.detail}` : ""}`);
    return fallback(`llm_${e.kind}`);
  }

  // 3. Validate against real, published records the model was given
  const validated = validateModelResponse(raw, index, disclosed);
  if (validated.blocks[0]?.type !== "text") return fallback("llm_invalid_response");
  if (validated.rejected.length) console.warn("[chat] rejected model output parts:", validated.rejected.join("; "));

  const projectIds = projectIdsOf(
    validated.blocks,
    validated.sources.filter((s) => s.sourceType === "project").map((s) => Number(s.sourceId))
  );
  const nextContext = nextChatContext(context, {
    intent: validated.intent,
    projectIds,
    technology: null,
    sourceKeys: validated.sources.map((s) => `${s.sourceType}:${s.sourceId}`),
  });

  const suggestions = (validated.suggestions.length ? validated.suggestions : kb.suggestions.slice(0, 3).map((s) => s.message))
    .filter((s) => s.toLowerCase() !== request.message.toLowerCase());

  return finish(
    {
      blocks: validated.blocks,
      suggestions,
      intent: validated.intent,
      sources: validated.sources,
      basis: validated.basis,
      mode: "ai",
    },
    nextContext,
    null,
    validated.rejected.length
  );
}
