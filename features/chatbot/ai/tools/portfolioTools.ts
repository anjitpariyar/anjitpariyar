import { z } from "zod";
import type { SkillCategory } from "../../engine/types";
import type { RecordRef } from "../context/contextProvider";
import {
  experienceRecord,
  faqRecord,
  profileRecord,
  projectDetailRecord,
  projectSummaryRecord,
  skillRecord,
} from "../context/recordFormatter";
import type { PortfolioRepository } from "../data/portfolioRepository";
import type { ToolCall, ToolDefinition, ToolResult } from "../llm/llmProvider";

/**
 * Read-only tools the model may call. The server owns this list: the model
 * can only pick a name and supply arguments, which are validated with Zod
 * before anything runs. Tools go through the repository (published data
 * only); there is no SQL or code execution path.
 */
const CATEGORIES = ["Frontend", "Backend", "Database", "Styling", "Animation", "Tools", "Other"] as const;

const ARGS = {
  getProfile: z.object({}).strict(),
  getProjects: z.object({}).strict(),
  getProjectDetails: z
    .object({ projectId: z.coerce.number().int().positive().describe("Numeric project id from the portfolio data") })
    .strict(),
  searchProjectsByTechnology: z
    .object({ technology: z.string().trim().min(1).max(60).describe('Technology name, e.g. "React" or "Framer Motion"') })
    .strict(),
  getSkills: z.object({ category: z.enum(CATEGORIES).optional().describe("Optional skill category filter") }).strict(),
  getExperience: z.object({}).strict(),
  getFAQs: z.object({ category: z.string().trim().max(40).optional().describe("Optional FAQ category") }).strict(),
} as const;

type ToolName = keyof typeof ARGS;

const DESCRIPTIONS: Record<ToolName, string> = {
  getProfile: "Anjit's published profile: title, bio, location, years of experience, availability and contact links.",
  getProjects: "List all published projects with id, title, technologies and a one-line summary.",
  getProjectDetails: "Full published details of one project: description, contribution, features, screens and links.",
  searchProjectsByTechnology: "Projects whose listed tech stack includes a technology (spelling variants are understood).",
  getSkills: "Published skills, optionally filtered by category.",
  getExperience: "Published professional experience (roles, companies, dates, responsibilities, technologies).",
  getFAQs: "Published FAQ questions and answers, optionally filtered by category.",
};

const jsonSchemaOf = (schema: z.ZodType) => {
  const s = z.toJSONSchema(schema) as Record<string, unknown>;
  delete s.$schema;
  return s;
};

export const PORTFOLIO_TOOL_DEFINITIONS: ToolDefinition[] = (Object.keys(ARGS) as ToolName[]).map((name) => ({
  name,
  description: DESCRIPTIONS[name],
  parameters: jsonSchemaOf(ARGS[name]),
}));

const ref = (sourceType: RecordRef["sourceType"], id: string | number): RecordRef => ({ sourceType, sourceId: String(id) });

/** Execute one tool call. Never throws: errors are returned to the model as data. */
export async function executePortfolioTool(repo: PortfolioRepository, call: ToolCall): Promise<ToolResult> {
  if (!(call.name in ARGS)) {
    return { ok: false, response: { error: `Unknown tool "${call.name}".` }, records: [] };
  }
  const name = call.name as ToolName;
  const parsed = ARGS[name].safeParse(call.args ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      response: { error: `Invalid arguments: ${parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ")}` },
      records: [],
    };
  }
  const args = parsed.data as Record<string, unknown>;

  try {
    switch (name) {
      case "getProfile": {
        const p = await repo.getProfile();
        return p
          ? { ok: true, response: { profile: profileRecord(p) }, records: [ref("profile", "profile")] }
          : { ok: true, response: { profile: null, note: "No profile is published." }, records: [] };
      }
      case "getProjects": {
        const projects = await repo.listProjects();
        return { ok: true, response: { projects: projects.map(projectSummaryRecord) }, records: projects.map((p) => ref("project", p.id)) };
      }
      case "getProjectDetails": {
        const p = await repo.getProject(args.projectId as number);
        return p
          ? { ok: true, response: { project: projectDetailRecord(p) }, records: [ref("project", p.id)] }
          : { ok: false, response: { error: `No published project with id ${args.projectId}.` }, records: [] };
      }
      case "searchProjectsByTechnology": {
        const { technology, projects } = await repo.searchProjectsByTechnology(args.technology as string);
        return {
          ok: true,
          response: {
            technology,
            matches: projects.map(projectSummaryRecord),
            note: projects.length ? undefined : "No published project lists this technology.",
          },
          records: projects.map((p) => ref("project", p.id)),
        };
      }
      case "getSkills": {
        const skills = await repo.getSkills(args.category as SkillCategory | undefined);
        return { ok: true, response: { skills: skills.map(skillRecord) }, records: skills.map((s) => ref("skill", s.id)) };
      }
      case "getExperience": {
        const items = await repo.getExperience();
        return {
          ok: true,
          response: { experience: items.map(experienceRecord), note: items.length ? undefined : "No work history is published." },
          records: items.map((e) => ref("experience", e.id)),
        };
      }
      case "getFAQs": {
        const faqs = await repo.getFaqs(args.category as string | undefined);
        return { ok: true, response: { faqs: faqs.map(faqRecord) }, records: faqs.map((f) => ref("faq", f.id)) };
      }
    }
  } catch (err) {
    console.error(`[chat] tool ${name} failed:`, (err as Error).message);
    return { ok: false, response: { error: "The data source is temporarily unavailable." }, records: [] };
  }
}
