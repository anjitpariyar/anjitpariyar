import type { ProjectRow } from "../types/database";
import { safeQuery, type PortfolioClient } from "./client";

/**
 * `*` rather than a column list so the optional columns (contribution,
 * features, category, github_url) are picked up once that migration runs,
 * without breaking before it does. Same order as the /projects grid.
 */
const PROJECT_COLUMNS = "*";

export function getActiveProjects(client: PortfolioClient) {
  return safeQuery<ProjectRow[]>(
    "projects",
    client
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    []
  );
}
