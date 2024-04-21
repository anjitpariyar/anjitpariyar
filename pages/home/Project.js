import { useState } from "react";
import styles from "./Home.module.scss";
import Title from "../../components/Title";
import ProjectCard from "../../components/ProjectCard";
import { motion } from "framer-motion";
import useSupabaseData from "../../hooks/common";

const Project = () => {
  const [mouse, setMouse] = useState({ x: "", y: "" });
  const [hover, setHover] = useState(false);

  const { data: projectList, isLoading, isError } = useSupabaseData("projects");

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
        {isLoading ? (
          <div>Loading</div>
        ) : isError ? (
          <div>Error</div>
        ) : (
          <div className={styles.grid}>
            {projectList.slice(0, 2).map((elem, index) => {
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
        )}
      </div>
    </section>
  );
};

export default Project;
