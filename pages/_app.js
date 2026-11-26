import "../styles/globals.css";
import "../styles/normalize.css";
// import "locomotive-scroll/dist/locomotive-scroll.css";
import Script from "next/script";
import Preloader from "../components/Preloader";
import AskAiPopup from "../components/AskAiPopup";
import { useState, useEffect } from "react";

const GA_ID = "G-KHM5XYZNKX";

function MyApp({ Component, pageProps }) {
  // "ssr":     server HTML and hydration render the full page (hidden), so
  //            search engines and AI crawlers that don't run JS get the content.
  // "loading": preloader only, as before.
  // "ready":   page mounts fresh, so the intro animations and the logo's
  //            layout animation into the header play as they always did.
  const [phase, setPhase] = useState("ssr");

  useEffect(() => {
    (function (h, o, t, j, a, r) {
      h.hj =
        h.hj ||
        function () {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
      h._hjSettings = { hjid: 1530972, hjsv: 6 };
      a = o.getElementsByTagName("head")[0];
      r = o.createElement("script");
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, "https://static.hotjar.com/c/hotjar-", ".js?sv=");

    setPhase("loading");
    const timer = setTimeout(() => setPhase("ready"), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "${GA_ID}");`}
      </Script>

      {phase === "ssr" && (
        <div style={{ visibility: "hidden" }}>
          <Component {...pageProps} />
        </div>
      )}
      {phase === "ready" && <Component {...pageProps} />}
      {phase === "ready" && <AskAiPopup />}
      <Preloader />
    </>
  );
}

export default MyApp;
