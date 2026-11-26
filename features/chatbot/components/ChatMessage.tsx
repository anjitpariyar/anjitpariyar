import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { blocksToPlainText } from "../engine/plainText";
import type { ChatMessage as Message } from "../engine/types";
import BlockRenderer from "./BlockRenderer";
import { useChatContext } from "./ChatContext";
import ChatSuggestions from "./ChatSuggestions";
import styles from "./Chat.module.scss";

type Props = { message: Message; isLatest: boolean; onRetry: (id: string) => void };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      className={styles.copyButton}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          // clipboard unavailable (insecure context / permissions)
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
      <span className={styles.srOnly} aria-live="polite">
        {copied ? " response copied to clipboard" : ""}
      </span>
    </button>
  );
}

function ChatMessage({ message, isLatest, onRetry }: Props) {
  const { index, send, busy } = useChatContext();

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

  const hasCards = message.blocks.some((b) => b.type !== "text");
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
        <div className={styles.messageFooter}>
          {(hasCards || message.blocks.length > 1 || message.intent !== "greeting") && (
            <CopyButton text={blocksToPlainText(message.blocks, index)} />
          )}
          {message.mode === "fallback" && (
            <span className={styles.modeNote} title="The AI assistant was unavailable, so this answer came from the basic keyword matcher.">
              Basic mode
            </span>
          )}
        </div>
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
