import { createHash } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ChatResponseBody } from "./chatService";
import { assertServer } from "./guard";

assertServer("chatLog");

/**
 * Writes one row per chat request to public.chat_logs (see
 * supabase/migrations/20261126000200_chat_logs.sql). Needs
 * SUPABASE_SERVICE_ROLE_KEY; without it logging is off and nothing breaks.
 * Logging never fails a request: errors are reported to the server log.
 */
export type ChatLogStatus = "answered" | "blocked" | "rate_limited" | "invalid" | "error";

export type ChatLogEntry = {
  status: ChatLogStatus;
  sessionId?: string | null;
  ip: string;
  country?: string | null;
  userAgent?: string | null;
  message?: string | null;
  response?: ChatResponseBody | null;
  blockReason?: string | null;
  latencyMs?: number | null;
};

const WRITE_TIMEOUT_MS = 1_500;
const MAX_TEXT = 4_000;

let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client === undefined) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  }
  return client;
}

const cap = (text: string | null | undefined, max = MAX_TEXT) =>
  text ? (text.length > max ? `${text.slice(0, max)}…` : text) : null;

/** Salted hash, so the same visitor can be grouped without storing the IP. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** The row stored for one request (exported for tests). */
export function toLogRow(entry: ChatLogEntry, salt: string) {
  const reply = entry.response?.reply;
  const meta = entry.response?.meta;
  const answer = reply?.blocks
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");
  return {
    status: entry.status,
    session_id: cap(entry.sessionId, 64),
    ip_hash: entry.ip ? hashIp(entry.ip, salt) : null,
    country: cap(entry.country, 8),
    user_agent: cap(entry.userAgent, 300),
    message: cap(entry.message),
    answer: cap(answer),
    blocks: reply?.blocks.filter((b) => b.type !== "text") ?? [],
    mode: reply?.mode ?? null,
    intent: reply?.intent ?? null,
    basis: reply?.basis ?? null,
    model: meta?.model ?? null,
    fallback_reason: meta?.fallbackReason ?? null,
    block_reason: entry.blockReason ?? null,
    tool_calls: meta?.toolCalls ?? [],
    latency_ms: entry.latencyMs ?? meta?.timings.totalMs ?? null,
  };
}

export function isChatLogEnabled() {
  return getClient() !== null;
}

export async function logChat(entry: ChatLogEntry): Promise<void> {
  const db = getClient();
  if (!db) return;
  const salt = process.env.CHAT_LOG_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const write = db.from("chat_logs").insert(toLogRow(entry, salt));
    const timeout = new Promise<{ error: Error }>((resolve) => {
      timer = setTimeout(() => resolve({ error: new Error("timed out") }), WRITE_TIMEOUT_MS);
    });
    const { error } = await Promise.race([write, timeout]);
    if (error) console.error("[chat] log write failed:", error.message);
  } catch (err) {
    console.error("[chat] log write failed:", (err as Error).message);
  } finally {
    clearTimeout(timer);
  }
}
