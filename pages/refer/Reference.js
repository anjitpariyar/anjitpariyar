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
              rel="noreferrer"
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
              rel="noreferrer"
            >
              <span>eye animation</span>
              <span>zakmotion</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://lottiefiles.com/cn36vzezli"
              target="_blank"
              rel="noreferrer"
            >
              <span>Screen Animation</span>
              <span>lee</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://lottiefiles.com/cn36vzezli"
              target="_blank"
              rel="noreferrer"
            >
              <span>robot animation</span>
              <span>Tomas</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://www.instagram.com/siobhan_sands_creative/"
              target="_blank"
              rel="noreferrer"
            >
              <span>butterfly illustration</span>
              <span>Siobhan Sands</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://unsplash.com/@scottwebb"
              target="_blank"
              rel="noreferrer"
            >
              <span>Concret Background</span>
              <span>@scottwebb</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://absurd.design/chapter1.html"
              target="_blank"
              rel="noreferrer"
            >
              <span>Chat illustration</span>
              <span>absurd.design</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://color.adobe.com/trends/Graphic-design"
              target="_blank"
              rel="noreferrer"
            >
              <span>Color Pallate</span>
              <span>Adobe color</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://growwwkit.com/"
              target="_blank"
              rel="noreferrer"
            >
              <span>About us pack</span>
              <span>growwwkit</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://www.kapwing.com/404-illustrations"
              target="_blank"
              rel="noreferrer"
            >
              <span>Ghost illustration</span>
              <span>404 illustrations</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Reference;
