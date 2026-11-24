import styles from "./header.module.scss";
import Link from "next/link";
import Logo from "../svg/Logo";
import Hamburger from "../svg/Hamburger";
import Navigation from "./Navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

const Header = () => {
  //trigger point for navigation hide and show
  const [show, setShow] = useState(false);
  const toggleNavigation = (e, state) => {
    e.preventDefault();
    setShow(state);
  };

  const router = useRouter();

  return (
    <>
      <header className={styles.header}>
        <div>
          <nav className={styles.nav + " " + styles.desktopOnly}>
            <li className={styles.navLink + " " + styles.brand}>
              <Link href="/">
                <motion.span layoutId="brandId_001">
                  <Logo />
                </motion.span>
              </Link>
            </li>
            <li
              className={
                styles.navLink +
                ` ${router.pathname.includes("/about") ? styles.active : ""}`
              }
            >
              <Link href="/about">About</Link>
            </li>
            <li
              className={
                styles.navLink +
                ` ${router.pathname.includes("/projects") ? styles.active : ""}`
              }
            >
              <Link href="/projects">Projects</Link>
            </li>
            <li
              className={
                styles.navLink +
                ` ${router.pathname.includes("/contact") ? styles.active : ""}`
              }
            >
              <Link href="/contact">Contact</Link>
            </li>
            <li className={styles.navLink}>
              <a
                href="https://www.instagram.com/limbo_anj/"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
            </li>
          </nav>
          <nav className={styles.nav + " " + styles.mobileOnly}>
            <li className={styles.navLink + " " + styles.brand}>
              <Link href="/">
                <Logo />
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
