import type { SkillRow } from "../types/database";
import { safeQuery, type PortfolioClient } from "./client";

export function getSkills(client: PortfolioClient) {
  return safeQuery<SkillRow[]>(
    "portfolio_skills",
    client
      .from("portfolio_skills")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    []
  );
}
