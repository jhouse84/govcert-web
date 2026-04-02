import { Metadata } from "next";
import SEOPageLayout from "@/components/SEOPageLayout";

export const metadata: Metadata = {
  title: "OASIS+ Application Help — AI-Powered Prep Tool",
  description: "Get help with your OASIS+ application. GovCert uses AI to select domains, map contract history, draft qualifying project narratives, and guide you through the Symphony portal. $1,000 — human help included.",
  alternates: { canonical: "/oasis-plus-application" },
  openGraph: {
    title: "OASIS+ Application Help — GovCert",
    description: "AI-powered OASIS+ application prep. Domain selection, contract mapping, project narratives, and Symphony portal guide.",
    url: "https://govcert.ai/oasis-plus-application",
  },
};

export default function OASISPlusApplication() {
  return (
    <SEOPageLayout
      badge="GSA OASIS+ GWAC"
      title="OASIS+ Application Help That Actually Works"
      subtitle="Stop guessing which domains to apply for and whether your projects qualify. GovCert maps your contract history to OASIS+ requirements and drafts every narrative — with human help where you need it."
    >
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, marginBottom: 16 }}>What Is OASIS+?</h2>
      <p>OASIS+ (One Acquisition Solution for Integrated Services Plus) is GSA&apos;s next-generation professional services Government-Wide Acquisition Contract (GWAC). It replaces the original OASIS contracts and serves as the federal government&apos;s primary vehicle for acquiring complex, integrated professional services across multiple disciplines.</p>
      <p>OASIS+ is organized into domain-based contract families — including Management and Advisory, Technical and Engineering, Research and Development, Intelligence Services, Environmental, and Enterprise Solutions — with both unrestricted and set-aside tracks for small business, 8(a), HUBZone, SDVOSB, and WOSB. Task orders under OASIS+ can be worth hundreds of millions of dollars, making it one of the highest-value contract vehicles in the federal marketplace.</p>
      <p>The challenge is the application itself. OASIS+ uses a scored evaluation system where applicants must demonstrate specific contract experience thresholds — minimum dollar values, project complexity, and relevance to the selected domains. Most businesses struggle with domain selection, project mapping, and the narrative format required by GSA&apos;s Symphony evaluation portal.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>How GovCert Helps</h2>
      <p>GovCert automates the strategic and documentation-heavy parts of the OASIS+ application:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 12 }}><strong>Domain Selection Analysis:</strong> Upload your contracts, task orders, and capability statements. GovCert analyzes your actual work history and scores your eligibility across all OASIS+ domains. It identifies which domains you can win and which ones lack sufficient qualifying experience — so you focus your application where it counts.</li>
        <li style={{ marginBottom: 12 }}><strong>Contract History Mapping:</strong> OASIS+ requires demonstrating contract experience at specific dollar thresholds per domain. GovCert maps each of your past contracts to the applicable NAICS codes, service categories, and domain criteria. It flags gaps in dollar value, period of performance, or scope alignment before you submit.</li>
        <li style={{ marginBottom: 12 }}><strong>Qualifying Project Narratives:</strong> Each domain requires detailed project narratives describing the scope, complexity, relevance, and outcomes of qualifying contracts. GovCert generates narratives from your uploaded documentation — structured to match GSA&apos;s evaluation criteria with emphasis on the scoring factors that matter most: contract value, multi-disciplinary scope, and performance outcomes.</li>
        <li style={{ marginBottom: 12 }}><strong>Relevant Experience Matrix:</strong> GovCert builds a comprehensive matrix linking your contracts to OASIS+ evaluation criteria, making it easy to see at a glance which projects support which domains and where additional documentation may strengthen your proposal.</li>
        <li style={{ marginBottom: 12 }}><strong>Set-Aside Track Guidance:</strong> If your firm holds socioeconomic certifications (8(a), HUBZone, SDVOSB, WOSB), GovCert identifies which set-aside pools offer the strongest competitive advantage based on your experience profile and recommends the optimal application strategy.</li>
        <li style={{ marginBottom: 12 }}><strong>Symphony Portal Guide:</strong> Step-by-step walkthrough of GSA&apos;s Symphony submission portal with copy-to-clipboard buttons, field-by-field instructions, attachment formatting requirements, and character limits matching the actual system. Know exactly what goes where before you start entering data.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>What Does It Cost?</h2>
      <p>GovCert costs <strong>$1,000</strong> for complete OASIS+ application preparation. Traditional OASIS consultants charge between $5,000 and $20,000 per domain — and many firms apply for multiple domains, driving costs even higher. With GovCert, the flat price covers all domains you apply for, unlimited narrative revisions, and human support at no additional cost.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Who Qualifies for OASIS+?</h2>
      <p>OASIS+ eligibility depends on the specific domain and track you are applying for. General requirements include:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}>Demonstrated contract experience in the domain&apos;s service categories at required dollar thresholds</li>
        <li style={{ marginBottom: 8 }}>Active SAM.gov registration with a valid Unique Entity Identifier (UEI)</li>
        <li style={{ marginBottom: 8 }}>Qualifying NAICS codes that align with the domains you are applying for</li>
        <li style={{ marginBottom: 8 }}>Past performance references from government or commercial customers</li>
        <li style={{ marginBottom: 8 }}>For set-aside tracks: current SBA certification (8(a), HUBZone, SDVOSB, or WOSB as applicable)</li>
        <li style={{ marginBottom: 8 }}>Adequate financial capacity and organizational resources for large-scale professional services delivery</li>
      </ul>
      <p>Not sure which domains you qualify for? GovCert&apos;s <strong>free eligibility check</strong> scores your contract history against every OASIS+ domain in minutes. No credit card required.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Why GovCert Instead of a Consultant?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ padding: 20, background: "#fff", borderRadius: 12, border: "1px solid #e5e0d5" }}>
          <h4 style={{ color: "#0B1929", marginBottom: 8 }}>Traditional Consultant</h4>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "#5A6B7B" }}>
            <li>$5,000 - $20,000 per domain</li>
            <li>2-4 month timeline</li>
            <li>Manual contract-to-domain mapping</li>
            <li>Extra fees for additional domains</li>
            <li>Limited revision cycles</li>
          </ul>
        </div>
        <div style={{ padding: 20, background: "#fff", borderRadius: 12, border: "2px solid #C89B3C" }}>
          <h4 style={{ color: "#C89B3C", marginBottom: 8 }}>GovCert</h4>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "#5A6B7B" }}>
            <li>$1,000 flat — all domains included</li>
            <li>Days, not months</li>
            <li>AI maps every contract automatically</li>
            <li>Unlimited revisions and narrative redrafts</li>
            <li>Available 24/7 + human help included</li>
          </ul>
        </div>
      </div>

      <p>GovCert was built by <strong>House Strategies Group LLC</strong> — a government contracting firm that understands the OASIS+ evaluation process from the inside. We built the tool we wished existed when preparing our own applications.</p>
    </SEOPageLayout>
  );
}
