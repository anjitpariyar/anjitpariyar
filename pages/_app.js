import "../styles/globals.css";
import "../styles/normalize.css";
// import "locomotive-scroll/dist/locomotive-scroll.css";
import Preloader from "../components/Preloader";
import { useState, useEffect } from "react";

function MyApp({ Component, pageProps }) {
  // variable for preloader hide / show

  const [show, setShow] = useState(false);
  useEffect(() => {
    // window.dataLayer = window.dataLayer || [];
    // function gtag() {
    //   dataLayer.push(arguments);
    // }
    // gtag("js", new Date());
    // gtag("config", "G-KHM5XYZNKX");
    // (function (h, o, t, j, a, r) {
    //   h.hj =
    //     h.hj ||
    //     function () {
    //       (h.hj.q = h.hj.q || []).push(arguments);
    //     };
    //   h._hjSettings = { hjid: 1530972, hjsv: 6 };
    //   a = o.getElementsByTagName("head")[0];
    //   r = o.createElement("script");
    //   r.async = 1;
    //   r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
    //   a.appendChild(r);
    // })(window, document, "https://static.hotjar.com/c/hotjar-", ".js?sv=");
    setTimeout(() => {
      setShow(true);
    }, 3500);
  });

  return (
    <>
      {show && <Component {...pageProps} />}
      <Preloader />
    </>
  );
}

export default MyApp;
