import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

export type PortfolioClient = SupabaseClient<Database>;

export type QueryResult<T> = { data: T; warning: string | null };

type PostgrestLike<T> = PromiseLike<{
  data: T | null;
  error: { code?: string; message: string } | null;
}>;

/** Postgres "undefined table" and PostgREST "table not in schema cache". */
const MISSING_TABLE = new Set(["42P01", "PGRST205"]);

/**
 * Run a query and never throw: the chat should still work (with less to say)
 * when a table is missing because the migration hasn't been applied yet, or
 * when Supabase is briefly unreachable.
 */
export async function safeQuery<T>(
  label: string,
  query: PostgrestLike<T>,
  fallback: T
): Promise<QueryResult<T>> {
  try {
    const { data, error } = await query;
    if (error) {
      const warning = MISSING_TABLE.has(error.code ?? "")
        ? `${label}: table not found (apply supabase/migrations first)`
        : `${label}: ${error.message}`;
      return { data: fallback, warning };
    }
    return { data: data ?? fallback, warning: null };
  } catch (err) {
    return { data: fallback, warning: `${label}: ${(err as Error).message}` };
  }
}
