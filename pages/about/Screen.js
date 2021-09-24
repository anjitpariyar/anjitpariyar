import { useEffect, useRef, useState } from "react";

import styles from "./About.module.scss";
import { gsap } from "gsap";

const Screen = () => {
  //text reveal
  const header = useRef(null);

  useEffect(() => {
    if (header?.current) {
      let t1 = gsap.timeline();
      t1.staggerTo(
        [...header?.current?.querySelectorAll("span")],
        1,
        { y: 0, opacity: 1, ease: "power4.out", delay: 1.5 },
        0.2
      );
    }
  }, []);

  // two lottie aniamtion parallax effect

  const [posY, setPosY] = useState(0);

  useEffect(() => {
    if (posY < 1000) {
      window.addEventListener("scroll", () => {
        setPosY(window.scrollY);
      });
    }
    return () => {
      window.removeEventListener("scroll", () => {});
    };
  }, [posY]);

  return (
    <section className={styles.screen}>
      <div className={styles.container + " " + styles.commonPadding}>
        <h1 className={styles.titleLg + " " + styles.textCenter} ref={header}>
          <span className={styles.thin}>(Wines)</span>
          <span>For</span>
          <br />
          <span>Expansion </span>
        </h1>
        <div className={styles.textWrapper}>
          <h2 className={styles.titleMd}>
            Post Familiar is a Portland based wine company focused on unique
            intersections of process, people and place. Rooted in the pursuit of
            experimentation, we partner with winemakers to produce distinct
            natural wines for the curious.
          </h2>
        </div>
      </div>
    </section>
  );
};

export default Screen;
