import styles from "./Home.module.scss";
import * as animationData from "../../json/robot.json";
import Lottie from "react-lottie";

const Enjoy = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <section className={styles.enjoy}>
      <div className={styles.container}>
        <div className={styles.lottieWrapper + " " + styles.commonFlex}>
          <aside className={styles.mlAuto}>
            <h1 className={styles.title + " " + styles.textCenter}>
              <span>
                {"{"} IF {"}"}
              </span>{" "}
              <br />I enjoy <br />
              <small>Creating a Web. </small>
            </h1>
          </aside>
          <aside className={styles.monitor}>
            <div className={styles.lottieWrapper}>
              <Lottie options={defaultOptions} height={600} width={400} />
            </div>
          </aside>
          <aside className={styles.mrAuto}>
            <h1 className={styles.title + " " + styles.textCenter}>
              <span>
                {"{"} true {"}"}{" "}
              </span>
              <br />
              You will enjoy <br />
              <small>Using it. </small>
            </h1>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Enjoy;
