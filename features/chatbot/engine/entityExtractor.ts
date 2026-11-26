import type { EngineIndex, NameAlias } from "./indexes";
import { dropOverlaps, findTechnologies, type Span } from "./knowledge";
import { ORDINALS, REFERENCE_PATTERN } from "./synonyms";
import { compact, levenshtein, stem, STOPWORDS, tokenize, type Token } from "./text";
import type { ConversationContext, Entities, SkillCategory } from "./types";

type NameMatch<Id> = Span & { id: Id; score: number };

/**
 * Find names (projects, companies) using sliding windows of 1–4 tokens so
 * "hamro bazar", "hamrobazar" and "Hamrobazaar" all match, with a small
 * edit-distance allowance for typos on longer names.
 */
function matchNames<Id>(tokens: Token[], aliases: NameAlias<Id>[]): NameMatch<Id>[] {
  const matches: NameMatch<Id>[] = [];
  for (let n = 1; n <= 4; n++) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const window = tokens.slice(i, i + n);
      const joined = compact(window.map((t) => t.text).join(""));
      if (joined.length < 3) continue;
      for (const alias of aliases) {
        let score = 0;
        if (joined === alias.compact) {
          score = alias.weak ? 0.6 : 1;
        } else if (!alias.weak && alias.compact.length >= 6 && joined.length >= 5) {
          const allowed = alias.compact.length >= 10 ? 2 : 1;
          if (levenshtein(joined, alias.compact, allowed) <= allowed) score = 0.8;
        }
        if (score > 0) {
          matches.push({
            id: alias.id,
            score,
            start: window[0].start,
            end: window[window.length - 1].end,
          });
        }
      }
    }
  }
  return matches;
}

function bestIds<Id>(matches: NameMatch<Id>[]): Id[] {
  const best = new Map<Id, number>();
  for (const m of dropOverlaps(matches)) {
    best.set(m.id, Math.max(best.get(m.id) ?? 0, m.score));
  }
  return [...best.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

function detectOrdinal(normalized: string): number | null {
  for (const [pattern, value] of ORDINALS) {
    const m = pattern.exec(normalized);
    if (!m) continue;
    return value === 0 ? Number(m[1]) : value;
  }
  return null;
}

function pickByOrdinal<T>(items: T[], ordinal: number): T | null {
  if (!items.length) return null;
  const idx = ordinal === -1 ? items.length - 1 : ordinal - 1;
  return items[idx] ?? null;
}

export function extractEntities(
  normalized: string,
  index: EngineIndex,
  context: ConversationContext
): Entities {
  const tokens = tokenize(normalized);

  // Technologies and categories compete for the same words ("animation"):
  // the longest span wins, and on a tie the category wins.
  type Tagged = Span & ({ kind: "category"; category: SkillCategory } | { kind: "tech"; key: string });
  const candidates: Tagged[] = [];
  for (const { category, pattern } of index.categoryPatterns) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(normalized))) {
      candidates.push({ kind: "category", category, start: m.index, end: m.index + m[0].length });
    }
  }
  for (const t of findTechnologies(normalized, index.tech)) {
    candidates.push({ kind: "tech", key: t.key, start: t.start, end: t.end });
  }

  const projectMatches = matchNames(tokens, index.projectAliases);
  const companyMatches = matchNames(tokens, index.companyAliases);

  // Names beat technology words that sit inside them.
  const nameSpans = dropOverlaps<Span>([...projectMatches, ...companyMatches]);
  const kept = dropOverlaps(candidates).filter(
    (c) => !nameSpans.some((n) => c.start < n.end && n.start < c.end)
  );

  const technologies = [
    ...new Set(kept.flatMap((c) => (c.kind === "tech" ? [c.key] : []))),
  ];
  const categories = [
    ...new Set(kept.flatMap((c) => (c.kind === "category" ? [c.category] : []))),
  ];

  const projectIds = bestIds(projectMatches);

  // A lone partial name that starts several project names ("hamro").
  let ambiguousProjectIds: number[] = [];
  if (!projectIds.length) {
    for (const t of tokens) {
      const word = compact(t.text);
      if (word.length < 4 || STOPWORDS.has(word)) continue;
      const ids = [...new Set(index.projectAliases.filter((a) => !a.weak && a.compact.startsWith(word)).map((a) => a.id))];
      if (ids.length >= 2) {
        ambiguousProjectIds = ids;
        break;
      }
    }
  }
  const companyExperienceIds = bestIds(companyMatches);

  // Context references: "the first one", "it", "there".
  const ordinal = detectOrdinal(normalized);
  const hasReference = REFERENCE_PATTERN.test(normalized);
  let referencedProjectId: number | null = null;
  let referencedExperienceId: string | null = null;
  const last = context.lastResults;
  if (ordinal !== null && last) {
    if (last.type === "projects") referencedProjectId = pickByOrdinal(last.ids, ordinal);
    if (last.type === "experiences") referencedExperienceId = pickByOrdinal(last.ids, ordinal);
  } else if (hasReference && context.lastProjectId !== null) {
    referencedProjectId = context.lastProjectId;
  }
  if (referencedProjectId !== null && !index.projectById.has(referencedProjectId)) {
    referencedProjectId = null;
  }

  // Leftover content words: used to search descriptions ("dashboards").
  const covered: Span[] = [...kept, ...nameSpans];
  const topicTerms = [
    ...new Set(
      tokens
        .filter((t) => !covered.some((c) => t.start < c.end && c.start < t.end))
        .map((t) => t.text.replace(/[^a-z0-9]/g, ""))
        .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
        .map(stem)
        .filter((w) => !index.vocabulary.has(w))
    ),
  ];

  return {
    projectIds,
    ambiguousProjectIds,
    referencedProjectId,
    referencedExperienceId,
    technologies,
    categories,
    companyExperienceIds,
    topicTerms,
    hasReference,
    ordinal,
  };
}
