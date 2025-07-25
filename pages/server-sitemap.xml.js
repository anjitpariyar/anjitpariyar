// pages/server-sitemap.xml.js
import { supabase } from "utils/supabaseClient";

export async function getServerSideProps({ res }) {
  // Fetch all project slugs from Supabase
  const { data: projects } = await supabase
    .from("projects")
    .select("slug")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  // Build XML for each project
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.anjitpariyar.com.np";
  const urls = projects
    .map(
      (project) => `
  <url>
    <loc>${baseUrl}/projects/${project.slug}</loc>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("");

  // Sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  // getServerSideProps will handle the response
  return null;
}
