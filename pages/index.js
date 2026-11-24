import Seo from "../components/Seo";
import { useRef } from "react";
import styles from "../components/home/Home.module.scss";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Banner from "../components/Banner";
import Screen from "../components/home/Screen";
import Project from "../components/home/Project";
import Enjoy from "../components/home/Enjoy";
import Program from "../components/home/Program";
import ChatImage from "/public/banner/chat.png";
import alchemy from "/public/banner/alchemy.gif";

export default function Home() {
  const containerRef = useRef(null);
  const chat = {
    link: "https://chat-25704.web.app/",
    image: ChatImage,
    title:
      "chat anonymously, <br/>  None will know who you are but don't kill anyone.",
    white: true,
    description: "Chat Now",
    bgColor: "var(--primary--color)",
    bgImage: alchemy,
  };

  return (
    <>
      <Seo />
      <Header />
      <main className={styles.main} ref={containerRef}>
        <Screen />
        <Enjoy />
        <Project />
        {/* <Banner {...butterfly} /> */}

        <div className={styles.chat}>
          <Banner {...chat} />
        </div>
        <Program />
      </main>
      <Footer />
    </>
  );
}
