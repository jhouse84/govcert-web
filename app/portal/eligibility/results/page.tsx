"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const CERT_LABELS: Record<string, string> = {
  GSA_MAS: "GSA Multiple Award Schedule",
  EIGHT_A: "8(a) Business Development",
  WOSB: "Women-Owned Small Business",
  HUBZONE: "HUBZone",
  MBE: "Minority Business Enterprise",
  SDVOSB: "Service-Disabled Veteran-Owned",
  VOSB: "Veteran-Owned Small Business",
  DBE: "Disadvantaged Business Enterprise",
};

const CERT_AGENCIES: Record<string, string> = {
  GSA_MAS: "GSA",
  EIGHT_A: "SBA",
  WOSB: "SBA",
  HUBZONE: "SBA",
  SDVOSB: "VA",
  VOSB: "VA",
  MBE: "State",
  DBE: "State",
};

const CERT_TIMELINES: Record<string, string> = {
  GSA_MAS: "60-90 days",
  EIGHT_A: "90-180 days",
  WOSB: "30-60 days",
  HUBZONE: "60-90 days",
  SDVOSB: "45-90 days",
  VOSB: "45-90 days",
  MBE: "30-90 days",
  DBE: "30-90 days",
};

const STATUS_LABELS: Record<string, string> = {
  ELIGIBLE: "Eligible \u2713",
  LIKELY_ELIGIBLE: "Likely Eligible",
  NEEDS_REVIEW: "More Info Helpful",
  NOT_ELIGIBLE: "May Not Qualify",
  INSUFFICIENT_DATA: "More Info Needed",
};

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  ELIGIBLE: { bg: "rgba(39,174,96,.1)", color: "#27ae60", border: "rgba(39,174,96,.25)" },
  LIKELY_ELIGIBLE: { bg: "rgba(46,204,113,.08)", color: "#2ecc71", border: "rgba(46,204,113,.2)" },
  NEEDS_REVIEW: { bg: "rgba(243,156,18,.1)", color: "#e67e22", border: "rgba(243,156,18,.2)" },
  NOT_ELIGIBLE: { bg: "rgba(231,76,60,.08)", color: "#e74c3c", border: "rgba(231,76,60,.2)" },
  INSUFFICIENT_DATA: { bg: "rgba(149,165,166,.08)", color: "#95a5a6", border: "rgba(149,165,166,.2)" },
};

const STATUS_MESSAGES: Record<string, string> = {
  ELIGIBLE: "Great news! Based on the information you've provided, you appear to meet the key requirements for this certification.",
  LIKELY_ELIGIBLE: "You're looking strong. A few additional details could help confirm your eligibility with even more confidence.",
  NEEDS_REVIEW: "You may qualify \u2014 providing more details would help us confirm. A few data points are still missing or need clarification.",
  NOT_ELIGIBLE: "Based on the information provided, some core requirements may not be met. Review the criteria below for details.",
  INSUFFICIENT_DATA: "We need more information to assess your eligibility. Complete the eligibility questionnaire to get an accurate assessment.",
};

const AVAILABLE_CERTS = ["GSA_MAS", "EIGHT_A"];

