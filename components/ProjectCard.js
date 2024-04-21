import React from "react";
import styles from "./projectcard.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

const ProjectCard = ({
  title,
  thumbnail,
  hoverState,
  index = 0,
  slug,
  thumbnail_video,
}) => {
  const { ref, inView } = useInView({
    threshold: 0.6,
  });

  console.log("project_" + slug);

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
    <motion.article
      onMouseEnter={() => hoverState(true)}
      onMouseLeave={() => hoverState(false)}
      ref={ref}
      layoutId={"project_" + slug}
    >
      <Link href={`/projects/${slug}`}>
        <a className={styles.projectCard}>
          <h2 className={styles.title}>{title}</h2>

          <div className={styles.imageWrapper}>
            {thumbnail_video ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className={styles.video}
                src={thumbnail_video}
              />
            ) : (
              <Image
                src={thumbnail}
                alt={`project ${title} by anjit pariyar`}
                layout="responsive"
                width={564}
                height={326}
              />
            )}

            <div className={styles.reveal} ref={reveal}></div>
          </div>
          {index > 0 && <span className={styles.count}>{index}</span>}
        </a>
      </Link>
    </motion.article>
  );
};

export default ProjectCard;
