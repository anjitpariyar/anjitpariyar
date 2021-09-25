import Header from "../../components/Header";
import Head from "next/head";
import Footer from "../../components/Footer";

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact - Anjit Pariyar - Frontend Developer</title>
      </Head>

      <Header />
      <main>Contact</main>
      <Footer />
      {/* <style global jsx>{`
        body {
          background-color: #f2913d;
        }
      `}</style> */}
    </>
  );
}
