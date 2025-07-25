module.exports = {
  siteUrl:
    process.env?.NEXT_PUBLIC_SITE_URL || "https://www.anjitpariyar.com.np",
  generateRobotsTxt: true, // (optional)
  exclude: ["/404"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        disallow: ["/404"],
      },
      { userAgent: "*", allow: "/" },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
      `${process.env.NEXT_PUBLIC_SITE_URL}/server-sitemap.xml`,
    ],
  },
  // ...other options
};