const CERT_REQUIREMENTS: Record<string, { documents: string[]; data: string[] }> = {
  EIGHT_A: {
    documents: [
      "Personal Financial Statement (SBA Form 413)",
      "Personal tax returns — last 3 years",
      "Business tax returns — last 3 years",
      "Business financial statements (P&L, Balance Sheet)",
      "Social disadvantage narrative & supporting evidence",
      "Business plan with growth projections",
      "Resumes of key personnel",
      "Organizational chart",
      "Business licenses & registrations",
      "Proof of US citizenship",
    ],
    data: [
      "Owner demographics (ethnicity, gender, disability status)",
      "Personal net worth breakdown (assets minus liabilities)",
      "3-year income history (AGI)",
      "Ownership percentages for all owners",
      "Year business was established",
      "NAICS codes for your services",
    ],
  },
  GSA_MAS: {
    documents: [
      "Business financial statements — last 2 years",
      "Commercial price list or rate card",
      "Past performance references (3+ contracts)",
      "Quality control/management documentation",
      "Capability statement",
      "Past proposals or statements of work",
      "CPARS reports (if available)",
      "SAM.gov registration confirmation",
    ],
    data: [
      "Revenue history — last 2+ years",
      "Employee count",
      "NAICS codes and SIN categories",
      "GSA pricing for each labor category",
      "Past contract details (agency, value, period of performance)",
    ],
  },
  WOSB: {
    documents: [
      "Proof of woman ownership (51%+)",
      "Operating agreement or articles showing control",
      "Proof of US citizenship",
      "Business financial statements",
      "Business tax returns — last 3 years",
    ],
    data: [
      "Owner gender and ownership percentages",
      "Evidence of daily management and control",
      "Business size (revenue by NAICS)",
    ],
  },
  EDWOSB: {
    documents: [
      "All WOSB documents (above)",
      "Personal Financial Statement",
      "Personal tax returns — last 3 years",
      "Proof of economic disadvantage",
    ],
    data: [
      "Personal net worth (must be under $850K)",
      "Average adjusted gross income — last 3 years",
      "Total personal assets",
    ],
  },
  HUBZONE: {
    documents: [
      "Lease or deed for principal office",
      "Employee roster with home addresses",
      "Payroll records showing employee locations",
      "Proof of US citizenship for owners",
    ],
    data: [
      "Principal office ZIP code (must be in HUBZone)",
      "Percentage of employees residing in HUBZone (must be 35%+)",
      "Business size by NAICS",
    ],
  },
  SDVOSB: {
    documents: [
      "VA disability rating letter",
      "DD-214 (Certificate of Release/Discharge)",
      "Operating agreement showing veteran control",
      "Proof of 51%+ veteran ownership",
    ],
    data: [
      "Service-disabled veteran status and rating",
      "Ownership percentages",
      "Evidence of daily management by veteran",
    ],
  },
  VOSB: {
    documents: [
      "DD-214 (Certificate of Release/Discharge)",
      "Operating agreement showing veteran control",
      "Proof of 51%+ veteran ownership",
    ],
    data: [
      "Veteran status verification",
      "Ownership percentages",
      "Evidence of daily management by veteran",
    ],
  },
};

const STATE_CERT_REQUIREMENTS = {
  documents: [
    "State-specific application forms",
    "Proof of minority/disadvantaged status",
    "Business financial statements",
    "Personal financial statement",
    "Business licenses & registrations",
  ],
  data: [
    "Owner demographics and ownership percentages",
    "Business revenue history",
    "Personal net worth information",
  ],
};

const ELIGIBILITY_FIELDS = [
  "entityType", "stateOfIncorporation", "principalAddress", "city", "state", "zip",
  "yearEstablished", "firstRevenueDate", "naicsCodes", "owners",
  "revenueYear1", "revenueYear2", "revenueYear3", "employeeCount",
  "netWorthRange", "agiRange", "totalAssetsRange",
  "hubzoneZip", "hubzoneEmployeePct",
  "samRegistered", "activeContracts", "completedContracts", "cparsAvailable", "pastPerfRefs",
  "existingCerts",
];

function computeCompleteness(eligibilityData: any): number {
  if (!eligibilityData) return 0;
  let filled = 0;
  for (const field of ELIGIBILITY_FIELDS) {
    const val = eligibilityData[field];
    if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) continue;
    filled++;
  }
  return Math.round((filled / ELIGIBILITY_FIELDS.length) * 100);
}

