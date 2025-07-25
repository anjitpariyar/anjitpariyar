import styles from "./header.module.scss";
import Link from "next/link";
import Logo from "../svg/Logo";
import Hamburger from "../svg/Hamburger";
import Navigation from "./Navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";

const Header = (data) => {
  const { description, keywords, url } = data;
  //trigger point for navigation hide and show
  const [show, setShow] = useState(false);
  const toggleNavigation = (e, state) => {
    e.preventDefault();
    setShow(state);
  };

  const router = useRouter();

  return (
    <>
      <Head>
        <meta
          name="description"
          content={
            description ||
            "Anjit Pariyar is a 4 Years Experienced React Developer. He had done more than 20+ projects. He is a professional developer from Nepal who loves to play around with web apps."
          }
        />
        <meta
          name="keywords"
          content={
            keywords ||
            "anjit, anjit pariyar, React Developer, React Developer nepal, web designer, react developer, react developer nepal, it nepal, nepal, anjit pariyar IT, frontend freelance, frontend freelance nepal,nepal github, anjitpariyar"
          }
        />
        <meta name="author" content={"Anjit pariyar"} />
        <meta name="copyright" content={"Anjit pariyar"} />
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
          name="description"
          content={
            description ||
            "Anjit Pariyar is a 4 Years Experienced React Developer. He had done more than 20+ projects. He is a professional developer from Nepal who loves to play around with web apps."
          }
        />
        <meta property="og:title" content={"Anjit Pariyar - React Developer"} />
        <meta
          property="og:description"
          content={
            description ||
            "Anjit Pariyar is a 4 Years Experienced React Developer. He had done more than 20+ projects. He is a professional developer from Nepal who loves to play around with web apps."
          }
        />
        <meta
          property="og:image"
          content={
            "https://res.cloudinary.com/dem2xvk2e/image/upload/v1632627087/img1_m5v3bc.jpg"
          }
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={url || "https://www.anjitpariyar.com.np"}
        ></meta>
        <meta
          property="og:site_name"
          content={"Anjit Pariyar - React Developer"}
        />
        <meta property="twitter:card" content="summary" />
        <meta
          property="twitter:title"
          content={"Anjit Pariyar - React Developer"}
        />
        <meta
          property="twitter:description"
          content={
            description ||
            "Anjit Pariyar is a 4 Years Experienced React Developer. He had done more than 20+ projects. He is a professional developer from Nepal who loves to play around with web apps."
          }
        />

        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-KHM5XYZNKX"
        ></script>
      </Head>
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
