import Header from "../../components/Header";
import Head from "next/head";
import Footer from "../../components/Footer";
import ProjectMain from "components/projects";

export default function Project({ description, url }) {
  return (
    <>
      <Head>
        <title>Projects - Anjit Pariyar - React Developer</title>
      </Head>

      <Header description={description} url={url} />
      <ProjectMain />
      <Footer />
    </>
  );
}

export async function getStaticProps() {
  // Fetch data from external API

  const data = {
    description:
      "Anjit pariyar has worked on 20+ projects in these three years. Most of them are built using React JS . some of them are hamrobazar, gyre,  digital ghumti and mentee. And more adding on the list...",
    url: "https://www.anjitpariyar.com.np/project",
  };

  // Pass data to the page via props
  return { props: data };
}
