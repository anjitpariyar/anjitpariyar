import type { Experience, Faq, Profile, Project, Skill } from "../../engine/types";

/**
 * Records -> compact, model-friendly shapes. Used both for the prompt
 * context and for tool results, so the model sees one consistent format.
 * Every record carries its database id, which is what the model must cite.
 */
const clip = (text: string | null | undefined, max: number) => {
  if (!text) return undefined;
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
};

export function profileRecord(p: Profile) {
  return {
    name: p.fullName,
    title: p.title ?? undefined,
    location: p.location ?? undefined,
    yearsOfExperience: p.yearsExperience ?? undefined,
    availability: p.availability ?? "not stated",
    shortBio: p.shortBio ?? undefined,
    background: clip(p.detailedBio, 2_000),
    additionalInformation: p.additionalInformation ?? undefined,
    contact: {
      email: p.email ?? "not listed",
      linkedin: p.linkedinUrl ?? "not listed",
      github: p.githubUrl ?? "not listed",
      website: p.website ?? "not listed",
      cv: p.cvUrl ?? "not listed",
      otherLinks: p.otherLinks.length ? p.otherLinks : undefined,
      contactForm: "/contact",
    },
  };
}

export function projectSummaryRecord(p: Project) {
  return {
    id: p.id,
    title: p.title,
    technologies: p.technologies.length ? p.technologies.map((t) => t.label) : p.technologiesText || "not listed",
    category: p.category ?? undefined,
    summary: clip(p.summary, 300),
  };
}

export function projectDetailRecord(p: Project) {
  return {
    ...projectSummaryRecord(p),
    /** Written by Anjit, often in the first person ("I" = Anjit). */
    description: clip(p.description, 3_000),
    contribution: p.contribution ?? "not separately recorded (see description)",
    features: p.features.length ? p.features : undefined,
    screensShown: p.imageTitles.length ? p.imageTitles : undefined,
    liveSite: p.link ?? undefined,
    sourceCode: p.githubUrl ?? undefined,
  };
}

export function skillRecord(s: Skill) {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description ?? undefined,
    aliases: s.aliases.length ? s.aliases : undefined,
    proficiency: s.proficiencyLabel ?? "not stated",
    yearsOfExperience: s.yearsExperience ?? "not stated",
    featured: s.isFeatured || undefined,
  };
}

export function experienceRecord(e: Experience) {
  return {
    id: e.id,
    company: e.company,
    position: e.position,
    employmentType: e.employmentType ?? undefined,
    start: e.startDate ?? "not stated",
    end: e.isCurrent ? "present" : e.endDate ?? "not stated",
    description: e.description ?? undefined,
    responsibilities: e.responsibilities.length ? e.responsibilities : undefined,
    technologies: e.technologies.length ? e.technologies : undefined,
  };
}

export function faqRecord(f: Faq) {
  return {
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category ?? undefined,
    relatedProjectIds: f.relatedProjectIds.length ? f.relatedProjectIds : undefined,
  };
}
