import styles from "./header.module.scss";
import Link from "next/link";
import Logo from "../svg/Logo";
import Hamburger from "../svg/Hamburger";
import Navigation from "./Navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import Head from "next/head";

const Header = () => {
  //trigger point for navigation hide and show
  const [show, setShow] = useState(false);
  const toggleNavigation = (e, state) => {
    e.preventDefault();
    setShow(state);
  };
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Anjit Pariyar is a 2 Years Experience Frontend Developer. And  I enjoy
Creating a Web."
        />
        <meta
          name="keywords"
          content="Anjit, Anjit pariyar, Frontend developer, frontend developer nepal, web designer, react developer, react developer nepal, it nepal, nepal, anjit pariyar IT, frontend freelance, frontend freelance nepal"
        />
        <meta name="author" content="Anjit pariyar" />
        <meta name="copyright" content="Anjit pariyar" />
        <meta name="robots" content="follow" />
        <meta httpEquiv="cache-control" content="no-cache" />
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href="/apple-icon-57x57.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href="/apple-icon-60x60.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href="/apple-icon-72x72.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/apple-icon-76x76.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href="/apple-icon-114x114.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/apple-icon-120x120.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/apple-icon-144x144.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/apple-icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-icon-180x180.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-icon-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon-96x96.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#f2ede4" />
        <meta name="msapplication-TileColor" content="#f2ede4" />
        <meta
          property="og:title"
          content="Anjit Pariyar - Frontend Developer"
        />
        <meta
          property="og:description"
          content="Anjit Pariyar is a 2 Years Experience Frontend Developer. And  I enjoy
Creating a Web."
        />
        <meta
          property="og:image"
          content="https://res.cloudinary.com/dem2xvk2e/image/upload/v1632627087/img1_m5v3bc.jpg"
        />
        <meta property="og:type" content="website" />
      </Head>
      <header className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.nav + " " + styles.desktopOnly}>
            <li className={styles.navLink + " " + styles.brand}>
              <Link href="/">
                <a>
                  <motion.span layoutId="brandId_001">
                    <Logo />
                  </motion.span>
                </a>
              </Link>
            </li>
            <li className={styles.navLink}>
              <Link href="/about">
                <a>About</a>
              </Link>
            </li>
            <li className={styles.navLink}>
              <Link href="/project">
                <a>Project</a>
              </Link>
            </li>
            <li className={styles.navLink}>
              <Link href="/contact">
                <a>Contact</a>
              </Link>
            </li>
            <li className={styles.navLink}>
              <a
                href="https://www.instagram.com/limbo_anj/"
                target="_blank"
                rel="noreferrer"
              >
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
