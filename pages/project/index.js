import Header from "../../components/Header";
import Head from "next/head";
import Footer from "../../components/Footer";
import ProjectList from "./ProjectList";
import FallImage from "/public/banner/fall.png";
import ChatImage from "/public/banner/chat.png";
import wildSea from "/public/banner/wild-sea.png";
import alchemy from "/public/banner/alchemy.gif";
import Banner from "../../components/Banner";
import styles from "./Project.module.scss";
import Screen from "./Screen";

export default function Project({ description, url }) {
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
      "chat anonymously, <br/>  None will know who you are but  don't kill anyone.",
    white: true,
    description: "Chat Now",
    bgColor: "var(--primary--color)",
    bgImage: alchemy,
  };
  return (
    <>
      <Head>
        <title>Projects - Anjit Pariyar - React Developer</title>
        <meta name="theme-color" content="#f2913d" />
        <meta name="msapplication-TileColor" content="#f2913d" />
      </Head>

      <Header description={description} url={url} />
      <Screen />
      <main>
        <ProjectList />
        <Banner {...butterfly} />
        <div className={styles.chat}>
          <Banner {...chat} />
        </div>
      </main>
      <Footer />
      <style global jsx>{`
        body {
          background-color: #f2913d;
        }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  // Fetch data from external API

  const data = {
    description:
      "Anjit pariyar has worked on 20+ projects in these three years. Most of them are built using React JS . some of them are hamrobazar, gyre,  digital ghumti and mentee. And more adding on the list...",
    url: "https://www.anjitpariyar.com.np/project",
  };

  // Pass data to the page via props
  return { props: data };
}
