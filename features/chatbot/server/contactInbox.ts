import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ContactMessage } from "../ai/tools/contactTool";
import { assertServer } from "./guard";

assertServer("contactInbox");

/**
 * Saves a message to public.contact_messages in Supabase (see
 * supabase/migrations/20261126000300_contact_messages.sql). The table is
 * closed to the anon key; the server writes with SUPABASE_SERVICE_ROLE_KEY,
 * so POST /api/contact and the chat AI are the only ways in.
 */
let client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to save contact messages");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

export type InboxMessage = ContactMessage & { source: string; sessionId?: string | null };

export async function saveContactMessage(msg: InboxMessage, db: SupabaseClient = getClient()): Promise<void> {
  const { error } = await db.from("contact_messages").insert({
    name: msg.name,
    email: msg.email,
    message: msg.message,
    source: msg.source,
    session_id: msg.sessionId ?? null,
  });
  if (error) throw new Error(`Saving contact message failed: ${error.message}`);
}
