/**
 * Direct-Gemini architecture tests, no network or keys:
 *   bun test features
 * Live model quality is measured by scripts/eval-chat.ts.
 */
import { describe, expect, test } from "bun:test";
import { createChatEngine } from "../../engine";
import { createChatContext, sanitizeChatContext } from "../../engine/conversationManager";
import { buildKnowledgeBase } from "../../engine/knowledge";
import { cleanAnswer, validateModelResponse } from "../../engine/responseValidator";
import { PROJECT_ROWS } from "../../engine/__tests__/projects.fixture";
import { handleChat, type ChatDeps } from "../../server/chatService";
import { createRateLimiter } from "../../server/rateLimit";
import { ChatRequestSchema } from "../../server/requestSchema";
import { PortfolioSnapshotContext, type RecordRef } from "../context/contextProvider";
import { SnapshotPortfolioRepository } from "../data/portfolioRepository";
import { GeminiProvider } from "../llm/geminiProvider";
import { LlmError, type LlmProvider, type ToolSet } from "../llm/llmProvider";
import { modelOutputJsonSchema, ModelOutputSchema } from "../llm/responseSchema";
import { executePortfolioTool, PORTFOLIO_TOOL_DEFINITIONS } from "../tools/portfolioTools";

const ts = { created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };
const kb = buildKnowledgeBase({
  profile: {
    ...ts, id: "p1", full_name: "Anjit Pariyar", professional_title: "React Developer",
    short_bio: "React developer from Nepal.", detailed_bio: null, location: "Nepal", email: null,
    website: "https://www.anjitpariyar.com.np", github_url: "https://github.com/anjitpariyar",
    linkedin_url: null, cv_url: null, other_links: [], years_experience: 5,
    availability_status: null, additional_information: null, is_published: true,
  },
  projects: PROJECT_ROWS,
  skills: [
    { ...ts, id: "s-react", name: "React", slug: "react", category: "Frontend", description: null, aliases: [], related_skills: [], proficiency_label: null, years_experience: null, is_featured: true, sort_order: 0, is_published: true },
    { ...ts, id: "s-anim", name: "Web animation", slug: "web-animation", category: "Animation", description: null, aliases: [], related_skills: [], proficiency_label: null, years_experience: null, is_featured: false, sort_order: 0, is_published: true },
    { ...ts, id: "s-hidden", name: "Cobol", slug: "cobol", category: "Other", description: null, aliases: [], related_skills: [], proficiency_label: null, years_experience: null, is_featured: false, sort_order: 0, is_published: false },
  ],
  experiences: [],
  faqs: [
    { ...ts, id: "f1", question: "What kind of projects does Anjit build?", answer: "Mostly web apps with React and Next.js.", keywords: [], category: "general", related_project_ids: [], sort_order: 0, is_published: true },
    { ...ts, id: "f-hidden", question: "Secret?", answer: "Hidden", keywords: [], category: null, related_project_ids: [], sort_order: 0, is_published: false },
  ],
  suggestions: [],
});
const engine = createChatEngine(kb);
const index = engine.index;
const repo = new SnapshotPortfolioRepository(index);
const HAMROBAZAR = 1;
const DIGITAL_GHUMTI = 2;
const MORTGAGE = 3;

// ---------------------------------------------------------------------------

describe("portfolio context", () => {
  test("small portfolio: full details in the prompt, all published records referenceable", async () => {
    const ctx = await new PortfolioSnapshotContext(repo, { mode: "auto", fullContextMaxChars: 100_000 }).build();
    expect(ctx.mode).toBe("full");
    expect(ctx.text).toContain('"title":"Hamrobazar"');
    expect(ctx.text).toContain("I have contributed to the development of the largest E-commerce site");
    expect(ctx.text).toContain('"availability":"not stated"');
    expect(ctx.records).toContainEqual({ sourceType: "project", sourceId: "1" });
    expect(ctx.records).toContainEqual({ sourceType: "faq", sourceId: "f1" });
  });

  test("large portfolio: switches to a catalog (details via tools)", async () => {
    const ctx = await new PortfolioSnapshotContext(repo, { mode: "auto", fullContextMaxChars: 1_000 }).build();
    expect(ctx.mode).toBe("overview");
    expect(ctx.text).toContain("call getProjectDetails");
    expect(ctx.text).not.toContain("I have contributed to the development");
    expect(ctx.text).not.toContain("Mostly web apps"); // FAQ answers come from getFAQs
  });

  test("never contains unpublished or inactive data", async () => {
    const ctx = await new PortfolioSnapshotContext(repo, { mode: "full", fullContextMaxChars: 1 }).build();
    for (const hidden of ["WithGyre", "Cobol", "Secret?", "Hidden"]) expect(ctx.text).not.toContain(hidden);
  });
});

