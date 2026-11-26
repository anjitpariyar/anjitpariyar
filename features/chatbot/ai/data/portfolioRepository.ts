import type { EngineIndex } from "../../engine/indexes";
import { dropOverlaps, findTechnologies } from "../../engine/knowledge";
import { normalize } from "../../engine/text";
import type { Experience, Faq, Profile, Project, Skill, SkillCategory } from "../../engine/types";

/**
 * Data access for the assistant. Everything the model can see or request
 * goes through this interface, and every implementation must return
 * published records only.
 *
 * Today: an in-memory snapshot of the published portfolio (small dataset,
 * loaded via RLS-protected anon queries and cached server-side).
 * Later: a SQL-backed or semantic-search implementation can replace it
 * without touching tools, prompts, conversation handling or the UI.
 */
export interface PortfolioRepository {
  getProfile(): Promise<Profile | null>;
  listProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | null>;
  searchProjectsByTechnology(technology: string): Promise<{ technology: string; projects: Project[] }>;
  getSkills(category?: SkillCategory): Promise<Skill[]>;
  getExperience(): Promise<Experience[]>;
  getFaqs(category?: string): Promise<Faq[]>;
}

export class SnapshotPortfolioRepository implements PortfolioRepository {
  constructor(private readonly index: EngineIndex) {}

  async getProfile() {
    return this.index.kb.profile;
  }

  async listProjects() {
    return this.index.kb.projects;
  }

  async getProject(id: number) {
    return this.index.projectById.get(id) ?? null;
  }

  /**
   * Resolves spelling variants ("ReactJS", "next js") to the canonical
   * technology, then matches the project's listed stack. Falls back to a
   * plain substring match for technologies the vocabulary doesn't know.
   */
  async searchProjectsByTechnology(technology: string) {
    const query = normalize(technology);
    const keys = [...new Set(dropOverlaps(findTechnologies(query, this.index.tech)).map((m) => m.key))];
    if (keys.length) {
      const projects = this.index.kb.projects.filter((p) => p.technologies.some((t) => keys.includes(t.key)));
      return { technology: keys.map((k) => this.index.tech.get(k)?.label ?? k).join(", "), projects };
    }
    const projects = query
      ? this.index.kb.projects.filter((p) => normalize(p.technologiesText).includes(query))
      : [];
    return { technology: technology.trim(), projects };
  }

  async getSkills(category?: SkillCategory) {
    return category ? this.index.kb.skills.filter((s) => s.category === category) : this.index.kb.skills;
  }

  async getExperience() {
    return this.index.kb.experiences;
  }

  async getFaqs(category?: string) {
    const c = category?.trim().toLowerCase();
    return c ? this.index.kb.faqs.filter((f) => f.category?.toLowerCase() === c) : this.index.kb.faqs;
  }
}
