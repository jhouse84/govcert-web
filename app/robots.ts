import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/dashboard/", "/settings/", "/clients/", "/certifications/"],
    },
    sitemap: "https://govcert.ai/sitemap.xml",
  };
}
