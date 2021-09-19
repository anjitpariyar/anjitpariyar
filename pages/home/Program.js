import styles from "./Home.module.scss";
import { useRef, useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import gsap from "gsap";

const Program = () => {
  const texts = [
    "HTML 5",
    "CSS 3",
    "JS",
    "REACT JS",
    "NEXT JS",
    "SASS",
    "TWIG",
    "BOOTSTRAP 5",
    "JQUERY",
    "HTML 5",
    "CSS 3",
  ];

  const header = useRef(null);
  const [width, setWidth] = useState(0);
  const { ref, inView } = useInView({
    /* Optional options */
    threshold: 0.2,
    // triggerOnce:true,
  });

  useEffect(() => {
    if (header?.current) {
      setWidth(header?.current?.scrollWidth - header?.current?.clientWidth);
    }
  }, []);
  useEffect(() => {
    if (inView && header?.current) {
      let t1 = gsap.timeline();
      t1.staggerTo(
        [...header?.current?.children],
        1,
        { y: 0, opacity: 1 },
        0.3
      );
    } else {
      let t1 = gsap.timeline();
      t1.staggerTo(
        [...header?.current?.children],
        1,
        { y: 200, opacity: 1 },
        0.3
      );
    }
  }, [inView]);

  return (
    <section
      className={styles.program + " " + (inView ? styles.active : " ")}
      ref={ref}
    >
      <div
        className={
          styles.commonPadding +
          " " +
          styles.container +
          " " +
          styles.paddingBottom
        }
      >
        <h1
          className={styles.titleLg}
          style={{ "--width": "-" + width + "px" }}
          ref={header}
        >
          {texts.map((text, i) => {
            return <span key={text + "-" + i}>{text}</span>;
          })}
        </h1>
      </div>
    </section>
  );
};

export default Program;
