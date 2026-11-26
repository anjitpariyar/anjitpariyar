import { describe, expect, mock, test } from "bun:test";

const saved: unknown[] = [];
mock.module("../contactInbox", () => ({ saveContactMessage: async (m: unknown) => void saved.push(m) }));
const { submitContact } = await import("../contactService");

const base = { name: "Sam", email: "sam@acme.io", message: "Hi, we'd like to hire Anjit." };
const T = 1_000_000;

describe("submitContact anti-bot checks", () => {
  test("honeypot: fake success, nothing saved", async () => {
    expect(await submitContact({ ...base, website: "spam.com" }, "1.1.1.1", "chatbot-ai", T)).toEqual({ ok: true });
    expect(saved).toHaveLength(0);
  });

  test("form submitted too fast is rejected; chat has no time trap", async () => {
    const r = await submitContact({ ...base, startedAt: T - 500 }, "2.2.2.2", "contact-page", T);
    expect(r.ok).toBe(false);
    expect((await submitContact({ ...base, message: "chat one" }, "2.2.2.3", "chatbot-ai", T)).ok).toBe(true);
  });

  test("link-stuffed message is rejected", async () => {
    const message = "buy http://a.io http://b.io http://c.io";
    expect((await submitContact({ ...base, message }, "3.3.3.3", "chatbot-ai", T)).ok).toBe(false);
  });

  test("duplicates are not saved twice; per-IP limit applies", async () => {
    saved.length = 0;
    const msg = { ...base, message: "duplicate check message" };
    expect((await submitContact(msg, "4.4.4.4", "chatbot-ai", T)).ok).toBe(true);
    expect((await submitContact(msg, "4.4.4.4", "chatbot-ai", T)).ok).toBe(true);
    expect(saved).toHaveLength(1);
    const second = await submitContact({ ...base, message: "another message" }, "4.4.4.4", "chatbot-ai", T);
    expect(second.ok).toBe(false); // 1 per minute
  });
});
