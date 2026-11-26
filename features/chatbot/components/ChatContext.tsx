import { createContext, useContext } from "react";
import type { EngineIndex } from "../engine/indexes";

type ChatContextValue = {
  index: EngineIndex;
  /** Ask a follow-up question (used by "View details" style actions). */
  send: (message: string) => void;
  busy: boolean;
};

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChatContext must be used inside <ChatContext.Provider>");
  return value;
}