describe("tools (function calling)", () => {
  const run = (name: string, args: Record<string, unknown>) => executePortfolioTool(repo, { name, args });

  test("declarations are valid JSON Schema objects", () => {
    expect(PORTFOLIO_TOOL_DEFINITIONS.map((d) => d.name)).toEqual([
      "getProfile", "getProjects", "getProjectDetails", "searchProjectsByTechnology", "getSkills", "getExperience", "getFAQs",
    ]);
    for (const d of PORTFOLIO_TOOL_DEFINITIONS) {
      expect(d.parameters.type).toBe("object");
      expect(d.parameters.$schema).toBeUndefined();
    }
  });

  test("getProjectDetails returns details and discloses that record", async () => {
    const r = await run("getProjectDetails", { projectId: "3" });
    expect(r.ok).toBe(true);
    expect((r.response.project as { title: string }).title).toBe("Hamro Mortage");
    expect(r.records).toEqual([{ sourceType: "project", sourceId: "3" }]);
  });

  test("technology search understands spelling variants", async () => {
    const react = await run("searchProjectsByTechnology", { technology: "ReactJS" });
    expect((react.response.matches as { title: string }[]).map((m) => m.title.trim())).toEqual(["Hamrobazar", "Digital Ghumti", "Life of Canberran", "PRISM NEURO"]);
    const next = await run("searchProjectsByTechnology", { technology: "next js" });
    expect((next.response.matches as unknown[]).length).toBe(4);
    const none = await run("searchProjectsByTechnology", { technology: "Vue" });
    expect(none.response.note).toBe("No published project lists this technology.");
  });

  test("arguments are validated; invalid calls return errors, not exceptions", async () => {
    expect((await run("getProjectDetails", { projectId: -1 })).ok).toBe(false);
    expect((await run("getProjectDetails", { projectId: 999 })).response.error).toContain("No published project");
    expect((await run("getProjectDetails", { projectId: 1, sql: "drop table projects" })).ok).toBe(false); // strict: unknown keys rejected
    expect((await run("getSkills", { category: "Hacking" })).ok).toBe(false);
    expect((await run("searchProjectsByTechnology", { technology: "x".repeat(200) })).ok).toBe(false);
    expect((await run("runSql", { query: "select 1" })).response.error).toContain("Unknown tool");
  });

  test("tools never return unpublished data", async () => {
    const skills = await run("getSkills", {});
    expect(JSON.stringify(skills.response)).not.toContain("Cobol");
    const faqs = await run("getFAQs", {});
    expect(JSON.stringify(faqs.response)).not.toContain("Secret");
    const details = await run("getProjectDetails", { projectId: 4 }); // WithGyre is inactive
    expect(details.ok).toBe(false);
  });
});

