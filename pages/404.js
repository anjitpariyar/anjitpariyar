import Seo from "components/Seo";
import { useRef } from "react";
import styles from "components/home/Home.module.scss";
import Header from "../components/Header";
import Link from "next/link";
import Image from "next/image";

export default function Custom404() {
  const containerRef = useRef(null);
  return (
    <>
      <Seo
        title="404 - Page Not Found - Anjit Pariyar - React Developer"
        themeColor="#232323"
        noindex
      />
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
                width={400}
                height={400}
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
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
