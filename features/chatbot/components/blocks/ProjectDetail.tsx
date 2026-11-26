import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ChatBlock } from "../../engine/types";
import { useChatContext } from "../ChatContext";
import styles from "../Chat.module.scss";
import TechTags from "./TechTags";

const LONG = 600;

export default function ProjectDetail({ block }: { block: Extract<ChatBlock, { type: "project_detail" }> }) {
  const { index } = useChatContext();
  const [expanded, setExpanded] = useState(false);
  const project = index.projectById.get(block.projectId);
  if (!project) return null;

  const showDescription = block.focus === "overview" || block.focus === "contribution";
  const description = project.description;
  const isLong = description.length > LONG;
  const visible = !isLong || expanded ? description : `${description.slice(0, LONG).trimEnd()}…`;

  return (
    <article className={styles.detailCard}>
      {project.thumbnail && block.focus === "overview" && (
        <div className={styles.detailThumb}>
          <Image
            src={project.thumbnail}
            alt={`${project.title} project by Anjit Pariyar`}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
      )}
      <div className={styles.cardBody}>
        <h3>{project.title}</h3>
        <TechTags items={project.technologies.length ? project.technologies : project.technologiesText ? [project.technologiesText] : []} />
        {showDescription && description && (
          <div className={styles.text}>
            {visible.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            {isLong && (
              <button type="button" className={styles.inlineButton} onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}
        {project.imageTitles.length > 0 && block.focus === "overview" && (
          <p className={styles.meta}>Screens: {project.imageTitles.join(" · ")}</p>
        )}
        <div className={styles.actions}>
          <Link href={`/projects/${project.slug}`} className={styles.actionPrimary}>
            Full case study
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
