import { buildKnowledgeBase } from "../engine/knowledge";
import type { KnowledgeBase } from "../engine/types";
import type { PortfolioClient } from "./client";
import { getExperiences } from "./experienceService";
import { getFaqs } from "./faqService";
import { getProfile } from "./profileService";
import { getActiveProjects } from "./projectService";
import { getSkills } from "./skillService";
import { getChatSuggestions } from "./suggestionService";

export type KnowledgeBaseLoad = { knowledgeBase: KnowledgeBase; warnings: string[] };

/**
 * Read everything the assistant knows in one round of parallel queries.
 * Runs on the server (getStaticProps), so visitors' messages never hit
 * Supabase: the engine answers from this snapshot in the browser.
 */
export async function loadKnowledgeBase(client: PortfolioClient): Promise<KnowledgeBaseLoad> {
  const [profile, projects, skills, experiences, faqs, suggestions] = await Promise.all([
    getProfile(client),
    getActiveProjects(client),
    getSkills(client),
    getExperiences(client),
    getFaqs(client),
    getChatSuggestions(client),
  ]);

  const warnings = [profile, projects, skills, experiences, faqs, suggestions]
    .map((r) => r.warning)
    .filter((w): w is string => !!w);

  return {
    knowledgeBase: buildKnowledgeBase({
      profile: profile.data,
      projects: projects.data,
      skills: skills.data,
      experiences: experiences.data,
      faqs: faqs.data,
      suggestions: suggestions.data,
    }),
    warnings,
  };
}
