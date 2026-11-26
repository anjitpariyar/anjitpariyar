import { useCallback, useMemo } from "react";
import Header from "components/Header";
import type { KnowledgeBase } from "../engine/types";
import { useChat } from "../hooks/useChat";
import { ChatContext } from "./ChatContext";
import ChatWindow from "./ChatWindow";
import styles from "./Chat.module.scss";

/** Used only when portfolio_chat_suggestions has no published rows. */
const FALLBACK_TOPICS = [
  { label: "Explore projects", message: "Show me your projects" },
  { label: "Technical skills", message: "What technologies do you work with?" },
  { label: "Professional experience", message: "Tell me about your experience" },
  { label: "Animation work", message: "Do you have experience with animations?" },
  { label: "Contact", message: "How can I contact you?" },
];

/** Full-screen chat: the site header on top, a dark chat below. */
export default function ChatApp({ knowledgeBase }: { knowledgeBase: KnowledgeBase }) {
  const { index, messages, isTyping, hydrated, send, retry, clear, maxLength } = useChat(knowledgeBase);

  const topics = useMemo(
    () =>
      knowledgeBase.suggestions.length
        ? knowledgeBase.suggestions.map((s) => ({ label: s.label, message: s.message }))
        : FALLBACK_TOPICS,
    [knowledgeBase.suggestions]
  );

  const sendMessage = useCallback((text: string) => void send(text), [send]);
  const contextValue = useMemo(() => ({ index, send: sendMessage, busy: isTyping }), [index, sendMessage, isTyping]);

  return (
    <ChatContext.Provider value={contextValue}>
      <div className={styles.app}>
        <div className={styles.siteHeader}>
          <Header />
        </div>
        <main className={styles.main}>
          <ChatWindow
            profile={knowledgeBase.profile}
            messages={messages}
            isTyping={isTyping}
            hydrated={hydrated}
            starters={topics}
            onSend={sendMessage}
            onRetry={retry}
            onNewChat={clear}
            maxLength={maxLength}
          />
        </main>
      </div>
    </ChatContext.Provider>
  );
}
