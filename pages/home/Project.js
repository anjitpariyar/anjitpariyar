import { useState } from "react";
import styles from "./Home.module.scss";
import Fb from "/public/projects/fb.png";
import Hb from "/public/projects/hb.png";
import Title from "../../components/Title";
import ProjectCard from "../../components/ProjectCard";
import { motion } from "framer-motion";

const Project = () => {
  const [mouse, setMouse] = useState({ x: "", y: "" });
  const [hover, setHover] = useState(false);
  const moveMe = (e) => {
    setMouse((prevState) => ({
      ...prevState,
      x: e.clientX - 150,
    }));
    setMouse((prevState) => ({
      ...prevState,
      y: e.clientY - 150,
    }));
  };
  const hoverState = (state) => {
    setHover(state);
  };
  const projectList = [
    {
      link: "https://hamrobazaar.com/",
      title: "Hamrobazar",
      image: Hb,
      bg: "#333333",
    },
    {
      link: "https://www.nodazidesign.com/",
      title: "NODAZI",
      image:
        "https://res.cloudinary.com/dem2xvk2e/image/upload/v1660668585/anjit/Screenshot_2022-08-16_at_22-23-54_NODAZI_STUDIO_o7ujpy.png",
      bg: "#fe4545",
      // internal: true,
    },
  ];

  return (
    <section className={styles.project} onMouseMove={(e) => moveMe(e)}>
      <div
        className={
          styles.container +
          " " +
          styles.commonPadding +
          " " +
          styles.paddingBottom
        }
      >
        <div className={styles.grid}>
          {projectList.map((elem, index) => {
            return (
              <ProjectCard key={index} {...elem} hoverState={hoverState} />
            );
          })}

          <motion.div
            className={styles.link + " " + (hover ? styles.active : " ")}
            style={{
              transform: "translate(" + mouse.x + "px," + mouse.y + "px)",
            }}
          >
            <Title
              text="visit now . visit now . visit now . visit now . "
              arc={360}
              radius={150}
              className={styles.title}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Project;