describe("response validation (model output is untrusted)", () => {
  const disclosed: RecordRef[] = [{ sourceType: "project", sourceId: "1" }, { sourceType: "faq", sourceId: "f1" }];

  test("keeps valid cards, rejects invented ids, unknown types and undisclosed sources", () => {
    const v = validateModelResponse(
      {
        answer: "**Yes** — he built *Hamrobazar*.",
        basis: "confirmed",
        intent: "projects",
        blocks: [
          { type: "project_list", ids: ["1", "999", "abc"] },
          { type: "html", ids: [] },
          { type: "skill_grid", ids: ["s-hidden", "s-react"] },
        ],
        suggestions: ["Tell me more", "x".repeat(300)],
        sources: [{ sourceType: "project", sourceId: "1" }, { sourceType: "project", sourceId: "2" }],
      },
      index,
      disclosed
    );
    expect(v.blocks).toEqual([
      { type: "text", text: "Yes — he built Hamrobazar." },
      { type: "project_list", projectIds: [1] },
      { type: "skill_grid", skillIds: ["s-react"] },
    ]);
    expect(v.sources).toEqual([{ sourceType: "project", sourceId: "1", label: "Hamrobazar", href: "/projects/hamrobazaar" }]);
    expect(v.suggestions).toEqual(["Tell me more"]);
    expect(v.rejected).toEqual(
      expect.arrayContaining(['unsupported block type "html"', "unknown project id 999", "unknown skill id s-hidden", "source not disclosed project:2"])
    );
  });

  test("garbage never throws and yields no cards", () => {
    for (const raw of [null, "text", 42, { blocks: "nope" }, { answer: { a: 1 } }]) {
      const v = validateModelResponse(raw, index, disclosed);
      expect(v.blocks.filter((b) => b.type !== "text")).toHaveLength(0);
    }
  });

  test("answer is plain text", () => {
    expect(cleanAnswer("## Title\n- one\n- two\n```js\nalert(1)\n```")).toBe("Title\n• one\n• two");
  });

  test("response JSON schema", () => {
    const s = modelOutputJsonSchema();
    expect(s.$schema).toBeUndefined();
    expect((s.required as string[]).sort()).toEqual(["answer", "basis", "blocks", "intent", "sources", "suggestions"]);
  });
});

