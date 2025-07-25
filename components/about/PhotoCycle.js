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
  const [currentImg, setCurrentImg] = useState(0);
  const title = [
    "wish I could give you a dog loyalty",
    "Busy schedules Huh?",
    "I can do this all day",
    "I don't smoke. Coding is enough ",
    "why is this crow staring at me? and hey this is my friend Rook.",
    "my cat doesn't like her",
  ];

  useEffect(() => {
    if (currentImg < 5) {
      setTimeout(() => {
        setCurrentImg((state) => state + 1);
      }, 4000);
    } else {
      setTimeout(() => {
        setCurrentImg(0);
      }, 4000);
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
        {/* {currentImg &&
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
          }[currentImg]} */}

        {[...Array(6)].map((_x, index) => {
          return (
            <PhotoCard
              currentImg={
                {
                  0: image1,
                  1: image2,
                  2: image3,
                  3: image4,
                  4: image5,
                  5: image6,
                }[index]
              }
              title={title[index]}
              key={index}
              active={currentImg === index}
            />
          );
        })}
      </div>
    </section>
  );
};

export default PhotoCycle;
