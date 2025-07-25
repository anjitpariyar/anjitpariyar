import Header from "../../components/Header";
import Head from "next/head";
import Footer from "../../components/Footer";
import ReferMain from "components/refer";

export default function Refer() {
  return (
    <>
      <Head>
        <title>Reference - Anjit Pariyar - React Developer</title>
        <meta name="theme-color" content="#1d8ff2" />
        <meta name="msapplication-TileColor" content="#1d8ff2" />
      </Head>

      <Header />
      <ReferMain />
      <Footer />
    </>
  );
}
