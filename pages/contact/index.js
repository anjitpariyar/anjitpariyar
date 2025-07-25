import Header from "../../components/Header";
import Head from "next/head";
import Footer from "../../components/Footer";
import ContactMain from "components/contact";

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact - Anjit Pariyar - React Developer</title>
        <meta name="theme-color" content="#f2b366" />
        <meta name="msapplication-TileColor" content="#f2b366" />
      </Head>

      <Header />
      <ContactMain />

      <Footer />
    </>
  );
}
