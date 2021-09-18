import Image from "next/image";
import styles from "./banner.module.scss";

const Banner = ({ link, image, title, white, description }) => {
  return (
    <section className={styles.banner}>
      <a className={styles.imageWrapper} href={link} target="_blank">
        {image && (
          <Image src={image} alt="Picture of the author" placeholder="blur" />
        )}

        <div className={styles.container}>
          <div className={styles.textWrapper}>
            <h2
              className={
                styles.titleMd + " " + (white ? styles.textWhite : " ")
              }
              dangerouslySetInnerHTML={{ __html: title }}
            ></h2>
            <p
              className={
                styles.titleSm + " " + (white ? styles.textWhite : " ")
              }
            >
              {description}
            </p>
          </div>
        </div>
      </a>
    </section>
  );
};

export default Banner;
