import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://govcert.ai";
  const now = new Date();

  return [
    // Core pages
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },

    // SEO landing pages
    { url: `${baseUrl}/8a-certification-help`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/gsa-schedule-application`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/oasis-plus-application`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/wosb-certification`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/hubzone-certification`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },

    // Blog posts
    { url: `${baseUrl}/blog/8a-certification-cost`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog/8a-consultant-vs-diy-vs-govcert`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog/oasis-plus-application-checklist`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog/wosb-certification-guide`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog/8a-application-denied-reasons`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
