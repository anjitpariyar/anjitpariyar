import { useState, useRef } from "react";

import styles from "../../styles/Home.module.scss";
import * as animationData from "../../json/computer.json";
import * as animationData2 from "../../json/eye.json";
import Lottie from "react-lottie";

const Screen = () => {
  const lottie1 = useRef(null);
  const lottie2 = useRef(null);

  const defaultOptions = {
    loop: false,
    autoplay: false,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const defaultOptions2 = {
    loop: false,
    autoplay: false,
    animationData: animationData2,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const MouseEnter = () => {
    lottie1?.current?.play();
  };
  const MouseEnter2 = () => {
    lottie2?.current?.play();
  };
  return (
    <section className={styles.screen}>
      <div className={styles.container + " " + styles.commonPadding}>
        <div className={styles.lottieWrapper + " " + styles.commonFlex}>
          <article className={styles.monitor} onMouseEnter={() => MouseEnter()}>
            <Lottie
              options={defaultOptions}
              height={200}
              width={270}
              ref={lottie1}
              eventListeners={[
                {
                  eventName: "complete",
                  callback: () => {
                    lottie1?.current?.stop();
                  },
                },
              ]}
            />
          </article>
          <article
            className={styles.eyeBall}
            onMouseEnter={() => MouseEnter2()}
          >
            <Lottie
              options={defaultOptions2}
              height={250}
              width={250}
              ref={lottie2}
              eventListeners={[
                {
                  eventName: "complete",
                  callback: () => {
                    lottie2?.current?.stop();
                  },
                },
              ]}
            />
          </article>
        </div>
        <h1 className={styles.titleLg + " " + styles.textCenter}>
          Anjit
          <br />
          Pariyar
          <br />
          <span className={styles.thin}>(N.01 – SS21)</span>
          <br />
          Frontend <br />
          Developer
        </h1>
      </div>
    </section>
  );
};

export default Screen;
