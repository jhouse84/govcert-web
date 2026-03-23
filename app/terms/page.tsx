"use client";

export default function TermsOfServicePage() {
  const headingFont = "'Cormorant Garamond', serif";
  const bodyFont = "'DM Sans', sans-serif";
  const navy = "#0B1929";
  const gold = "#C89B3C";
  const gold2 = "#D4AF5A";
  const cream = "#FAF8F4";
  const ink = "#4A5568";

  const sectionStyle: React.CSSProperties = { marginBottom: 40 };
  const h2Style: React.CSSProperties = {
    fontFamily: headingFont,
    fontSize: 28,
    fontWeight: 400,
    color: navy,
    marginBottom: 16,
    lineHeight: 1.2,
  };
  const pStyle: React.CSSProperties = {
    fontFamily: bodyFont,
    fontSize: 15,
    color: ink,
    lineHeight: 1.75,
    marginBottom: 12,
  };
  const ulStyle: React.CSSProperties = {
    fontFamily: bodyFont,
    fontSize: 15,
    color: ink,
    lineHeight: 1.75,
    paddingLeft: 24,
    marginBottom: 12,
  };

  return (
    <div style={{ minHeight: "100vh", background: cream }}>
      {/* Header */}
      <div style={{ background: navy, padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: gold, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
          </div>
          <span style={{ fontFamily: headingFont, fontSize: 22, color: "#fff", fontWeight: 500 }}>
            Gov<em style={{ color: gold2, fontStyle: "normal" }}>Cert</em>
          </span>
        </a>
        <a href="/" style={{ fontFamily: bodyFont, fontSize: 13, color: "rgba(255,255,255,.6)", textDecoration: "none" }}>
          &larr; Back to Home
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px 80px" }}>
        <h1 style={{ fontFamily: headingFont, fontSize: "clamp(36px,5vw,48px)", fontWeight: 400, color: navy, marginBottom: 8, lineHeight: 1.1 }}>
          Terms of Service
        </h1>
        <p style={{ fontFamily: bodyFont, fontSize: 14, color: "rgba(74,85,104,.6)", marginBottom: 48 }}>
          Last updated: March 2026
        </p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Service Description</h2>
          <p style={pStyle}>
            GovCert, operated by House Strategies Group LLC ("Company", "we", "us"), is a government certification automation platform that helps small businesses identify, apply for, and manage federal, state, and local government certifications including 8(a), GSA MAS, WOSB, HUBZone, MBE/DBE, and SAM.gov registrations.
          </p>
          <p style={pStyle}>
            By creating an account or using our services, you ("User", "you") agree to be bound by these Terms of Service. If you do not agree, do not use the platform.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Account Responsibilities</h2>
          <p style={pStyle}>When using GovCert, you agree to:</p>
          <ul style={ulStyle}>
            <li style={{ marginBottom: 8 }}>Provide accurate, current, and complete information during registration and throughout the certification process.</li>
            <li style={{ marginBottom: 8 }}>Maintain the security of your password and account credentials. You are responsible for all activity that occurs under your account.</li>
            <li style={{ marginBottom: 8 }}>Notify us immediately of any unauthorized use of your account.</li>
            <li style={{ marginBottom: 8 }}>Not share your account access with unauthorized individuals.</li>
            <li style={{ marginBottom: 8 }}>Ensure that all documents and information uploaded to the platform are truthful and not fraudulent.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Pricing &amp; Payments</h2>
          <p style={pStyle}>GovCert uses a two-part pricing model:</p>
          <ul style={ulStyle}>
            <li style={{ marginBottom: 8 }}><strong>One-Time Application Generation Fee:</strong> A per-certification fee covers AI-powered application generation, document analysis, narrative drafting, GovCert Review scoring, and submission companion tools. This fee is charged once per certification type (e.g., GSA MAS, 8(a), OASIS+).</li>
            <li style={{ marginBottom: 8 }}><strong>Monthly Maintenance Subscription (Optional):</strong> Ongoing certification maintenance including SAM.gov monitoring, compliance alerts, data call response assistance, and continued GovCert Review access. Available in Essential, Professional, and Enterprise tiers.</li>
          </ul>
          <p style={pStyle}>
            During beta testing periods, all features may be offered at no cost. When pricing is active, payment is required before AI-generated outputs are accessible. Input of data (answering questions, uploading documents) is always free.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Third-Party Integrations</h2>
          <p style={pStyle}>GovCert integrates with third-party services to enhance your experience:</p>
          <ul style={ulStyle}>
            <li style={{ marginBottom: 8 }}><strong>Intuit QuickBooks:</strong> When you connect your QuickBooks account, we access your financial reports (Profit &amp; Loss, Balance Sheet), company information, and employee data solely to pre-fill certification application fields. You authorize this access via Intuit&apos;s OAuth flow and may disconnect at any time.</li>
            <li style={{ marginBottom: 8 }}><strong>SAM.gov:</strong> We query the SAM.gov Entity Management API to verify and populate your business registration data (UEI, CAGE code, address, NAICS codes).</li>
            <li style={{ marginBottom: 8 }}><strong>Anthropic Claude AI:</strong> Your document text and application data are processed by Anthropic&apos;s Claude AI for analysis, narrative generation, and scoring. This data is processed per-request and is not used to train AI models.</li>
            <li style={{ marginBottom: 8 }}><strong>SendGrid:</strong> Email notifications are sent via SendGrid for account verification, invitation management, PPQ requests, and system notifications.</li>
          </ul>
          <p style={pStyle}>
            You may revoke access to any third-party integration at any time through your Integrations settings. Revoking access does not delete data already imported into GovCert.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. AI-Generated Content Disclaimer</h2>
          <p style={pStyle}>
            GovCert uses artificial intelligence to analyze documents, assess certification eligibility, suggest application responses, and provide guidance throughout the certification process. You acknowledge and agree that:
          </p>
          <ul style={ulStyle}>
            <li style={{ marginBottom: 8 }}>AI-generated content is provided as a starting point and should be reviewed carefully before inclusion in any certification application.</li>
            <li style={{ marginBottom: 8 }}>AI analysis and recommendations do not constitute legal, financial, or professional advice.</li>
            <li style={{ marginBottom: 8 }}>You are solely responsible for verifying the accuracy of all information before submitting applications to government agencies.</li>
            <li style={{ marginBottom: 8 }}>AI eligibility assessments are estimates based on the information provided and do not guarantee certification approval.</li>
            <li style={{ marginBottom: 8 }}>We recommend consulting with a qualified attorney or certification consultant for complex applications.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Intellectual Property</h2>
          <p style={pStyle}>
            <strong>Your Data:</strong> You retain full ownership of all data, documents, and information you upload to GovCert. We do not claim any intellectual property rights over your content. You grant us a limited license to use your data solely for the purpose of providing our services to you.
          </p>
          <p style={pStyle}>
            <strong>Our Platform:</strong> The GovCert platform, including its software, design, features, documentation, and branding, is the exclusive property of House Strategies Group LLC. You may not copy, modify, distribute, or reverse-engineer any part of the platform without our written consent.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Limitation of Liability</h2>
          <p style={pStyle}>
            To the maximum extent permitted by law, House Strategies Group LLC and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, business opportunities, or goodwill, arising from your use of the platform.
          </p>
          <p style={pStyle}>
            Our total liability for any claims arising from your use of GovCert shall not exceed the amount you paid to us in subscription fees during the twelve (12) months preceding the claim.
          </p>
          <p style={pStyle}>
            We are not responsible for the outcome of any government certification application. Certification decisions are made solely by the relevant government agencies.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Termination</h2>
          <p style={pStyle}>
            We may suspend or terminate your access to GovCert at any time if you violate these Terms, engage in fraudulent activity, or misuse the platform. Upon termination, your right to use the platform ceases immediately.
          </p>
          <p style={pStyle}>
            You may terminate your account at any time by contacting us. Upon termination, we will retain your data for 30 days to allow for data export, after which it will be permanently deleted unless retention is required by law.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Governing Law</h2>
          <p style={pStyle}>
            These Terms of Service shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the state or federal courts located in Hillsborough County, Florida.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Changes to These Terms</h2>
          <p style={pStyle}>
            We reserve the right to modify these Terms of Service at any time. We will notify you of material changes by posting the updated terms on this page and, where appropriate, sending an email notification. Your continued use of the platform after changes are posted constitutes your acceptance of the updated terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Contact Information</h2>
          <p style={pStyle}>
            For questions about these Terms of Service, please contact us at:
          </p>
          <p style={pStyle}>
            <strong>House Strategies Group LLC</strong><br />
            Tampa, Florida<br />
            Email: <a href="mailto:jelani.house@housestrategiesgroup.com" style={{ color: gold, textDecoration: "none" }}>jelani.house@housestrategiesgroup.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
