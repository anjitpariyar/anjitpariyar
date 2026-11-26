const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.anjitpariyar.com.np";

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  // /server-sitemap.xml is a sitemap, not a page; it's listed in robots.txt instead
  exclude: ["/404", "/server-sitemap.xml", "/chat"],
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/", disallow: ["/404"] }],
    additionalSitemaps: [`${siteUrl}/server-sitemap.xml`],
  },
};
