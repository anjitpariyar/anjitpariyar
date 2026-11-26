import type { ExperienceRow } from "../types/database";
import { safeQuery, type PortfolioClient } from "./client";

export function getExperiences(client: PortfolioClient) {
  return safeQuery<ExperienceRow[]>(
    "portfolio_experiences",
    client
      .from("portfolio_experiences")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("start_date", { ascending: false, nullsFirst: false }),
    []
  );
}
