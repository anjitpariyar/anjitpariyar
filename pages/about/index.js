import Header from "../../components/Header";
import Head from "next/head";
import Footer from "../../components/Footer";
import PhotoGrid from "./PhotoGrid";
import PhotoCycle from "./PhotoCycle";

import Screen from "./Screen";
export default function About() {
  return (
    <>
      <Head>
        <title>About - Anjit Pariyar - React Developer</title>

        <meta name="theme-color" content="#f28241" />
        <meta name="msapplication-TileColor" content="#f28241" />
      </Head>

      <Header />
      <main>
        <Screen />
        <PhotoGrid />
        <PhotoCycle />
      </main>
      <Footer />
      {/* <style global jsx>{`
        body {
          background-color: #f28241;
        }
      `}</style> */}
    </>
  );
}
