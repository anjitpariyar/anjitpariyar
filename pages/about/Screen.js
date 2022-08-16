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
          <span className={styles.thin}>(Be Yourself)</span>
          <span>I chose</span>
          <br />
          <span>the </span>
          <br />

          <span>Web App. </span>
        </h1>
        <div className={styles.textWrapper}>
          <h2 className={styles.titleMd}>
            From the Tech background, I have three years of experience in
            developing Web apps. I can pixel-perfect any website. I love to work
            more on UIUX-based websites as they are the one that solves user
            problems. Animating a site is not my cup of tea but coffee. And
            always keen to upgrade myself.
          </h2>
        </div>
      </div>
    </section>
  );
};

export default Screen;
