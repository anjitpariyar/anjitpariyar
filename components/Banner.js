import Image from "next/image";
import styles from "./banner.module.scss";
import { useEffect, useRef } from "react";
import { gsap } from "gsap/dist/gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
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
    threshold: 0.5,
  });

  const reveal = useRef(null);
  const imageMove = useRef(null);

  useEffect(() => {
    if (inView && reveal?.current) {
      let t1 = gsap.timeline();
      t1.to(reveal?.current, 2, {
        y: reveal?.current.clientHeight,
        ease: "power4.out",
      });
    }
  }, [inView]);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(
      imageMove?.current.firstChild,
      { y: -200, scale: 1 },
      {
        scrollTrigger: {
          trigger: imageMove?.current,
          start: "top center",
          end: "bottom top",
          scrub: true,
        },
        y: 200,
        scale: 1.3,
        ease: "none",
      }
    );
  }, []);
  return (
    <section className={styles.banner} ref={ref}>
      <a
        className={styles.imageWrapper}
        href={link}
        target="_blank"
        ref={imageMove}
        rel="noreferrer"
      >
        {image && (
          <Image
            src={image}
            alt="Picture of the author"
            placeholder="blur"
            layout="fill"
            objectFit="cover"
          />
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
