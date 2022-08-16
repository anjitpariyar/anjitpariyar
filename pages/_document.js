import Document, { Html, Main, Head, NextScript } from "next/document";

/**
 * This will help to render the styled component css in Server side
 */

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta
            name="description"
            content={
              "Anjit Pariyar is a 2 Years Experience Frontend Developer. And  I enjoy Creating a Web."
            }
          />
          <meta
            name="keywords"
            content="Anjit, Anjit pariyar, Frontend developer, frontend developer nepal, web designer, react developer, react developer nepal, it nepal, nepal, anjit pariyar IT, frontend freelance, frontend freelance nepal"
          />
          <meta name="author" content="Anjit pariyar" />
          <meta name="copyright" content="Anjit pariyar" />
          <meta name="robots" content="follow" />
          <meta httpEquiv="cache-control" content="no-cache" />
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
          <meta name="theme-color" content="#f2ede4" />
          <meta name="msapplication-TileColor" content="#f2ede4" />
          <meta
            name="description"
            content={
              "Anjit Pariyar is a 2 Years Experienced Frontend Developer. And  I enjoy Creating a Web."
            }
          />
          <meta
            property="og:title"
            content="Anjit Pariyar - Frontend Developer"
          />
          <meta
            property="og:description"
            content={
              "Anjit Pariyar is a 2 Years Experienced Frontend Developer. And  I enjoy Creating a Web."
            }
          />
          <meta
            property="og:image"
            content="https://res.cloudinary.com/dem2xvk2e/image/upload/v1632627087/img1_m5v3bc.jpg"
          />
          <meta property="og:type" content="website" />
          <meta
            property="og:url"
            content="https://www.anjitpariyar.com.np/"
          ></meta>
          <meta
            property="og:site_name"
            content="Anjit Pariyar - Frontend Developer"
          />
          <meta property="twitter:card" content="summary" />
          <meta
            property="twitter:title"
            content="Anjit Pariyar - Frontend Developer"
          />
          <meta
            property="twitter:description"
            content={
              "Anjit Pariyar is a 2 Years Experienced Frontend Developer. And  I enjoy Creating a Web."
            }
          />
        </Head>
        <body>
          <Main />
          <NextScript>
            <script
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-KHM5XYZNKX"
            ></script>
          </NextScript>
        </body>
      </Html>
    );
  }
}
