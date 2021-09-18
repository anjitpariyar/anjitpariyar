import { useState, useRef } from "react";

import styles from "./Home.module.scss";
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
              isClickToPauseDisabled={true}
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
              isClickToPauseDisabled={true}
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
          <span className={styles.thin}>(2 Yrs Exp)</span>
          <br />
          Frontend <br />
          Developer
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
