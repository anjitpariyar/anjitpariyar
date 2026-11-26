import { createChatEngine, type ChatEngine } from "../engine";
import type { KnowledgeBase } from "../engine/types";
import { loadKnowledgeBase } from "../services/knowledgeBaseService";
import { assertServer } from "./guard";
import { getAnonClient } from "./supabaseServer";

assertServer("knowledgeStore");

const TTL_MS = 60_000;

type Snapshot = { kb: KnowledgeBase; engine: ChatEngine; loadedAt: number; warnings: string[] };

let current: Snapshot | null = null;
let pending: Promise<Snapshot> | null = null;

/**
 * Published knowledge base + derived indexes, cached per server instance for
 * a minute so a chat request doesn't re-read six tables. Concurrent callers
 * share one load.
 */
export async function getKnowledge(): Promise<Snapshot> {
  if (current && Date.now() - current.loadedAt < TTL_MS) return current;
  if (!pending) {
    pending = loadKnowledgeBase(getAnonClient())
      .then(({ knowledgeBase, warnings }) => {
        if (warnings.length) console.warn(`[chat] knowledge: ${warnings.join(" | ")}`);
        current = { kb: knowledgeBase, engine: createChatEngine(knowledgeBase), loadedAt: Date.now(), warnings };
        return current;
      })
      .finally(() => {
        pending = null;
      });
  }
  // Serve stale data rather than wait, if we have any.
  return current ?? pending;
}
