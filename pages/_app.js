import "../styles/globals.css";
import "../styles/normalize.css";
// import "locomotive-scroll/dist/locomotive-scroll.css";
import Preloader from "../components/Preloader";
import { useState, useEffect } from "react";

function MyApp({ Component, pageProps }) {
  // variable for preloader hide / show

  const [show, setShow] = useState(false);
  useEffect(() => {
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
