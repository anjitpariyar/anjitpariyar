import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KnowledgeBase } from "../engine/types";
import { useChat } from "../hooks/useChat";
import { ChatContext } from "./ChatContext";
import ChatSidebar from "./ChatSidebar";
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

export default function ChatApp({ knowledgeBase }: { knowledgeBase: KnowledgeBase }) {
  const { index, messages, isTyping, hydrated, send, retry, clear, maxLength } = useChat(knowledgeBase);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const router = useRouter();

  const topics = useMemo(
    () =>
      knowledgeBase.suggestions.length
        ? knowledgeBase.suggestions.map((s) => ({ label: s.label, message: s.message }))
        : FALLBACK_TOPICS,
    [knowledgeBase.suggestions]
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButton.current?.focus();
  }, []);

  const sendAndClose = useCallback(
    (text: string) => {
      setDrawerOpen(false);
      void send(text);
    },
    [send]
  );

  // Drawer: Esc closes, focus moves in, and navigating away closes it.
  useEffect(() => {
    if (!drawerOpen) return;
    drawer.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    router.events.on("routeChangeStart", closeDrawer);
    return () => {
      window.removeEventListener("keydown", onKey);
      router.events.off("routeChangeStart", closeDrawer);
    };
  }, [drawerOpen, closeDrawer, router.events]);

  const sendMessage = useCallback((text: string) => void send(text), [send]);
  const contextValue = useMemo(() => ({ index, send: sendMessage, busy: isTyping }), [index, sendMessage, isTyping]);
  const profile = knowledgeBase.profile;

  return (
    <ChatContext.Provider value={contextValue}>
      <div className={styles.app}>
        <header className={styles.mobileBar}>
          <button
            ref={menuButton}
            type="button"
            className={styles.menuButton}
            aria-expanded={drawerOpen}
            aria-controls="chat-sidebar"
            onClick={() => setDrawerOpen(true)}
          >
            Menu
          </button>
          <p className={styles.mobileTitle}>{profile ? profile.fullName : "Portfolio assistant"}</p>
          <button type="button" className={styles.menuButton} onClick={clear} disabled={!messages.length}>
            Clear
          </button>
        </header>

        <aside
          id="chat-sidebar"
          ref={drawer}
          className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`}
          aria-label="Profile and suggested topics"
        >
          <button type="button" className={styles.drawerClose} onClick={closeDrawer}>
            Close<span className={styles.srOnly}> menu</span>
          </button>
          <ChatSidebar
            profile={profile}
            topics={topics}
            onSelect={sendAndClose}
            onClear={() => {
              clear();
              setDrawerOpen(false);
            }}
            canClear={messages.length > 0}
            busy={isTyping}
          />
        </aside>
        {drawerOpen && <div className={styles.backdrop} onClick={closeDrawer} aria-hidden="true" />}

        <main className={styles.main}>
          <ChatWindow
            profile={profile}
            messages={messages}
            isTyping={isTyping}
            hydrated={hydrated}
            starters={topics}
            onSend={sendMessage}
            onRetry={retry}
            maxLength={maxLength}
          />
        </main>
      </div>
    </ChatContext.Provider>
  );
}
