import styles from "./Contact.module.scss";
import { useEffect, useRef } from "react";
import { gsap } from "gsap/dist/gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useInView } from "react-intersection-observer";

const Refer = () => {
  const imageMove = useRef(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(
      [...imageMove?.current.children],
      { y: -100, stagger: 0.3 },
      {
        scrollTrigger: {
          trigger: imageMove?.current,
          start: "top center",
          end: "bottom top",
          scrub: true,
        },
        y: 100,
        stagger: 0.3,
      }
    );
  }, []);
  return (
    <section className={styles.refer}>
      <div className={styles.commonPadding + " " + styles.paddingBottom}>
        <ul ref={imageMove}>
          <li className={styles.titleSm}>
            <div className={styles.container}>
              <span>City</span> <span>Kathmandu, Nepal</span>
            </div>
          </li>
          <li className={styles.titleSm}>
            <a href="tel:+977 9825131071" className={styles.container}>
              <span>Ph no</span>
              <span>+977 98-251-31-071</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="mailto:anjitpariyar@gmail.com"
            >
              <span>Gmail</span>
              <span>anjitpariyar@gmail.com</span>
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
              target="_blank"
            >
              <span>github</span>
              <span>anjit pariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://dribbble.com/limbo_anj"
              target="_blank"
            >
              <span>Dribble</span>
              <span>Anjit pariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://www.linkedin.com/in/anjit-pariyar-b46131178/"
              target="_blank"
            >
              <span>LinkedIn</span>
              <span>anjit pariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://anjitpariyar.medium.com/"
              target="_blank"
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

export default Refer;
