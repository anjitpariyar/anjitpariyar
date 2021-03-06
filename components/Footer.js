import styles from "./footer.module.scss";
import styles2 from "./header.module.scss";
import Link from "next/link";

import Header from "./Header";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useInView } from "react-intersection-observer";

const Footer = () => {
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const reveal = useRef(null);
  useEffect(() => {
    if (inView && reveal?.current) {
      let t1 = gsap.timeline();

      t1.staggerTo(
        [...reveal?.current.children],
        1,
        { y: 0, opacity: 1, ease: "power4.out" },
        0.2
      );
    } else {
      let t1 = gsap.timeline();
      t1.staggerTo(
        [...reveal?.current.children],
        1,
        { y: 200, opacity: 0, ease: "power4.out" },
        0.2
      );
    }
  }, [inView]);
  return (
    <footer className={styles.footer + " " + styles.bgDark} ref={ref}>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.titleLg}>
          <a ref={reveal} href="mailto:anjitpariyar@gmail.com">
            <span>P</span>
            <span>r</span>
            <span>o</span>
            <span>j</span>
            {/* <span className={styles.empty}>{"  "}</span> */}
            <span>e</span>
            <span>c</span>
            <span>t</span>
            <span>?</span>
          </a>
        </h1>
      </div>
      <div className={styles2.header + " " + styles2.footer}>
        <div className={styles2.container}>
          <nav className={styles2.nav}>
            <li className={styles2.navLink}>
              <Link href="/refer">
                <a>All Reference</a>
              </Link>
            </li>

            <li className={styles2.navLink}>
              <a>Anjit Pariyar &copy;{new Date().getFullYear()}</a>
            </li>
            <li className={styles2.navLink}>
              <a
                href="https://github.com/anjitpariyar"
                target="_blank"
                rel="noreferrer"
              >
                Github
              </a>
            </li>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
