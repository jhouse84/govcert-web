import { Metadata } from "next";
import SEOPageLayout from "@/components/SEOPageLayout";

export const metadata: Metadata = {
  title: "8(a) Certification Help — AI-Powered Application Prep",
  description: "Get help with your SBA 8(a) certification application. GovCert uses AI to draft your social disadvantage narrative, validate financials, and guide you through certify.sba.gov. $1,000 — human help included.",
  alternates: { canonical: "/8a-certification-help" },
  openGraph: {
    title: "8(a) Certification Help — GovCert",
    description: "AI-powered 8(a) application prep. Social disadvantage narratives, financial validation, submission guide.",
    url: "https://govcert.ai/8a-certification-help",
  },
};

export default function EightACertificationHelp() {
  return (
    <SEOPageLayout
      badge="SBA 8(a) Business Development"
      title="8(a) Certification Help That Actually Works"
      subtitle="Stop paying $10,000 for what AI can do in days. GovCert drafts your entire 8(a) application from your uploaded documents — with human help where you need it."
    >
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, marginBottom: 16 }}>What Is 8(a) Certification?</h2>
      <p>The SBA 8(a) Business Development Program is a nine-year program designed to help socially and economically disadvantaged small businesses compete for federal contracts. It provides access to sole-source contracts up to $4 million, set-aside competitions, mentorship programs, and management and technical assistance.</p>
      <p>The 8(a) application is one of the most complex federal certification processes. It requires a detailed social disadvantage narrative under 13 CFR 124.103, economic disadvantage documentation including a Personal Financial Statement (SBA Form 413), a comprehensive business plan, corporate experience narratives, past performance references, and two years of financial statements.</p>
      <p>Most businesses either hire consultants at $3,000 to $15,000 or spend months struggling through the application on their own. Many give up entirely.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>How GovCert Helps</h2>
      <p>GovCert automates the hardest parts of the 8(a) application process:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 12 }}><strong>Document Analysis:</strong> Upload your tax returns, financial statements, capability statements, and invoices. GovCert reads every file and extracts the data automatically.</li>
        <li style={{ marginBottom: 12 }}><strong>Eligibility Scoring:</strong> Instant assessment against all 8(a) criteria — social disadvantage, net worth under $850K, AGI under $400K, ownership percentage, US citizenship, and years in business.</li>
        <li style={{ marginBottom: 12 }}><strong>Social Disadvantage Narrative:</strong> The hardest section. GovCert breaks it into 7 guided questions, then generates a regulation-compliant narrative structured to the SBA three-part review standard. Includes an approval likelihood score and specific suggestions to strengthen it.</li>
        <li style={{ marginBottom: 12 }}><strong>Economic Disadvantage:</strong> Auto-populates your SBA Form 413 from uploaded documents. Includes AI-powered property and vehicle value estimators.</li>
        <li style={{ marginBottom: 12 }}><strong>Business Plan:</strong> Generates all 8 required sections from your documents and guided answers.</li>
        <li style={{ marginBottom: 12 }}><strong>Financial Validation:</strong> Checks your data against actual CFR thresholds — accrual basis accounting, revenue matching tax returns, net worth limits — before you submit.</li>
        <li style={{ marginBottom: 12 }}><strong>Submission Guide:</strong> Step-by-step walkthrough of certify.sba.gov with copy-to-clipboard buttons and character counters matching the actual portal limits.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>What Does It Cost?</h2>
      <p>GovCert costs <strong>$1,000</strong> for complete 8(a) application preparation — a fraction of the $3,000 to $15,000 that traditional consultants charge. The price is the same regardless of complexity because the AI does the heavy lifting. Human help is included where needed at no additional cost.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Who Qualifies for 8(a)?</h2>
      <p>To be eligible for the 8(a) program, the business must be:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}>At least 51% owned by a socially and economically disadvantaged individual</li>
        <li style={{ marginBottom: 8 }}>A small business by SBA size standards</li>
        <li style={{ marginBottom: 8 }}>Owner must be a US citizen</li>
        <li style={{ marginBottom: 8 }}>Owner&apos;s personal net worth must be under $850,000 (excluding primary residence and business equity)</li>
        <li style={{ marginBottom: 8 }}>Owner&apos;s average adjusted gross income must be under $400,000 over 3 years</li>
        <li style={{ marginBottom: 8 }}>Owner&apos;s total assets must be under $6.5 million</li>
        <li style={{ marginBottom: 8 }}>Business must have been in operation for at least 2 years</li>
      </ul>
      <p>Not sure if you qualify? GovCert&apos;s <strong>free eligibility check</strong> scores you against every criterion in minutes. No credit card required.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Why GovCert Instead of a Consultant?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ padding: 20, background: "#fff", borderRadius: 12, border: "1px solid #e5e0d5" }}>
          <h4 style={{ color: "#0B1929", marginBottom: 8 }}>Traditional Consultant</h4>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "#5A6B7B" }}>
            <li>$3,000 - $15,000</li>
            <li>2-4 month timeline</li>
            <li>Manual document review</li>
            <li>One narrative draft, revisions extra</li>
            <li>Limited availability</li>
          </ul>
        </div>
        <div style={{ padding: 20, background: "#fff", borderRadius: 12, border: "2px solid #C89B3C" }}>
          <h4 style={{ color: "#C89B3C", marginBottom: 8 }}>GovCert</h4>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "#5A6B7B" }}>
            <li>$1,000 flat</li>
            <li>Days, not months</li>
            <li>AI reads every document automatically</li>
            <li>Unlimited revisions and redrafts</li>
            <li>Available 24/7 + human help included</li>
          </ul>
        </div>
      </div>

      <p>GovCert was built by <strong>House Strategies Group LLC</strong> — a government contracting firm that went through the certification process firsthand. We built the tool we wished existed.</p>
    </SEOPageLayout>
  );
}
