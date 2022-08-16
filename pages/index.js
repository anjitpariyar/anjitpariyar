import Head from "next/head";
import { useRef } from "react";
import styles from "./home/Home.module.scss";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Banner from "../components/Banner";
import Screen from "./home/Screen";
import Project from "./home/Project";
import Enjoy from "./home/Enjoy";
import Program from "./home/Program";
import FallImage from "/public/banner/fall.png";
import ChatImage from "/public/banner/chat.png";
import wildSea from "/public/banner/wild-sea.png";
import alchemy from "/public/banner/alchemy.gif";

export default function Home() {
  const containerRef = useRef(null);
  const butterfly = {
    link: "https://anjitpariyar.github.io/everythingFall/",
    image: FallImage,
    title: "EverythingFall",
    white: true,
    description: "Are you Ready for Html Canvas ?",
    bgColor: "var(--dark)",
    bgImage: wildSea,
  };
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
      <Head>
        <title>Anjit Pariyar - Frontend Developer</title>
        <meta name="theme-color" content="#f2ede4" />
        <meta name="msapplication-TileColor" content="#f2ede4" />
        <meta
          property="og:title"
          content="Anjit Pariyar - Frontend Developer"
        />
        <meta
          property="og:description"
          content="Anjit Pariyar is a 2 Years Experience Frontend Developer. And  I enjoy
Creating a Web."
        />
        <meta
          property="og:image"
          content="https://res.cloudinary.com/dem2xvk2e/image/upload/v1632627087/img1_m5v3bc.jpg"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://anjitpariyar.com.np/"></meta>
      </Head>
      <Header />
      <main className={styles.main} ref={containerRef}>
        <Screen />
        <Enjoy />
        <Project />
        <Banner {...butterfly} />
        <Program />
        <div className={styles.chat}>
          <Banner {...chat} />
        </div>
      </main>
      <Footer />
    </>
  );
}
