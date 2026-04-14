import { Metadata } from "next";
import SEOPageLayout from "@/components/SEOPageLayout";
import BlogPostSchema from "@/components/BlogPostSchema";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "GSA MAS Refresh 31: What Changed and What You Need to Do",
  description: "GSA eliminated CSP-1, MFC disclosure, and the legacy Price Reduction Clause in Refresh 31. TDR is now mandatory for all SINs. Here is what offerors need to know and how GovCert handles the transition.",
  alternates: { canonical: "/blog/gsa-mas-refresh-31-tdr" },
  openGraph: {
    title: "GSA MAS Refresh 31: What Changed and What You Need to Do",
    description: "Refresh 31 eliminates CSP-1 and MFC. TDR is mandatory. Here is what every GSA Schedule offeror needs to know.",
    url: "https://govcert.ai/blog/gsa-mas-refresh-31-tdr",
  },
};

export default function GSAMASRefresh31() {
  return (
    <>
    <BlogPostSchema title="GSA MAS Refresh 31: What Changed and What You Need to Do" description="GSA eliminated CSP-1, MFC disclosure, and the legacy Price Reduction Clause in Refresh 31. TDR is now mandatory for all SINs." slug="gsa-mas-refresh-31-tdr" datePublished="2026-04-14" />
    <BreadcrumbSchema items={[{ name: "Home", url: "https://govcert.ai" }, { name: "Blog", url: "https://govcert.ai/blog" }, { name: "GSA MAS Refresh 31", url: "https://govcert.ai/blog/gsa-mas-refresh-31-tdr" }]} />
    <SEOPageLayout
      badge="Blog"
      title="GSA MAS Refresh 31: What Changed and What You Need to Do"
      subtitle="Mass Mod A914 went live on April 2, 2026. It is the biggest pricing change to the MAS solicitation in years. Here is what it means for your offer."
    >
      <p style={{ fontSize: 18, lineHeight: 1.7, color: "#1a1a1a", marginBottom: 8 }}>On April 2, 2026, GSA released Refresh 31 of the Multiple Award Schedule solicitation (47QSMD20R0001). This update — implemented through Mass Modification A914 — makes Transactional Data Reporting (TDR) mandatory for every SIN on the Schedule and eliminates several pricing disclosure requirements that have been part of the MAS program for decades.</p>
      <p style={{ fontSize: 13, color: "#8B7A3E", marginBottom: 32 }}><em>Published: April 14, 2026</em></p>

      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>If you are preparing a new GSA Schedule offer, or if you submitted one before April 2 that is still pending, this affects you directly. Here is what changed, what it means, and what you need to do.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>What GSA Eliminated</h2>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>CSP-1 (Commercial Sales Practices)</h3>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>The CSP-1 form required offerors to disclose their commercial pricing history, identify their Most Favored Customer, and explain their discount structure. It was one of the most common reasons offers were returned for clarification. Under Refresh 31, the CSP-1 is gone. All references to it have been removed from the solicitation.</p>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>MFC (Most Favored Customer) Disclosure</h3>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>Offerors previously had to identify their best commercial customer and demonstrate that GSA was getting pricing equal to or better than that customer. This requirement is eliminated. GSA no longer asks you to identify an MFC or build a commercial-to-MFC-to-GSA discount ladder.</p>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>Legacy Price Reduction Clause</h3>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>The old GSAR 552.238-81 required contractors to automatically reduce GSA prices when their commercial pricing changed relative to the MFC baseline. The new version (December 2025 GSAR Deviation) is two sentences: the government can request price reductions, and the contractor can offer them voluntarily. No automatic triggers. No MFC tracking obligation.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>What GSA Added</h2>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>Mandatory Transactional Data Reporting (TDR)</h3>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>TDR was previously a pilot program covering some SINs. As of Refresh 31, it is mandatory for every SIN on the Schedule. Contractors must report transaction-level data monthly through the FAS Sales Reporting Portal (SRP) within 30 calendar days of month-end.</p>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>The clause governing TDR is GSAR 552.238-80 (December 2025 GSAR Deviation). It defines 14 mandatory data elements for every transaction plus additional elements being phased in:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>Always required:</strong> Contract/BPA number, task order number, description of deliverable, manufacturer info, unit of measure, quantity, price paid per unit, total price, SIN</li>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>Transitioning to mandatory:</strong> Order date, ship date, zip code shipped to, Federal customer Treasury Agency code</li>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>New in R31:</strong> Cloud service type, unique catalog identifier, order type, order discount, worksite (for services T&amp;M/LH)</li>
      </ul>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>Fair and Reasonable Pricing Standard</h3>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>Instead of MFC-based pricing evaluation, GSA now evaluates whether your rates are &quot;fair and reasonable.&quot; The solicitation states that GSA will use existing government data sources — the CALC tool, BLS wage data, GSA Advantage comparables — before requesting additional information from the offeror. You are not required to submit pricing support data upfront; the contracting officer will request what they need.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>What Stayed the Same</h2>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>Evaluation factors 1-4:</strong> Corporate Experience, Past Performance, Quality Control, and Relevant Project Experience are unchanged. Same eOffer entry, same character limits.</li>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>Financial statements:</strong> Two years of P&amp;L and balance sheet still required (audited if available).</li>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>IFF:</strong> The 0.75% Industrial Funding Fee is unchanged. It must be included in your awarded prices and remitted quarterly.</li>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>EPA clauses:</strong> Economic Price Adjustment methodology is unchanged.</li>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>eOffer submission process:</strong> Still submitted electronically through eOffer with FAS ID multi-factor authentication.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>What If You Already Submitted an Offer?</h2>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>If your offer was submitted before April 2, 2026 under the old non-TDR format, GSA recommends withdrawing it and resubmitting under the Refresh 31 requirements. The Significant Changes attachment states plainly: offers not compliant with TDR will be rejected.</p>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>Your narratives, past performance, and financials are still valid. The work you need to redo is the pricing documentation: rebuild your rate table without MFC columns, regenerate your Price Proposal with TDR compliance commitments, and update your pricing terms.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>How GovCert Handles Refresh 31</h2>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>GovCert&apos;s platform has been updated to prepare fully Refresh 31-compliant offers:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>Pricing wizard:</strong> No MFC rate or discount columns. Your rate table is built around commercial rates and GSA rates with IFF. Export as pricing support documentation — not a CSP-1.</li>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>Price Proposal generator:</strong> AI-generated document with fair-and-reasonable justification (CALC/BLS benchmarks), TDR compliance commitment, and the new PRC acknowledgment. No MFC identification section.</li>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>AI review:</strong> The pre-submission review evaluates your offer against R31 standards. It checks rate competitiveness against CALC comparables, flags missing TDR acknowledgments, and does not generate false findings about MFC disclosure or CSP-1 formatting.</li>
        <li style={{ marginBottom: 8, fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}><strong>Submit page:</strong> The 18-item checklist uses the current R31 terminology. Pre-R31 applications show a banner explaining the transition.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>The Bottom Line</h2>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>Refresh 31 simplifies the pricing side of the MAS application. You no longer need to identify your best customer, build a discount ladder, or worry about automatic price reduction triggers. But TDR adds a new ongoing obligation: monthly transaction reporting with specific data elements. If you are preparing an offer now, make sure your pricing documentation reflects the current requirements — not the pre-April 2 framework.</p>
      <p style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8, marginBottom: 16 }}>The full Refresh 31 solicitation is available on the <a href="https://vsc.gsa.gov/drupal/node/175" style={{ color: "#C89B3C", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">GSA Vendor Support Center</a>.</p>

    </SEOPageLayout>
    </>
  );
}
