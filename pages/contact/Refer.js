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
            <a className={styles.container} href="#" target="_blank">
              <span>instagram</span>
              <span>@limbo_anj</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a className={styles.container} href="#!">
              <span>github</span>
              <span>anjitpariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a className={styles.container} href="#!">
              <span>Dribble</span>
              <span>anjitpariyar</span>
            </a>
          </li>
          <li className={styles.titleSm}>
            <a className={styles.container} href="#!">
              <span>LinkedIn</span>
              <span>anjitpariyar</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Refer;
