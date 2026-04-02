import { Metadata } from "next";
import SEOPageLayout from "@/components/SEOPageLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GovCert Blog — Federal Certification Insights & Guides",
  description: "Expert guides on 8(a) certification, WOSB, OASIS+, and federal contracting. Learn how to navigate SBA applications, avoid common mistakes, and win government contracts.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "GovCert Blog — Federal Certification Insights",
    description: "Expert guides on 8(a) certification, WOSB, OASIS+, and federal contracting.",
    url: "https://govcert.ai/blog",
  },
};

const posts = [
  {
    slug: "8a-certification-cost",
    title: "How Much Does 8(a) Certification Cost in 2026?",
    date: "March 28, 2026",
    description:
      "A transparent breakdown of every cost involved in getting 8(a) certified — from DIY and consultants to GovCert. Know exactly what you will spend before you start.",
  },
  {
    slug: "8a-consultant-vs-diy-vs-govcert",
    title: "8(a) Certification: Consultant vs. DIY vs. GovCert — Which Is Right for You?",
    date: "March 25, 2026",
    description:
      "Side-by-side comparison of the three main paths to 8(a) certification. Costs, timelines, success rates, and who each approach is best for.",
  },
  {
    slug: "8a-application-denied-reasons",
    title: "5 Reasons Your 8(a) Application Got Denied (And How to Fix Them)",
    date: "March 20, 2026",
    description:
      "The most common reasons the SBA denies 8(a) applications — and exactly how to fix each one before reapplying.",
  },
  {
    slug: "oasis-plus-application-checklist",
    title: "The Complete OASIS+ Application Checklist for 2026",
    date: "March 15, 2026",
    description:
      "Everything you need to apply for OASIS+ in 2026 — domain selection, qualifying projects, required documents, and the Symphony portal process.",
  },
  {
    slug: "wosb-certification-guide",
    title: "WOSB Certification: Step-by-Step Guide for 2026",
    date: "March 10, 2026",
    description:
      "A complete walkthrough of the Women-Owned Small Business certification process, from eligibility to SAM.gov submission.",
  },
];

export default function BlogIndex() {
  return (
    <SEOPageLayout
      badge="Blog"
      title="GovCert Blog"
      subtitle="Practical guides, cost breakdowns, and expert insights for federal certification applicants. No jargon, no gatekeeping — just the information you need to get certified."
    >
      <div style={{ display: "grid", gap: 32 }}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{
              display: "block",
              padding: 28,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e0d5",
              textDecoration: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <p style={{ fontSize: 13, color: "#8A7B6B", marginBottom: 8 }}>{post.date}</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#0B1929", fontWeight: 500, marginBottom: 12 }}>{post.title}</h2>
            <p style={{ fontSize: 15, color: "#5A6B7B", lineHeight: 1.6, marginBottom: 0 }}>{post.description}</p>
          </Link>
        ))}
      </div>
    </SEOPageLayout>
  );
}
