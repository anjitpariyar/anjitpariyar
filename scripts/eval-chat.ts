/**
 * Evaluate the Gemini assistant against live Supabase data.
 *
 *   bun run eval-chat              # all conversations
 *   bun run eval-chat --only=forms # one case
 *
 * Per case: which projects the final answer references (cards + cited
 * sources), card types, grounding basis, tool calls, fallbacks and latency.
 * Makes real Gemini calls (counted against your quota / billed).
 */
import { createClient } from "@supabase/supabase-js";
import { getAiConfig } from "../features/chatbot/ai/config";
import { EVAL_CASES } from "../features/chatbot/ai/eval/dataset";
import { GeminiProvider } from "../features/chatbot/ai/llm/geminiProvider";
import { createChatEngine } from "../features/chatbot/engine";
import { createChatContext, summarizeForHistory, type HistoryItem } from "../features/chatbot/engine/conversationManager";
import { loadKnowledgeBase } from "../features/chatbot/services/knowledgeBaseService";
import { handleChat } from "../features/chatbot/server/chatService";
import type { Database } from "../features/chatbot/types/database";

const c = getAiConfig();
if (!c.geminiApiKey) {
  console.error("GEMINI_API_KEY is required.");
  process.exit(1);
}
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

const client = createClient<Database>(c.supabaseUrl, c.supabaseAnonKey, { auth: { persistSession: false } });
const { knowledgeBase: kb, warnings } = await loadKnowledgeBase(client);
warnings.forEach((w) => console.warn("warning:", w));
const engine = createChatEngine(kb);
const slugOf = (id: string | number) => kb.projects.find((p) => String(p.id) === String(id))?.slug ?? "";

const deps = {
  getKnowledge: async () => ({ kb, engine }),
  llm: new GeminiProvider({ apiKey: c.geminiApiKey, model: c.geminiModel, fallbackModels: c.geminiFallbackModels, timeoutMs: c.llmTimeoutMs, thinkingLevel: c.geminiThinkingLevel }),
  config: c,
};

const latencies: number[] = [];
let passed = 0;
const cases = EVAL_CASES.filter((t) => !only || t.id === only);

for (const tc of cases) {
  let context = createChatContext();
  const history: HistoryItem[] = [];
  const problems: string[] = [];
  let finalSlugs = new Set<string>();
  let finalBlocks = new Set<string>();
  let finalBasis: string | null = null;

  for (const message of tc.turns) {
    const out = await handleChat({ message, history, context }, deps);
    latencies.push(out.meta.timings.totalMs);
    context = out.context;
    history.push({ role: "user", text: message }, { role: "assistant", text: summarizeForHistory(out.reply.blocks, engine.index) });

    finalBlocks = new Set(out.reply.blocks.map((b) => b.type));
    finalSlugs = new Set([
      ...out.reply.sources.filter((s) => s.sourceType === "project").map((s) => slugOf(s.sourceId)),
      ...out.reply.blocks.flatMap((b) => (b.type === "project_list" ? b.projectIds : b.type === "project_detail" ? [b.projectId] : [])).map(slugOf),
    ]);
    finalBasis = out.reply.basis;
    if (out.reply.mode === "fallback") problems.push(`fallback (${out.meta.fallbackReason})`);

    const answer = out.reply.blocks[0]?.type === "text" ? out.reply.blocks[0].text : "";
    const t = out.meta.timings;
    console.log(`\n[${tc.id}] > ${message}\n  ${answer.replace(/\n+/g, " ").slice(0, 280)}`);
    console.log(
      `  cards: ${out.reply.blocks.slice(1).map((b) => b.type).join(", ") || "-"} | projects: ${[...finalSlugs].join(", ") || "-"} | basis: ${out.reply.basis} | tools: ${out.meta.toolCalls.join(", ") || "-"} | ${t.llmMs}ms model, ${t.totalMs}ms total`
    );
  }

  if (tc.expectSlugs && !tc.expectSlugs.some((s) => finalSlugs.has(s))) {
    problems.push(`expected one of ${tc.expectSlugs.join(", ")}; got ${[...finalSlugs].join(", ") || "none"}`);
  }
  for (const b of tc.expectBlocks ?? []) if (!finalBlocks.has(b)) problems.push(`missing ${b} card`);
  if (tc.grounding === "insufficient" && finalBasis !== "insufficient") problems.push(`expected basis "insufficient", got "${finalBasis}"`);

  if (problems.length) console.log(`  ✗ ${problems.join("; ")}`);
  else {
    passed++;
    console.log("  ✓ pass");
  }
}

const sorted = [...latencies].sort((a, b) => a - b);
const pct = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;
console.log(`\n${passed}/${cases.length} cases passed. Latency per turn: p50 ${pct(50)}ms, p95 ${pct(95)}ms (model ${c.geminiModel}, context ${c.context.mode}).`);
