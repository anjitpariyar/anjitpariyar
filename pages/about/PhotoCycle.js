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

  let tempImg1 = image1;
  let tempImg2 = image2;
  let tempImg3 = image3;
  let tempImg4 = image4;
  let tempImg5 = image5;
  let tempImg6 = image6;

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

    switch (currentImg) {
      case 1:
        setTitle("wish I could give a dog loyalty");
        break;
      case 2:
        setTitle("Anyone else love coffee ?");
        break;
      case 3:
        setTitle("I can do this all day");
        break;
      case 4:
        setTitle("I don't smoke. Coding is enough ");
        break;

      case 5:
        setTitle(
          "why is this crow staring at me? and hey this is my friend Rook."
        );
        break;
      case 6:
        setTitle("my cat doesn't like her");
        break;
      default:
        setTitle("loading");
      // code block
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
        {currentImg && (
          <PhotoCard currentImg={eval("tempImg" + currentImg)} title={title} />
        )}
      </div>
    </section>
  );
};

export default PhotoCycle;
