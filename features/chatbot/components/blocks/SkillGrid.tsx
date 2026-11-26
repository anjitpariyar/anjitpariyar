import type { ChatBlock, Skill, SkillCategory } from "../../engine/types";
import { useChatContext } from "../ChatContext";
import styles from "../Chat.module.scss";

const ORDER: SkillCategory[] = ["Frontend", "Styling", "Animation", "Backend", "Database", "Tools", "Other"];

export default function SkillGrid({ block }: { block: Extract<ChatBlock, { type: "skill_grid" }> }) {
  const { index } = useChatContext();
  const skills = block.skillIds.map((id) => index.skillById.get(id)).filter((s): s is Skill => !!s);
  if (!skills.length) return null;

  const groups = ORDER.map((category) => ({
    category,
    items: skills.filter((s) => s.category === category),
  })).filter((g) => g.items.length);

  return (
    <div className={styles.skillGrid}>
      {groups.map(({ category, items }) => (
        <section key={category} className={styles.skillGroup} aria-label={`${category} skills`}>
          <h3>{category}</h3>
          <ul>
            {items.map((s) => (
              <li key={s.id} className={s.isFeatured ? styles.featured : undefined}>
                <span className={styles.skillName}>{s.name}</span>
                {(s.proficiencyLabel || s.yearsExperience !== null) && (
                  <span className={styles.skillMeta}>
                    {[s.proficiencyLabel, s.yearsExperience !== null ? `${s.yearsExperience} yrs` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
