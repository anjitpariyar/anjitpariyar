import Header from "../../components/Header";
import Seo from "components/Seo";
import Footer from "../../components/Footer";
import ContactMain from "components/contact";

export default function Contact() {
  return (
    <>
      <Seo title="Contact - Anjit Pariyar - React Developer" themeColor="#f2b366" />

      <Header />
      <ContactMain />

      <Footer />
    </>
  );
}
