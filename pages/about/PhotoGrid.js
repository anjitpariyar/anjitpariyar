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
              Done 20+ projects. <br /> Studying BIT in
              <br /> KCC, Kathmandu.
            </p>
          </article>
          <article className={styles.image}>
            <Image src={image1} alt="Image of anjit pariyar" />
          </article>
        </div>
        <div className={styles.commonPadding + " " + styles.wrapper}>
          <div className={styles.textWrapper}>
            <h2 className={styles.titleMd}>
              Let&apos;s talk about some experiences. I started as an intern in{" "}
              <a
                href="https://www.facebook.com/icebergtechnology/"
                target="_blank"
                rel="noreferrer"
              >
                Iceberg technology
              </a>
              , where I learn designing tools and basic web structure. and later
              hired by the same company as a web designer for 6 months.
              presently in{" "}
              <a href="https://thesunbi.com/" target="_blank" rel="noreferrer">
                SunBi Holdings
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
