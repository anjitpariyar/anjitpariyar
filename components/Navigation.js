import styles from "./header.module.scss";
import styles2 from "./navigation.module.scss";
import Link from "next/link";
import Cross from "../svg/Cross";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const Navigation = ({ show, toggleNavigation }) => {
  const nav = useRef(null);

  useEffect(() => {
    let t1 = gsap.timeline();
    if (show) {
      t1.to(nav?.current, {
        y: "-100vh",
        duration: 1,
        ease: "strong.inOut",
      });
      t1.to([...nav?.current.querySelectorAll("nav a")], {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: "ease",
        stagger: 0.2,
        delay: -0.3,
      });
    }
  }, [show]);
  const close = (e) => {
    let t1 = gsap.timeline();
    t1.to(nav?.current, {
      y: "100vh",
      duration: 2,
      ease: "strong.inOut",
    });
    t1.to([...nav?.current.querySelectorAll("nav a")], {
      y: 100,
      opacity: 0,
      duration: 0.2,
      ease: "ease",
      stagger: 0.1,
      delay: -2,
    });

    toggleNavigation(e, false);
  };
  return (
    <div
      className={
        styles.header + " " + styles2.navigation + " " + styles2.mobileOnly
      }
      ref={nav}
    >
      <div className={styles.container}>
        <nav className={styles.nav + " " + styles2.nav}>
          <li
            className={
              styles.navLink + " " + styles2.navLink + " " + styles2.cross
            }
          >
            <a href="#!" className={styles.hamburger} onClick={(e) => close(e)}>
              <Cross />
            </a>
          </li>
          <li className={styles.navLink + " " + styles2.navLink}>
            <Link href="/">
              <a>About</a>
            </Link>
          </li>
          <li className={styles.navLink + " " + styles2.navLink}>
            <Link href="/">
              <a>Project</a>
            </Link>
          </li>
          <li className={styles.navLink + " " + styles2.navLink}>
            <Link href="/">
              <a>Contact</a>
            </Link>
          </li>
          <li className={styles.navLink + " " + styles2.navLink}>
            <a href="https://www.instagram.com/limbo_anj/" target="_blank">
              Insatgram
            </a>
          </li>
        </nav>
      </div>
    </div>
  );
};

export default Navigation;
