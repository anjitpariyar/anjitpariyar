import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { saveContactMessage } from "../contactInbox";

function fakeDb(error: { message: string } | null = null) {
  const rows: { table: string; row: unknown }[] = [];
  const db = { from: (table: string) => ({ insert: async (row: unknown) => (rows.push({ table, row }), { error }) }) };
  return { db: db as unknown as SupabaseClient, rows };
}

describe("contactInbox (Supabase)", () => {
  test("inserts into contact_messages", async () => {
    const { db, rows } = fakeDb();
    await saveContactMessage({ name: "Sam", email: "sam@acme.io", message: "Hello", source: "chatbot-ai", sessionId: "abc12345" }, db);
    expect(rows).toEqual([
      { table: "contact_messages", row: { name: "Sam", email: "sam@acme.io", message: "Hello", source: "chatbot-ai", session_id: "abc12345" } },
    ]);
  });

  test("a failed insert throws so nobody is told it was sent", async () => {
    const { db } = fakeDb({ message: "permission denied" });
    expect(saveContactMessage({ name: "Sam", email: "sam@acme.io", message: "Hello", source: "contact-page" }, db)).rejects.toThrow("permission denied");
  });
});
