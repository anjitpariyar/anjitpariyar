import type { FaqRow } from "../types/database";
import { safeQuery, type PortfolioClient } from "./client";

export function getFaqs(client: PortfolioClient) {
  return safeQuery<FaqRow[]>(
    "portfolio_faqs",
    client
      .from("portfolio_faqs")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    []
  );
}
