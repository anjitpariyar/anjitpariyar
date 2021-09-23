import styles from "./preloader.module.scss";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Logo from "../svg/Logo";
import { motion } from "framer-motion";

const Preloader = () => {
  const pre = useRef(null);

  useEffect(() => {
    let t1 = gsap.timeline();
    t1.to(pre?.current, {
      y: "-100vh",
      duration: 1.4,
      ease: "ease",
      delay: 4,
    });
  }, []);

  return (
    <div className={styles.preloader} ref={pre}>
      <motion.a layoutId="brandId_001">
        <Logo className={styles.brand} />
      </motion.a>
    </div>
  );
};

export default Preloader;
