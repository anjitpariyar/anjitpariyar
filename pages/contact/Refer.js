import styles from "./Contact.module.scss";

const Refer = () => {
  return (
    <section className={styles.refer}>
      <div className={styles.commonPadding + " " + styles.paddingBottom}>
        <ul>
          <li className={styles.titleSm}>
            <div className={styles.container}>
              <span>City</span> <span>Kathmandu, Nepal</span>
            </div>
          </li>
          <li className={styles.titleSm}>
            <a href="tel:+977 9825131071" className={styles.container}>
              <span>Ph no</span>
              <span>+977 98-251-31-071</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="mailto:anjitpariyar@gmail.com"
            >
              <span>Gmail</span>
              <span>anjitpariyar@gmail.com</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://www.instagram.com/limbo_anj/"
              target="_blank"
            >
              <span>instagram</span>
              <span>@limbo_anj</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://github.com/anjitpariyar"
            >
              <span>github</span>
              <span>anjit pariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://dribbble.com/limbo_anj"
            >
              <span>Dribble</span>
              <span>Anjit pariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://www.linkedin.com/in/anjit-pariyar-b46131178/"
            >
              <span>LinkedIn</span>
              <span>anjit pariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a
              className={styles.container}
              href="https://anjitpariyar.medium.com/"
            >
              <span>Medium</span>
              <span>@anjitpariyar</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Refer;
