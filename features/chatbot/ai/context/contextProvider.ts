import type { HistoryItem } from "../../engine/conversationManager";
import type { KnowledgeSourceType } from "../../types/database";
import type { ContextMode } from "../config";
import type { PortfolioRepository } from "../data/portfolioRepository";
import {
  experienceRecord,
  faqRecord,
  profileRecord,
  projectDetailRecord,
  projectSummaryRecord,
  skillRecord,
} from "./recordFormatter";

export type RecordRef = { sourceType: KnowledgeSourceType; sourceId: string };

export type PortfolioContext = {
  /** Serialized portfolio data for the prompt. */
  text: string;
  mode: "full" | "overview";
  /** Records whose ids the model was shown (the validator allows only these, plus tool results). */
  records: RecordRef[];
};

/**
 * Decides what portfolio data goes into the prompt for one message.
 * The current implementation sends the published portfolio (full details
 * when small, a catalog when large). A future RAG implementation would
 * return only the records relevant to `message` — same interface.
 */
export interface ContextProvider {
  build(input: { message: string; history: HistoryItem[]; focusProjectIds: number[] }): Promise<PortfolioContext>;
}

export class PortfolioSnapshotContext implements ContextProvider {
  constructor(
    private readonly repo: PortfolioRepository,
    private readonly options: { mode: ContextMode; fullContextMaxChars: number }
  ) {}

  async build(): Promise<PortfolioContext> {
    const [profile, projects, skills, experience, faqs] = await Promise.all([
      this.repo.getProfile(),
      this.repo.listProjects(),
      this.repo.getSkills(),
      this.repo.getExperience(),
      this.repo.getFaqs(),
    ]);

    const records: RecordRef[] = [
      ...(profile ? [{ sourceType: "profile" as const, sourceId: "profile" }] : []),
      ...projects.map((p) => ({ sourceType: "project" as const, sourceId: String(p.id) })),
      ...skills.map((s) => ({ sourceType: "skill" as const, sourceId: s.id })),
      ...experience.map((e) => ({ sourceType: "experience" as const, sourceId: e.id })),
      ...faqs.map((f) => ({ sourceType: "faq" as const, sourceId: f.id })),
    ];

    const section = (name: string, value: unknown) => `## ${name}\n${JSON.stringify(value)}`;
    const shared = [
      section("profile", profile ? profileRecord(profile) : "not published"),
      section("skills", skills.length ? skills.map(skillRecord) : "none recorded"),
      section("experience", experience.length ? experience.map(experienceRecord) : "none recorded"),
    ];

    const full = [
      ...shared,
      section("projects", projects.map(projectDetailRecord)),
      section("faqs", faqs.length ? faqs.map(faqRecord) : "none recorded"),
    ].join("\n\n");

    const useFull =
      this.options.mode === "full" || (this.options.mode === "auto" && full.length <= this.options.fullContextMaxChars);
    if (useFull) return { text: full, mode: "full", records };

    const overview = [
      ...shared,
      section("projects (summaries; call getProjectDetails for more)", projects.map(projectSummaryRecord)),
      section(
        "faqs (questions only; call getFAQs for answers)",
        faqs.map((f) => ({ id: f.id, question: f.question, category: f.category ?? undefined }))
      ),
    ].join("\n\n");
    return { text: overview, mode: "overview", records };
  }
}
