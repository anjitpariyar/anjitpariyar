import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "../home/Home.module.scss";
import styles2 from "./Project.module.scss";

import Header from "../../components/Header";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "utils/supabaseClient";
import * as DOMPurify from "dompurify";

const Post = ({ project, error, isLoading }) => {
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

  const sanitizedData = (rawText) => ({
    __html: DOMPurify.sanitize(rawText).replaceAll("\n", "<br/>"),
  });

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  console.log("project_" + pid);

  return (
    <>
      <Head>
        <title>
          {project?.title ?? "NA"} - Projects - Anjit Pariyar - React Developer
        </title>
      </Head>

      <>
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
            {error ? (
              <div className={styles2.header}>
                <h2>Sorry. Couldn&apos;t found &quot;{pid}&quot; project. </h2>
              </div>
            ) : null}

            {isLoading ? (
              <div className={styles2.header}>
                <h2>Loading...</h2>
              </div>
            ) : null}

            {project?.title ? (
              <>
                <div className={styles2.header}>
                  <h2>{project.title}</h2>
                  <div className={styles2.buttongroup}>
                    <button onClick={handleCopyClick} className={styles2.copy}>
                      <Image
                        src={
                          isCopied ? "/icons/checked.svg" : "/icons/copy.svg"
                        }
                        alt="copy"
                        objectFit="contain"
                        height={20}
                        width={20}
                      />
                    </button>

                    <a
                      className={styles.btn + " " + styles2.formBtn}
                      href={project.link}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Visit Site
                    </a>
                  </div>
                </div>
                <div className={styles.textWrapper}>
                  <motion.a
                    className={styles.imageWrapper}
                    layoutId={"project_" + pid}
                    href={project.thumbnail}
                    target="_blank"
                    rel="referrer anjit pariyar"
                  >
                    {project?.thumbnail_video ? (
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className={styles.video}
                        src={project?.thumbnail_video}
                      />
                    ) : (
                      <Image
                        src={project.thumbnail}
                        alt={
                          project.title +
                          " - Projects - Anjit Pariyar - React Developer"
                        }
                        layout="responsive"
                        height={460}
                        width={800}
                        objectFit="contain"
                      />
                    )}
                  </motion.a>

                  <div
                    className={styles.titleSm}
                    dangerouslySetInnerHTML={sanitizedData(project.description)}
                  />

                  <div className={styles2.grid}>
                    {project.images.map((image, index) => (
                      <div key={index}>
                        <a
                          className={styles2.imageWrapper}
                          href={image.thumbnail}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Image
                            src={image.thumbnail}
                            alt={
                              image.title +
                              project.title +
                              " - Projects - Anjit Pariyar - React Developer"
                            }
                            layout="responsive"
                            objectFit="contain"
                            height={550}
                            width={390}
                          />
                        </a>
                        <h2>{image.title}</h2>
                      </div>
                    ))}
                  </div>

                  <h2 className={styles.titleSm} style={{ marginBottom: "0" }}>
                    Frontend Tech Stack:
                  </h2>
                  <h2 className={styles.titleSm} style={{ marginTop: "0.5em" }}>
                    {project.languages}
                  </h2>

                  <Link href="/projects">
                    <a className={styles.btn}>Back to project</a>
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </main>
      </>
    </>
  );
};

export default Post;

export async function getServerSideProps({ params }) {
  const { pid } = params;
  let data = null;
  let error = null;
  try {
    const response = await supabase
      .from("projects")
      .select("*")
      .eq("slug", pid)
      .single();

    if (response.error) throw response.error;
    data = response.data;
  } catch (err) {
    error = err.message;
  }

  return {
    props: {
      project: data,
      error: error,
      isLoading: !error && !data,
    },
  };
}
