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

export default function ProjectMain() {
  return (
    <>
      <Screen />
      <main>
        <ProjectList />
        <BottomScreen />
        <div className={styles.chat}>
          <Banner {...chat} />
        </div>
      </main>
    </>
  );
}
