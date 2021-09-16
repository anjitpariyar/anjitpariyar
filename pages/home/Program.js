import styles from "./Home.module.scss";
import { useRef, useState, useEffect } from "react";
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
  useEffect(() => {
    if (header?.current) {
      setWidth(header?.current?.scrollWidth - header?.current?.clientWidth);
      console.log(header?.current);
    }
  }, []);

  return (
    <section className={styles.program}>
      <div className={styles.commonPadding + " " + styles.container}>
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
