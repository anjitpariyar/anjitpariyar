import type {
  ChatSuggestionRow,
  ExperienceRow,
  FaqRow,
  ProfileRow,
  ProjectRow,
  SkillRow,
} from "../types/database";
import { TECHNOLOGIES } from "./synonyms";
import { compact, firstParagraph, htmlToText, normalize, phraseRegExp, STOPWORDS } from "./text";
import type {
  KnowledgeBase,
  Profile,
  ProfileLink,
  Project,
  Skill,
  SkillCategory,
  TechRef,
} from "./types";

// ---------------------------------------------------------------------------
// Technology index: built-in vocabulary + portfolio_skills (name, aliases)
// ---------------------------------------------------------------------------

export type TechEntry = {
  key: string;
  label: string;
  category: SkillCategory;
  patterns: RegExp[];
  /** Linked portfolio_skills row, if any. */
  skillId: string | null;
  /** True when the entry exists only because of a skill row. */
  fromSkill: boolean;
};

export type TechIndex = Map<string, TechEntry>;

export type Span = { start: number; end: number };
export type TechMatch = Span & { key: string };

/** Aliases too ambiguous to match as bare words ("what's next?"). */
const AMBIGUOUS_ALIASES = new Set(["next", "go", "express", "node", "spring", "query", "router"]);

function usableAlias(alias: string): boolean {
  const a = normalize(alias);
  return a.length >= 2 && !STOPWORDS.has(a) && !AMBIGUOUS_ALIASES.has(a);
}

function matchesWhole(patterns: RegExp[], text: string): boolean {
  return patterns.some((p) => {
    p.lastIndex = 0;
    const m = p.exec(text);
    return !!m && m[0].length === text.length;
  });
}

export function buildTechIndex(skills: Skill[]): TechIndex {
  const index: TechIndex = new Map();
  for (const [key, def] of Object.entries(TECHNOLOGIES)) {
    index.set(key, { key, ...def, patterns: [...def.patterns], skillId: null, fromSkill: false });
  }

  for (const skill of skills) {
    const name = normalize(skill.name);
    const existing =
      index.get(skill.slug) ??
      index.get(compact(skill.slug)) ??
      [...index.values()].find((e) => !e.fromSkill && matchesWhole(e.patterns, name));

    const aliasPatterns = [skill.name, ...skill.aliases]
      .filter(usableAlias)
      .map((a) => phraseRegExp(a, true));

    if (existing && !existing.skillId) {
      existing.skillId = skill.id;
      existing.label = skill.name; // database wording wins for display
      existing.patterns.push(...aliasPatterns);
    } else {
      const key = `skill-${skill.slug}`;
      index.set(key, {
        key,
        label: skill.name,
        category: skill.category,
        patterns: aliasPatterns,
        skillId: skill.id,
        fromSkill: true,
      });
    }
  }
  return index;
}

/** Keep the longest of overlapping matches ("framer motion" beats "motion"). */
export function dropOverlaps<T extends Span>(matches: T[]): T[] {
  const sorted = [...matches].sort(
    (a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start
  );
  const kept: T[] = [];
  for (const m of sorted) {
    if (!kept.some((k) => m.start < k.end && k.start < m.end)) kept.push(m);
  }
  return kept.sort((a, b) => a.start - b.start);
}

/** All technology mentions in normalized text, with character spans. */
export function findTechnologies(normalized: string, index: TechIndex): TechMatch[] {
  const matches: TechMatch[] = [];
  for (const entry of index.values()) {
    for (const pattern of entry.patterns) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(normalized))) {
        if (m[0].length === 0) {
          pattern.lastIndex++;
          continue;
        }
        matches.push({ key: entry.key, start: m.index, end: m.index + m[0].length });
      }
    }
  }
  return matches;
}

export function extractTechRefs(text: string, index: TechIndex): TechRef[] {
  const seen = new Set<string>();
  const refs: TechRef[] = [];
  for (const m of dropOverlaps(findTechnologies(normalize(text), index))) {
    if (seen.has(m.key)) continue;
    seen.add(m.key);
    refs.push({ key: m.key, label: index.get(m.key)!.label });
  }
  return refs;
}

// ---------------------------------------------------------------------------
// Row -> knowledge base normalizers
// ---------------------------------------------------------------------------

const clean = (v: string | null | undefined): string | null => {
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t : null;
};

const isHttpUrl = (v: string | null): v is string => !!v && /^https?:\/\//i.test(v);
const isEmail = (v: string | null): v is string => !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function parseImageTitles(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => (img && typeof img === "object" ? (img as { title?: unknown }).title : null))
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim());
}

function parseLinks(raw: unknown): ProfileLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => (l && typeof l === "object" ? (l as Record<string, unknown>) : {}))
    .map((l) => ({ label: clean(l.label as string), url: clean(l.url as string) }))
    .filter((l): l is ProfileLink => !!l.label && isHttpUrl(l.url));
}

