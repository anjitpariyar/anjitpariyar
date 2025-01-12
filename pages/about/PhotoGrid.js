import styles from "./About.module.scss";
import Image from "next/image";

const PhotoGrid = () => {
  return (
    <section className={styles.photoGrid}>
      <div className={styles.container + " " + styles.commonPadding}>
        <div className={styles.grid}>
          <article className={styles.details}>
            <p className={styles.titleSm + " " + styles.left}>
              Done 20+ projects.
            </p>
          </article>
          <article className={styles.image}>
            <Image
              src={"/about/img1.jpg"}
              alt="Image of anjit pariyar"
              fill="responsive"
              height={462}
              width={346}
            />
          </article>
        </div>
        <div className={styles.commonPadding + " " + styles.wrapper}>
          <div className={styles.textWrapper}>
            <h2 className={styles.titleMd}>
              {"4 Y E A R S  O F  "}
              <br />
              {"E X P E R I E N C E"}
            </h2>
            <h2 className={styles.titleMd}>
              At{" "}
              <a
                href="https://www.cubit.com.np/"
                target="_blank"
                rel="noreferrer"
              >
                Cubit
              </a>{" "}
              Since April 2024 as a React Dev.
            </h2>
            <h2 className={styles.titleMd}>
              At{" "}
              <a href="https://www.lukuku.co/" target="_blank" rel="noreferrer">
                LUKUKU
              </a>{" "}
              Since February 2022 to March 2024 as a React Dev.
            </h2>

            <h2 className={styles.titleMd}>
              Worked at{" "}
              <a href="https://sunbi.com.np/" target="_blank" rel="noreferrer">
                SunBi Holdings
              </a>{" "}
              From April 2020 to May 2022 as a React Dev.
            </h2>

            <h2 className={styles.titleMd}>
              Started at{" "}
              <a
                href="https://www.facebook.com/icebergtechnology/"
                target="_blank"
                rel="noreferrer"
              >
                ICEBERG TECHNOLOGY
              </a>
              June 2019 to March 2020 as a Web Designer.
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotoGrid;
