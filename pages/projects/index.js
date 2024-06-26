import Header from "../../components/Header";
import Head from "next/head";
import Footer from "../../components/Footer";
import ProjectList from "./ProjectList";
import ChatImage from "/public/banner/chat.png";
import alchemy from "/public/banner/alchemy.gif";
import Banner from "../../components/Banner";
import styles from "./Project.module.scss";
import Screen from "./Screen";
import BottomScreen from "./BottomScreen";

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

export default function Project({ description, url }) {
  return (
    <>
      <Head>
        <title>Projects - Anjit Pariyar - React Developer</title>
      </Head>

      <Header description={description} url={url} />
      <Screen />
      <main>
        <ProjectList />
        <BottomScreen />
        <div className={styles.chat}>
          <Banner {...chat} />
        </div>
      </main>
      <Footer />
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
