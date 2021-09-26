import { useState } from "react";
import styles from "./Home.module.scss";
import Hb from "/public/projects/hb.png";
import Dg from "/public/projects/dg.png";
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
      link: "/project/hamrobazar",
      title: "Hamrobazar",
      image: Hb,
      bg: "#232323",
      internal: true,
    },
    {
      link: "https://digitalghumti.com/",
      title: "Digital Ghumti",
      image: Dg,
      bg: "#00a8e5",
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
              text="view now . view now . view now . view now . "
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
