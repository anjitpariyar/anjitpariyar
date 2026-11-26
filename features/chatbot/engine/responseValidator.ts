import type { KnowledgeSourceType } from "../types/database";
import type { EngineIndex } from "./indexes";
import type { ChatBlock, ContactHighlight, Intent, ProjectFocus } from "./types";

/**
 * Converts the model's structured output into renderable blocks, trusting
 * nothing:
 *  - only approved block types survive;
 *  - every record id must exist in the published knowledge base, and FAQ ids
 *    and source references must also be among the records actually disclosed
 *    to the model this turn (prompt context + tool results);
 *  - text is length-capped and stripped of markdown (it's rendered as plain
 *    React text, never HTML).
 * Anything dropped is reported in `rejected` for logging / tests.
 */
export type SourceRef = {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  label: string;
  href: string | null;
};

export type ValidatedResponse = {
  blocks: ChatBlock[];
  suggestions: string[];
  intent: Intent;
  basis: "confirmed" | "interpretation" | "insufficient";
  sources: SourceRef[];
  rejected: string[];
};

const MAX_ANSWER = 2_000;
const MAX_BLOCKS = 3;
const MAX_IDS = 8;

const BLOCK_TYPES = new Set(["project_list", "project_detail", "skill_grid", "experience_list", "contact_card", "faq_card"]);
const FOCUS = new Set<ProjectFocus>(["overview", "technologies", "contribution", "links"]);
const HIGHLIGHT = new Set<ContactHighlight>(["email", "github", "linkedin", "cv", "website"]);
const INTENTS = new Set<Intent>([
  "greeting", "about", "experience", "projects", "project_details", "skills",
  "technology_experience", "contact", "availability", "faq", "help", "unknown",
]);
const SOURCE_TYPES = new Set<KnowledgeSourceType>(["profile", "project", "skill", "experience", "faq"]);

const asString = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Plain text: drop markdown emphasis/headings/code fences, cap length. */
export function cleanAnswer(text: string): string {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned.length > MAX_ANSWER ? `${cleaned.slice(0, MAX_ANSWER).trimEnd()}…` : cleaned;
}

export function sourceLabel(index: EngineIndex, type: KnowledgeSourceType, id: string): { label: string; href: string | null } | null {
  switch (type) {
    case "project": {
      const p = index.projectById.get(Number(id));
      return p ? { label: p.title, href: `/projects/${p.slug}` } : null;
    }
    case "skill": {
      const s = index.skillById.get(id);
      return s ? { label: s.name, href: null } : null;
    }
    case "experience": {
      const e = index.experienceById.get(id);
      return e ? { label: `${e.position} at ${e.company}`, href: null } : null;
    }
    case "faq": {
      const f = index.faqById.get(id);
      return f ? { label: "FAQ", href: null } : null;
    }
    case "profile":
      return index.kb.profile ? { label: "Profile", href: "/about" } : null;
  }
}

export function validateModelResponse(
  raw: unknown,
  index: EngineIndex,
  evidence: { sourceType: KnowledgeSourceType; sourceId: string }[]
): ValidatedResponse {
  const rejected: string[] = [];
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const evidenceKeys = new Set(evidence.map((e) => `${e.sourceType}:${e.sourceId}`));

  const answer = cleanAnswer(asString(r.answer));
  const blocks: ChatBlock[] = answer ? [{ type: "text", text: answer }] : [];
  if (!answer) rejected.push("missing answer");

  const projectIds = (ids: unknown[]) =>
    ids.map((v) => Number(asString(v))).filter((id) => {
      const ok = Number.isInteger(id) && index.projectById.has(id);
      if (!ok) rejected.push(`unknown project id ${String(id)}`);
      return ok;
    });
  const idsIn = (ids: unknown[], valid: (id: string) => boolean, label: string) =>
    ids.map(asString).filter((id) => {
      const ok = valid(id);
      if (!ok) rejected.push(`unknown ${label} id ${id}`);
      return ok;
    });

  const usedTypes = new Set<string>();
  for (const item of asArray(r.blocks)) {
    if (blocks.length - (answer ? 1 : 0) >= MAX_BLOCKS) break;
    const b = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const type = asString(b.type);
    if (!BLOCK_TYPES.has(type)) {
      rejected.push(`unsupported block type "${type}"`);
      continue;
    }
    if (usedTypes.has(type)) continue; // one of each type per answer
    const ids = [...new Set(asArray(b.ids).map(asString))].slice(0, MAX_IDS);

    switch (type) {
      case "project_list": {
        const valid = projectIds(ids);
        if (valid.length) blocks.push({ type, projectIds: valid });
        break;
      }
      case "project_detail": {
        const [id] = projectIds(ids.slice(0, 1));
        const focus = asString(b.focus) as ProjectFocus;
        if (id !== undefined) blocks.push({ type, projectId: id, focus: FOCUS.has(focus) ? focus : "overview" });
        break;
      }
      case "skill_grid": {
        const valid = idsIn(ids, (id) => index.skillById.has(id), "skill");
        if (valid.length) blocks.push({ type, skillIds: valid });
        break;
      }
      case "experience_list": {
        const valid = idsIn(ids, (id) => index.experienceById.has(id), "experience");
        if (valid.length) blocks.push({ type, experienceIds: valid });
        break;
      }
      case "faq_card": {
        // FAQs must have been disclosed this turn (context or getFAQs).
        const valid = idsIn(ids, (id) => index.faqById.has(id) && evidenceKeys.has(`faq:${id}`), "faq");
        if (valid.length) blocks.push({ type, faqIds: valid });
        break;
      }
      case "contact_card": {
        const highlight = asString(b.highlight) as ContactHighlight;
        blocks.push({ type, highlight: HIGHLIGHT.has(highlight) ? highlight : null });
        break;
      }
    }
    usedTypes.add(type);
  }

  const seenSources = new Set<string>();
  const sources: SourceRef[] = [];
  for (const item of asArray(r.sources)) {
    const s = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const sourceType = asString(s.sourceType) as KnowledgeSourceType;
    const sourceId = asString(s.sourceId);
    const key = `${sourceType}:${sourceId}`;
    if (!SOURCE_TYPES.has(sourceType) || !evidenceKeys.has(key)) {
      rejected.push(`source not disclosed ${key}`);
      continue;
    }
    if (seenSources.has(key)) continue;
    const label = sourceLabel(index, sourceType, sourceId);
    if (!label) continue;
    seenSources.add(key);
    sources.push({ sourceType, sourceId, ...label });
  }

  const suggestions = [
    ...new Set(
      asArray(r.suggestions)
        .map(asString)
        .map((s) => s.replace(/\s+/g, " ").trim())
        .filter((s) => s.length > 2 && s.length <= 100)
    ),
  ].slice(0, 4);

  const intent = asString(r.intent) as Intent;
  const basis = asString(r.basis);
  return {
    blocks,
    suggestions,
    intent: INTENTS.has(intent) ? intent : "unknown",
    basis: basis === "confirmed" || basis === "interpretation" || basis === "insufficient" ? basis : "insufficient",
    sources: sources.slice(0, 8),
    rejected,
  };
}
