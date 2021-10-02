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
              Post Familiar is a Portland based wine company focused on unique
              intersections of process, people and place. Rooted in the pursuit
              of experimentation, we partner with winemakers to produce distinct
              natural wines for the curious.
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotoGrid;
