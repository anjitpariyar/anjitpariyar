import Image from "next/image";
import styles from "./banner.module.scss";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useInView } from "react-intersection-observer";

const Banner = ({
  link,
  image,
  title,
  white,
  description,
  bgColor,
  bgImage,
}) => {
  const { ref, inView } = useInView({
    threshold: 0.7,
  });
  console.log(bgImage);

  const reveal = useRef(null);
  useEffect(() => {
    if (inView && reveal?.current) {
      let t1 = gsap.timeline();
      t1.staggerTo(
        reveal?.current,
        1,
        { x: reveal?.current.clientWidth, ease: "power4.out" },
        0.2
      );
    }
  }, [inView]);
  return (
    <section className={styles.banner} ref={ref}>
      <a className={styles.imageWrapper} href={link} target="_blank">
        {image && (
          <Image src={image} alt="Picture of the author" placeholder="blur" />
        )}
        <div
          className={styles.reveal}
          style={{
            backgroundColor: bgColor,
            backgroundImage: "url(" + bgImage?.src + ")",
          }}
          ref={reveal}
        ></div>

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
