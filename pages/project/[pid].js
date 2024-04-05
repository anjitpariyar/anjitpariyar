import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "../home/Home.module.scss";
import styles2 from "./Project.module.scss";

import Header from "../../components/Header";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const Post = () => {
  const router = useRouter();
  const { pid } = router.query;

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(window.location);
    } catch (e) {
      throw e;
    } finally {
      // 👇 Show the result feedback for 2 seconds
      setIsCopied(true);
    }
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <>
      <Head>
        <title>{pid} - Anjit Pariyar - React Developer</title>
        <meta name="theme-color" content="#232323" />
        <meta name="msapplication-TileColor" content="#232323" />
      </Head>
      <Header />
      <main className={styles.pageNotFound + " " + styles2.projectSingle}>
        <div
          className={
            styles.container +
            " " +
            styles.commonPadding +
            " " +
            styles.paddingBottom
          }
        >
          {/* header , title and share */}
          {/* main image */}
          {/* description */}
          {/* three more picture */}
          {/* stack */}

          <div className={styles2.header}>
            <h2>HamroBazar</h2>
            <div className={styles2.buttongroup}>
              <button onClick={handleCopyClick} className={styles2.copy}>
                <Image
                  src={isCopied ? "/icons/checked.svg" : "/icons/copy.svg"}
                  alt="copy"
                  objectFit="contain"
                  height={20}
                  width={20}
                />
              </button>

              <a
                className={styles.btn + " " + styles2.formBtn}
                href="http://www.google.com"
                target="_blank"
                rel="noreferrer noopener"
              >
                Visit Site
              </a>
            </div>
          </div>

          <div className={styles.textWrapper}>
            {
              <motion.a
                className={styles.imageWrapper}
                layoutId={pid?.toLowerCase() + "01"}
                href="https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                target="_blank"
                rel="referrer anjitpariyar.com.np"
              >
                <Image
                  src={
                    "https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                  }
                  alt="404"
                  layout="fill"
                  objectFit="contain"
                />
              </motion.a>
            }
            <h2 className={styles.titleSm}>
              Contributed to the development of the largest E-commerce site in
              the country, Hamrobazar, utilized by millions of users, showcasing
              expertise in designing and optimizing user experiences at scale.
            </h2>

            <h2 className={styles.titleSm}>
              Easy Listing, Easy Viewing Call, chat, comment instantly.
            </h2>

            <div className={styles2.grid}>
              <div>
                <a
                  className={styles2.imageWrapper}
                  href="https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src={
                      "https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                    }
                    alt="404"
                    layout="fill"
                    objectFit="cover"
                  />
                </a>
                <h2>Home Page</h2>
              </div>
              <div>
                <a
                  className={styles2.imageWrapper}
                  href="https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src={
                      "https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                    }
                    alt="404"
                    layout="fill"
                    objectFit="cover"
                  />
                </a>
                <h2>Home Page</h2>
              </div>
              <div>
                <a
                  className={styles2.imageWrapper}
                  href="https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src={
                      "https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                    }
                    alt="404"
                    layout="fill"
                    objectFit="cover"
                  />
                </a>
                <h2>Home Page</h2>
              </div>
              <div>
                <a
                  className={styles2.imageWrapper}
                  href="https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    src={
                      "https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png"
                    }
                    alt="404"
                    layout="fill"
                    objectFit="cover"
                  />
                </a>
                <h2>Home Page</h2>
              </div>
            </div>

            <h2 className={styles.titleSm} style={{ marginBottom: "0" }}>
              Frontend Tech Stack:
            </h2>
            <h2 className={styles.titleSm} style={{ marginTop: "0.5em" }}>
              REACTJS REDUX REDUX-SAGA REALTIME DB
            </h2>

            <Link href="/project">
              <a className={styles.btn}>Back to project</a>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default Post;
