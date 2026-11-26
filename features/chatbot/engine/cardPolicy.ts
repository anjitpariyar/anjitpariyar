import type { EngineIndex } from "./indexes";
import { compact } from "./text";
import type { ChatBlock, Intent } from "./types";

/**
 * Keeps project cards from appearing on every answer.
 *
 *  - Project cards only for project questions (list, details, "which projects
 *    used X"). General, hiring, skills or contact answers get none.
 *  - A project list drops projects already shown in this conversation, unless
 *    the visitor named them. If every project in it was shown before, it's a
 *    narrowing follow-up ("which one used animation?") and stays as is.
 */
const PROJECT_CARD_INTENTS = new Set<Intent>(["projects", "project_details", "technology_experience"]);

export function namedProjectIds(message: string, index: EngineIndex): Set<number> {
  const text = compact(message);
  const ids = new Set<number>();
  for (const p of index.projectById.values()) {
    const names = [p.title, p.slug].map(compact).filter((n) => n.length >= 4);
    if (names.some((n) => text.includes(n))) ids.add(p.id);
  }
  return ids;
}

export function applyCardPolicy(
  blocks: ChatBlock[],
  input: { intent: Intent; message: string; shownProjectIds: number[]; index: EngineIndex }
): ChatBlock[] {
  const allowCards = PROJECT_CARD_INTENTS.has(input.intent);
  const named = namedProjectIds(input.message, input.index);
  const shown = new Set(input.shownProjectIds);

  return blocks.flatMap((b): ChatBlock[] => {
    if (b.type === "project_detail") {
      return allowCards || named.has(b.projectId) ? [b] : [];
    }
    if (b.type !== "project_list") return [b];
    if (!allowCards) {
      const keep = b.projectIds.filter((id) => named.has(id));
      return keep.length ? [{ ...b, projectIds: keep }] : [];
    }
    const fresh = b.projectIds.filter((id) => !shown.has(id) || named.has(id));
    if (!fresh.length) return [b]; // all seen before: a narrowing follow-up
    return [{ ...b, projectIds: fresh }];
  });
}

/** Deterministic per-conversation shuffle, so example projects rotate between chats. */
export function rotationOrder(ids: number[], seed: string): number[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
