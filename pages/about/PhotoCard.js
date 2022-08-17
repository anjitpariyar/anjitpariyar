import styles from "./About.module.scss";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

const PhotoCard = ({ currentImg, title, active }) => {
  const [load, setLoad] = useState(false);
  const variants = {
    hidden: { opacity: 0.4, y: -100 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div layoutid="123" style={{ display: !active && "none" }}>
      <motion.div
        className={styles.textCenter + " " + styles.textWrapper}
        initial="hidden"
        animate="visible"
        variants={variants}
      >
        <Image
          src={currentImg}
          alt="who's photo are they? anjit pariyar"
          layout="fill"
          objectFit="contain"
          priority
          placeholder="blur"
          blurDataURL={currentImg}
        />
        {/* {!load && <div className={styles.loader}></div>} */}
      </motion.div>

      <>
        <motion.p className={styles.textCenter} layoutid="1235">
          * {title} *
        </motion.p>
      </>
    </motion.div>
  );
};

export default PhotoCard;
