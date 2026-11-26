import type { ChatBlock, Experience } from "../../engine/types";
import { useChatContext } from "../ChatContext";
import styles from "../Chat.module.scss";
import ExperienceCard from "./ExperienceCard";

export default function ExperienceList({ block }: { block: Extract<ChatBlock, { type: "experience_list" }> }) {
  const { index } = useChatContext();
  const items = block.experienceIds
    .map((id) => index.experienceById.get(id))
    .filter((e): e is Experience => !!e);
  if (!items.length) return null;
  return (
    <ol className={styles.experienceList}>
      {items.map((e) => (
        <li key={e.id}>
          <ExperienceCard experience={e} />
        </li>
      ))}
    </ol>
  );
}
