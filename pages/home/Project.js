import styles from "./Home.module.scss";
import Image from "next/image";
import Hb from "/public/projects/hb.png";
import Dg from "/public/projects/dg.png";
import Link from "next/link";
import Title from "../../components/Title";

const Project = () => {
  return (
    <section className={styles.project}>
      <div className={styles.container + " " + styles.commonPadding}>
        <div className={styles.grid}>
          <article>
            <Link href="/">
              <a>
                <h2 className={styles.title}>Hamrobazar</h2>
                <div className={styles.imageWrapper}>
                  <Image src={Hb} alt="Picture of the author" />
                </div>
              </a>
            </Link>
          </article>
          <article>
            <Link href="/">
              <a>
                <h2 className={styles.title}>Digital Ghumti</h2>

                <div className={styles.imageWrapper}>
                  <Image src={Dg} alt="Picture of the author" />
                </div>
              </a>
            </Link>
          </article>
          <div className={styles.link}>
            <Title
              text="→ View → View → View → View → View → View "
              arc={360}
              radius={150}
              className={styles.title}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Project;
