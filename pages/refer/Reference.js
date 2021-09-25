import styles from "./Refer.module.scss";
import { useEffect, useRef } from "react";

const Reference = () => {
  const imageMove = useRef(null);

  return (
    <section className={styles.refer}>
      <div className={styles.commonPadding + " " + styles.paddingBottom}>
        <ul ref={imageMove}>
          <li className={styles.titleSm}>
            <a
              href="https://postfamiliar.com"
              className={styles.container}
              target="_blank"
            >
              <span>Whole Website</span>
              <span>Post Familiar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              href="https://www.zakmotion.com/"
              className={styles.container}
              target="_blank"
            >
              <span>eye animationo</span>
              <span>zakmotion</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="mailto:anjitpariyar@gmail.com"
              target="_blank"
            >
              <span>Screen Animation</span>
              <span>lee</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://www.instagram.com/limbo_anj/"
              target="_blank"
            >
              <span>instagram</span>
              <span>@limbo_anj</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://github.com/anjitpariyar"
            >
              <span>github</span>
              <span>anjit pariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://dribbble.com/limbo_anj"
            >
              <span>Dribble</span>
              <span>Anjit pariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://www.linkedin.com/in/anjit-pariyar-b46131178/"
            >
              <span>LinkedIn</span>
              <span>anjit pariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://anjitpariyar.medium.com/"
            >
              <span>Medium</span>
              <span>@anjitpariyar</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Reference;
