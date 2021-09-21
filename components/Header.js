import styles from "./header.module.scss";
import Link from "next/link";
import Logo from "../svg/Logo";

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <nav className={styles.nav + " " + styles.desktopOnly}>
          <li className={styles.navLink + " " + styles.brand}>
            <Link href="/">
              <a>
                <Logo />
              </a>
            </Link>
          </li>
          <li className={styles.navLink}>
            <Link href="/">
              <a>About</a>
            </Link>
          </li>
          <li className={styles.navLink}>
            <Link href="/">
              <a>Project</a>
            </Link>
          </li>
          <li className={styles.navLink}>
            <Link href="/">
              <a>Contact</a>
            </Link>
          </li>
          <li className={styles.navLink}>
            <a href="https://www.instagram.com/limbo_anj/" target="_blank">
              Insatgram
            </a>
          </li>
        </nav>
        <nav className={styles.nav + " " + styles.mobileOnly}>
          <li className={styles.navLink + " " + styles.brand}>
            <Link href="/">
              <a>
                <Logo />
              </a>
            </Link>
          </li>

          <li className={styles.navLink}>
            <a href="#!" target="_blank">
              =
            </a>
          </li>
        </nav>
      </div>
    </header>
  );
};

export default Header;
