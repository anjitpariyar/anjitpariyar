import styles from "./header.module.scss";
import Link from "next/link";
import Logo from "../svg/Logo";
import Hamburger from "../svg/Hamburger";
import Navigation from "./Navigation";
import { useState } from "react";
import { motion } from "framer-motion";

const Header = () => {
  //trigger point for navigation hide and show
  const [show, setShow] = useState(false);
  const toggleNavigation = (e, state) => {
    e.preventDefault();
    setShow(state);
  };
  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.nav + " " + styles.desktopOnly}>
            <li className={styles.navLink + " " + styles.brand}>
              <Link href="/">
                <motion.a layoutId="brandId_001">
                  <Logo />
                </motion.a>
              </Link>
            </li>
            <li className={styles.navLink}>
              <Link href="/">
                <a>About</a>
              </Link>
            </li>
            <li className={styles.navLink}>
              <Link href="/">
                <a>Project</a>
              </Link>
            </li>
            <li className={styles.navLink}>
              <Link href="/">
                <a>Contact</a>
              </Link>
            </li>
            <li className={styles.navLink}>
              <a href="https://www.instagram.com/limbo_anj/" target="_blank">
                Insatgram
              </a>
            </li>
          </nav>
          <nav className={styles.nav + " " + styles.mobileOnly}>
            <li className={styles.navLink + " " + styles.brand}>
              <Link href="/">
                <a>
                  <Logo />
                </a>
              </Link>
            </li>

            <li className={styles.navLink}>
              <a
                href="#!"
                target="_blank"
                className={styles.hamburger}
                onClick={(e) => toggleNavigation(e, true)}
              >
                <Hamburger />
              </a>
            </li>
          </nav>
        </div>
      </header>
      <Navigation show={show} toggleNavigation={toggleNavigation} />
    </>
  );
};

export default Header;
