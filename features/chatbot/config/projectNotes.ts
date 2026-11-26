import type { ChatBlock } from "../engine/types";
import type { EngineIndex } from "../engine/indexes";

/**
 * Projects Anjit had only a small part in. The chat never leads with them,
 * never uses them as proof points, and always lists them last.
 * Key = project slug in Supabase; value = what his role actually was.
 */
export const MINOR_PROJECTS: Record<string, string> = {
  hamrobazaar:
    "Anjit was involved only in the initial phase (early screens) before the project was handed over to another team. It is not his project and he did not build or scale the platform.",
};

const isMinor = (index: EngineIndex, id: number) => {
  const slug = index.projectById.get(id)?.slug;
  return !!slug && slug in MINOR_PROJECTS;
};

/** Moves minor projects to the end of every project list. */
export function demoteMinorProjects(blocks: ChatBlock[], index: EngineIndex): ChatBlock[] {
  return blocks.map((b) => {
    if (b.type !== "project_list") return b;
    const main = b.projectIds.filter((id) => !isMinor(index, id));
    const minor = b.projectIds.filter((id) => isMinor(index, id));
    return minor.length ? { ...b, projectIds: [...main, ...minor] } : b;
  });
}

/** Prompt section describing the minor projects that exist in the data. */
export function minorProjectsPrompt(index: EngineIndex): string {
  const lines = [...index.projectById.values()]
    .filter((p) => p.slug in MINOR_PROJECTS)
    .map((p) => `- ${p.title} (id ${p.id}): ${MINOR_PROJECTS[p.slug]}`);
  if (!lines.length) return "";
  return `MINOR CONTRIBUTIONS (overrides the project descriptions)
${lines.join("\n")}
- Never open with, introduce Anjit with, or pitch these projects. Never use them as proof points, as evidence of scale or users ("millions", "largest", "at scale"), or as his main work.
- Leave them out of answers unless the visitor names them or asks for every project. In lists, put them last.
- If asked about one directly, answer honestly and briefly with the role above, then pivot to a project he led (e.g. PRISM NEURO, Healing Trauma, Life of Canberran).

`;
}
