import styles from "./Home.module.scss";
import * as animationData from "../../json/robot.json";
import Lottie from "react-lottie";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useInView } from "react-intersection-observer";

const Enjoy = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const header = useRef(null);
  const header2 = useRef(null);

  const { ref, inView } = useInView({
    /* Optional options */
    threshold: 0.4,
  });
  useEffect(() => {
    if (inView && header?.current && header2?.current) {
      let t1 = gsap.timeline();
      t1.staggerTo(
        [...header?.current?.children],
        1,
        { y: 0, opacity: 1, ease: "power4.out" },
        0.2
      ).staggerTo(
        [...header2?.current?.children],
        1,
        { y: 0, opacity: 1, ease: "power4.out" },
        0.2
      );
    } else {
      let t1 = gsap.timeline();
      t1.staggerTo(
        [...header?.current?.children],
        1,
        { y: -100, opacity: 0, ease: "power4.out" },
        0.2
      );
    }
  }, [inView]);

  return (
    <section className={styles.enjoy}>
      <div className={styles.container}>
        <div className={styles.lottieWrapper + " " + styles.commonFlex}>
          <aside className={styles.mlAuto}>
            <h1 className={styles.title + " " + styles.textCenter} ref={header}>
              <span className={styles.thin}>
                {"{"} IF {"}"}
              </span>{" "}
              <br />
              <span>I enjoy </span>
              <br />
              <small>Creating a Web. </small>
            </h1>
          </aside>
          <aside className={styles.monitor} ref={ref}>
            <div className={styles.lottieWrapper}>
              <Lottie
                options={defaultOptions}
                height={600}
                width={400}
                isClickToPauseDisabled={true}
              />
            </div>
          </aside>
          <aside className={styles.mrAuto}>
            <h1
              className={styles.title + " " + styles.textCenter}
              ref={header2}
            >
              <span className={styles.thin}>
                {"{"} true {"}"}{" "}
              </span>
              <br />
              <span>You will enjoy</span> <br />
              <small>Using it. </small>
            </h1>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Enjoy;
