import { createClient } from "@supabase/supabase-js";
import { getAiConfig } from "../features/chatbot/ai/config";
import { GeminiProvider } from "../features/chatbot/ai/llm/geminiProvider";
import { createChatEngine } from "../features/chatbot/engine";
import { createChatContext, summarizeForHistory, type HistoryItem } from "../features/chatbot/engine/conversationManager";
import { loadKnowledgeBase } from "../features/chatbot/services/knowledgeBaseService";
import { handleChat } from "../features/chatbot/server/chatService";
const c = getAiConfig();
const { knowledgeBase: kb } = await loadKnowledgeBase(createClient(c.supabaseUrl, c.supabaseAnonKey) as any);
const engine = createChatEngine(kb);
const deps = { getKnowledge: async () => ({ kb, engine }), llm: new GeminiProvider({ apiKey: c.geminiApiKey!, model: c.geminiModel, fallbackModels: c.geminiFallbackModels, timeoutMs: c.llmTimeoutMs }), config: c };
let context = createChatContext(); const history: HistoryItem[] = [];
for (const message of ["Has he built anything like an online marketplace?", "Show me your React projects.", "Which one involved animations?", "Tell me more about that one.", "Has he shipped a native iOS app?"]) {
  const out = await handleChat({ message, history, context }, deps);
  context = out.context;
  history.push({ role: "user", text: message }, { role: "assistant", text: summarizeForHistory(out.reply.blocks, engine.index) });
  const txt = out.reply.blocks[0]?.type === "text" ? out.reply.blocks[0].text : "";
  console.log(`\n> ${message}\n[${out.reply.mode}${out.meta.fallbackReason ? " " + out.meta.fallbackReason : ""} | ${out.meta.model} | ${out.meta.timings.totalMs}ms | basis ${out.reply.basis} | tools ${out.meta.toolCalls.join(",") || "-"}]\n${txt}\ncards: ${JSON.stringify(out.reply.blocks.slice(1))}\nsources: ${out.reply.sources.map((s) => s.label).join(", ")}\nchips: ${out.reply.suggestions.join(" | ")}`);
}
