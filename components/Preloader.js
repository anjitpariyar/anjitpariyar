import styles from "./preloader.module.scss";
import { useEffect, useRef } from "react";
import Logo from "../svg/Logo";
import { motion } from "framer-motion";

const Preloader = () => {
  const pre = useRef(null);

  useEffect(() => {
    pre.current.style.transition = "opacity 0.6s ease";
    const timer = setTimeout(() => {
      pre.current.style.opacity = "0";
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.preloader + " preloader"} ref={pre}>
      <motion.a layoutId="brandId_001">
        <Logo className={styles.brand} />
      </motion.a>
    </div>
  );
};

export default Preloader;
