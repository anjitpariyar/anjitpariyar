import { buildTechIndex, type TechIndex } from "./knowledge";
import { CATEGORY_SYNONYMS, INTENT_LEXICON, PROJECT_ASPECTS } from "./synonyms";
import { compact, normalize, phraseRegExp, stem } from "./text";
import type { Experience, Faq, KnowledgeBase, Project, Skill, SkillCategory } from "./types";

export type NameAlias<Id> = { id: Id; compact: string; weak: boolean };

export type EngineIndex = {
  kb: KnowledgeBase;
  tech: TechIndex;
  projectById: Map<number, Project>;
  skillById: Map<string, Skill>;
  experienceById: Map<string, Experience>;
  faqById: Map<string, Faq>;
  projectAliases: NameAlias<number>[];
  companyAliases: NameAlias<string>[];
  categoryPatterns: { category: SkillCategory; pattern: RegExp }[];
  /** Stemmed words the engine already understands; excluded from topic search. */
  vocabulary: Set<string>;
  /** Stemmed content words per project / experience, for topic search. */
  projectTerms: Map<number, Set<string>>;
  experienceTerms: Map<string, Set<string>>;
};

/** First words too generic to identify a project on their own. */
const GENERIC_FIRST_WORDS = new Set([
  "digital", "life", "the", "my", "new", "web", "app", "project", "site", "online", "smart",
  "global", "open", "super", "best", "health", "data",
]);

function aliasesFor<Id>(
  id: Id,
  names: string[],
  firstWordPool: Map<string, number>,
  tech: TechIndex,
  otherNames: string[]
): NameAlias<Id>[] {
  const out: NameAlias<Id>[] = [];
  const seen = new Set<string>();
  const add = (value: string, weak: boolean) => {
    const c = compact(value);
    if (c.length < 3 || seen.has(c)) return;
    // Don't let a slug like "prisma" shadow the technology Prisma.
    const n = normalize(value);
    for (const entry of tech.values()) {
      if (entry.patterns.some((p) => ((p.lastIndex = 0), p.exec(n)?.[0] === n))) return;
    }
    seen.add(c);
    out.push({ id, compact: c, weak });
  };
  for (const name of names) {
    add(name, false);
    add(name.replace(/[_-]+/g, " "), false);
  }
  const first = normalize(names[0]).split(" ")[0] ?? "";
  const prefixesAnother = otherNames.some((n) => compact(n).startsWith(compact(first)));
  if (
    first.length >= 5 &&
    !GENERIC_FIRST_WORDS.has(first) &&
    firstWordPool.get(first) === 1 &&
    !prefixesAnother
  ) {
    add(first, true);
  }
  return out;
}

function termsOf(...texts: (string | null | undefined)[]): Set<string> {
  const set = new Set<string>();
  for (const t of texts) {
    if (!t) continue;
    for (const w of normalize(t).split(" ")) {
      if (w.length >= 3) set.add(stem(w));
    }
  }
  return set;
}

function countFirstWords(names: string[]): Map<string, number> {
  const pool = new Map<string, number>();
  for (const n of names) {
    const first = normalize(n).split(" ")[0] ?? "";
    pool.set(first, (pool.get(first) ?? 0) + 1);
  }
  return pool;
}

export function buildEngineIndex(kb: KnowledgeBase): EngineIndex {
  const tech = buildTechIndex(kb.skills);

  const projectPool = countFirstWords(kb.projects.map((p) => p.title));
  const projectAliases = kb.projects.flatMap((p) =>
    aliasesFor(p.id, [p.title, p.slug], projectPool, tech, kb.projects.filter((o) => o.id !== p.id).map((o) => o.title))
  );
  const companyPool = countFirstWords(kb.experiences.map((e) => e.company));
  const companyAliases = kb.experiences.flatMap((e) =>
    aliasesFor(e.id, [e.company], companyPool, tech, kb.experiences.filter((o) => o.id !== e.id).map((o) => o.company))
  );

  const categoryPatterns = (Object.entries(CATEGORY_SYNONYMS) as [SkillCategory, string[]][])
    .flatMap(([category, words]) =>
      words.map((w) => ({ category, pattern: phraseRegExp(w, true) }))
    );

  const vocabulary = new Set<string>();
  const addVocab = (phrase: string) =>
    normalize(phrase)
      .split(" ")
      .forEach((w) => vocabulary.add(stem(w)));
  Object.values(INTENT_LEXICON).forEach((list) => list.forEach(([p]) => addVocab(p)));
  Object.values(CATEGORY_SYNONYMS).forEach((list) => list.forEach(addVocab));
  Object.values(PROJECT_ASPECTS).forEach((list) => list.forEach(addVocab));

  return {
    kb,
    tech,
    projectById: new Map(kb.projects.map((p) => [p.id, p])),
    skillById: new Map(kb.skills.map((s) => [s.id, s])),
    experienceById: new Map(kb.experiences.map((e) => [e.id, e])),
    faqById: new Map(kb.faqs.map((f) => [f.id, f])),
    projectAliases,
    companyAliases,
    categoryPatterns,
    vocabulary,
    projectTerms: new Map(
      kb.projects.map((p) => [p.id, termsOf(p.title, p.description, ...p.imageTitles)])
    ),
    experienceTerms: new Map(
      kb.experiences.map((e) => [
        e.id,
        termsOf(e.company, e.position, e.description, ...e.responsibilities),
      ])
    ),
  };
}
