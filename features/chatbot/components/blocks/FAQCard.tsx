import type { ChatBlock, Faq } from "../../engine/types";
import { useChatContext } from "../ChatContext";
import styles from "../Chat.module.scss";

export default function FAQCard({ block }: { block: Extract<ChatBlock, { type: "faq_card" }> }) {
  const { index } = useChatContext();
  const faqs = block.faqIds.map((id) => index.faqById.get(id)).filter((f): f is Faq => !!f);
  return (
    <>
      {faqs.map((f) => (
        <article key={f.id} className={styles.faqCard}>
          <h3>{f.question}</h3>
          {f.answer.split(/\n\s*\n/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </article>
      ))}
    </>
  );
}
