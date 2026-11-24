import Header from "../../components/Header";
import Seo from "components/Seo";
import Footer from "../../components/Footer";

import AboutMain from "components/about";
export default function About() {
  return (
    <>
      <Seo title="About - Anjit Pariyar - React Developer" themeColor="#f28241" />

      <Header />
      <AboutMain />
      <Footer />
      {/* <style global jsx>{`
        body {
          background-color: #f28241;
        }
      `}</style> */}
    </>
  );
}
