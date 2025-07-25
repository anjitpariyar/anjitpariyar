import Head from "next/head";
import { useRef } from "react";
import styles from "components/home/Home.module.scss";
import Header from "../components/Header";
import Link from "next/link";
import Image from "next/image";

export default function Custom404() {
  const containerRef = useRef(null);
  return (
    <>
      <Head>
        <title>404 - page Not Found - Anjit Pariyar - React Developer</title>
        <meta name="theme-color" content="#232323" />
        <meta name="msapplication-TileColor" content="#232323" />
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
            <div className={styles.imageWrapper}>
              <Image
                src={
                  "https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/QIxIKBH.png"
                }
                alt="404"
                layout="responsive"
                objectFit="contain"
                width={400}
                height={400}
              />
            </div>
            <h2 className={styles.titleSm}>
              Once alive and now dead, this ghost appears to have some
              unfinished business. Could it be with you? Or the treasure hidden
              under the floorboards of the old mansion in the hills that may
              never reach its rightful owner, a compassionate school teacher in
              Brooklyn.
            </h2>
            <Link href="/" className={styles.btn}>
              Back to Home page
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
