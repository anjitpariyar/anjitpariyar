import { describe, expect, test } from "bun:test";
import { createChatEngine } from "../../engine";
import { buildKnowledgeBase } from "../../engine/knowledge";
import { PROJECT_ROWS } from "../../engine/__tests__/projects.fixture";
import { handleChat, type ChatDeps } from "../../server/chatService";
import type { LlmProvider } from "../llm/llmProvider";
import { CONTACT_TOOL_NAME, createContactExecutor, type ContactSender } from "../tools/contactTool";

const args = { name: "Sam", email: "sam@acme.io", message: "We'd like to hire Anjit for a Next.js project." };
const summary = { role: "assistant" as const, text: "Here's what I'll send: • Name: Sam • Email: sam@acme.io • Message: … Shall I send it?" };
const typed = { role: "user" as const, text: "I'm Sam, sam@acme.io, we'd like to hire him for a Next.js project" };

function sender(allow = true) {
  const sent: unknown[] = [];
  const s: ContactSender = {
    send: async (m) => {
      if (!allow) throw Object.assign(new Error("Too many"), { reason: "rate_limited" });
      sent.push(m);
    },
  };
  return { s, sent };
}
const call = (a: Record<string, unknown> = args) => ({ name: CONTACT_TOOL_NAME, args: a });

describe("sendMessageToAnjit guards", () => {
  test("sends after the summary was shown and the visitor confirmed", async () => {
    const { s, sent } = sender();
    const exec = createContactExecutor({ sender: s, history: [typed, summary], currentMessage: "yes send it" });
    expect((await exec(call())).ok).toBe(true);
    expect(sent).toEqual([args]);
  });

  test("refuses an email the visitor never typed", async () => {
    const { s, sent } = sender();
    const exec = createContactExecutor({ sender: s, history: [summary], currentMessage: "yes" });
    expect((await exec(call())).ok).toBe(false);
    expect(sent).toHaveLength(0);
  });

  test("refuses before the summary/confirmation step", async () => {
    const { s, sent } = sender();
    const exec = createContactExecutor({ sender: s, history: [], currentMessage: typed.text });
    const r = await exec(call());
    expect(r.ok).toBe(false);
    expect(String(r.response.error)).toContain("Not confirmed");
    expect(sent).toHaveLength(0);
  });

  test("refuses invalid email, rate-limited visitor and a second send", async () => {
    const ok = createContactExecutor({ sender: sender().s, history: [typed, summary], currentMessage: "yes" });
    expect((await ok(call({ ...args, email: "nope" }))).ok).toBe(false);
    expect((await ok(call())).ok).toBe(true);
    expect((await ok(call())).ok).toBe(false);

    const limited = createContactExecutor({ sender: sender(false).s, history: [typed, summary], currentMessage: "yes" });
    expect((await limited(call())).ok).toBe(false);
  });

  test("an inbox failure is reported, not claimed as sent", async () => {
    const s: ContactSender = { send: async () => { throw new Error("down"); } };
    const exec = createContactExecutor({ sender: s, history: [typed, summary], currentMessage: "yes" });
    const r = await exec(call());
    expect(r.ok).toBe(false);
    expect(r.response.sent).toBe(false);
  });
});

describe("chat orchestration with the contact tool", () => {
  const kb = buildKnowledgeBase({ profile: null, projects: PROJECT_ROWS, skills: [], experiences: [], faqs: [], suggestions: [] });
  const engine = createChatEngine(kb);

  function toolCallingLlm(after: (sent: unknown) => unknown): LlmProvider {
    return {
      name: "fake",
      model: "fake-model",
      generateResponse: async () => ({ text: "", usage: { inputTokens: 0, outputTokens: 0, calls: 1 } }),
      generateStructuredResponse: async (req) => {
        const result = await req.tools!.execute(call());
        const raw = after(result);
        if (raw instanceof Error) throw raw;
        return { raw, parsed: { success: true, data: raw as never }, usage: { inputTokens: 0, outputTokens: 0, calls: 1 }, toolCalls: [], model: "fake-model" };
      },
    };
  }
  const deps = (llm: LlmProvider, contact?: ContactSender): ChatDeps => ({
    getKnowledge: async () => ({ kb, engine }),
    llm,
    config: { maxOutputTokens: 1000, context: { mode: "full", fullContextMaxChars: 100_000, maxToolRounds: 3 } },
    contact,
  });

  test("tool is offered only when a sender is configured", async () => {
    let offered: string[] = [];
    const llm: LlmProvider = {
      ...toolCallingLlm(() => ({})),
      generateStructuredResponse: async (req) => {
        offered = req.tools!.definitions.map((d) => d.name);
        const raw = { answer: "ok", basis: "confirmed", intent: "contact", blocks: [], suggestions: [], sources: [] };
        return { raw, parsed: { success: true, data: raw as never }, usage: { inputTokens: 0, outputTokens: 0, calls: 1 }, toolCalls: [], model: "m" };
      },
    };
    await handleChat({ message: "hi", history: [] }, deps(llm));
    expect(offered).not.toContain(CONTACT_TOOL_NAME);
    await handleChat({ message: "hi", history: [] }, deps(llm, sender().s));
    expect(offered).toContain(CONTACT_TOOL_NAME);
  });

  test("if the model fails after sending, the visitor is still told it was sent", async () => {
    const { s, sent } = sender();
    const out = await handleChat(
      { message: "yes", history: [typed, summary] },
      deps(toolCallingLlm(() => new Error("boom")), s)
    );
    expect(sent).toHaveLength(1);
    expect(out.reply.mode).toBe("ai");
    expect((out.reply.blocks[0] as { text: string }).text).toContain("Done!");
  });
});
