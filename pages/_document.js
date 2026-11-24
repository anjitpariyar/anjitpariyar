import Document, { Html, Main, Head, NextScript } from "next/document";

/**
 * Site-wide tags only. Per-page title, description, canonical and social
 * tags are rendered by components/Seo.js.
 */

const SITE_URL = "https://www.anjitpariyar.com.np";

// Structured data: tells Google and AI assistants who this site is about.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Anjit Pariyar",
      url: SITE_URL,
      image:
        "https://res.cloudinary.com/dem2xvk2e/image/upload/v1632627087/img1_m5v3bc.jpg",
      jobTitle: "React Developer",
      description:
        "React developer from Nepal with 5 years of experience building web apps with React and Next.js. He has built 20+ projects.",
      address: { "@type": "PostalAddress", addressCountry: "NP" },
      knowsAbout: [
        "React",
        "Next.js",
        "JavaScript",
        "Frontend development",
        "Web design",
      ],
      sameAs: [
        "https://github.com/anjitpariyar",
        "https://www.linkedin.com/in/anjit-pariyar-b46131178/",
        "https://dribbble.com/limbo_anj",
        "https://www.instagram.com/limbo_anj/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Anjit Pariyar - React Developer",
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link
            rel="apple-touch-icon"
            sizes="57x57"
            href="/apple-icon-57x57.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="60x60"
            href="/apple-icon-60x60.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="72x72"
            href="/apple-icon-72x72.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="76x76"
            href="/apple-icon-76x76.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="114x114"
            href="/apple-icon-114x114.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="120x120"
            href="/apple-icon-120x120.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="144x144"
            href="/apple-icon-144x144.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="152x152"
            href="/apple-icon-152x152.png"
          />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-icon-180x180.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="192x192"
            href="/android-icon-192x192.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="96x96"
            href="/favicon-96x96.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link rel="manifest" href="/manifest.json" />
          <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
          {/* google console */}
          <meta
            name="google-site-verification"
            content="g7ZyMI0si6r_e5yfChQy8lJ_h4PvMtwt3OV-zhMuqzQ"
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
