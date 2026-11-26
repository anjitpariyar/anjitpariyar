import type { EngineIndex } from "./indexes";
import { extractTechRefs } from "./knowledge";
import type { Experience, Project, Skill, SkillCategory } from "./types";

const techKeysOf = (p: Project) => new Set(p.technologies.map((t) => t.key));

const expTechCache = new WeakMap<Experience, Set<string>>();
export function experienceTechKeys(index: EngineIndex, e: Experience): Set<string> {
  let keys = expTechCache.get(e);
  if (!keys) {
    keys = new Set(e.technologies.flatMap((t) => extractTechRefs(t, index.tech).map((r) => r.key)));
    expTechCache.set(e, keys);
  }
  return keys;
}

export function techLabel(index: EngineIndex, key: string): string {
  return index.tech.get(key)?.label ?? key;
}

export function techCategory(index: EngineIndex, key: string): SkillCategory | null {
  return index.tech.get(key)?.category ?? null;
}

/**
 * Projects whose `languages` column lists the technologies. Prefers projects
 * that list *all* of them; falls back to *any* when nothing lists all.
 */
export function projectsByTech(
  index: EngineIndex,
  techKeys: string[],
  within?: number[]
): { projects: Project[]; matchedAll: boolean } {
  const pool = within
    ? within.map((id) => index.projectById.get(id)).filter((p): p is Project => !!p)
    : index.kb.projects;
  const all = pool.filter((p) => techKeys.every((k) => techKeysOf(p).has(k)));
  if (all.length || techKeys.length <= 1) return { projects: all, matchedAll: true };
  return { projects: pool.filter((p) => techKeys.some((k) => techKeysOf(p).has(k))), matchedAll: false };
}

export function projectsByCategory(index: EngineIndex, category: SkillCategory, within?: number[]): Project[] {
  const pool = within
    ? within.map((id) => index.projectById.get(id)).filter((p): p is Project => !!p)
    : index.kb.projects;
  return pool.filter((p) => p.technologies.some((t) => techCategory(index, t.key) === category));
}

export function skillsByTech(index: EngineIndex, techKeys: string[]): Skill[] {
  const ids = new Set(
    techKeys.map((k) => index.tech.get(k)?.skillId).filter((id): id is string => !!id)
  );
  return index.kb.skills.filter((s) => ids.has(s.id));
}

export function skillsByCategory(index: EngineIndex, category: SkillCategory): Skill[] {
  return index.kb.skills.filter((s) => s.category === category);
}

export function experiencesByTech(index: EngineIndex, techKeys: string[]): Experience[] {
  return index.kb.experiences.filter((e) => {
    const keys = experienceTechKeys(index, e);
    return techKeys.some((k) => keys.has(k));
  });
}

export function experiencesByCategory(index: EngineIndex, category: SkillCategory): Experience[] {
  return index.kb.experiences.filter((e) =>
    [...experienceTechKeys(index, e)].some((k) => techCategory(index, k) === category)
  );
}

/** Projects sharing at least one technology with the given project. */
export function relatedProjects(index: EngineIndex, project: Project, limit = 3): Project[] {
  const keys = techKeysOf(project);
  return index.kb.projects
    .filter((p) => p.id !== project.id)
    .map((p) => ({ p, shared: p.technologies.filter((t) => keys.has(t.key)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, limit)
    .map((x) => x.p);
}

/**
 * Plain word search over project descriptions / image captions and
 * experience text. Used for things that aren't technologies
 * ("dashboards", "e-commerce").
 */
export function topicSearch(
  index: EngineIndex,
  terms: string[]
): { projects: Project[]; experiences: Experience[]; matchedTerms: string[] } {
  if (!terms.length) return { projects: [], experiences: [], matchedTerms: [] };
  const matched = new Set<string>();
  const rank = <T,>(items: T[], termsOf: (item: T) => Set<string> | undefined) =>
    items
      .map((item) => {
        const words = termsOf(item);
        const hits = terms.filter((t) => words?.has(t));
        hits.forEach((h) => matched.add(h));
        return { item, hits: hits.length };
      })
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .map((x) => x.item);

  return {
    projects: rank(index.kb.projects, (p) => index.projectTerms.get(p.id)),
    experiences: rank(index.kb.experiences, (e) => index.experienceTerms.get(e.id)),
    matchedTerms: [...matched],
  };
}

/** Sentences in a project description that describe Anjit's own work. */
export function contributionSentences(project: Project): string[] {
  if (project.contribution) return [project.contribution];
  const CONTRIBUTION =
    /(?<![a-z])(?:i|i've|i have|anjit|he|my)\b.*?\b(?:contribut|develop|buil|implement|design|creat|led|lead|responsib|work|optimi|integrat|architect)/i;
  return project.description
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s && CONTRIBUTION.test(s));
}
