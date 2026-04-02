import { Metadata } from "next";
import SEOPageLayout from "@/components/SEOPageLayout";

export const metadata: Metadata = {
  title: "GSA Schedule Application Help — AI-Powered MAS Prep",
  description: "Get help with your GSA Multiple Award Schedule application. GovCert uses AI to build corporate experience narratives, validate CSP-1 pricing, generate your QCP, and guide you through eOffer. $1,000 — human help included.",
  alternates: { canonical: "/gsa-schedule-application" },
  openGraph: {
    title: "GSA Schedule Application Help — GovCert",
    description: "AI-powered GSA MAS application prep. Corporate experience narratives, CSP-1 pricing, QCP, and eOffer submission guide.",
    url: "https://govcert.ai/gsa-schedule-application",
  },
};

export default function GSAScheduleApplication() {
  return (
    <SEOPageLayout
      badge="GSA Multiple Award Schedule"
      title="GSA Schedule Application Help That Actually Works"
      subtitle="Stop paying consultants $15,000+ for GSA Schedule prep. GovCert builds your entire MAS offer package from your uploaded documents — with human help where you need it."
    >
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, marginBottom: 16 }}>What Is the GSA Multiple Award Schedule?</h2>
      <p>The GSA Multiple Award Schedule (MAS), formerly known as GSA Schedule or Federal Supply Schedule, is the largest government-wide contracting vehicle in the federal marketplace. It provides federal, state, and local agencies with streamlined access to over 11 million commercial products and services at pre-negotiated prices.</p>
      <p>Once on the GSA Schedule, your company can compete for task orders across all federal agencies without having to re-bid your pricing or qualifications each time. Schedule holders gain visibility on GSA Advantage, the federal government&apos;s online shopping platform, and can receive orders directly from contracting officers. The average GSA Schedule contract runs for 20 years (a 5-year base period with three 5-year option periods), making it one of the most valuable long-term revenue channels in federal contracting.</p>
      <p>However, the application process is notoriously complex. GSA receives tens of thousands of offers and rejects a significant portion due to incomplete documentation, pricing errors, or non-compliant narratives. Most small businesses either hire consultants charging $10,000 to $25,000 or spend six months or more attempting the offer on their own.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>How GovCert Helps</h2>
      <p>GovCert automates the most time-consuming and error-prone parts of the GSA MAS application:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 12 }}><strong>SIN Selection &amp; Mapping:</strong> Upload your capability statement, past contracts, and invoices. GovCert analyzes your actual work history and maps it to the most appropriate Special Item Numbers (SINs) under the consolidated MAS solicitation. It flags SINs where your experience is weak and recommends alternatives.</li>
        <li style={{ marginBottom: 12 }}><strong>Corporate Experience Narratives:</strong> The offer requires detailed project narratives demonstrating relevant experience for each SIN. GovCert generates regulation-compliant narratives from your uploaded contracts, task orders, and performance evaluations — formatted to GSA&apos;s expectations with scope, period of performance, dollar value, and outcomes.</li>
        <li style={{ marginBottom: 12 }}><strong>CSP-1 Pricing Worksheet:</strong> The Commercial Sales Practices format (CSP-1) is where most offers fail. GovCert structures your pricing data, identifies your Most Favored Customer, calculates discount relationships, and validates that your proposed GSA pricing reflects the required price-reduction clause provisions. It flags inconsistencies before they become rejection reasons.</li>
        <li style={{ marginBottom: 12 }}><strong>Quality Control Plan (QCP):</strong> GSA requires a written plan describing how you maintain quality in delivering your products or services. GovCert generates a tailored QCP based on your business type, SINs, and service delivery model — no generic templates.</li>
        <li style={{ marginBottom: 12 }}><strong>Technical Proposal:</strong> For professional services SINs, GovCert builds the technical evaluation section with staffing plans, labor category descriptions, and methodology narratives drawn from your actual project history.</li>
        <li style={{ marginBottom: 12 }}><strong>eOffer Submission Guide:</strong> Step-by-step walkthrough of the GSA eOffer portal with copy-to-clipboard buttons, character counters, and attachment checklists matching the actual system requirements. Know exactly which documents go where.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>What Does It Cost?</h2>
      <p>GovCert costs <strong>$1,000</strong> for complete GSA Schedule application preparation. Traditional GSA consultants charge between $10,000 and $25,000 — and that often doesn&apos;t include revisions after GSA&apos;s Final Proposal Revision (FPR) feedback. With GovCert, unlimited revisions and human support are included at no additional cost.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Who Qualifies for a GSA Schedule?</h2>
      <p>There is no single set-aside requirement for the GSA Schedule — it is open to businesses of all sizes. However, you must meet several baseline criteria:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}>At least 2 years of corporate experience (as reflected in financial statements and tax returns)</li>
        <li style={{ marginBottom: 8 }}>Active SAM.gov registration with a valid Unique Entity Identifier (UEI)</li>
        <li style={{ marginBottom: 8 }}>Demonstrated past performance on contracts relevant to the SINs you are proposing</li>
        <li style={{ marginBottom: 8 }}>Adequate financial resources — GSA reviews your balance sheet for financial stability</li>
        <li style={{ marginBottom: 8 }}>Established commercial pricing with identifiable commercial customers and a pricing track record</li>
        <li style={{ marginBottom: 8 }}>A satisfactory performance record — no active exclusions in SAM.gov or unresolved audit findings</li>
      </ul>
      <p>Not sure if your business is ready? GovCert&apos;s <strong>free eligibility check</strong> evaluates your documentation against GSA&apos;s requirements in minutes. No credit card required.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Why GovCert Instead of a Consultant?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ padding: 20, background: "#fff", borderRadius: 12, border: "1px solid #e5e0d5" }}>
          <h4 style={{ color: "#0B1929", marginBottom: 8 }}>Traditional Consultant</h4>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "#5A6B7B" }}>
            <li>$10,000 - $25,000</li>
            <li>3-6 month timeline</li>
            <li>Manual document review and assembly</li>
            <li>Extra fees for FPR revisions</li>
            <li>One consultant, limited bandwidth</li>
          </ul>
        </div>
        <div style={{ padding: 20, background: "#fff", borderRadius: 12, border: "2px solid #C89B3C" }}>
          <h4 style={{ color: "#C89B3C", marginBottom: 8 }}>GovCert</h4>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "#5A6B7B" }}>
            <li>$1,000 flat</li>
            <li>Days, not months</li>
            <li>AI reads every document automatically</li>
            <li>Unlimited revisions including FPR responses</li>
            <li>Available 24/7 + human help included</li>
          </ul>
        </div>
      </div>

      <p>GovCert was built by <strong>House Strategies Group LLC</strong> — a government contracting firm that navigated the GSA Schedule process firsthand. We built the tool we wished existed when we were preparing our own offer.</p>
    </SEOPageLayout>
  );
}
