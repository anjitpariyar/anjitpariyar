import { useState } from "react";
import type { ChatBlock, Project } from "../../engine/types";
import { useChatContext } from "../ChatContext";
import styles from "../Chat.module.scss";
import ProjectCard from "./ProjectCard";

const INITIAL = 4;

export default function ProjectList({ block }: { block: Extract<ChatBlock, { type: "project_list" }> }) {
  const { index } = useChatContext();
  const [expanded, setExpanded] = useState(false);
  const projects = block.projectIds
    .map((id) => index.projectById.get(id))
    .filter((p): p is Project => !!p);
  if (!projects.length) return null;

  const shown = expanded ? projects : projects.slice(0, INITIAL);
  return (
    <div>
      <ol className={styles.projectGrid}>
        {shown.map((p, i) => (
          <li key={p.id}>
            <span className={styles.srOnly}>{i + 1}. </span>
            <ProjectCard project={p} />
          </li>
        ))}
      </ol>
      {projects.length > INITIAL && (
        <button type="button" className={styles.moreButton} onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? "Show fewer" : `Show all ${projects.length} projects`}
        </button>
      )}
    </div>
  );
}
