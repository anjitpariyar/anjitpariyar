import type { TechRef } from "../../engine/types";
import styles from "../Chat.module.scss";

export default function TechTags({ items, max }: { items: TechRef[] | string[]; max?: number }) {
  const labels = items.map((t) => (typeof t === "string" ? t : t.label));
  const shown = max ? labels.slice(0, max) : labels;
  const hidden = labels.length - shown.length;
  if (!labels.length) return null;
  return (
    <ul className={styles.tags} aria-label="Technologies">
      {shown.map((label) => (
        <li key={label}>{label}</li>
      ))}
      {hidden > 0 && <li className={styles.tagMore}>+{hidden}</li>}
    </ul>
  );
}
