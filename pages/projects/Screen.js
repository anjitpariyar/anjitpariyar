import { useEffect, useRef, useState } from "react";

import styles from "./Project.module.scss";
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
          <span className={styles.thin}>Projects </span>
          <br />
          <span>that I </span>
          <span>enjoyed</span>
        </h1>
      </div>
    </section>
  );
};

export default Screen;
