import type { EngineIndex } from "./indexes";
import { INTENT_LEXICON, PROJECT_ASPECTS } from "./synonyms";
import { normalize, phraseRegExp, stem, STOPWORDS } from "./text";
import type { ConversationContext, Entities, Faq, Intent, IntentResult, ProjectFocus } from "./types";

type LexIntent = keyof typeof INTENT_LEXICON;

const LEXICON: [LexIntent, RegExp, number][] = (
  Object.entries(INTENT_LEXICON) as [LexIntent, [string, number][]][]
).flatMap(([intent, phrases]) =>
  phrases.map(([phrase, weight]) => [intent, phraseRegExp(phrase), weight] as [LexIntent, RegExp, number])
);

const ASPECTS = (Object.entries(PROJECT_ASPECTS) as [Exclude<ProjectFocus, "overview">, string[]][])
  .map(([focus, words]) => ({ focus, patterns: words.map((w) => phraseRegExp(w)) }));

const has = (re: RegExp, text: string) => {
  re.lastIndex = 0;
  return re.test(text);
};

/** Which aspect of a project the message is asking about, if any. */
export function detectProjectFocus(normalized: string): ProjectFocus | null {
  for (const { focus, patterns } of ASPECTS) {
    if (patterns.some((p) => has(p, normalized))) return focus;
  }
  return null;
}

const PAST_OR_SPECIFIC = /(?<![a-z0-9])(?:used|did|was|were|built with|made with|behind)(?![a-z0-9])/;

// ---------------------------------------------------------------------------
// FAQ matching
// ---------------------------------------------------------------------------

const contentWords = (text: string) =>
  new Set(
    normalize(text)
      .split(" ")
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
      .map(stem)
  );

const faqCache = new WeakMap<Faq, { keywords: RegExp[]; words: Set<string> }>();

function faqFeatures(faq: Faq) {
  let f = faqCache.get(faq);
  if (!f) {
    f = {
      keywords: faq.keywords.filter((k) => k.trim()).map((k) => phraseRegExp(k)),
      words: contentWords(faq.question),
    };
    faqCache.set(faq, f);
  }
  return f;
}

export type FaqMatch = { faq: Faq; score: number };

/** Score FAQs by keyword phrases (strong) and question word overlap (soft). */
export function matchFaqs(normalized: string, index: EngineIndex): FaqMatch[] {
  const words = contentWords(normalized);
  const results: FaqMatch[] = [];
  for (const faq of index.kb.faqs) {
    const { keywords, words: qWords } = faqFeatures(faq);
    const keywordScore = Math.min(6, keywords.filter((k) => has(k, normalized)).length * 3);
    const union = new Set([...qWords, ...words]);
    const overlap = union.size ? [...qWords].filter((w) => words.has(w)).length / union.size : 0;
    if (keywordScore === 0 && overlap < 0.5) continue;
    results.push({ faq, score: keywordScore + overlap * 4 });
  }
  return results.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Intent scoring
// ---------------------------------------------------------------------------

export type Detection = IntentResult & {
  faqMatches: FaqMatch[];
  /** Project-aspect follow-up ("what tech was used?") about the last project. */
  projectFollowUp: boolean;
  focus: ProjectFocus | null;
};

const MIN_SCORE = 1.5;

export function detectIntent(
  normalized: string,
  entities: Entities,
  context: ConversationContext,
  index: EngineIndex
): Detection {
  const scores: Partial<Record<Intent, number>> = {};
  const add = (intent: Intent, n: number) => {
    scores[intent] = (scores[intent] ?? 0) + n;
  };

  for (const [intent, re, weight] of LEXICON) {
    if (has(re, normalized)) add(intent, weight);
  }
  const lexical = { ...scores };
  const wordCount = normalized.split(" ").filter(Boolean).length;
  const isShort = wordCount <= 5;

  const hasNamedProject = entities.projectIds.length > 0;
  const hasProject = hasNamedProject || entities.referencedProjectId !== null;
  const hasTech = entities.technologies.length > 0;
  const hasCategory = entities.categories.length > 0;
  const focus = detectProjectFocus(normalized);

  // "What technologies were used?" right after discussing a project.
  const projectFollowUp =
    !hasProject &&
    !hasTech &&
    focus !== null &&
    context.lastProjectId !== null &&
    context.lastIntent === "project_details" &&
    (isShort || PAST_OR_SPECIFIC.test(normalized));

  if (hasProject) add("project_details", 3.5);
  if (entities.ordinal !== null && entities.referencedProjectId !== null) add("project_details", 1);
  // Must outweigh the generic "tech stack" / "role" lexicon it overlaps with.
  if (projectFollowUp) add("project_details", 4 + (lexical.skills ?? 0) + (lexical.experience ?? 0));
  if (entities.ambiguousProjectIds.length && !hasTech) add("project_details", 3);

  if (hasTech) {
    add("technology_experience", 3);
    if (lexical.projects) add("projects", 2.5);
    if (lexical.skills && !lexical.technology_experience) add("skills", 1);
  }
  if (hasCategory) {
    if (lexical.skills) add("skills", 2.5);
    else if (lexical.projects) add("projects", 2.5);
    else add("technology_experience", 3);
  }
  if (entities.companyExperienceIds.length) add("experience", 3.5);
  if (entities.referencedExperienceId) add("experience", 3);

  // A named project plus "projects" ("projects like Hamrobazar") is still details.
  if (hasNamedProject && lexical.projects && !hasTech) add("project_details", 1);

  // Conversation bias: refine the previous result list ("which ones use X").
  if (context.lastResults?.type === "projects" && (hasTech || hasCategory) && !hasProject) {
    add("projects", lexical.projects ? 1.5 : isShort && context.lastIntent === "projects" ? 3.5 : 0);
  }
  if (isShort && (hasTech || hasCategory) && context.lastIntent === "technology_experience") {
    add("technology_experience", 1);
  }

  // Technology questions need something to be about; otherwise they're a
  // topic question ("have you worked with dashboards?") handled by search.
  if (!hasTech && !hasCategory && scores.technology_experience) {
    scores.technology_experience = entities.topicTerms.length ? 1.6 : 0;
  }

  // Greetings only win when nothing else was asked ("hi, show me projects").
  const nonGreeting = Object.entries(scores).some(([k, v]) => k !== "greeting" && (v ?? 0) >= MIN_SCORE);
  if (scores.greeting && nonGreeting) scores.greeting *= 0.3;

  const faqMatches = matchFaqs(normalized, index);
  if (faqMatches.length) scores.faq = faqMatches[0].score;

  const ranked = (Object.entries(scores) as [Intent, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const [top, second] = ranked;
  if (!top || top[1] < MIN_SCORE) {
    return {
      intent: "unknown",
      confidence: 0,
      scores,
      alternative: top?.[0] ?? null,
      faqMatches,
      projectFollowUp,
      focus,
    };
  }

  const secondScore = second?.[1] ?? 0;
  const confidence = Math.max(0, Math.min(1, (top[1] - secondScore * 0.5) / 5));
  return {
    intent: top[0],
    confidence: Number(confidence.toFixed(2)),
    scores,
    alternative: second && secondScore >= MIN_SCORE && secondScore >= top[1] * 0.75 ? second[0] : null,
    faqMatches,
    projectFollowUp,
    focus,
  };
}