export function toProfile(row: ProfileRow | null): Profile | null {
  if (!row || !clean(row.full_name)) return null;
  return {
    fullName: row.full_name.trim(),
    title: clean(row.professional_title),
    shortBio: clean(row.short_bio),
    detailedBio: clean(row.detailed_bio),
    location: clean(row.location),
    email: isEmail(clean(row.email)) ? clean(row.email) : null,
    website: isHttpUrl(clean(row.website)) ? clean(row.website) : null,
    githubUrl: isHttpUrl(clean(row.github_url)) ? clean(row.github_url) : null,
    linkedinUrl: isHttpUrl(clean(row.linkedin_url)) ? clean(row.linkedin_url) : null,
    cvUrl: isHttpUrl(clean(row.cv_url)) ? clean(row.cv_url) : null,
    otherLinks: parseLinks(row.other_links),
    yearsExperience:
      row.years_experience === null || row.years_experience === undefined
        ? null
        : Number(row.years_experience),
    availability: clean(row.availability_status),
    additionalInformation: clean(row.additional_information),
  };
}

export function toSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    name: row.name.trim(),
    slug: row.slug,
    category: row.category ?? "Other",
    description: clean(row.description),
    aliases: (row.aliases ?? []).filter(Boolean),
    relatedSkills: (row.related_skills ?? []).filter(Boolean),
    proficiencyLabel: clean(row.proficiency_label),
    yearsExperience: row.years_experience === null ? null : Number(row.years_experience),
    isFeatured: !!row.is_featured,
  };
}

export function toProject(row: ProjectRow, index: TechIndex): Project {
  const description = htmlToText(row.description);
  const technologiesText = (row.languages ?? "").replace(/\s+/g, " ").trim();
  return {
    id: row.id,
    slug: row.slug,
    title: row.title.trim(),
    thumbnail: isHttpUrl(row.thumbnail) ? row.thumbnail : null,
    link: isHttpUrl(row.link) ? row.link : null,
    description,
    summary: firstParagraph(description),
    technologiesText,
    technologies: extractTechRefs(technologiesText, index),
    imageTitles: parseImageTitles(row.images),
    isPinned: !!row.is_pinned,
    contribution: htmlToText(row.contribution) || null,
    features: Array.isArray(row.features) ? row.features.map((f) => f.trim()).filter(Boolean) : [],
    category: clean(row.category),
    githubUrl: isHttpUrl(clean(row.github_url)) ? clean(row.github_url) : null,
  };
}

export type RawKnowledge = {
  profile: ProfileRow | null;
  projects: ProjectRow[];
  skills: SkillRow[];
  experiences: ExperienceRow[];
  faqs: FaqRow[];
  suggestions: ChatSuggestionRow[];
};

/** Turn raw (already published/active-filtered) rows into the knowledge base. */
export function buildKnowledgeBase(input: RawKnowledge, loadedAt = new Date()): KnowledgeBase {
  // Queries already filter, and RLS guards the new tables; this is a final
  // guarantee that inactive / unpublished rows never reach visitors.
  const published = <T extends { is_published: boolean }>(rows: T[]) =>
    rows.filter((r) => r.is_published === true);
  const raw: RawKnowledge = {
    profile: input.profile?.is_published ? input.profile : null,
    projects: input.projects.filter((p) => p.is_active === true),
    skills: published(input.skills),
    experiences: published(input.experiences),
    faqs: published(input.faqs),
    suggestions: published(input.suggestions),
  };

  const skills = raw.skills.map(toSkill);
  const index = buildTechIndex(skills);
  const projects = raw.projects.map((p) => toProject(p, index));
  const projectIds = new Set(projects.map((p) => p.id));

  return {
    profile: toProfile(raw.profile),
    projects,
    skills,
    experiences: raw.experiences.map((e) => ({
      id: e.id,
      company: e.company.trim(),
      position: e.position.trim(),
      employmentType: clean(e.employment_type),
      description: clean(e.description),
      responsibilities: (e.responsibilities ?? []).map((r) => r.trim()).filter(Boolean),
      startDate: e.start_date,
      endDate: e.end_date,
      isCurrent: !!e.is_current,
      technologies: (e.technologies ?? []).map((t) => t.trim()).filter(Boolean),
      companyUrl: isHttpUrl(clean(e.company_url)) ? clean(e.company_url) : null,
    })),
    faqs: raw.faqs.map((f) => ({
      id: f.id,
      question: f.question.trim(),
      answer: f.answer.trim(),
      keywords: (f.keywords ?? []).filter(Boolean),
      category: clean(f.category),
      relatedProjectIds: (f.related_project_ids ?? [])
        .map(Number)
        .filter((id) => projectIds.has(id)),
    })),
    suggestions: raw.suggestions
      .filter((s) => clean(s.label) && clean(s.message))
      .map((s) => ({
        id: s.id,
        label: s.label.trim(),
        message: s.message.trim(),
        category: clean(s.category),
      })),
    loadedAt: loadedAt.toISOString(),
  };
}
