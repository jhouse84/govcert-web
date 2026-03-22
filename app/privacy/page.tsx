"use client";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontFamily: bodyFont, fontSize: 14, color: "rgba(74,85,104,.6)", marginBottom: 48 }}>
          Last updated: March 2026
        </p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Introduction</h2>
          <p style={pStyle}>
            GovCert, operated by House Strategies Group LLC ("we", "us", or "our"), located in Tampa, Florida, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our government certification automation platform.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Information We Collect</h2>
          <p style={pStyle}>We collect the following categories of information to facilitate government certification applications:</p>
          <ul style={ulStyle}>
            <li style={{ marginBottom: 8 }}><strong>Business Information:</strong> Company name, address, DUNS/UEI number, CAGE code, NAICS codes, business structure, and SAM.gov registration details.</li>
            <li style={{ marginBottom: 8 }}><strong>Financial Data:</strong> Revenue figures, tax returns, profit and loss statements, balance sheets, and payroll information required for size standard determinations and certification eligibility.</li>
            <li style={{ marginBottom: 8 }}><strong>Personal Information:</strong> Names, email addresses, phone numbers, Social Security Numbers (for certain SBA certifications), resumes, and personal net worth statements of business owners and key personnel.</li>
            <li style={{ marginBottom: 8 }}><strong>Documents:</strong> Business licenses, articles of incorporation, operating agreements, tax returns, financial statements, capability statements, and other documents required for certification applications.</li>
            <li style={{ marginBottom: 8 }}><strong>Account Information:</strong> Login credentials, account preferences, and usage data.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>How We Use Your Information</h2>
          <p style={pStyle}>We use the information we collect to:</p>
          <ul style={ulStyle}>
            <li style={{ marginBottom: 8 }}>Process and manage government certification applications on your behalf.</li>
            <li style={{ marginBottom: 8 }}>Perform AI-powered analysis to assess certification eligibility and identify potential issues with applications.</li>
            <li style={{ marginBottom: 8 }}>Auto-fill application forms with verified data from your uploaded documents and integrated services.</li>
            <li style={{ marginBottom: 8 }}>Send transactional emails including application status updates, compliance reminders, and account notifications.</li>
            <li style={{ marginBottom: 8 }}>Provide customer support and respond to your inquiries.</li>
            <li style={{ marginBottom: 8 }}>Improve and optimize our platform and services.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Third-Party Services</h2>
          <p style={pStyle}>We integrate with the following third-party services to provide our platform:</p>
          <ul style={ulStyle}>
            <li style={{ marginBottom: 8 }}><strong>SendGrid:</strong> For transactional email delivery (application notifications, password resets, compliance reminders).</li>
            <li style={{ marginBottom: 8 }}><strong>Anthropic (Claude AI):</strong> For AI-powered document analysis, eligibility assessment, and application assistance. Your data is processed in accordance with Anthropic's data handling policies and is not used to train AI models.</li>
            <li style={{ marginBottom: 8 }}><strong>QuickBooks / Gusto:</strong> Optional integrations for pulling financial and payroll data required for certification applications. Connected only with your explicit authorization via OAuth.</li>
            <li style={{ marginBottom: 8 }}><strong>SAM.gov:</strong> For verifying business registrations and retrieving publicly available entity data.</li>
          </ul>
          <p style={pStyle}>
            We do not sell, rent, or share your personal information with third parties for their marketing purposes.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Data Storage and Security</h2>
          <p style={pStyle}>
            Your data is stored in a PostgreSQL database hosted on Railway with encryption at rest. All data transmission between your browser and our servers is encrypted via TLS/SSL. We implement industry-standard security measures including password hashing, JWT-based authentication, and role-based access controls.
          </p>
          <p style={pStyle}>
            Uploaded documents are stored securely and access is restricted to authorized users associated with your account.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Data Retention</h2>
          <p style={pStyle}>
            We retain your data for as long as your account is active and as needed to provide you with our services. If you request deletion of your account, we will delete your personal data and documents within 30 days, except where we are required to retain certain records for legal or compliance purposes.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Your Rights</h2>
          <p style={pStyle}>You have the right to:</p>
          <ul style={ulStyle}>
            <li style={{ marginBottom: 8 }}><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li style={{ marginBottom: 8 }}><strong>Correction:</strong> Request correction of inaccurate or incomplete personal data.</li>
            <li style={{ marginBottom: 8 }}><strong>Deletion:</strong> Request deletion of your personal data and account.</li>
            <li style={{ marginBottom: 8 }}><strong>Data Portability:</strong> Request an export of your data in a commonly used format.</li>
          </ul>
          <p style={pStyle}>
            To exercise any of these rights, please contact us using the information provided below.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Changes to This Policy</h2>
          <p style={pStyle}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>Contact Us</h2>
          <p style={pStyle}>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
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
