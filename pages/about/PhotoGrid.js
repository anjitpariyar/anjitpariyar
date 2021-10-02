import styles from "./About.module.scss";
import Image from "next/image";
import image1 from "/public/about/img1.jpg";
const PhotoGrid = () => {
  return (
    <section className={styles.photoGrid}>
      <div className={styles.container + " " + styles.commonPadding}>
        <div className={styles.grid}>
          <article className={styles.details}>
            <p className={styles.titleSm + " " + styles.left}>
              Born in <br /> 2000, Nepal. <br /> Studying BIT in
              <br /> KCC, Kathmandu.
            </p>
          </article>
          <article className={styles.image}>
            <Image src={image1} alt="Picture of the author" />
          </article>
        </div>
        <div className={styles.commonPadding + " " + styles.wrapper}>
          <div className={styles.textWrapper}>
            <h2 className={styles.titleMd}>
              Lets talk about some experience. 3-months in{" "}
              <a
                href="https://www.facebook.com/icebergtechnology/"
                target="_blank"
                rel="noreferrer"
              >
                Iceberg technology
              </a>{" "}
              as an intern. 6-months in{" "}
              <a
                href="https://www.facebook.com/icebergtechnology/"
                target="_blank"
                rel="noreferrer"
              >
                Iceberg technology
              </a>{" "}
              as a web designer. presently in{" "}
              <a href="https://thesunbi.com/" target="_blank" rel="noreferrer">
                sunbi
              </a>{" "}
              as a frontend dev since 2020.
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotoGrid;
