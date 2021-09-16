import Image from "next/image";
import FallImage from "/public/projects/fall.png";
import styles from "./Home.module.scss";

const Fall = () => {
  return (
    <section className={styles.project}>
      <div className={styles.commonPadding}>
        <a
          className={styles.imageWrapper}
          href="https://anjitpariyar.github.io/everythingFall/"
          target="_blank"
        >
          <Image src={FallImage} alt="Picture of the author" />
          <div className={styles.container}>
            <div className={styles.textWrapper}>
              <h2 className={styles.titleMd + " " + styles.textWhite}>
                EverythingFall
              </h2>
              <p className={styles.textWhite + " " + styles.title}>
                Are you Ready for Html Canvas ?
              </p>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
};

export default Fall;
