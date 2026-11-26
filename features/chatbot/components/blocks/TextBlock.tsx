import type { ChatBlock } from "../../engine/types";
import styles from "../Chat.module.scss";

/** Plain text only; paragraphs split on blank lines, line breaks preserved. */
export default function TextBlock({ block }: { block: Extract<ChatBlock, { type: "text" }> }) {
  return (
    <div className={styles.text}>
      {block.text.split(/\n\s*\n/).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}
