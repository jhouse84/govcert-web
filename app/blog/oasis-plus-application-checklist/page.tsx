import { Metadata } from "next";
import SEOPageLayout from "@/components/SEOPageLayout";

export const metadata: Metadata = {
  title: "The Complete OASIS+ Application Checklist for 2026 — GovCert",
  description: "Everything you need to apply for OASIS+ in 2026: domain selection, contract history requirements, qualifying project narratives, Symphony portal process, and common mistakes to avoid.",
  alternates: { canonical: "/blog/oasis-plus-application-checklist" },
  openGraph: {
    title: "The Complete OASIS+ Application Checklist for 2026",
    description: "Step-by-step OASIS+ application checklist covering domains, qualifying projects, documents, and the Symphony portal.",
    url: "https://govcert.ai/blog/oasis-plus-application-checklist",
  },
};

export default function OasisPlusChecklist() {
  return (
    <SEOPageLayout
      badge="Blog"
      title="The Complete OASIS+ Application Checklist for 2026"
      subtitle="OASIS+ is the largest professional services GWAC in federal history. Here is everything you need to submit a winning application."
    >
      <p>OASIS+ (One Acquisition Solution for Integrated Services Plus) is GSA&apos;s next-generation government-wide acquisition contract for professional services. It replaced the original OASIS contracts and represents the single largest vehicle for professional services procurement across the federal government. Winning a spot on OASIS+ gives your company access to billions of dollars in task orders spanning management consulting, IT services, engineering, logistics, environmental services, and more.</p>
      <p>The application process is conducted through GSA&apos;s Symphony portal and requires careful preparation. Unlike some federal certifications, OASIS+ is not a self-certification — it is a competitive evaluation based on your company&apos;s demonstrated experience, past performance, and organizational capability. This checklist covers everything you need to prepare a complete application in 2026.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Understanding OASIS+ Structure</h2>
      <p>OASIS+ is organized into domains that correspond to broad professional services categories. When you apply, you select which domains you are competing for based on your company&apos;s capabilities and contract history. You do not need to apply for all domains — in fact, you should only apply for domains where you have strong qualifying experience.</p>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>The OASIS+ Domains</h3>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}><strong>Management and Advisory:</strong> Strategy, program management, organizational development, and consulting services</li>
        <li style={{ marginBottom: 8 }}><strong>Technical and Engineering:</strong> Systems engineering, R&amp;D, testing, logistics engineering, and technical support</li>
        <li style={{ marginBottom: 8 }}><strong>Scientific:</strong> Research, laboratory services, data science, and environmental science</li>
        <li style={{ marginBottom: 8 }}><strong>Intelligence Services:</strong> Analysis, collection management, and intelligence support</li>
        <li style={{ marginBottom: 8 }}><strong>Enterprise Solutions:</strong> IT modernization, cloud, cybersecurity, and digital transformation</li>
        <li style={{ marginBottom: 8 }}><strong>Environmental:</strong> Compliance, remediation, sustainability, and conservation</li>
      </ul>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>Contract Pools</h3>
      <p>Within each domain, OASIS+ has separate contract pools for small businesses and unrestricted (large business) competitors. Small business pools include designations for 8(a), HUBZone, WOSB/EDWOSB, and SDVOSB. If you hold one of these certifications, you compete in a less crowded pool with higher award rates.</p>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Step 1: Verify Your Eligibility</h2>
      <p>Before you invest time in the application, confirm that your company meets the baseline requirements:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 12 }}><strong>Active SAM.gov registration:</strong> Your System for Award Management registration must be current and complete. This includes your NAICS codes, socioeconomic designations, and core competencies.</li>
        <li style={{ marginBottom: 12 }}><strong>DUNS/UEI number:</strong> Your Unique Entity Identifier must be active in SAM.gov.</li>
        <li style={{ marginBottom: 12 }}><strong>Relevant NAICS codes:</strong> You must have NAICS codes that align with the OASIS+ domains you are applying for. Review the OASIS+ solicitation for the specific NAICS codes mapped to each domain.</li>
        <li style={{ marginBottom: 12 }}><strong>Adequate accounting system:</strong> You need an accounting system that can handle cost-type contracts. For small businesses, a CPA letter confirming your accounting system&apos;s adequacy may be required.</li>
        <li style={{ marginBottom: 12 }}><strong>No active exclusions:</strong> Check SAM.gov to confirm your company has no active exclusions or debarments.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Step 2: Select Your Domains Strategically</h2>
      <p>Do not apply for every domain. GSA evaluates your application by domain, and a weak application in one domain does not help you. Focus on domains where you have the strongest qualifying project experience.</p>
      <p>For each domain you select, you will need to provide qualifying project narratives that demonstrate relevant experience. The evaluation is pass/fail on minimum requirements, then scored competitively. The key criteria for domain selection:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}>Do you have at least the minimum number of qualifying projects for this domain?</li>
        <li style={{ marginBottom: 8 }}>Are those projects recent enough to meet the recency requirements?</li>
        <li style={{ marginBottom: 8 }}>Do the projects demonstrate the scope and complexity that GSA is looking for?</li>
        <li style={{ marginBottom: 8 }}>Can you provide verifiable past performance references for each project?</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Step 3: Prepare Your Qualifying Project Narratives</h2>
      <p>This is the most important part of your OASIS+ application. Each qualifying project narrative must demonstrate that your company performed relevant professional services work at the required scope and complexity level. GSA evaluators score these narratives carefully.</p>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>What Makes a Strong Project Narrative</h3>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 12 }}><strong>Specificity:</strong> Do not write generic descriptions. Include specific deliverables, methodologies, team sizes, and measurable outcomes. &quot;Provided IT support&quot; is weak. &quot;Migrated 3,200 users from on-premise Exchange to Microsoft 365 with zero downtime over a 14-week period&quot; is strong.</li>
        <li style={{ marginBottom: 12 }}><strong>Relevance to domain:</strong> Every narrative should clearly map to the domain you are applying for. If you are applying for Management and Advisory, your narratives should emphasize strategy, consulting, and organizational outcomes — not technical implementation.</li>
        <li style={{ marginBottom: 12 }}><strong>Contract details:</strong> Include the contract number, contracting agency, period of performance, total contract value, and your company&apos;s specific role (prime or sub). GSA will verify these details.</li>
        <li style={{ marginBottom: 12 }}><strong>Complexity indicators:</strong> Highlight elements that demonstrate sophistication — multi-agency coordination, large dollar values, geographically distributed teams, complex stakeholder environments, or innovative approaches.</li>
        <li style={{ marginBottom: 12 }}><strong>Measurable outcomes:</strong> Quantify results wherever possible. Cost savings, efficiency improvements, user adoption rates, and schedule performance all strengthen your narrative.</li>
      </ul>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>Project Narrative Checklist</h3>
      <p>For each qualifying project, prepare the following information:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}>Contract number and task order number (if applicable)</li>
        <li style={{ marginBottom: 8 }}>Client agency and contracting officer name</li>
        <li style={{ marginBottom: 8 }}>Period of performance (start and end dates)</li>
        <li style={{ marginBottom: 8 }}>Total contract value and value of your company&apos;s portion</li>
        <li style={{ marginBottom: 8 }}>Prime or subcontractor role</li>
        <li style={{ marginBottom: 8 }}>Relevant NAICS code</li>
        <li style={{ marginBottom: 8 }}>Project description (scope, deliverables, methodology)</li>
        <li style={{ marginBottom: 8 }}>Measurable outcomes and results</li>
        <li style={{ marginBottom: 8 }}>CPARS rating (if available)</li>
        <li style={{ marginBottom: 8 }}>Past performance reference contact information</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Step 4: Gather Required Documents</h2>
      <p>Beyond project narratives, OASIS+ requires several organizational documents. Prepare these well before you start the Symphony portal submission:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 12 }}><strong>Corporate experience matrix:</strong> A summary table of all qualifying projects mapped to the domains and NAICS codes you are applying for.</li>
        <li style={{ marginBottom: 12 }}><strong>Organizational chart:</strong> Showing key personnel, reporting structure, and relevant certifications or clearances.</li>
        <li style={{ marginBottom: 12 }}><strong>Financial statements:</strong> Two to three years of audited or reviewed financial statements. Revenue size matters for scoring in some pools.</li>
        <li style={{ marginBottom: 12 }}><strong>Accounting system documentation:</strong> Evidence that your accounting system can handle cost-type contracts, including CPA letters if applicable.</li>
        <li style={{ marginBottom: 12 }}><strong>Quality management certifications:</strong> ISO 9001, CMMI, or other relevant certifications can strengthen your application.</li>
        <li style={{ marginBottom: 12 }}><strong>Facility clearance documentation:</strong> If applicable to the domains you are pursuing, particularly for intelligence services.</li>
        <li style={{ marginBottom: 12 }}><strong>Socioeconomic certifications:</strong> Current 8(a), HUBZone, WOSB, or SDVOSB certifications if you are applying to a small business pool.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Step 5: Navigate the Symphony Portal</h2>
      <p>GSA uses the Symphony procurement portal for OASIS+ submissions. The portal is separate from SAM.gov and has its own registration and submission process.</p>

      <h3 style={{ fontSize: 20, color: "#0B1929", fontWeight: 600, margin: "28px 0 12px" }}>Symphony Portal Tips</h3>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 12 }}><strong>Register early:</strong> Create your Symphony account well before the submission deadline. Account verification can take several business days.</li>
        <li style={{ marginBottom: 12 }}><strong>Save frequently:</strong> The portal has session timeouts. Save your work after completing each section to avoid losing progress.</li>
        <li style={{ marginBottom: 12 }}><strong>Follow character and file size limits:</strong> Each field in Symphony has specific character limits. Project narratives typically have word or character maximums that you must stay within. Draft your narratives in a separate document first, confirm they fit, then paste into the portal.</li>
        <li style={{ marginBottom: 12 }}><strong>Upload documents in the correct format:</strong> GSA specifies accepted file formats (typically PDF) and maximum file sizes. Confirm all documents meet these requirements before submission day.</li>
        <li style={{ marginBottom: 12 }}><strong>Submit before the deadline:</strong> Do not wait until the last hour. Portal traffic spikes near deadlines and technical issues are common. Aim to submit at least 48 hours before the window closes.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Common Mistakes That Get Applications Rejected</h2>
      <p>After reviewing feedback from OASIS+ evaluations, these are the most frequent reasons applications fail:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 12 }}><strong>Generic project narratives:</strong> Vague descriptions that do not demonstrate specific capabilities or outcomes. Evaluators need concrete evidence of your competence, not marketing language.</li>
        <li style={{ marginBottom: 12 }}><strong>Mismatched domains:</strong> Submitting IT implementation projects for Management and Advisory domains, or consulting narratives for Technical and Engineering. Each narrative must clearly align with its target domain.</li>
        <li style={{ marginBottom: 12 }}><strong>Unverifiable references:</strong> Providing past performance contacts who are no longer at the agency, have retired, or cannot be reached. Verify all reference contact information before submission.</li>
        <li style={{ marginBottom: 12 }}><strong>Incomplete SAM.gov registration:</strong> Missing NAICS codes, expired registration, or incomplete entity information. GSA cross-references your SAM.gov profile during evaluation.</li>
        <li style={{ marginBottom: 12 }}><strong>Exceeding character or page limits:</strong> Symphony enforces strict limits. Narratives that are cut off mid-sentence because they exceeded the character count will be evaluated as-is, potentially missing critical information.</li>
        <li style={{ marginBottom: 12 }}><strong>Missing the submission window:</strong> OASIS+ on-ramps open periodically and close on a fixed date. Late submissions are not accepted regardless of circumstances.</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>Realistic Timeline</h2>
      <p>Plan for a minimum of 6 to 8 weeks of preparation before the submission window opens. Here is a realistic breakdown:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 24 }}>
        <li style={{ marginBottom: 8 }}><strong>Weeks 1-2:</strong> Domain selection, qualifying project identification, and eligibility verification</li>
        <li style={{ marginBottom: 8 }}><strong>Weeks 3-4:</strong> Project narrative drafting and internal review</li>
        <li style={{ marginBottom: 8 }}><strong>Week 5:</strong> Document collection — financial statements, org charts, certifications, and past performance references</li>
        <li style={{ marginBottom: 8 }}><strong>Week 6:</strong> Symphony portal setup, data entry, and document uploads</li>
        <li style={{ marginBottom: 8 }}><strong>Week 7:</strong> Final review, reference verification, and compliance checks</li>
        <li style={{ marginBottom: 8 }}><strong>Week 8:</strong> Submission and confirmation</li>
      </ul>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, margin: "40px 0 16px" }}>How GovCert Helps With OASIS+</h2>
      <p>GovCert&apos;s platform is expanding to support OASIS+ application preparation. The AI can analyze your existing contract portfolio, identify your strongest qualifying projects for each domain, and help draft compelling project narratives that meet GSA&apos;s evaluation criteria. If you are preparing for the next OASIS+ on-ramp, start with a free eligibility assessment to see which domains and pools you are best positioned to compete in.</p>
    </SEOPageLayout>
  );
}
