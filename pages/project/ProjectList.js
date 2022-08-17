import { useState } from "react";
import styles from "./Project.module.scss";
// import Hb from "/public/projects/hb.png";
import Dg from "/public/projects/dg.png";
import Fb from "/public/projects/fb.png";
import Hb from "/public/projects/hb.png";
import Bhomi from "/public/projects/bhumi.png";
import Gyre from "/public/projects/gyre.png";
import NDZ from "/public/projects/nodazisquare.png";
import Sunbi from "/public/projects/thesunbi.png";
import Vita from "/public/projects/vita500.png";

import Mentee from "/public/projects/mentee.png";

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
      link: "https://hamrobazaar.com/",
      title: "Hamrobazar",
      image: Hb,
      bg: "#333333",
    },

    {
      link: "https://withgyre.com/",
      title: "Gyre",
      image: Gyre,
      bg: "#ff8021",
    },
    {
      link: "https://www.nodazidesign.com/",
      title: "Nodazi",
      image: NDZ,
      bg: " #54875f",
    },
    {
      link: "https://digitalghumti.com/",
      title: "Digital Ghumti",
      image: Dg,
      bg: "#00a8e5",
    },
    {
      link: "https://fanbucket.com/login",
      title: "Fanbucket",
      image: Fb,
      bg: "#fe4545",
    },
    {
      link: "https://www.vita500.com/",
      title: "Vita 500",
      image: Vita,
      bg: "#ff6211",
    },
    {
      link: "https://www.thesunbi.com/",
      title: "SunBi Holdings",
      image: Sunbi,
      bg: "#d12828",
    },
    {
      link: "https://bhoomi.com.np/",
      title: "Bhoomi",
      image: Bhomi,
      bg: "#4cb848",
    },
    {
      link: "https://gomentee.com/",
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
              <ProjectCard
                key={index}
                {...elem}
                hoverState={hoverState}
                index={index + 1}
              />
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
