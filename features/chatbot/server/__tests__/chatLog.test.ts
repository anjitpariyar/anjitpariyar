import { describe, expect, test } from "bun:test";
import type { ChatResponseBody } from "../chatService";
import { hashIp, toLogRow } from "../chatLog";
import { ChatRequestSchema } from "../requestSchema";

const response = {
  reply: {
    blocks: [
      { type: "text", text: "Here are his React projects." },
      { type: "project_list", projectIds: [1, 3] },
    ],
    suggestions: [],
    intent: "projects",
    sources: [],
    basis: "confirmed",
    mode: "ai",
  },
  context: {},
  meta: {
    timings: { contextMs: 1, llmMs: 900, totalMs: 950 },
    model: "gemini-test",
    promptVersion: "x",
    contextMode: "full",
    toolCalls: ["getProjects"],
    fallbackReason: null,
  },
} as unknown as ChatResponseBody;

describe("chat log", () => {
  test("stores the exchange without the raw IP", () => {
    const row = toLogRow(
      { status: "answered", ip: "203.0.113.7", sessionId: "abc-12345", message: "Show me React projects", response },
      "salt"
    );
    expect(row.ip_hash).toBe(hashIp("203.0.113.7", "salt"));
    expect(JSON.stringify(row)).not.toContain("203.0.113.7");
    expect(row.answer).toBe("Here are his React projects.");
    expect(row.blocks).toEqual([{ type: "project_list", projectIds: [1, 3] }]);
    expect(row).toMatchObject({ mode: "ai", intent: "projects", model: "gemini-test", tool_calls: ["getProjects"], latency_ms: 950 });
  });

  test("IP hashes depend on the salt", () => {
    expect(hashIp("203.0.113.7", "a")).not.toBe(hashIp("203.0.113.7", "b"));
    expect(hashIp("203.0.113.7", "a")).toBe(hashIp("203.0.113.7", "a"));
  });

  test("blocked requests keep the reason and cap long text", () => {
    const row = toLogRow({ status: "blocked", ip: "1.2.3.4", blockReason: "bot_user_agent", message: "x".repeat(5_000) }, "s");
    expect(row).toMatchObject({ status: "blocked", block_reason: "bot_user_agent", answer: null, mode: null });
    expect(row.message!.length).toBe(4_001);
  });

  test("a malformed sessionId is dropped, not rejected", () => {
    const r = ChatRequestSchema.safeParse({ message: "hi", sessionId: "<script>" });
    expect(r.success && r.data.sessionId).toBeUndefined();
    const ok = ChatRequestSchema.safeParse({ message: "hi", sessionId: "3f1c2a9e-1b2c-4d5e-8f90-123456789abc" });
    expect(ok.success && ok.data.sessionId).toBe("3f1c2a9e-1b2c-4d5e-8f90-123456789abc");
  });
});
