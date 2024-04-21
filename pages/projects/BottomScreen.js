import GitHubCalendar from "react-github-calendar";

import styles from "./Project.module.scss";

const BottomScreen = () => {
  return (
    <section className={styles.bottomScreen}>
      <div className={styles.container + " " + styles.commonPadding}>
        <h1 className={styles.titleLg + " " + styles.textCenter}>
          <span className={styles.thin}>& </span>
          <br />
          <span className={styles.thin}>Many More </span>
        </h1>
      </div>
      <a
        href="https://github.com/anjitpariyar"
        className={styles.link}
        target="_blank"
        rel="noreferrer"
      >
        <GitHubCalendar username="anjitpariyar" />
      </a>
    </section>
  );
};

export default BottomScreen;
