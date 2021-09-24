import { useState } from "react";
import styles from "./Project.module.scss";
import Hb from "/public/projects/hb.png";
import Dg from "/public/projects/dg.png";
import Fb from "/public/projects/fb.png";
import Mentee from "/public/projects/Mentee.png";

import Title from "../../components/Title";
import ProjectCard from "../../components/ProjectCard";
import { motion } from "framer-motion";

const ProjectList = () => {
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
      link: "/",
      title: "Hamrobazar",
      image: Hb,
      bg: "#232323",
    },
    {
      link: "/",
      title: "Digital Ghumti",
      image: Dg,
      bg: "#00a8e5",
    },
    {
      link: "/",
      title: "Fanbucket",
      image: Fb,
      bg: "#fe4545",
    },
    {
      link: "/",
      title: "Mentee",
      image: Mentee,
      bg: "#f26522",
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
              text="visite now . visite now . visite now . visite now . "
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

export default ProjectList;
