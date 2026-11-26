import Link from "next/link";
import Logo from "svg/Logo";
import type { Profile } from "../engine/types";
import ChatSuggestions from "./ChatSuggestions";
import styles from "./Chat.module.scss";

type Props = {
  profile: Profile | null;
  topics: { label: string; message: string }[];
  onSelect: (message: string) => void;
  onClear: () => void;
  canClear: boolean;
  busy: boolean;
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function ChatSidebar({ profile, topics, onSelect, onClear, canClear, busy }: Props) {
  return (
    <div className={styles.sidebarInner}>
      <Link href="/" className={styles.brand} aria-label="Anjit Pariyar — home">
        <Logo />
      </Link>

      {profile && (
        <section className={styles.profile} aria-label="About Anjit">
          <h2>{profile.fullName}</h2>
          {profile.title && <p className={styles.profileTitle}>{profile.title}</p>}
          {profile.location && <p className={styles.meta}>{profile.location}</p>}
          {profile.availability && <p className={styles.availability}>{profile.availability}</p>}
        </section>
      )}

      <nav aria-label="Site" className={styles.sideNav}>
        <ul>
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>

      {topics.length > 0 && (
        <section className={styles.topics}>
          <h2 className={styles.sideHeading}>Ask about</h2>
          <ChatSuggestions label="Suggested topics" items={topics} onSelect={onSelect} disabled={busy} variant="list" />
        </section>
      )}

      <div className={styles.sideFooter}>
        <button type="button" className={styles.clearButton} onClick={onClear} disabled={!canClear}>
          Clear conversation
        </button>
        <p className={styles.disclaimer}>
          AI answers grounded in Anjit&apos;s published portfolio data. Messages are processed by Google Gemini to
          answer, and are not stored by this site.
        </p>
      </div>
    </div>
  );
}
