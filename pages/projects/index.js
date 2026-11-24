import Header from "../../components/Header";
import Seo from "components/Seo";
import Footer from "../../components/Footer";
import ProjectMain from "components/projects";

export default function Project({ description }) {
  return (
    <>
      <Seo
        title="Projects - Anjit Pariyar - React Developer"
        description={description}
      />
      <Header />
      <ProjectMain />
      <Footer />
    </>
  );
}

export async function getStaticProps() {
  // Fetch data from external API

  const data = {
    description:
      "Anjit Pariyar has built 20+ projects over 5 years, mostly with React and Next.js, including Hamrobazaar, Gyre, Digital Ghumti and Mentee.",
  };

  // Pass data to the page via props
  return { props: data };
}
