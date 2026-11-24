import { useEffect, useRef, useState } from "react";

import styles from "./Home.module.scss";
import animationData from "../../json/computer.json";
import animationData2 from "../../json/eye.json";
import { Lottie } from "lottie-react";
import { gsap } from "gsap";

const Screen = () => {
  // lottie ref
  const lottie1 = useRef(null);
  const lottie2 = useRef(null);

  const rendererSettings = { preserveAspectRatio: "xMidYMid slice" };

  //playing animation on hover
  const MouseEnter = () => {
    lottie1?.current?.play();
  };
  const MouseEnter2 = () => {
    lottie2?.current?.play();
  };

  //text reveal
  const header = useRef(null);

  useEffect(() => {
    if (header?.current) {
      let t1 = gsap.timeline();
      t1.staggerTo(
        [...header?.current?.children],
        1,
        { y: 0, opacity: 1, ease: "power4.out", delay: 0.1 },
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

  // router

  return (
    <section className={styles.screen}>
      <div className={styles.container + " " + styles.commonPadding}>
        <div className={styles.lottieWrapper + " " + styles.commonFlex}>
          <article
            className={styles.monitor}
            onMouseEnter={() => MouseEnter()}
            style={{
              transform: "translateY(" + posY * 0.4 + "px)",
              opacity: 1 - posY * 0.002,
            }}
          >
            <Lottie
              src={animationData}
              loop={false}
              autoplay={false}
              rendererSettings={rendererSettings}
              lottieRef={lottie1}
              subscriptions={{ complete: () => lottie1?.current?.stop() }}
              style={{ height: 200, width: 270, margin: "0 auto", overflow: "hidden" }}
            />
          </article>
          <article
            className={styles.eyeBall}
            onMouseEnter={() => MouseEnter2()}
            style={{
              transform: "translateY(" + posY * 0.6 + "px)",
              opacity: 1 - posY * 0.002,
            }}
          >
            <Lottie
              src={animationData2}
              loop={false}
              autoplay={false}
              rendererSettings={rendererSettings}
              lottieRef={lottie2}
              subscriptions={{ complete: () => lottie2?.current?.stop() }}
              style={{ height: 250, width: 250, margin: "0 auto", overflow: "hidden" }}
            />
          </article>
        </div>
        <h1 className={styles.titleLg + " " + styles.textCenter} ref={header}>
          <span>Anjit</span>
          <br />
          <span>Pariyar</span>

          <br />
          <span className={styles.thin}>(5 Yrs. Exp.)</span>
          <br />
          <span>React </span>
          <br />
          <span>Developer</span>

          <br />
          <span className={styles.flex}>
            (
            <small>
              And <br /> I
            </small>
            Believe )
          </span>
        </h1>
      </div>
    </section>
  );
};

export default Screen;
