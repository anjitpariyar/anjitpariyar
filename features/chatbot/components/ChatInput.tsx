import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import styles from "./Chat.module.scss";

type Props = { onSend: (text: string) => void; disabled: boolean; maxLength: number; autoFocus?: boolean };

export default function ChatInput({ onSend, disabled, maxLength, autoFocus }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const empty = value.trim().length === 0;

  // Grow with content up to ~5 lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const borders = el.offsetHeight - el.clientHeight;
    const next = el.scrollHeight + borders;
    el.style.height = `${Math.min(next, 160)}px`;
    el.style.overflowY = next > 160 ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    if (autoFocus && window.matchMedia("(pointer: fine)").matches) ref.current?.focus();
  }, [autoFocus]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (empty || disabled) return;
    onSend(value);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a line; don't send mid-IME composition.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form className={styles.inputBar} onSubmit={submit}>
      <label htmlFor="chat-input" className={styles.srOnly}>
        Ask about Anjit&apos;s projects, skills or experience
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        rows={1}
        value={value}
        maxLength={maxLength}
        placeholder="Ask anything about Anjit…"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        aria-describedby="chat-input-hint"
      />
      <button type="submit" disabled={empty || disabled} className={styles.sendButton} aria-label="Send message">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
      <p id="chat-input-hint" className={styles.inputHint}>
        Answers come from Anjit&apos;s portfolio. Enter to send, Shift + Enter for a new line.
      </p>
    </form>
  );
}
