import { useState, useEffect } from "react";
import styles from "./Home.module.scss";
import Title from "../../components/Title";
import ProjectCard from "../../components/ProjectCard";
import { motion } from "framer-motion";

import { supabase } from "utils/supabaseClient";

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

  async function Notes() {
    const { data: notes } = await supabase.from("projects").select("*");

    console.log(notes);
  }

  useEffect(() => {
    Notes();

    return () => {};
  }, []);

  const projectList = [
    {
      link: "https://hamrobazaar.com/",
      title: "Hamrobazar",
      slug: "hamrobazaar",
      thumbnail:
        "https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png",
      description:
        "Hamrobazar is a classified ads site in Nepal. It is a platform where people can buy and sell products and services. It is one of the most popular classified ads sites in Nepal. <br/> <br/> I have contributed to the development of the largest E-commerce site in the country, Hamrobazar, utilized by millions of users, showcasing expertise in designing and optimizing user experiences at scale. <br/> <br/> Easy Listing, Easy Viewing Call, chat, comment instantly. <br/><br/>Easy Listing, Easy Viewing Call, chat, comment instantly.",
      languages: "REACTJS REDUX REDUX-SAGA REALTIME DB",
      images: [
        {
          thumbnail:
            "https://lvvfmdfnsjekhhjkqeei.supabase.co/storage/v1/object/public/anjitpariyar/hbScreen.png",
          title: "Home Page",
        },
      ],
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
