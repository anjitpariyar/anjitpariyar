import React from "react";
import styles from "./projectcard.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

const ProjectCard = ({
  link,
  title,
  image,
  hoverState,
  bg,
  internal,
  index = 0,
}) => {
  const { ref, inView } = useInView({
    threshold: 0.6,
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
      {internal ? (
        <Link href={link + "?image=" + image.src}>
          <a className={styles.projectCard}>
            <h2 className={styles.title}>{title}</h2>
            <motion.div
              className={styles.imageWrapper}
              layoutId={title.toLowerCase() + "01"}
            >
              <Image
                src={image}
                alt={"project " + title + " by anjit pariyar"}
                layout="fill"
                objectFit="cover"
              />
              <div
                className={styles.reveal}
                style={{ backgroundColor: bg }}
                ref={reveal}
              ></div>
            </motion.div>
            dsada
          </a>
        </Link>
      ) : (
        <a
          className={styles.projectCard}
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          <h2 className={styles.title}>{title}</h2>

          <div className={styles.imageWrapper} style={{ backgroundColor: bg }}>
            <Image
              src={image}
              alt={"project " + title + " by anjit pariyar"}
              objectFit="contain"
            />
            <div
              className={styles.reveal}
              style={{ backgroundColor: bg }}
              ref={reveal}
            ></div>
          </div>
          {index > 0 && <span className={styles.count}>{index}</span>}
        </a>
      )}
    </article>
  );
};

export default ProjectCard;
