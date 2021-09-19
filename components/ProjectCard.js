import React from "react";
import styles from "./projectcard.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useInView } from "react-intersection-observer";

const ProjectCard = ({ link, title, image, hoverState, bg }) => {
  const { ref, inView } = useInView({
    threshold: 1,
  });

  const reveal = useRef(null);
  useEffect(() => {
    if (inView && reveal?.current) {
      let t1 = gsap.timeline();
      t1.staggerTo(
        reveal?.current,
        1,
        { x: reveal?.current.clientWidth, ease: "power4.out" },
        0.2
      );
    }
  }, [inView]);

  return (
    <article
      onMouseEnter={() => hoverState(true)}
      onMouseLeave={() => hoverState(false)}
      ref={ref}
    >
      <Link href={link}>
        <a className={styles.projectCard}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.imageWrapper}>
            <Image src={image} alt="Picture of the author" />
            <div
              className={styles.reveal}
              style={{ backgroundColor: bg }}
              ref={reveal}
            ></div>
          </div>
        </a>
      </Link>
    </article>
  );
};

export default ProjectCard;