describe("request handling", () => {
  test("request schema bounds input", () => {
    expect(ChatRequestSchema.safeParse({ message: "  " }).success).toBe(false);
    expect(ChatRequestSchema.safeParse({ message: "x".repeat(501) }).success).toBe(false);
    expect(ChatRequestSchema.safeParse({ message: "hi" }).success).toBe(true);
  });

  test("untrusted context is sanitized", () => {
    const c = sanitizeChatContext({ lastProjectIds: [1, 999, "3", "x"], lastTechnology: "<script>" }, index);
    expect(c.lastProjectIds).toEqual([1, 3]);
    expect(c.lastTechnology).toBeNull();
  });

  test("rate limiter", () => {
    let t = 0;
    const check = createRateLimiter({ perMinute: 2, perHour: 100 }, () => t);
    expect(check("a").ok && check("a").ok).toBe(true);
    expect(check("a").ok).toBe(false);
    expect(check("b").ok).toBe(true);
    t = 60_001;
    expect(check("a").ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Orchestration with a scripted fake LLM
// ---------------------------------------------------------------------------

type Script = (req: Parameters<LlmProvider["generateStructuredResponse"]>[0]) => Promise<unknown> | unknown;

function fakeLlm(script: Script) {
  const requests: Parameters<LlmProvider["generateStructuredResponse"]>[0][] = [];
  const llm: LlmProvider = {
    name: "fake",
    model: "fake-model",
    generateResponse: async () => ({ text: "", usage: { inputTokens: 0, outputTokens: 0, calls: 1 } }),
    generateStructuredResponse: async (req) => {
      requests.push(req);
      const raw = await script(req);
      if (raw instanceof Error) throw raw;
      return { raw, parsed: { success: true, data: raw as never }, usage: { inputTokens: 0, outputTokens: 0, calls: 1 }, toolCalls: [], model: "fake-model" };
    },
  };
  return { llm, requests };
}

const deps = (llm: LlmProvider | null, mode: "full" | "overview" = "full"): ChatDeps => ({
  getKnowledge: async () => ({ kb, engine }),
  llm,
  config: { maxOutputTokens: 1000, context: { mode, fullContextMaxChars: 100_000, maxToolRounds: 3 } },
});

const answer = (extra: Record<string, unknown> = {}) => ({
  answer: "ok", basis: "confirmed", intent: "projects", blocks: [], suggestions: [], sources: [], ...extra,
});

describe("chat orchestration", () => {
  test("system prompt carries rules + published portfolio; user turn carries recent context", async () => {
    const { llm, requests } = fakeLlm(() => answer());
    await handleChat({ message: "Has he built an online marketplace?", history: [] }, deps(llm));
    const req = requests[0];
    expect(req.system).toContain("Never invent projects");
    expect(req.system).toContain('"title":"Hamrobazar"');
    expect(req.system).not.toContain("Cobol");
    expect(req.messages.at(-1)!.text).toContain("Visitor's message: Has he built an online marketplace?");
    expect(req.tools!.definitions).toHaveLength(7);
  });

  test("follow-up chain: React projects -> which involved animations -> that one", async () => {
    let context = createChatContext();
    const turns: [string, Record<string, unknown>][] = [
      ["Show me your React projects.", answer({ blocks: [{ type: "project_list", ids: ["1", "2", "15", "16"] }] })],
      ["Which one involved animations?", answer({ blocks: [{ type: "project_list", ids: ["2"] }], sources: [{ sourceType: "project", sourceId: "2" }] })],
      ["Tell me more about that one.", answer({ intent: "project_details", blocks: [{ type: "project_detail", ids: ["2"], focus: "overview" }] })],
    ];
    const history: { role: "user" | "assistant"; text: string }[] = [];
    const seen: string[] = [];
    for (const [message, output] of turns) {
      const { llm, requests } = fakeLlm(() => output);
      const out = await handleChat({ message, history, context }, deps(llm));
      seen.push(requests[0].messages.at(-1)!.text);
      context = out.context;
      history.push({ role: "user", text: message }, { role: "assistant", text: `ok\n[Cards shown: ${out.context.lastProjectIds.join(", ")}]` });
    }
    expect(seen[1]).toContain("Projects shown or discussed in the previous answer, in order: Hamrobazar (id 1), Digital Ghumti (id 2), Life of Canberran (id 15), PRISM NEURO (id 16)");
    expect(seen[2]).toContain("in order: Digital Ghumti (id 2)");
    expect(context.lastProjectIds).toEqual([DIGITAL_GHUMTI]);
  });

  test("overview mode: details fetched by tool become citable", async () => {
    const { llm } = fakeLlm(async (req) => {
      const r = await req.tools!.execute({ name: "getProjectDetails", args: { projectId: MORTGAGE } });
      expect(r.ok).toBe(true);
      return answer({ intent: "project_details", blocks: [{ type: "project_detail", ids: ["3"], focus: "contribution" }], sources: [{ sourceType: "project", sourceId: "3" }] });
    });
    const out = await handleChat({ message: "What did he do on the mortgage project?", history: [] }, deps(llm, "overview"));
    expect(out.meta.contextMode).toBe("overview");
    expect(out.reply.blocks[1]).toEqual({ type: "project_detail", projectId: MORTGAGE, focus: "contribution" });
    expect(out.reply.sources[0].label).toBe("Hamro Mortage");
  });

  test("overview mode: an FAQ the model never fetched can't be shown as a card", async () => {
    const { llm } = fakeLlm(() => answer({ blocks: [{ type: "faq_card", ids: ["f1"] }] }));
    const out = await handleChat({ message: "what kind of projects", history: [] }, deps(llm, "overview"));
    // f1 *is* in the overview catalog (question only), so it's disclosed; f-hidden never is:
    expect(out.reply.blocks.some((b) => b.type === "faq_card")).toBe(true);
    const { llm: llm2 } = fakeLlm(() => answer({ blocks: [{ type: "faq_card", ids: ["f-hidden"] }] }));
    const out2 = await handleChat({ message: "secret", history: [] }, deps(llm2, "overview"));
    expect(out2.reply.blocks.some((b) => b.type === "faq_card")).toBe(false);
  });

  test("failures fall back to the rule-based engine", async () => {
    expect((await handleChat({ message: "hi", history: [] }, deps(null))).meta.fallbackReason).toBe("llm_not_configured");
    const { llm } = fakeLlm(() => new LlmError("quota", "quota", 429));
    const out = await handleChat({ message: "Show me your React projects", history: [] }, deps(llm));
    expect(out.reply.mode).toBe("fallback");
    expect(out.meta.fallbackReason).toBe("llm_quota");
    expect(out.reply.blocks.some((b) => b.type === "project_list")).toBe(true);
    const { llm: empty } = fakeLlm(() => ({ blocks: [{ type: "project_list", ids: ["1"] }] }));
    expect((await handleChat({ message: "projects", history: [] }, deps(empty))).meta.fallbackReason).toBe("llm_invalid_response");
  });

  test("successful turn updates context from cards and sources", async () => {
    const { llm } = fakeLlm(() => answer({ blocks: [{ type: "project_detail", ids: ["1"] }], sources: [{ sourceType: "project", sourceId: "1" }] }));
    const out = await handleChat({ message: "Tell me about Hamrobazar", history: [] }, deps(llm));
    expect(out.reply.mode).toBe("ai");
    expect(out.context.lastProjectIds).toEqual([HAMROBAZAR]);
    expect(out.context.rule.lastProjectId).toBe(HAMROBAZAR); // fallback stays in sync
  });
});

// ---------------------------------------------------------------------------
// Gemini provider tool loop, driven by a fake SDK client
// ---------------------------------------------------------------------------

type FakeResponse = {
  functionCalls?: { id?: string; name: string; args: Record<string, unknown> }[];
  text?: string;
};

function geminiWith(responses: (FakeResponse | Error)[], fallbackModels: string[] = []) {
  const provider = new GeminiProvider({ apiKey: "test", model: "gemini-test", fallbackModels, timeoutMs: 5_000 });
  const calls: { model: string; contents: unknown[]; config: Record<string, unknown> }[] = [];
  (provider as unknown as { client: unknown }).client = {
    models: {
      generateContent: async (req: { model: string; contents: unknown[]; config: Record<string, unknown> }) => {
        calls.push({ model: req.model, contents: structuredClone(req.contents.map((c) => JSON.parse(JSON.stringify(c)))), config: req.config });
        const next = responses.shift();
        if (!next) throw new Error("no more responses");
        if (next instanceof Error) throw next;
        return {
          functionCalls: next.functionCalls,
          text: next.text,
          candidates: [{ content: { role: "model", parts: (next.functionCalls ?? []).map((f) => ({ functionCall: f })) }, finishReason: "STOP" }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        };
      },
    },
  };
  return { provider, calls };
}

const tools = (log: string[]): ToolSet => ({
  definitions: PORTFOLIO_TOOL_DEFINITIONS,
  maxRounds: 2,
  execute: async (call) => {
    log.push(call.name);
    return executePortfolioTool(repo, call);
  },
});

const request = (t?: ToolSet) => ({
  system: "sys",
  messages: [{ role: "user" as const, text: "hi" }],
  schema: ModelOutputSchema,
  jsonSchema: modelOutputJsonSchema(),
  tools: t,
});

describe("Gemini provider", () => {
  test("executes function calls, returns results, then parses the JSON answer", async () => {
    const final = JSON.stringify(answer());
    const { provider, calls } = geminiWith([
      { functionCalls: [{ id: "c1", name: "getProjectDetails", args: { projectId: 1 } }] },
      { text: final },
    ]);
    const log: string[] = [];
    const out = await provider.generateStructuredResponse(request(tools(log)));
    expect(log).toEqual(["getProjectDetails"]);
    expect(out.parsed.success).toBe(true);
    expect(out.toolCalls).toEqual([{ name: "getProjectDetails", args: { projectId: 1 }, ok: true }]);
    expect(out.usage).toEqual({ inputTokens: 20, outputTokens: 10, calls: 2 });
    // Second request carries the model's call and our functionResponse.
    const second = calls[1].contents as { role: string; parts: Record<string, unknown>[] }[];
    expect(second.at(-2)!.role).toBe("model");
    const fr = second.at(-1)!.parts[0].functionResponse as { id: string; name: string; response: { project: { title: string } } };
    expect(fr.id).toBe("c1");
    expect(fr.response.project.title).toBe("Hamrobazar");
    expect(calls[0].config.responseMimeType).toBe("application/json");
    expect(calls[0].config.tools).toBeDefined();
  });

  test("tool rounds are bounded; the last call has no tools and must answer", async () => {
    const loop = { functionCalls: [{ name: "getProjects", args: {} }] };
    const { provider, calls } = geminiWith([loop, loop, { text: JSON.stringify(answer()) }]);
    const out = await provider.generateStructuredResponse(request(tools([])));
    expect(calls).toHaveLength(3);
    expect(calls[2].config.tools).toBeUndefined();
    expect(out.parsed.success).toBe(true);
  });

  test("falls back to two-step mode when tools + JSON schema aren't supported together", async () => {
    const unsupported = Object.assign(new Error("Function calling with a response mime type 'application/json' is unsupported"), { status: 400 });
    const { provider, calls } = geminiWith([unsupported, { text: "prose answer" }, { text: JSON.stringify(answer()) }]);
    const out = await provider.generateStructuredResponse(request(tools([])));
    expect(out.parsed.success).toBe(true);
    expect(calls[1].config.responseMimeType).toBeUndefined(); // tools only
    expect(calls[2].config.tools).toBeUndefined(); // schema only
  });

  const overloaded = () =>
    Object.assign(new Error('{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}'), { status: 503 });

  test("retries a transient 503 on the same model", async () => {
    const { provider, calls } = geminiWith([overloaded(), { text: JSON.stringify(answer()) }]);
    const out = await provider.generateStructuredResponse(request());
    expect(calls.map((c) => c.model)).toEqual(["gemini-test", "gemini-test"]);
    expect(out.model).toBe("gemini-test");
  });

  test("native JSON overloaded -> prompted JSON (schema in prompt, parsed from text), remembered", async () => {
    const fenced = "Here you go:\n```json\n" + JSON.stringify(answer()) + "\n```";
    const { provider, calls } = geminiWith([overloaded(), overloaded(), { text: fenced }, { text: JSON.stringify(answer()) }]);
    const out = await provider.generateStructuredResponse(request());
    expect(out.parsed.success).toBe(true);
    expect(calls[0].config.responseMimeType).toBe("application/json");
    expect(calls[2].config.responseMimeType).toBeUndefined();
    expect(String(calls[2].config.systemInstruction)).toContain("RESPONSE FORMAT");
    // Next message goes straight to prompted JSON.
    await provider.generateStructuredResponse(request());
    expect(calls[3].config.responseMimeType).toBeUndefined();
  });

  test("moves to the fallback model when the primary stays overloaded in both JSON styles", async () => {
    const { provider, calls } = geminiWith(
      [overloaded(), overloaded(), overloaded(), overloaded(), { text: JSON.stringify(answer()) }],
      ["gemini-backup"]
    );
    const out = await provider.generateStructuredResponse(request());
    expect(calls.map((c) => c.model)).toEqual(["gemini-test", "gemini-test", "gemini-test", "gemini-test", "gemini-backup"]);
    expect(out.model).toBe("gemini-backup");
  });

  test("quota errors are not retried", async () => {
    const quota = Object.assign(new Error("Resource has been exhausted (e.g. check quota)."), { status: 429 });
    const { provider, calls } = geminiWith([quota], ["gemini-backup"]);
    await expect(provider.generateStructuredResponse(request())).rejects.toMatchObject({ kind: "quota" });
    expect(calls).toHaveLength(1);
  });

  test("maps provider errors", async () => {
    const { provider } = geminiWith([Object.assign(new Error("Resource has been exhausted (e.g. check quota)."), { status: 429 })]);
    await expect(provider.generateStructuredResponse(request())).rejects.toMatchObject({ kind: "quota" });
    const { provider: p2 } = geminiWith([{ text: "not json" }]);
    await expect(p2.generateStructuredResponse(request())).rejects.toMatchObject({ kind: "invalid_response" });
  });
});
