import { Metadata } from "next";
import SEOPageLayout from "@/components/SEOPageLayout";

export const metadata: Metadata = {
  title: "WOSB Certification — Complete Application Guide",
  description: "Get help with your WOSB and EDWOSB certification application. GovCert uses AI to assess eligibility, validate ownership and control requirements, and guide you through SAM.gov self-certification. $1,000 — human help included.",
  alternates: { canonical: "/wosb-certification" },
  openGraph: {
    title: "WOSB Certification Help — GovCert",
    description: "AI-powered WOSB and EDWOSB certification prep. Eligibility assessment, document validation, and SAM.gov self-certification guide.",
    url: "https://govcert.ai/wosb-certification",
  },
};

export default function WOSBCertification() {
  return (
    <SEOPageLayout
      badge="Women-Owned Small Business"
      title="WOSB Certification Help That Actually Works"
      subtitle="Navigate the WOSB and EDWOSB certification process with confidence. GovCert validates your eligibility, reviews your documents, and walks you through every step of self-certification — with human help where you need it."
    >
      <p style={{ fontSize: 17, lineHeight: 1.7, color: "#1a2b3c", marginBottom: 8 }}>Women-Owned Small Business (WOSB) certification is a self-certification program that gives women-owned firms access to federal set-aside contracts. GovCert&apos;s free eligibility assessment checks your WOSB and EDWOSB qualification instantly and guides you through the SAM.gov certification process.</p>
      <p style={{ fontSize: 13, color: "#8B7A3E", marginBottom: 32 }}><em>Last updated: April 2, 2026</em></p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, marginBottom: 16 }}>What Is WOSB Certification?</h2>
      <p>The Women-Owned Small Business (WOSB) Federal Contracting Program is designed to increase the participation of women-owned businesses in federal procurement. The federal government has a statutory goal of awarding at least 5% of all federal contracting dollars to women-owned small businesses, and the WOSB program creates set-aside and sole-source contract opportunities to help meet that goal.</p>
      <p>There are two designations under the program: WOSB (Women-Owned Small Business) and EDWOSB (Economically Disadvantaged Women-Owned Small Business). EDWOSB provides access to an even broader range of set-aside industries and contract opportunities. Both designations allow firms to compete for contracts specifically reserved for women-owned businesses across hundreds of NAICS codes that SBA has identified as underrepresented.</p>
      <p>Since 2020, WOSB certification is handled through self-certification in SAM.gov or through SBA-approved third-party certifiers. While the process is simpler than programs like 8(a), the documentation requirements are specific and mistakes can lead to decertification, protest losses, or missed opportunities.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>WOSB vs. EDWOSB: What&apos;s the Difference?</h2>
      <p>Both programs require that the business be at least 51% owned and controlled by one or more women who are US citizens. The key difference is the economic disadvantage threshold:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}><strong>WOSB:</strong> Requires 51% ownership and control by women. No income or net worth limitations. Eligible for WOSB set-asides in designated NAICS codes where women are underrepresented.</li>
        <li style={{ marginBottom: 8 }}><strong>EDWOSB:</strong> Same ownership and control requirements as WOSB, plus the qualifying woman must demonstrate economic disadvantage — personal net worth under $850,000 (excluding primary residence and business ownership interest) and average adjusted gross income under $400,000 over 3 years. EDWOSB firms can compete for both EDWOSB and WOSB set-asides, accessing a wider pool of contract opportunities.</li>
      </ul>
      <p>If you meet the economic thresholds, EDWOSB certification is almost always the better choice because it opens more doors without limiting your ability to compete for standard WOSB opportunities.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>How GovCert Helps</h2>
      <p>GovCert streamlines the entire WOSB and EDWOSB certification process:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 12 }}><strong>Eligibility Assessment:</strong> Upload your corporate documents, tax returns, and ownership records. GovCert evaluates your business against every WOSB and EDWOSB requirement — ownership percentage, management control, citizenship, small business size standards, and economic disadvantage thresholds. You get a clear pass/fail on each criterion with specific guidance on any gaps.</li>
        <li style={{ marginBottom: 12 }}><strong>Ownership &amp; Control Validation:</strong> The most common reason for WOSB protests and decertification is failure to demonstrate unconditional ownership and control. GovCert reviews your operating agreement, articles of incorporation, bylaws, and any shareholder agreements to identify provisions that could undermine your certification — such as super-majority voting requirements, disproportionate board seats, or restrictive transfer clauses.</li>
        <li style={{ marginBottom: 12 }}><strong>Document Preparation:</strong> GovCert generates the supporting documentation package required for self-certification, including ownership affidavits, control narratives, and economic disadvantage statements for EDWOSB applicants. Every document is tailored to your specific corporate structure.</li>
        <li style={{ marginBottom: 12 }}><strong>NAICS Code Strategy:</strong> Not all NAICS codes are eligible for WOSB set-asides. GovCert cross-references your capabilities against SBA&apos;s list of eligible NAICS codes and identifies which contracts you can pursue once certified — helping you understand the revenue opportunity before you apply.</li>
        <li style={{ marginBottom: 12 }}><strong>SAM.gov Self-Certification Guide:</strong> Step-by-step walkthrough of the SAM.gov WOSB self-certification process with screenshots, field-by-field instructions, and document upload checklists. Know exactly what to enter and where to upload before you start.</li>
        <li style={{ marginBottom: 12 }}><strong>Protest Readiness Review:</strong> Competitors can protest your WOSB status at any time. GovCert reviews your documentation against the most common protest grounds — control deficiencies, unconditional ownership gaps, and economic disadvantage calculation errors — so you are prepared to defend your certification from day one.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>What Does It Cost?</h2>
      <p>GovCert costs <strong>$1,000</strong> for complete WOSB or EDWOSB certification preparation. Many consultants charge $2,000 to $5,000 for WOSB assistance, and third-party certifiers charge additional fees on top of that. With GovCert, the flat price covers eligibility assessment, document preparation, self-certification guidance, and human support at no additional cost.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Who Qualifies for WOSB?</h2>
      <p>To be eligible for WOSB certification, the business must meet the following criteria:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}>At least 51% unconditionally and directly owned by one or more women</li>
        <li style={{ marginBottom: 8 }}>Controlled in both management and daily operations by one or more women who own it</li>
        <li style={{ marginBottom: 8 }}>The qualifying woman or women must be US citizens</li>
        <li style={{ marginBottom: 8 }}>The business must be small under SBA size standards for its primary NAICS code</li>
        <li style={{ marginBottom: 8 }}>For EDWOSB: personal net worth under $850,000 (excluding primary residence and business equity)</li>
        <li style={{ marginBottom: 8 }}>For EDWOSB: average adjusted gross income under $400,000 over the preceding 3 years</li>
      </ul>
      <p>Not sure if you qualify? GovCert&apos;s <strong>free eligibility check</strong> evaluates your ownership structure and financials against every WOSB and EDWOSB criterion in minutes. No credit card required.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Why GovCert Instead of a Consultant?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ padding: 20, background: "#fff", borderRadius: 12, border: "1px solid #e5e0d5" }}>
          <h4 style={{ color: "#0B1929", marginBottom: 8 }}>Traditional Consultant</h4>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "#5A6B7B" }}>
            <li>$2,000 - $5,000</li>
            <li>2-4 week timeline</li>
            <li>Manual document review</li>
            <li>Generic template documents</li>
            <li>No protest readiness review</li>
          </ul>
        </div>
        <div style={{ padding: 20, background: "#fff", borderRadius: 12, border: "2px solid #C89B3C" }}>
          <h4 style={{ color: "#C89B3C", marginBottom: 8 }}>GovCert</h4>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "#5A6B7B" }}>
            <li>$1,000 flat</li>
            <li>Days, not weeks</li>
            <li>AI reviews every document automatically</li>
            <li>Tailored documents for your corporate structure</li>
            <li>Protest readiness review included</li>
          </ul>
        </div>
      </div>

      <p>GovCert was built by <strong>House Strategies Group LLC</strong> — a government contracting firm that understands the certification landscape from the inside. We built the tool we wished existed.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Frequently Asked Questions</h2>

      <h3 style={{ fontSize: 18, color: "#0B1929", fontWeight: 600, marginBottom: 8 }}>What is the difference between WOSB and EDWOSB?</h3>
      <p style={{ marginBottom: 24 }}>Both require at least 51% ownership and control by women who are US citizens. EDWOSB (Economically Disadvantaged Women-Owned Small Business) adds economic thresholds: personal net worth under $850,000 (excluding primary residence and business equity) and average adjusted gross income under $400,000 over three years. EDWOSB firms can compete for both EDWOSB and WOSB set-asides, giving them access to a wider pool of contract opportunities.</p>

      <h3 style={{ fontSize: 18, color: "#0B1929", fontWeight: 600, marginBottom: 8 }}>Is WOSB certification free?</h3>
      <p style={{ marginBottom: 24 }}>Self-certification through SAM.gov is free. There is no government fee to certify as a WOSB or EDWOSB. If you choose to use an SBA-approved third-party certifier instead of self-certifying, those organizations may charge their own fees. GovCert&apos;s eligibility assessment is free, and full application preparation costs $1,000 — significantly less than the $2,000 to $5,000 that traditional consultants charge.</p>

      <h3 style={{ fontSize: 18, color: "#0B1929", fontWeight: 600, marginBottom: 8 }}>Do I need to recertify?</h3>
      <p style={{ marginBottom: 24 }}>Yes. WOSB certification must be recertified annually through SAM.gov. You must confirm that your business still meets all eligibility requirements — ownership percentage, management control, citizenship, small business size, and (for EDWOSB) economic disadvantage thresholds. Failure to recertify can result in loss of your WOSB designation and ineligibility for set-aside contracts.</p>

      <h3 style={{ fontSize: 18, color: "#0B1929", fontWeight: 600, marginBottom: 8 }}>What documents are required?</h3>
      <p style={{ marginBottom: 24 }}>Required documents include your articles of incorporation or organization, operating agreement or bylaws, proof of US citizenship for qualifying women owners, business tax returns, personal tax returns (for EDWOSB), a Personal Financial Statement (for EDWOSB), and any shareholder or partnership agreements. GovCert reviews your documents against every requirement and flags anything missing before you submit.</p>

      <h3 style={{ fontSize: 18, color: "#0B1929", fontWeight: 600, marginBottom: 8 }}>Can a man own part of a WOSB?</h3>
      <p style={{ marginBottom: 24 }}>Yes, but the qualifying woman or women must unconditionally and directly own at least 51% of the business and control its management and daily operations. A man can own up to 49% as a minority stakeholder, provided the ownership structure does not give him veto power, super-majority voting rights, or disproportionate control over business decisions. GovCert reviews your operating agreement to identify any provisions that could undermine the control requirement.</p>
    </SEOPageLayout>
  );
}
