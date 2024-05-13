import Image from "next/image";
import styles from "./banner.module.scss";
import { useEffect, useRef } from "react";
import { gsap } from "gsap/dist/gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
// import { useInView } from "react-intersection-observer";

gsap.registerPlugin(ScrollTrigger);

const Banner = ({
  link,
  image,
  title,
  white,
  description,
  bgColor,
  bgImage,
}) => {
  // const { ref, inView } = useInView({
  //   threshold: 0.5,
  // });

  const reveal = useRef(null);
  const imageMove = useRef(null);

  // useEffect(() => {
  // if (inView && reveal?.current) {
  // let t1 = gsap.timeline();
  // t1.to(reveal?.current, 2, {
  //   y: reveal?.current.clientHeight,
  //   ease: "power4.out",
  // });
  // }
  // }, [inView]);
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    gsap.fromTo(
      imageMove?.current.firstChild,
      { y: isMobile ? -300 : -200, scale: 1 },
      {
        scrollTrigger: {
          trigger: imageMove?.current,
          start: "top center",
          end: "bottom top",
          scrub: true,
        },
        y: isMobile ? 0 : 200,
        scale: isMobile ? 1.2 : 1.4,
        ease: "none",
      }
    );
  }, []);
  return (
    // ref={ref}
    <section className={styles.banner}>
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
            // backgroundImage: "url(" + bgImage?.src + ")",
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