export default function EligibilityResultsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCert, setCreatingCert] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "ADMIN" || parsed.role === "ADVISOR") {
        router.push("/dashboard");
        return;
      }
      setUser(parsed);
    }
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const clients = await apiRequest("/api/clients");
      if (clients && clients.length > 0) {
        const cId = clients[0].id;
        setClientId(cId);

        const data = await apiRequest(`/api/eligibility/${cId}`);
        setEligibility(data);
        setCompleteness(computeCompleteness(data));
        if (data?.assessmentResults) {
          setAssessmentResults(data.assessmentResults);
        }
      }
    } catch (err) {
      console.error("Failed to load eligibility data:", err);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  async function startApplication(certType: string) {
    if (!clientId || creatingCert) return;
    setCreatingCert(certType);
    try {
      const newCert = await apiRequest("/api/certifications", {
        method: "POST",
        body: JSON.stringify({ clientId, type: certType, status: "IN_PROGRESS" }),
      });
      const wizardBase = certType === "EIGHT_A"
        ? `/certifications/${newCert.id}/8a/social-disadvantage`
        : `/certifications/${newCert.id}/corporate`;
      router.push(wizardBase);
    } catch (err: any) {
      if (err.message?.includes("already has")) {
        alert(err.message);
      } else {
        console.error(err);
      }
      setCreatingCert(null);
    }
  }

  const federalAssessments = assessmentResults?.assessments || [];
  const stateAssessments = assessmentResults?.stateCerts || [];
  const recommendedNext = assessmentResults?.recommendedNext;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading your assessment results...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top right, rgba(200,155,60,.03) 0%, transparent 50%), var(--cream)", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "linear-gradient(180deg, #0B1929 0%, #0D1F35 100%)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", flexShrink: 0 }} />
        <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </div>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>My Portal</div>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\u{1F3E0}"}</span> Home
          </a>
          <a href="/portal/applications" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\u{1F4CB}"}</span> My Applications
          </a>
          <a href="/portal/eligibility" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", borderLeft: "3px solid var(--gold)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
            <span>{"\u2705"}</span> Eligibility
          </a>
          <a href="/portal/integrations" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\u{1F517}"}</span> Integrations
          </a>
          <a href="/portal/documents" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\u{1F4C4}"}</span> My Documents
          </a>
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Client Portal</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Eligibility Assessment</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 4 }}>
              Your Eligibility Assessment
            </h1>
            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", borderRadius: 2, marginBottom: 10 }} />
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 640 }}>
              Based on the information you've provided, here's a preliminary look at which certifications you may qualify for.
            </p>
          </div>

          {/* Disclaimer Banner */}
          <div style={{
            background: "linear-gradient(135deg, rgba(232,184,75,.08) 0%, rgba(200,155,60,.12) 100%)",
            border: "1px solid rgba(200,155,60,.25)",
            borderLeft: "4px solid #E8B84B",
            borderRadius: 10,
            padding: "18px 22px",
            marginBottom: 28,
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{"\u26A0\uFE0F"}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#8A6D1B", marginBottom: 6 }}>Important</div>
                <p style={{ fontSize: 12.5, color: "#6B5516", lineHeight: 1.7, margin: 0 }}>
                  This assessment is a preliminary analysis based on the information you've provided. It is not a guarantee of certification approval. Actual eligibility is determined by the certifying agency (SBA, GSA, VA, or your state agency) upon review of your complete application. GovCert provides this assessment as a guide to help you focus your efforts on the most promising certifications. We recommend consulting with a certification specialist for complex situations.
                </p>
              </div>
            </div>
          </div>

          {/* Completeness Indicator */}
          <div style={{
            background: "#fff",
            border: "1px solid rgba(200,155,60,.08)",
            borderRadius: 12,
            padding: "22px 26px",
            marginBottom: 28,
            boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}>
            {/* Progress Ring */}
            <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
              <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(200,155,60,.1)" strokeWidth="6" />
                <circle
                  cx="34" cy="34" r="28" fill="none"
                  stroke="url(#progressGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - completeness / 100)}`}
                  style={{ transition: "stroke-dashoffset .8s ease" }}
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#C89B3C" />
                    <stop offset="100%" stopColor="#E8B84B" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--navy)",
              }}>
                {completeness}%
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
                Data Completeness
              </div>
              <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, margin: 0, marginBottom: 8 }}>
                Your assessment is based on {completeness}% of available data. Providing more information improves accuracy.
              </p>
              <a
                href="/portal/eligibility"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 13, fontWeight: 500, color: "var(--gold)",
                  textDecoration: "none",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#E8B84B"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--gold)"; }}
              >
                Update Your Information {"\u2192"}
              </a>
            </div>
          </div>

          {/* Federal Certifications Section */}
          {federalAssessments.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>Federal Certifications</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>
                Federal Program Results
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {federalAssessments.map((assessment: any, idx: number) => (
                  <AssessmentCard
                    key={assessment.certType || idx}
                    assessment={assessment}
                    onStartApplication={startApplication}
                    creatingCert={creatingCert}
                    eligibilityData={eligibility}
                  />
                ))}
              </div>
            </div>
          )}

          {/* State Certifications Section */}
          {stateAssessments.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>State Certifications</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>
                {stateAssessments[0]?.state ? `${stateAssessments[0].state} Programs` : "State Program Results"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {stateAssessments.map((assessment: any, idx: number) => (
                  <AssessmentCard
                    key={assessment.certType || idx}
                    assessment={assessment}
                    onStartApplication={startApplication}
                    creatingCert={creatingCert}
                    eligibilityData={eligibility}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No results state */}
          {federalAssessments.length === 0 && stateAssessments.length === 0 && (
            <div style={{
              background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12,
              padding: "48px 32px", textAlign: "center" as const, marginBottom: 28,
              boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u{1F4CA}"}</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
                No Assessment Results Yet
              </h3>
              <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 24, maxWidth: 460, margin: "0 auto 24px" }}>
                Complete the eligibility questionnaire so we can analyze which certifications you may qualify for.
              </p>
              <a
                href="/portal/eligibility"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "12px 28px",
                  background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                  border: "none", borderRadius: 8, color: "#fff",
                  fontSize: 14, fontWeight: 500, textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(200,155,60,.35)",
                  transition: "all .2s",
                }}
              >
                Start Eligibility Assessment {"\u2192"}
              </a>
            </div>
          )}

          {/* Recommendation Section */}
          {recommendedNext && (() => {
            const recAssessment = [...federalAssessments, ...stateAssessments].find((a: any) => a.certType === recommendedNext);
            const recScore = recAssessment?.score ?? 0;
            const recTimeline = CERT_TIMELINES[recommendedNext] || "Varies";
            const recCertName = CERT_LABELS[recommendedNext] || recommendedNext;
            const recReqs = CERT_REQUIREMENTS[recommendedNext] || STATE_CERT_REQUIREMENTS;

            const CERT_NEXT_STEPS: Record<string, string[]> = {
              EIGHT_A: [
                "Prepare your social disadvantage narrative with specific examples and supporting evidence",
                "Gather your last 3 years of personal and business tax returns",
                "Complete SBA Form 413 (Personal Financial Statement) for all owners",
                "Compile your business plan with realistic growth projections",
              ],
              GSA_MAS: [
                "Verify your SAM.gov registration is active and current",
                "Prepare a commercial price list or rate card for all labor categories",
                "Gather 3+ past performance references with contract details",
                "Document your quality control processes and procedures",
              ],
              WOSB: [
                "Gather proof of woman ownership showing 51%+ stake",
                "Prepare your operating agreement showing management and control",
                "Collect business financial statements and tax returns",
                "Verify your business meets SBA size standards for your NAICS codes",
              ],
              EDWOSB: [
                "Complete all WOSB documentation requirements first",
                "Prepare your Personal Financial Statement showing net worth under $850K",
                "Gather personal tax returns for the last 3 years",
                "Compile documentation proving economic disadvantage",
              ],
              HUBZONE: [
                "Verify your principal office address is in a designated HUBZone",
                "Compile an employee roster with home addresses to confirm 35%+ reside in HUBZones",
                "Gather payroll records documenting employee locations",
                "Confirm your business meets SBA size standards",
              ],
              SDVOSB: [
                "Obtain your VA disability rating letter documenting service-connected disability",
                "Gather your DD-214 (Certificate of Release/Discharge from Active Duty)",
                "Prepare operating agreement showing veteran daily management and control",
                "Document 51%+ ownership by the service-disabled veteran",
              ],
              VOSB: [
                "Gather your DD-214 (Certificate of Release/Discharge from Active Duty)",
                "Prepare operating agreement showing veteran daily management and control",
                "Document 51%+ ownership by the veteran",
                "Register and verify through the SBA VetCert portal",
              ],
            };

            const defaultNextSteps = [
              "Review the required documents list above and begin gathering materials",
              "Ensure all business registrations and licenses are current",
              "Complete the eligibility questionnaire with any missing information",
              "Contact a certification specialist if you have questions about requirements",
            ];

            const nextSteps = CERT_NEXT_STEPS[recommendedNext] || defaultNextSteps;

            return (
              <div style={{
                background: "linear-gradient(135deg, #0B1929 0%, #1A3357 50%, #0B1929 100%)",
                borderRadius: 12,
                padding: "32px 34px",
                marginBottom: 28,
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg, #C89B3C, #E8B84B)",
                }} />

                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, boxShadow: "0 4px 16px rgba(200,155,60,.3)",
                  }}>
                    <span style={{ fontSize: 22, color: "#fff" }}>{"\u2726"}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 6 }}>Our Recommendation</div>
                    <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', serif", color: "#fff", fontWeight: 400, lineHeight: 1.3, marginBottom: 8 }}>
                      Start with <strong style={{ color: "var(--gold2)" }}>{recCertName}</strong>
                    </div>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,.7)", lineHeight: 1.7, margin: 0 }}>
                      Based on your profile, {recCertName} has the highest eligibility score at {recScore}%.
                      {recTimeline !== "Varies" && ` This certification also has a processing time of ${recTimeline}, making it an efficient starting point.`}
                      {recScore >= 70 && " Your strong score suggests a solid foundation for a successful application."}
                      {recScore >= 50 && recScore < 70 && " With some additional documentation, you have a good chance of qualifying."}
                    </p>
                  </div>
                </div>

                {/* Next steps */}
                <div style={{
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 10,
                  padding: "20px 24px",
                  marginBottom: 24,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--gold2)", marginBottom: 14 }}>
                    What You Should Do First
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {nextSteps.map((step: string, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: "rgba(200,155,60,.2)", border: "1px solid rgba(200,155,60,.3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: "var(--gold2)", flexShrink: 0, marginTop: 1,
                        }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)", lineHeight: 1.5 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {AVAILABLE_CERTS.includes(recommendedNext) ? (
                    <button
                      onClick={() => startApplication(recommendedNext)}
                      disabled={!!creatingCert}
                      style={{
                        padding: "14px 32px",
                        background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                        border: "none", borderRadius: 8, color: "#fff",
                        fontSize: 15, fontWeight: 600, cursor: creatingCert ? "wait" : "pointer",
                        boxShadow: "0 4px 20px rgba(200,155,60,.35)",
                        transition: "all .2s", flexShrink: 0,
                        opacity: creatingCert ? 0.7 : 1,
                      }}
                    >
                      {creatingCert === recommendedNext ? "Creating..." : `Start This Application \u2192`}
                    </button>
                  ) : (
                    <span style={{
                      padding: "14px 28px", borderRadius: 8,
                      background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
                      color: "rgba(255,255,255,.45)", fontSize: 14, fontWeight: 500, flexShrink: 0,
                    }}>
                      Coming Soon
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                    Estimated processing: {recTimeline}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Bottom Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 40 }}>
            {/* Managed Service CTA */}
            <div style={{
              background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12,
              padding: "22px 20px",
              boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{"\u2726"}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Want help with your applications?</div>
              <p style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 14 }}>
                Our managed service team can handle the entire certification process for you. You just review and approve.
              </p>
              <a
                href="/portal/upgrade"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "8px 18px",
                  background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                  border: "none", borderRadius: 6, color: "#fff",
                  fontSize: 12, fontWeight: 500, textDecoration: "none",
                  boxShadow: "0 2px 12px rgba(200,155,60,.25)",
                }}
              >
                Learn More {"\u2192"}
              </a>
            </div>

            {/* Update Info */}
            <div style={{
              background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12,
              padding: "22px 20px",
              boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{"\u{1F4DD}"}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Need to update your information?</div>
              <p style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 14 }}>
                Adding more details improves the accuracy of your assessment. You can update your eligibility data at any time.
              </p>
              <a
                href="/portal/eligibility"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "8px 18px",
                  background: "transparent",
                  border: "1px solid var(--gold)",
                  borderRadius: 6, color: "var(--gold)",
                  fontSize: 12, fontWeight: 500, textDecoration: "none",
                }}
              >
                Update Information {"\u2192"}
              </a>
            </div>

            {/* Questions */}
            <div style={{
              background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12,
              padding: "22px 20px",
              boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{"\u{1F4AC}"}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Have questions?</div>
              <p style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 14 }}>
                Use the chat widget in the bottom-right corner to ask questions about your eligibility or the certification process.
              </p>
              <span style={{ fontSize: 12, color: "var(--ink4)", fontStyle: "italic" }}>
                Look for the chat icon below {"\u2198\uFE0F"}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


