import Header from "../../components/Header";
import Head from "next/head";
import Footer from "../../components/Footer";

// importing parts
import Screen from "./Screen";
import Reference from "./Reference";

export default function Refer() {
  return (
    <>
      <Head>
        <title>Reference - Anjit Pariyar - Frontend Developer</title>
        <meta name="theme-color" content="#1d8ff2" />
        <meta name="msapplication-TileColor" content="#1d8ff2" />
      </Head>

      <Header />
      <main>
        <Screen />
        <Reference />
      </main>
      <Footer />
      <style global jsx>{`
        body {
          background-color: #1d8ff2;
        }
      `}</style>
    </>
  );
}
