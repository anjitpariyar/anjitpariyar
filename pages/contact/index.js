import Header from "../../components/Header";
import Head from "next/head";
import Footer from "../../components/Footer";

// importing parts
import Screen from "./Screen";
import Form from "./Form";
import Refer from "./Refer";

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact - Anjit Pariyar - Frontend Developer</title>
      </Head>

      <Header />
      <main>
        <Screen />
        <Form />
        <Refer />
      </main>
      <Footer />
      <style global jsx>{`
        body {
          background-color: #f2b366;
        }
      `}</style>
    </>
  );
}
