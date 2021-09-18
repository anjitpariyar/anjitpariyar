import React from "react";
import styles from "./projectcard.module.scss";
import Link from "next/link";
import Image from "next/image";

const ProjectCard = ({ link, title, image, hoverState }) => {
  return (
    <article
      onMouseEnter={() => hoverState(true)}
      onMouseLeave={() => hoverState(false)}
    >
      <Link href={link}>
        <a className={styles.projectCard}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.imageWrapper}>
            <Image src={image} alt="Picture of the author" />
          </div>
        </a>
      </Link>
    </article>
  );
};

export default ProjectCard;
