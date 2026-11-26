import { describe, expect, test } from "bun:test";
import { applyCardPolicy, rotationOrder } from "../cardPolicy";
import { createChatEngine } from "..";
import { buildKnowledgeBase } from "../knowledge";
import { PROJECT_ROWS } from "./projects.fixture";

const kb = buildKnowledgeBase({ profile: null, projects: PROJECT_ROWS, skills: [], experiences: [], faqs: [], suggestions: [] });
const { index } = createChatEngine(kb);
const id = (slug: string) => [...index.projectById.values()].find((p) => p.slug === slug)!.id;
const text = { type: "text" as const, text: "answer" };
const list = (...ids: number[]) => ({ type: "project_list" as const, projectIds: ids });

describe("card policy", () => {
  test("no project cards on general / hiring questions", () => {
    const out = applyCardPolicy([text, list(id("prisma"), id("digitalghumti"))], { intent: "about", message: "is anjit good?", shownProjectIds: [], index });
    expect(out).toEqual([text]);
  });

  test("a project the visitor names still shows on a general question", () => {
    const out = applyCardPolicy([text, list(id("prisma"), id("digitalghumti"))], { intent: "about", message: "is he good? like prism neuro", shownProjectIds: [], index });
    expect(out).toEqual([text, list(id("prisma"))]);
  });

  test("projects already shown are not repeated in a new list", () => {
    const out = applyCardPolicy([text, list(id("prisma"), id("digitalghumti"), id("signite"))], {
      intent: "projects", message: "what else has he built?", shownProjectIds: [id("prisma")], index,
    });
    expect(out).toEqual([text, list(id("digitalghumti"), id("signite"))]);
  });

  test("narrowing follow-up over an already-shown list keeps it", () => {
    const out = applyCardPolicy([text, list(id("digitalghumti"))], { intent: "projects", message: "which one used animation?", shownProjectIds: [id("digitalghumti"), id("prisma")], index });
    expect(out).toEqual([text, list(id("digitalghumti"))]);
  });

  test("rotation is stable per conversation and differs between conversations", () => {
    const ids = [...index.projectById.keys()];
    expect(rotationOrder(ids, "chat-a")).toEqual(rotationOrder(ids, "chat-a"));
    expect(new Set(rotationOrder(ids, "chat-a"))).toEqual(new Set(ids));
    const orders = new Set(["a", "b", "c", "d", "e"].map((s) => rotationOrder(ids, s).join(",")));
    expect(orders.size).toBeGreaterThan(1);
  });
});
