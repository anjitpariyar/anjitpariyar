import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../home/Home.module.scss";
import styles2 from "./Project.module.scss";

import Header from "../../components/Header";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
const Post = () => {
  const router = useRouter();
  const { pid, image } = router.query;

  return (
    <>
      <Head>
        <title>{pid} - Anjit Pariyar - Frontend Developer</title>
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
          <div className={styles.textWrapper + " " + styles.textCenter}>
            <motion.div
              className={styles.imageWrapper}
              layoutId={pid?.toLowerCase() + "01"}
            >
              <Image src={image} alt="404" layout="fill" objectFit="contain" />
            </motion.div>
            <h2 className={styles.titleSm}>{pid} is launching soon.</h2>
            <Link href="/project">
              <a className={styles.btn}>Back to project</a>
            </Link>
          </div>
        </div>
      </main>
      <style global jsx>{`
        body {
          background-color: var(--dark);
          color: var(--white);
        }
      `}</style>
    </>
  );
};

export default Post;
