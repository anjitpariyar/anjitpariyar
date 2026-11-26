import { createClient } from "@supabase/supabase-js";
import type { PortfolioClient } from "../services/client";
import type { Database } from "../types/database";
import { getAiConfig } from "../ai/config";
import { assertServer } from "./guard";

assertServer("supabaseServer");

let anon: PortfolioClient | null = null;

/**
 * Anon client: row-level security applies, so only published rows are
 * readable. The assistant needs nothing more privileged; no service-role key.
 */
export function getAnonClient(): PortfolioClient {
  if (!anon) {
    const c = getAiConfig();
    anon = createClient<Database>(c.supabaseUrl, c.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anon;
}
