import { describe, expect, test } from "bun:test";
import { demoteMinorProjects, minorProjectsPrompt } from "../../config/projectNotes";
import { createChatEngine } from "../../engine";
import { buildKnowledgeBase } from "../../engine/knowledge";
import { PROJECT_ROWS } from "../../engine/__tests__/projects.fixture";

const kb = buildKnowledgeBase({ profile: null, projects: PROJECT_ROWS, skills: [], experiences: [], faqs: [], suggestions: [] });
const { index } = createChatEngine(kb);
const hamrobazar = [...index.projectById.values()].find((p) => p.slug === "hamrobazaar")!;
const others = [...index.projectById.values()].filter((p) => p.slug !== "hamrobazaar").map((p) => p.id);

describe("minor projects (Hamrobazar)", () => {
  test("moved to the end of project lists, other blocks untouched", () => {
    const text = { type: "text" as const, text: "hi" };
    const out = demoteMinorProjects([text, { type: "project_list", projectIds: [hamrobazar.id, ...others.slice(0, 2)] }], index);
    expect(out[0]).toBe(text);
    expect(out[1]).toEqual({ type: "project_list", projectIds: [...others.slice(0, 2), hamrobazar.id] });
  });

  test("prompt names it with his real role and forbids pitching it", () => {
    const rules = minorProjectsPrompt(index);
    expect(rules).toContain(`Hamrobazar (id ${hamrobazar.id})`);
    expect(rules).toContain("initial phase");
    expect(rules).toContain("Never open with");
  });
});
