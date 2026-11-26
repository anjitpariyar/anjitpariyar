import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./askAiPopup.module.scss";

const STORAGE_KEY = "askAiPopupSeen";
/** Shown this long after the page is ready, so it never covers the intro. */
const DELAY_MS = 4000;

const seen = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true; // storage blocked: don't nag on every visit
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
};

/**
 * One-time invitation to try the Ask AI chat. First visit only (remembered
 * in localStorage), never on /chat, dismissible with the close button or Esc.
 */
const AskAiPopup = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const onChat = router.pathname.startsWith("/chat");
  const closeTimer = useRef(null);

  useEffect(() => {
    if (onChat || seen()) return;
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [onChat]);

  const close = useCallback(() => {
    markSeen();
    setLeaving(true);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Navigating to the chat some other way counts as "seen".
  useEffect(() => {
    if (onChat && open) {
      markSeen();
      setOpen(false);
    }
  }, [onChat, open]);

  if (!open) return null;

  return (
    <aside
      className={`${styles.popup} ${leaving ? styles.leaving : ""}`}
      role="dialog"
      aria-labelledby="ask-ai-popup-title"
      aria-describedby="ask-ai-popup-text"
    >
      <button type="button" className={styles.close} onClick={close} aria-label="Close">
        ×
      </button>
      <span className={styles.star} aria-hidden="true">
        ⭐
      </span>
      <div>
        <p id="ask-ai-popup-title" className={styles.title}>
          Psst… want to try Ask AI?
        </p>
        <p id="ask-ai-popup-text" className={styles.text}>
          Ask my AI anything about my projects, skills or experience. It knows the whole portfolio.
        </p>
        <div className={styles.actions}>
          <Link href="/chat" className={styles.try} onClick={markSeen}>
            Try it ✨
          </Link>
          <button type="button" className={styles.later} onClick={close}>
            Maybe later
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AskAiPopup;
