import type { Experience } from "../../engine/types";
import styles from "../Chat.module.scss";
import TechTags from "./TechTags";

const fmt = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
};

function duration(e: Experience): string | null {
  if (!e.startDate) return null;
  const end = e.isCurrent ? "Present" : e.endDate ? fmt(e.endDate) : null;
  return end ? `${fmt(e.startDate)} – ${end}` : `Since ${fmt(e.startDate)}`;
}

export default function ExperienceCard({ experience: e }: { experience: Experience }) {
  const period = duration(e);
  return (
    <article className={styles.experienceCard}>
      <header>
        <h3>{e.position}</h3>
        <p className={styles.company}>
          {e.companyUrl ? (
            <a href={e.companyUrl} target="_blank" rel="noreferrer noopener">
              {e.company}
            </a>
          ) : (
            e.company
          )}
          {e.employmentType && <span> · {e.employmentType}</span>}
        </p>
        {period && <p className={styles.meta}>{period}</p>}
      </header>
      {e.description && <p>{e.description}</p>}
      {e.responsibilities.length > 0 && (
        <ul className={styles.bullets}>
          {e.responsibilities.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      <TechTags items={e.technologies} />
    </article>
  );
}
