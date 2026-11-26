import type { ConversationContext, Intent, ResultSet, SkillCategory } from "./types";

export function createInitialContext(): ConversationContext {
  return {
    lastIntent: null,
    lastProjectId: null,
    lastTechnology: null,
    lastCategory: null,
    lastResults: null,
    turn: 0,
  };
}

export type ContextUpdate = {
  intent: Intent;
  projectId?: number | null;
  technology?: string | null;
  category?: SkillCategory | null;
  results?: ResultSet | null;
};

/**
 * Fold one turn into the context. Fields the turn didn't touch are kept, so
 * "tell me about Hamrobazar" -> "what is your experience?" -> "what tech was
 * used there?" still resolves "there". Unknown turns don't reset anything.
 */
export function updateContext(prev: ConversationContext, update: ContextUpdate): ConversationContext {
  const next: ConversationContext = { ...prev, turn: prev.turn + 1 };
  if (update.intent === "unknown") return next;

  next.lastIntent = update.intent;
  if (update.projectId !== undefined && update.projectId !== null) next.lastProjectId = update.projectId;
  if (update.technology !== undefined && update.technology !== null) next.lastTechnology = update.technology;
  if (update.category !== undefined && update.category !== null) next.lastCategory = update.category;
  if (update.results !== undefined && update.results !== null && update.results.ids.length > 0) {
    next.lastResults = update.results;
  }
  return next;
}

/** Validate context loaded from localStorage (it may be stale or tampered with). */
export function restoreContext(raw: unknown): ConversationContext {
  const base = createInitialContext();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const results = r.lastResults as ResultSet | null | undefined;
  const validResults =
    results &&
    typeof results === "object" &&
    ["projects", "experiences", "skills"].includes(results.type) &&
    Array.isArray(results.ids)
      ? results
      : null;
  return {
    lastIntent: typeof r.lastIntent === "string" ? (r.lastIntent as Intent) : null,
    lastProjectId: typeof r.lastProjectId === "number" ? r.lastProjectId : null,
    lastTechnology: typeof r.lastTechnology === "string" ? r.lastTechnology : null,
    lastCategory: typeof r.lastCategory === "string" ? (r.lastCategory as SkillCategory) : null,
    lastResults: validResults,
    turn: typeof r.turn === "number" ? r.turn : 0,
  };
}
