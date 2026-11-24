import Head from "next/head";
import { useRouter } from "next/router";

export const SITE_URL = "https://www.anjitpariyar.com.np";
export const DEFAULT_TITLE = "Anjit Pariyar - React Developer";
export const DEFAULT_DESCRIPTION =
  "Anjit Pariyar is a React developer from Nepal with 5 years of experience. He has built 20+ web apps and loves solving problems and creating websites that users love.";
export const DEFAULT_IMAGE =
  "https://res.cloudinary.com/dem2xvk2e/image/upload/v1632627087/img1_m5v3bc.jpg";

/**
 * All per-page SEO tags live here, rendered once per page.
 * Every tag has a `key` so next/head keeps a single copy of it.
 */
const Seo = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  path,
  themeColor = "#f2ede4",
  noindex = false,
}) => {
  const router = useRouter();
  const cleanPath = (path ?? router.asPath).split(/[?#]/)[0];
  const url = SITE_URL + cleanPath;

  return (
    <Head>
      <title key="title">{title}</title>
      <meta key="description" name="description" content={description} />
      <meta key="author" name="author" content="Anjit Pariyar" />
      <meta
        key="robots"
        name="robots"
        content={noindex ? "noindex, follow" : "index, follow"}
      />
      {!noindex && <link key="canonical" rel="canonical" href={url} />}

      <meta key="theme-color" name="theme-color" content={themeColor} />
      <meta
        key="ms-tile-color"
        name="msapplication-TileColor"
        content={themeColor}
      />

      <meta key="og:type" property="og:type" content="website" />
      <meta
        key="og:site_name"
        property="og:site_name"
        content="Anjit Pariyar - React Developer"
      />
      <meta key="og:title" property="og:title" content={title} />
      <meta
        key="og:description"
        property="og:description"
        content={description}
      />
      <meta key="og:url" property="og:url" content={url} />
      <meta key="og:image" property="og:image" content={image} />

      <meta
        key="twitter:card"
        name="twitter:card"
        content="summary_large_image"
      />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <meta
        key="twitter:description"
        name="twitter:description"
        content={description}
      />
      <meta key="twitter:image" name="twitter:image" content={image} />
    </Head>
  );
};

export default Seo;
