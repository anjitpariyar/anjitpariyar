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
        { y: 0, opacity: 1, ease: "power4.out", delay: 0.3 },
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
          <span className={styles.thin}>(Be Yourself)</span>
          <span>I chose</span>
          <br />
          <span>the </span>
          <br />

          <span>Web App. </span>
        </h1>
        <div className={styles.textWrapper}>
          <h2 className={styles.titleMd}>
            From the start I have thrives on solving problems and creating
            websites that users love.
            <br />
            <br />
            I develop the knack for adding animations to websites, making them
            more engaging and interactive.
            <br />
            <br />
            All these years makes me, proficient in React.js, adept at handling
            performance optimization, ensuring responsiveness, and seamlessly
            integrating APIs to enhance user experiences.
            <br />
            <br />I am dedicated to crafting user-friendly interfaces and
            leveraging technology to bring ideas to life on the web.
          </h2>
        </div>
      </div>
    </section>
  );
};

export default Screen;
