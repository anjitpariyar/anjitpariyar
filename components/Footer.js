import styles from "./footer.module.scss";
import styles2 from "./header.module.scss";
import Link from "next/link";

import Header from "./Header";

const Footer = () => {
  return (
    <footer className={styles.footer + " " + styles.bgDark}>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.titleLg}>
          <Link href="/">Hire me</Link>
        </h1>
      </div>
      <div className={styles2.header}>
        <div className={styles2.container}>
          <nav className={styles2.nav}>
            <li className={styles2.navLink}>
              <Link href="/">
                <a>All Reference</a>
              </Link>
            </li>

            <li className={styles2.navLink}>
              <a>Anjit Pariyar &copy;{new Date().getFullYear()}</a>
            </li>
            <li className={styles2.navLink}>
              <a href="https://github.com/anjitpariyar" target="_blank">
                Github
              </a>
            </li>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
