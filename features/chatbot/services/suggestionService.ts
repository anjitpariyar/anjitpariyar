import type { ChatSuggestionRow } from "../types/database";
import { safeQuery, type PortfolioClient } from "./client";

export function getChatSuggestions(client: PortfolioClient) {
  return safeQuery<ChatSuggestionRow[]>(
    "portfolio_chat_suggestions",
    client
      .from("portfolio_chat_suggestions")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    []
  );
}
