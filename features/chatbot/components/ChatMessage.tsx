import Link from "next/link";
import { memo } from "react";
import type { ChatMessage as Message } from "../engine/types";
import BlockRenderer from "./BlockRenderer";
import { useChatContext } from "./ChatContext";
import ChatSuggestions from "./ChatSuggestions";
import styles from "./Chat.module.scss";

type Props = { message: Message; isLatest: boolean; onRetry: (id: string) => void };

function ChatMessage({ message, isLatest, onRetry }: Props) {
  const { send, busy } = useChatContext();

  if (message.role === "error") {
    return (
      <li className={styles.errorRow} role="alert">
        <p>{message.text}</p>
        <button type="button" onClick={() => onRetry(message.id)} disabled={busy}>
          Retry
        </button>
      </li>
    );
  }

  if (message.role === "user") {
    return (
      <li className={styles.userRow}>
        <span className={styles.srOnly}>You said:</span>
        <p className={styles.userBubble}>{message.text}</p>
      </li>
    );
  }

  return (
    <li className={styles.botRow}>
      <span className={styles.srOnly}>Assistant:</span>
      <div className={styles.botBody}>
        {message.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
        {message.sources && message.sources.length > 0 && (
          <p className={styles.sources}>
            <span>Based on </span>
            {message.sources.map((s, i) => (
              <span key={`${s.sourceType}:${s.sourceId}`}>
                {i > 0 && " · "}
                {s.href ? <Link href={s.href}>{s.label}</Link> : s.label}
              </span>
            ))}
          </p>
        )}
        {message.mode === "fallback" && (
          <div className={styles.messageFooter}>
            <span className={styles.modeNote} title="The AI assistant was unavailable, so this answer came from the basic keyword matcher.">
              Basic mode
            </span>
          </div>
        )}
        {isLatest && message.suggestions.length > 0 && (
          <ChatSuggestions
            label="Suggested follow-up questions"
            items={message.suggestions.map((s) => ({ label: s, message: s }))}
            onSelect={send}
            disabled={busy}
          />
        )}
      </div>
    </li>
  );
}

export default memo(ChatMessage);
