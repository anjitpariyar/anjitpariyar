import styles from "./About.module.scss";
import Image from "next/image";

const PhotoCard = ({ currentImg, title }) => {
  return (
    <div>
      <div className={styles.textCenter + " " + styles.textWrapper}>
        <Image
          src={currentImg}
          alt="who's photo are they"
          layout="fill"
          objectFit="contain"
        />
      </div>
      <p className={styles.textCenter}>* {title} *</p>
    </div>
  );
};

export default PhotoCard;
