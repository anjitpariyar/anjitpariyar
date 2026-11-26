import { createInitialContext, restoreContext } from "./contextManager";
import type { EngineIndex } from "./indexes";
import type { ChatBlock, ConversationContext, Intent } from "./types";

/**
 * Conversation state shared by the AI path and the rule-based fallback.
 * Lives in the visitor's browser (localStorage) and is sent with each
 * request, because the model keeps no memory between API calls. The server
 * treats it as untrusted input and validates every id against real records.
 */
export type ChatContextState = {
  lastIntent: Intent | null;
  /** Projects shown or discussed in the last answer, in display order. */
  lastProjectIds: number[];
  lastTechnology: string | null;
  /** Records cited last turn ("project:1", ...), for follow-ups like "compare it". */
  lastSourceKeys: string[];
  /** Context for the rule-based engine, kept in sync for seamless fallback. */
  rule: ConversationContext;
};

export type HistoryItem = { role: "user" | "assistant"; text: string };

export const HISTORY_MAX_TURNS = 8;
export const HISTORY_MAX_CHARS = 700;

export function createChatContext(): ChatContextState {
  return { lastIntent: null, lastProjectIds: [], lastTechnology: null, lastSourceKeys: [], rule: createInitialContext() };
}

/** Validate untrusted context: drop unknown ids, cap lengths. */
export function sanitizeChatContext(raw: unknown, index: EngineIndex): ChatContextState {
  const base = createChatContext();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const ids = Array.isArray(r.lastProjectIds) ? r.lastProjectIds : [];
  return {
    lastIntent: typeof r.lastIntent === "string" ? (r.lastIntent as Intent) : null,
    lastProjectIds: ids
      .map(Number)
      .filter((id) => Number.isInteger(id) && index.projectById.has(id))
      .slice(0, 8),
    lastTechnology: typeof r.lastTechnology === "string" && index.tech.has(r.lastTechnology) ? r.lastTechnology : null,
    lastSourceKeys: Array.isArray(r.lastSourceKeys)
      ? r.lastSourceKeys.filter((k): k is string => typeof k === "string" && k.length < 120).slice(0, 12)
      : [],
    rule: restoreContext(r.rule),
  };
}

/** Keep the last N turns, each truncated, so token usage stays bounded. */
export function boundHistory(history: HistoryItem[]): HistoryItem[] {
  return history
    .filter((h) => (h.role === "user" || h.role === "assistant") && typeof h.text === "string" && h.text.trim())
    .slice(-HISTORY_MAX_TURNS * 2)
    .map((h) => ({
      role: h.role,
      text: h.text.length > HISTORY_MAX_CHARS ? `${h.text.slice(0, HISTORY_MAX_CHARS)}…` : h.text,
    }));
}

/** Project ids an answer refers to, in order (cards first, then cited sources). */
export function projectIdsOf(blocks: ChatBlock[], sourceProjectIds: number[] = []): number[] {
  const ids: number[] = [];
  for (const b of blocks) {
    if (b.type === "project_list") ids.push(...b.projectIds);
    if (b.type === "project_detail") ids.push(b.projectId);
  }
  return [...new Set([...ids, ...sourceProjectIds])];
}

export function nextChatContext(
  prev: ChatContextState,
  turn: {
    intent: Intent;
    projectIds: number[];
    technology: string | null;
    sourceKeys: string[];
  }
): ChatContextState {
  const projectIds = turn.projectIds.length ? turn.projectIds.slice(0, 8) : prev.lastProjectIds;
  const rule: ConversationContext = {
    ...prev.rule,
    turn: prev.rule.turn + 1,
    lastIntent: turn.intent === "unknown" ? prev.rule.lastIntent : turn.intent,
    lastProjectId: turn.projectIds.length === 1 ? turn.projectIds[0] : prev.rule.lastProjectId,
    lastTechnology: turn.technology ?? prev.rule.lastTechnology,
    lastResults: turn.projectIds.length > 1 ? { type: "projects", ids: turn.projectIds } : prev.rule.lastResults,
  };
  return {
    lastIntent: turn.intent === "unknown" ? prev.lastIntent : turn.intent,
    lastProjectIds: projectIds,
    lastTechnology: turn.technology ?? prev.lastTechnology,
    lastSourceKeys: turn.sourceKeys.length ? turn.sourceKeys.slice(0, 12) : prev.lastSourceKeys,
    rule,
  };
}

/** Compact text of an assistant turn for the history sent to the model. */
export function summarizeForHistory(blocks: ChatBlock[], index: EngineIndex): string {
  const text = blocks
    .filter((b): b is Extract<ChatBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join(" ");
  const shown = projectIdsOf(blocks)
    .map((id) => index.projectById.get(id))
    .filter(Boolean)
    .map((p) => `${p!.title} (id ${p!.id})`);
  return shown.length ? `${text}\n[Cards shown: ${shown.join(", ")}]` : text;
}
