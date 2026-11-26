import Image from "next/image";
import Link from "next/link";
import type { Project } from "../../engine/types";
import { useChatContext } from "../ChatContext";
import styles from "../Chat.module.scss";
import TechTags from "./TechTags";

export default function ProjectCard({ project }: { project: Project }) {
  const { send, busy } = useChatContext();
  return (
    <article className={styles.projectCard}>
      <div className={styles.thumb}>
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={`${project.title} project by Anjit Pariyar`}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
          />
        ) : (
          <span aria-hidden="true">{project.title.charAt(0)}</span>
        )}
      </div>
      <div className={styles.cardBody}>
        <h3>{project.title}</h3>
        {project.summary && <p className={styles.clamp}>{project.summary}</p>}
        <TechTags items={project.technologies} max={4} />
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionPrimary}
            onClick={() => send(`Tell me about ${project.title}`)}
            disabled={busy}
          >
            View details
          </button>
          <Link href={`/projects/${project.slug}`} className={styles.actionLink}>
            Case study
          </Link>
          {project.link && (
            <a href={project.link} target="_blank" rel="noreferrer noopener" className={styles.actionLink}>
              Live site <span aria-hidden="true">↗</span>
              <span className={styles.srOnly}> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