/* ─── Assessment Card Component ─── */
function AssessmentCard({
  assessment,
  onStartApplication,
  creatingCert,
  eligibilityData,
}: {
  assessment: any;
  onStartApplication: (type: string) => void;
  creatingCert: string | null;
  eligibilityData: any;
}) {
  const status = assessment.status || "INSUFFICIENT_DATA";
  const sc = STATUS_COLORS[status] || STATUS_COLORS.INSUFFICIENT_DATA;
  const certType = assessment.certType || "";
  const certName = CERT_LABELS[certType] || assessment.certName || certType;
  const agency = CERT_AGENCIES[certType] || "Federal";
  const timeline = CERT_TIMELINES[certType] || "Varies";
  const score = assessment.score ?? 0;
  const criteria = assessment.criteriaResults || [];
  const actionsRequired = assessment.actionsRequired || [];
  const aiSummary = assessment.aiSummary || assessment.summary || "";
  const isStartable = AVAILABLE_CERTS.includes(certType) && (status === "ELIGIBLE" || status === "LIKELY_ELIGIBLE");
  const isReview = status === "NEEDS_REVIEW" || status === "INSUFFICIENT_DATA";

  return (
    <div style={{
      background: "#fff",
      border: "1px solid rgba(200,155,60,.08)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.03)",
      transition: "all .25s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08), 0 16px 48px rgba(0,0,0,.05)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.03)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Card Header */}
      <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid rgba(200,155,60,.06)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" as const }}>
              <span style={{
                display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600,
                padding: "3px 10px", borderRadius: 100,
                background: "var(--navy)", color: "var(--gold2)",
                letterSpacing: ".04em", textTransform: "uppercase" as const,
              }}>{agency}</span>
              <span style={{
                display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600,
                padding: "3px 12px", borderRadius: 100,
                background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
              }}>
                {STATUS_LABELS[status] || status}
              </span>
              <span style={{ fontSize: 12, color: "var(--ink4)" }}>
                Est. {timeline}
              </span>
            </div>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 24,
              color: "var(--navy)", fontWeight: 400, lineHeight: 1.2, margin: 0,
            }}>
              {certName}
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5, marginTop: 6, marginBottom: 0 }}>
              {STATUS_MESSAGES[status]}
            </p>
          </div>

          {/* Score Circle */}
          <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(200,155,60,.08)" strokeWidth="5" />
              <circle
                cx="36" cy="36" r="30" fill="none"
                stroke={sc.color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - score / 100)}`}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: sc.color, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 9, color: "var(--ink4)", marginTop: 1 }}>SCORE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Checklist */}
      {criteria.length > 0 && (
        <div style={{ padding: "18px 26px", borderBottom: "1px solid rgba(200,155,60,.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink4)", marginBottom: 12 }}>
            Eligibility Criteria
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {criteria.map((c: any, i: number) => {
              const met = c.met;
              const icon = met === true ? "\u2713" : met === false ? "\u2717" : "?";
              const iconColor = met === true ? "#27ae60" : met === false ? "#e74c3c" : "#e67e22";
              const iconBg = met === true ? "rgba(39,174,96,.08)" : met === false ? "rgba(231,76,60,.06)" : "rgba(230,126,34,.08)";
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: iconColor, flexShrink: 0, marginTop: 1,
                  }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{c.criterion || c.name}</div>
                    {c.detail && <div style={{ fontSize: 12, color: "var(--ink4)", lineHeight: 1.5, marginTop: 2 }}>{c.detail}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions Required */}
      {actionsRequired.length > 0 && (
        <div style={{ padding: "18px 26px", borderBottom: "1px solid rgba(200,155,60,.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink4)", marginBottom: 12 }}>
            To Improve Your Eligibility
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {actionsRequired.map((action: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#e67e22", fontSize: 10, marginTop: 4, flexShrink: 0 }}>{"\u25CF"}</span>
                <span style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <div style={{ padding: "18px 26px", borderBottom: "1px solid rgba(200,155,60,.06)" }}>
          <div style={{
            background: "rgba(232,184,75,.04)",
            border: "1px solid rgba(200,155,60,.15)",
            borderLeft: "3px solid #E8B84B",
            borderRadius: 8,
            padding: "14px 18px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>
              AI Analysis
            </div>
            <p style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.7, margin: 0 }}>
              {aiSummary}
            </p>
          </div>
        </div>
      )}

      {/* What You'll Need to Apply */}
      {(() => {
        const reqs = CERT_REQUIREMENTS[certType] || STATE_CERT_REQUIREMENTS;
        // Determine which items are likely already provided based on eligibility data
        const hasFinancials = !!(eligibilityData?.revenueYear1 || eligibilityData?.revenueYear2 || eligibilityData?.revenueYear3);
        const hasOwners = !!(eligibilityData?.owners && eligibilityData.owners.length > 0);
        const hasNaics = !!(eligibilityData?.naicsCodes && eligibilityData.naicsCodes.length > 0);
        const hasNetWorth = !!eligibilityData?.netWorthRange;
        const hasAgi = !!eligibilityData?.agiRange;
        const hasAssets = !!eligibilityData?.totalAssetsRange;
        const hasEmployees = !!eligibilityData?.employeeCount;
        const hasYearEstablished = !!eligibilityData?.yearEstablished;
        const hasSam = !!eligibilityData?.samRegistered;
        const hasPastPerf = !!(eligibilityData?.pastPerfRefs || eligibilityData?.completedContracts);
        const hasCpars = !!eligibilityData?.cparsAvailable;
        const hasHubzoneZip = !!eligibilityData?.hubzoneZip;
        const hasHubzonePct = !!eligibilityData?.hubzoneEmployeePct;
        const hasAddress = !!(eligibilityData?.principalAddress || eligibilityData?.zip);

        function isDocLikelyProvided(doc: string): boolean {
          const d = doc.toLowerCase();
          if (d.includes("financial statement") && !d.includes("personal")) return hasFinancials;
          if (d.includes("personal financial statement")) return hasNetWorth;
          if (d.includes("tax return") && d.includes("business")) return hasFinancials;
          if (d.includes("tax return") && d.includes("personal")) return hasAgi;
          if (d.includes("sam.gov")) return hasSam;
          if (d.includes("past performance") || d.includes("past proposals")) return hasPastPerf;
          if (d.includes("cpars")) return hasCpars;
          if (d.includes("business license")) return hasYearEstablished;
          if (d.includes("lease") || d.includes("deed")) return hasAddress;
          if (d.includes("employee roster") || d.includes("payroll")) return hasEmployees;
          return false;
        }

        function isDataLikelyProvided(item: string): boolean {
          const d = item.toLowerCase();
          if (d.includes("revenue")) return hasFinancials;
          if (d.includes("employee count") || d.includes("employee")) return hasEmployees;
          if (d.includes("naics") || d.includes("sin")) return hasNaics;
          if (d.includes("ownership percentage") || d.includes("owner")) return hasOwners;
          if (d.includes("net worth")) return hasNetWorth;
          if (d.includes("agi") || d.includes("adjusted gross") || d.includes("income history")) return hasAgi;
          if (d.includes("total") && d.includes("asset")) return hasAssets;
          if (d.includes("year") && d.includes("established")) return hasYearEstablished;
          if (d.includes("hubzone") && d.includes("zip")) return hasHubzoneZip;
          if (d.includes("hubzone") && d.includes("employee")) return hasHubzonePct;
          if (d.includes("past contract") || d.includes("period of performance")) return hasPastPerf;
          if (d.includes("demographics") || d.includes("gender") || d.includes("ethnicity")) return hasOwners;
          if (d.includes("business size")) return hasFinancials;
          return false;
        }

        return (
          <div style={{ padding: "18px 26px", borderBottom: "1px solid rgba(200,155,60,.06)" }}>
            <div style={{ marginTop: 0, padding: "16px 20px", background: "rgba(200,155,60,.04)", border: "1px solid rgba(200,155,60,.12)", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--gold)", marginBottom: 10 }}>What You&apos;ll Need to Apply</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 6 }}>{"\uD83D\uDCC4"} Required Documents</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {reqs.documents.map((doc: string, i: number) => {
                      const provided = isDocLikelyProvided(doc);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ fontSize: 10, color: provided ? "#27ae60" : "var(--ink4)", marginTop: 2, flexShrink: 0 }}>
                            {provided ? "\u2713" : "\u2022"}
                          </span>
                          <span style={{ fontSize: 11, color: provided ? "var(--ink3)" : "var(--ink3)", lineHeight: 1.5, textDecoration: provided ? "none" : "none" }}>
                            {doc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 6 }}>{"\uD83D\uDCCA"} Required Data</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {reqs.data.map((item: string, i: number) => {
                      const provided = isDataLikelyProvided(item);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ fontSize: 10, color: provided ? "#27ae60" : "var(--ink4)", marginTop: 2, flexShrink: 0 }}>
                            {provided ? "\u2713" : "\u2022"}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--ink3)", lineHeight: 1.5 }}>
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Card Actions */}
      <div style={{ padding: "16px 26px", display: "flex", gap: 12, alignItems: "center" }}>
        {isStartable && (
          <button
            onClick={() => onStartApplication(certType)}
            disabled={!!creatingCert}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
              border: "none", borderRadius: 8, color: "#fff",
              fontSize: 13, fontWeight: 500, cursor: creatingCert ? "wait" : "pointer",
              boxShadow: "0 4px 20px rgba(200,155,60,.35)",
              transition: "all .2s",
              opacity: creatingCert ? 0.7 : 1,
            }}
          >
            {creatingCert === certType ? "Creating..." : `Start Application \u2192`}
          </button>
        )}
        {!isStartable && AVAILABLE_CERTS.includes(certType) && status === "NEEDS_REVIEW" && (
          <button
            onClick={() => onStartApplication(certType)}
            disabled={!!creatingCert}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
              border: "none", borderRadius: 8, color: "#fff",
              fontSize: 13, fontWeight: 500, cursor: creatingCert ? "wait" : "pointer",
              boxShadow: "0 4px 20px rgba(200,155,60,.35)",
              transition: "all .2s",
              opacity: creatingCert ? 0.7 : 1,
            }}
          >
            {creatingCert === certType ? "Creating..." : `Start Application \u2192`}
          </button>
        )}
        {!AVAILABLE_CERTS.includes(certType) && (status === "ELIGIBLE" || status === "LIKELY_ELIGIBLE") && (
          <span style={{
            padding: "10px 20px", borderRadius: 8,
            background: "var(--navy)", border: "1px solid rgba(200,155,60,.2)",
            color: "var(--gold2)", fontSize: 12, fontWeight: 500,
          }}>
            Coming Soon
          </span>
        )}
        {isReview && (
          <a
            href="/portal/eligibility"
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "10px 24px",
              background: "transparent",
              border: "1px solid var(--gold)",
              borderRadius: 8, color: "var(--gold)",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              transition: "all .2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(200,155,60,.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Provide More Details {"\u2192"}
          </a>
        )}
      </div>
    </div>
  );
}
