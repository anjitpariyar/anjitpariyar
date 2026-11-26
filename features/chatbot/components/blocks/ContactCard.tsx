import type { ChatBlock, ContactHighlight } from "../../engine/types";
import { useChatContext } from "../ChatContext";
import styles from "../Chat.module.scss";

type Row = { key: string; label: string; value: string; href: string; external: boolean };

const pretty = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export default function ContactCard({ block }: { block: Extract<ChatBlock, { type: "contact_card" }> }) {
  const { index } = useChatContext();
  const p = index.kb.profile;

  const rows: Row[] = [];
  if (p?.email) rows.push({ key: "email", label: "Email", value: p.email, href: `mailto:${p.email}`, external: false });
  if (p?.linkedinUrl) rows.push({ key: "linkedin", label: "LinkedIn", value: pretty(p.linkedinUrl), href: p.linkedinUrl, external: true });
  if (p?.githubUrl) rows.push({ key: "github", label: "GitHub", value: pretty(p.githubUrl), href: p.githubUrl, external: true });
  if (p?.website) rows.push({ key: "website", label: "Portfolio", value: pretty(p.website), href: p.website, external: true });
  if (p?.cvUrl) rows.push({ key: "cv", label: "CV", value: "Download CV", href: p.cvUrl, external: true });
  for (const l of p?.otherLinks ?? []) {
    rows.push({ key: `other-${l.label}`, label: l.label, value: pretty(l.url), href: l.url, external: true });
  }

  // No profile or contact details loaded: render nothing rather than an empty card.
  if (!rows.length) return null;

  const highlight: ContactHighlight | null = block.highlight;
  return (
    <section className={styles.contactCard} aria-label="Contact details">
      {p && <h3>{p.fullName}</h3>}
      <dl>
        {rows.map((r) => (
          <div key={r.key} className={r.key === highlight ? styles.highlight : undefined}>
            <dt>{r.label}</dt>
            <dd>
              {r.external ? (
                <a href={r.href} target="_blank" rel="noreferrer noopener">
                  {r.value}
                  <span className={styles.srOnly}> (opens in a new tab)</span>
                </a>
              ) : (
                <a href={r.href}>{r.value}</a>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
