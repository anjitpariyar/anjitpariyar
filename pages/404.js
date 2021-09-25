import Head from "next/head";
import { useRef } from "react";
import styles from "./home/Home.module.scss";
import Header from "../components/Header";
import Link from "next/link";

export default function Custom404() {
  const containerRef = useRef(null);
  return (
    <>
      <Head>
        <title>404 - page Not Found - Anjit Pariyar - Frontend Developer</title>
        <meta name="theme-color" content="#212f4d" />
        <meta name="msapplication-TileColor" content="#212f4d" />
      </Head>
      <Header />
      <main className={styles.pageNotFound} ref={containerRef}>
        <div
          className={
            styles.container +
            " " +
            styles.commonPadding +
            " " +
            styles.paddingBottom
          }
        >
          <div className={styles.textWrapper + " " + styles.textCenter}>
            <img src={"https://i.imgur.com/QIxIKBH.png"} alt="404" />
            <h2 className={styles.titleSm}>
              Once alive and now dead, this ghost appears to have some
              unfinished business. Could it be with you? Or the treasure hidden
              under the floorboards of the old mansion in the hills that may
              never reach its rightful owner, a compassionate school teacher in
              Brooklyn.
            </h2>
            <Link href="/">
              <a className={styles.btn}>Back to Home page</a>
            </Link>
          </div>
        </div>
      </main>
      <style global jsx>{`
        body {
          background-color: #212f4d;
          color: var(--white);
        }
      `}</style>
    </>
  );
}
