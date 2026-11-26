import { useEffect, useRef } from "react";
import type { ChatMessage as Message, Profile } from "../engine/types";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import ChatSuggestions from "./ChatSuggestions";
import styles from "./Chat.module.scss";

type Props = {
  profile: Profile | null;
  messages: Message[];
  isTyping: boolean;
  hydrated: boolean;
  starters: { label: string; message: string }[];
  onSend: (text: string) => void;
  onRetry: (errorId: string) => void;
  onNewChat: () => void;
  maxLength: number;
};

function Welcome({ profile, starters, onSend }: Pick<Props, "profile" | "starters" | "onSend">) {
  const first = profile?.fullName.split(/\s+/)[0] ?? "Anjit";
  return (
    <div className={styles.welcome}>
      <h1>What would you like to know about {first}?</h1>
      <p className={styles.welcomeText}>
        Projects, skills, experience, or whether he&apos;s the right fit for your team. Ask anything.
      </p>
      <ChatSuggestions label="Suggested questions" items={starters} onSelect={onSend} variant="list" />
    </div>
  );
}

export default function ChatWindow({ profile, messages, isTyping, hydrated, starters, onSend, onRetry, onNewChat, maxLength }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const empty = hydrated && messages.length === 0;

  // Keep the newest exchange in view: scroll to the bottom for the question
  // and typing dots, but for a reply, show it from the top (cards can be tall).
  const last = messages[messages.length - 1];
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const rows = el.querySelectorAll<HTMLElement>("[role=log] > li");
    const reply = rows[rows.length - 1];
    if (last?.role === "assistant" && !isTyping && reply) {
      const question = reply.previousElementSibling as HTMLElement | null;
      const anchor = question ?? reply;
      el.scrollTo({ top: anchor.offsetTop - 16, behavior });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
  }, [last?.id, last?.role, isTyping]);

  return (
    <div className={styles.window}>
      <div className={styles.topBar}>
        <p className={styles.topTitle}>
          Ask AI <span>about {profile?.fullName ?? "Anjit Pariyar"}</span>
        </p>
        <button
          type="button"
          className={styles.newChat}
          onClick={onNewChat}
          disabled={!messages.length || isTyping}
          title="Start a new conversation"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          New chat
        </button>
      </div>

      <div className={styles.scroller} ref={scroller}>
        <div className={styles.thread}>
          {empty && <Welcome profile={profile} starters={starters} onSend={onSend} />}
          <ol className={styles.messages} role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} isLatest={m.id === lastAssistant && !isTyping} onRetry={onRetry} />
            ))}
          </ol>
          {isTyping && (
            <div className={styles.typing} role="status">
              <span className={styles.srOnly}>Assistant is typing</span>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      <div className={styles.inputWrap}>
        <ChatInput onSend={onSend} disabled={isTyping} maxLength={maxLength} autoFocus />
      </div>
    </div>
  );
}
