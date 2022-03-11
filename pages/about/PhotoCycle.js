import styles from "./About.module.scss";
import Image from "next/image";
import image1 from "/public/about/PNG/img1.png";
import image2 from "/public/about/PNG/img2.png";
import image3 from "/public/about/PNG/img3.png";
import image4 from "/public/about/PNG/img4.png";
import image5 from "/public/about/PNG/img5.png";
import image6 from "/public/about/PNG/img6.png";

import { useEffect, useState } from "react";
import PhotoCard from "./PhotoCard";

const PhotoCycle = () => {
  const [currentImg, setCurrentImg] = useState(1);
  const [title, setTitle] = useState("loading");

  useEffect(() => {
    if (currentImg < 6) {
      setTimeout(() => {
        setCurrentImg((state) => state + 1);
      }, 3000);
    } else {
      setTimeout(() => {
        setCurrentImg(1);
      }, 3000);
    }

    return () => {
      clearTimeout();
    };
  }, [currentImg]);

  return (
    <section className={styles.photoCycle}>
      <div
        className={
          styles.container +
          " " +
          styles.commonPadding +
          " " +
          styles.paddingBottom
        }
      >
        {currentImg &&
          // <PhotoCard currentImg={eval("tempImg" + currentImg)} title={title} />
          {
            1: (
              <PhotoCard
                currentImg={image1}
                title={"wish I could give you a dog loyalty"}
              />
            ),
            2: (
              <PhotoCard
                currentImg={image2}
                title={"Anyone else love coffee ?"}
              />
            ),
            3: (
              <PhotoCard currentImg={image3} title={"I can do this all day"} />
            ),
            4: (
              <PhotoCard
                currentImg={image4}
                title={"I don't smoke. Coding is enough "}
              />
            ),
            5: (
              <PhotoCard
                currentImg={image5}
                title={
                  "why is this crow staring at me? and hey this is my friend Rook."
                }
              />
            ),
            6: (
              <PhotoCard
                currentImg={image6}
                title={"my cat doesn't like her"}
              />
            ),
          }[currentImg]}
      </div>
    </section>
  );
};

export default PhotoCycle;
