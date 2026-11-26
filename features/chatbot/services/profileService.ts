import type { ProfileRow } from "../types/database";
import { safeQuery, type PortfolioClient } from "./client";

/** The most recently updated published profile row. */
export async function getProfile(client: PortfolioClient) {
  const result = await safeQuery<ProfileRow[]>(
    "portfolio_profile",
    client
      .from("portfolio_profile")
      .select("*")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(1),
    []
  );
  return { data: result.data[0] ?? null, warning: result.warning };
}
