"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import FinancialReadiness from "@/components/FinancialReadiness";
import { OASIS_SECTIONS, OASIS_DOMAINS, OASIS_SOLICITATION_TYPES, OASIS_SCORING_CATEGORIES } from "@/lib/oasis-domains";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtCurrency(v: string | number | undefined): string {
  if (!v) return "--";
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return "--";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function calcAAV(totalValue: string, startDate: string, endDate: string): string {
  const val = parseFloat(String(totalValue).replace(/[^0-9.]/g, ""));
  if (!val || !startDate || !endDate) return "--";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const years = (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years <= 0) return "--";
  return fmtCurrency(val / years);
}

const STANDARD_CERTS: Record<string, string> = {
  "iso-9001": "ISO 9001 — Quality Management",
  "iso-27001": "ISO 27001 — Information Security",
  "iso-20000": "ISO 20000 — IT Service Management",
  "cmmi-dev": "CMMI Dev — Development",
  "cmmi-svc": "CMMI SVC — Services",
  "as9100": "AS9100 — Aerospace Quality",
  "soc-2": "SOC 2 — Service Organization Controls",
};

/* ------------------------------------------------------------------ */
/*  Shared inline-style constants                                      */
/* ------------------------------------------------------------------ */

const cardStyle: React.CSSProperties = {
  background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)",
  padding: "28px 32px", marginBottom: 20, boxShadow: "var(--shadow)",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em",
  color: "var(--gold)", marginBottom: 4,
};
const sectionTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)",
  fontWeight: 400, marginBottom: 16,
};
const fieldRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "8px 0", borderBottom: "1px solid var(--border)",
};
const fieldLabel: React.CSSProperties = { fontSize: 12, color: "var(--ink4)", fontWeight: 500 };
const fieldValue: React.CSSProperties = { fontSize: 13, color: "var(--navy)", fontWeight: 500, textAlign: "right" as const };
const copyBtnBase: React.CSSProperties = {
  padding: "4px 14px", background: "var(--cream)", border: "1px solid var(--border2)",
  borderRadius: "var(--r)", color: "var(--navy)", fontSize: 11, fontWeight: 500, cursor: "pointer",
  whiteSpace: "nowrap" as const,
};
const narrativeBox: React.CSSProperties = {
  padding: "14px 16px", background: "var(--cream)", borderRadius: "var(--r)",
  fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const,
  maxHeight: 200, overflowY: "auto" as const,
};
const chipStyle: React.CSSProperties = {
  padding: "5px 14px", borderRadius: 100, background: "var(--cream)",
  border: "1px solid var(--border)", fontSize: 12, fontWeight: 500, color: "var(--navy)",
};
const checkMark: React.CSSProperties = {
  width: 22, height: 22, borderRadius: "50%", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0,
};
const accordionHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  cursor: "pointer", userSelect: "none" as const,
};

/* ------------------------------------------------------------------ */
/*  OASIS+ Submission Checklist                                        */
/* ------------------------------------------------------------------ */

const OASIS_PLUS_CHECKLIST = [
  { id: "pastPerformance", label: "Past Performance (min. 5 Relevant Contracts with CPARS Ratings)",
    what: "Documentation of at least 5 relevant government contracts with CPARS (Contractor Performance Assessment Reporting System) ratings. Each must demonstrate work in the domain(s) you are proposing for, with ratings of Satisfactory or above.",
    where: "Log into CPARS at cpars.gov to pull your official ratings. If you don't have CPARS access, contact your Contracting Officer's Representative (COR) from each contract to request copies of completed evaluations.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Proposal → Past Performance tab → upload CPARS report PDFs and complete the Attachment J.P-6 Past Performance Rating Form for each contract.",
    format: "PDF. Official CPARS report exports or scanned signed evaluations. One file per contract recommended. Include contract number, agency, period of performance, and final rating.",
    docCategory: "CONTRACT",
  },
  { id: "relevantExperience", label: "Relevant Experience by Domain",
    what: "Narrative and supporting documentation demonstrating your company's relevant experience in each OASIS+ domain you are proposing (Management & Advisory, Technical & Engineering, Intelligence Services, etc.). Must align with the domain-specific evaluation criteria in the solicitation.",
    where: "GovCert compiled your domain experience from qualifying projects and contract history. Review in the Qualifying Projects section. Supplement with project summaries, SOWs, and deliverable examples.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Qualifying Projects tab → enter each project's details and upload supporting narratives per the Attachment J.P-3 Project Verification Form.",
    format: "Use the J.P-3 template (available in the solicitation documents on SAM.gov). One completed form per qualifying project. PDF format.",
    docCategory: "CONTRACT",
  },
  { id: "accountingSystem", label: "Accounting System Documentation (DCAA-Compliant)",
    what: "Evidence that your accounting system is adequate for cost-type contracts. Ideally a DCAA (Defense Contract Audit Agency) pre-award survey or audit opinion letter. If not DCAA-audited, provide documentation of your system's compliance with FAR 16.301-3 and DFARS 252.242-7006.",
    where: "If you have a DCAA audit, request a copy of the SF 1408 Pre-Award Survey from DCAA. If not yet audited, your CPA can prepare an accounting system description with your chart of accounts, timekeeping procedures, and indirect rate structure.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Business Systems section → upload your DCAA audit letter or accounting system adequacy documentation.",
    format: "PDF. DCAA audit letter preferred. Alternatively, a CPA-prepared accounting system description (10-20 pages) covering cost segregation, timekeeping, billing, and indirect rate methodology.",
    docCategory: "FINANCIAL_STATEMENT",
  },
  { id: "ociPlan", label: "Organizational Conflict of Interest (OCI) Plan",
    what: "A written plan describing how your organization identifies, mitigates, and avoids organizational conflicts of interest per FAR Subpart 9.5. Required for all OASIS+ offerors to demonstrate you can manage potential conflicts across multiple task orders.",
    where: "Your contracts or legal team should draft this. It should cover your current contract portfolio, describe potential conflicts, and outline mitigation procedures. Templates are available from GSA OASIS+ resources.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Required Documents → upload your OCI Mitigation Plan as a standalone PDF.",
    format: "PDF. Typically 5-15 pages. Must address FAR 9.505 requirements, include specific mitigation strategies, and be signed by an authorized company official.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "subcontractingPlan", label: "Small Business Subcontracting Plan (if applicable)",
    what: "Required for large businesses proposing on the Unrestricted pool. Details your plan to subcontract work to small businesses, including percentage goals by category (SDB, WOSB, HUBZone, SDVOSB, etc.). Small businesses are exempt.",
    where: "Your contracts team or small business liaison officer prepares this. Use the SBA's subcontracting plan template or the format specified in the OASIS+ solicitation. Include historical subcontracting data and projected goals.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Required Documents → Subcontracting Plan section → upload the completed plan.",
    format: "PDF. Follow the format in FAR 52.219-9. Must include specific dollar and percentage goals per small business category, a description of outreach efforts, and the name of your small business liaison.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "corporateExperience", label: "Corporate Experience Narrative per Domain",
    what: "A written narrative for each domain describing your company's corporate-level capabilities, experience depth, and competitive differentiators. This is separate from individual project write-ups — it tells the story of your organization's expertise in that domain.",
    where: "GovCert drafted domain narratives from your capability statement and past performance. Review them in each domain's section. Refine to emphasize breadth of experience, key differentiators, and workforce depth.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Qualifying Projects tab → Corporate Experience section → paste or upload narratives per domain.",
    format: "Text narrative or PDF. Typically 2-5 pages per domain. Should reference specific contracts, NAICS codes, and quantified outcomes.",
    docCategory: "CAPABILITY_STATEMENT",
  },
  { id: "keyPersonnel", label: "Key Personnel Resumes",
    what: "Professional resumes for key personnel who will lead OASIS+ task order execution — typically your Program Manager, Project Managers, and domain-specific technical leads. Resumes should emphasize relevant government contract experience and clearances.",
    where: "Collect updated resumes from each key person. Ensure they highlight relevant certifications (PMP, ITIL, etc.), security clearances, and specific contract experience aligned with your proposed domains.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Key Personnel section → upload individual resume PDFs for each named key person.",
    format: "PDF. Standard professional resume, 2-4 pages each. Include education, certifications, clearance level, and relevant contract experience with contract numbers where possible.",
    docCategory: "RESUME",
  },
  { id: "samRegistration", label: "SAM.gov Registration (Active, Matching NAICS)",
    what: "Your company must have an active SAM.gov registration with the correct NAICS codes and size standard for each domain you're proposing. The UEI, CAGE code, and entity information in your proposal must exactly match your SAM.gov record.",
    where: "Log into SAM.gov → Entity Management → verify your registration is active and not expired. Confirm your NAICS codes include those required for your selected OASIS+ domains. Update if needed (changes take 24-48 hours).",
    sbaPortal: "The Symphony Portal auto-validates against SAM.gov. Ensure your UEI is entered correctly in Tab 1 (Company Information). Mismatches will flag errors during submission.",
    format: "No upload needed — verified electronically. Print a SAM.gov entity registration summary PDF for your records. Ensure registration does not expire before the proposal deadline.",
    docCategory: null,
  },
  { id: "financialStatements", label: "Financial Statements Demonstrating Viability",
    what: "Audited or reviewed financial statements for the 3 most recent fiscal years — Balance Sheet, Income Statement, and Cash Flow Statement. GSA evaluates your financial viability and ability to perform on potentially large task orders.",
    where: "Your CPA or accounting firm prepares these. Audited statements carry more weight than reviewed or compiled. If publicly traded, use your SEC filings (10-K). Ensure statements show the legal entity name that matches your SAM.gov registration.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Required Documents → Financial Statements section → upload each year's statements as separate PDFs.",
    format: "PDF. Audited financial statements preferred. Must include Balance Sheet, Income Statement, and Cash Flow Statement for each year. CPA letter or audit opinion should be included.",
    docCategory: "FINANCIAL_STATEMENT",
  },
  { id: "qualityManagement", label: "Quality Management System Documentation",
    what: "Documentation of your Quality Management System (QMS) — ISO 9001 certification, CMMI appraisal, or equivalent. Demonstrates your organization maintains consistent quality standards in service delivery. Even without formal certification, document your QMS processes.",
    where: "If ISO 9001 certified, obtain a copy of your current certificate from your registrar. For CMMI, get your appraisal letter from the CMMI Institute. If neither, prepare a QMS description covering your quality policy, procedures, and continuous improvement processes.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Business Systems → Certifications section → upload your ISO/CMMI certificate or QMS documentation.",
    format: "PDF. Current ISO 9001 certificate or CMMI appraisal letter preferred. Alternatively, a QMS policy document (5-10 pages) describing quality processes, metrics, and corrective action procedures.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "securityClearance", label: "Security Clearance Documentation (if applicable)",
    what: "Facility Clearance Letter (FCL) from DCSA (Defense Counterintelligence and Security Agency) if your company holds or requires a facility security clearance. Many OASIS+ task orders require cleared facilities and personnel for classified work.",
    where: "Request your FCL verification letter through NISS (National Industrial Security System) at dcsa.mil. Your Facility Security Officer (FSO) can pull this. If you don't have an FCL, note this — it's scored but not always required.",
    sbaPortal: "In the Symphony Portal (idiq.gsa.gov) → Business Systems → Security Clearance section → upload your FCL letter or DCSA verification.",
    format: "PDF. Official DCSA/NISS FCL verification letter showing clearance level (Confidential, Secret, Top Secret), facility name, and cage code. Must be current and not expired.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OASISSubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Application data slices
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [solicitation, setSolicitation] = useState("unrestricted");
  const [scorecardData, setScorecardData] = useState<Record<string, Record<string, number>>>({});
  const [qps, setQps] = useState<any[]>([]);
  const [ppData, setPPData] = useState<any[]>([]);
  const [feData, setFEData] = useState<any[]>([]);
  const [systemsData, setSystemsData] = useState<any>(null);
  const [contractHistory, setContractHistory] = useState<any[]>([]);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});
  const [clientDocs, setClientDocs] = useState<Record<string, any[]>>({});

  // Accordion state — all expanded by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    company: true, domains: true, qps: true, pp: true,
    fep: true, systems: true, docs: true, review: true,
  });

  function toggle(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  /* ---- data fetch ---- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-submit");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      setClient(data.client || null);
      const app = data.application;
      if (app?.oasisDomains) try { setSelectedDomains(JSON.parse(app.oasisDomains)); } catch {}
      if (app?.oasisSolicitation) setSolicitation(app.oasisSolicitation);
      if (app?.oasisScorecardData) try { setScorecardData(JSON.parse(app.oasisScorecardData)); } catch {}
      if (app?.oasisQPData) try { setQps(JSON.parse(app.oasisQPData)); } catch {}
      if (app?.oasisPPData) try { setPPData(JSON.parse(app.oasisPPData)); } catch {}
      if (app?.oasisFEPData) try { setFEData(JSON.parse(app.oasisFEPData)); } catch {}
      if (app?.oasisSystemsData) try { setSystemsData(JSON.parse(app.oasisSystemsData)); } catch {}
      if (app?.oasisContractHistory) {
        try {
          const ch = JSON.parse(app.oasisContractHistory);
          setContractHistory(ch.contracts || []);
        } catch {}
      }

      const completed: Record<string, boolean> = {};
      if (app) {
        if (app.oasisDomains) completed["domains"] = true;
        if (app.oasisScorecardData) completed["scorecard"] = true;
        if (app.oasisQPData) completed["qualifying-projects"] = true;
        if (app.oasisPPData) completed["past-performance"] = true;
        if (app.oasisFEPData) completed["federal-experience"] = true;
        if (app.oasisSystemsData) completed["systems-certs"] = true;
      }
      setCompletedSections(completed);

      // Fetch all client documents grouped by category
      if (data.clientId) {
        try {
          const allCats = "FINANCIAL_STATEMENT,CONTRACT,CERTIFICATION_DOCUMENT,CAPABILITY_STATEMENT,RESUME,TAX_RETURN,BANK_STATEMENT,BUSINESS_LICENSE,INVOICE,OTHER";
          const docs = await apiRequest(`/api/upload/documents/by-category/${data.clientId}/${allCats}`);
          const grouped: Record<string, any[]> = {};
          for (const doc of docs) {
            if (!grouped[doc.category]) grouped[doc.category] = [];
            grouped[doc.category].push(doc);
          }
          setClientDocs(grouped);
        } catch {}
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  /* ---- clipboard ---- */
  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function CopyBtn({ text, label }: { text: string; label: string }) {
    return (
      <button onClick={() => copyText(text, label)} style={copyBtnBase}>
        {copied === label ? "\u2713 Copied!" : "Copy"}
      </button>
    );
  }

  /* ---- derived ---- */
  const solType = OASIS_SOLICITATION_TYPES.find(s => s.id === solicitation);
  const solKey = solicitation === "unrestricted" ? "unrestricted" : "smallBusiness";

  // Completeness scoring
  const sectionStatuses = [
    { key: "company", label: "Company Information", done: !!(client?.businessName && client?.uei) },
    { key: "domains", label: "Domain Selection", done: completedSections["domains"] },
    { key: "scorecard", label: "Self-Scoring", done: completedSections["scorecard"] },
    { key: "qps", label: "Qualifying Projects", done: completedSections["qualifying-projects"] },
    { key: "pp", label: "Past Performance", done: completedSections["past-performance"] },
    { key: "fep", label: "Federal Experience", done: completedSections["federal-experience"] },
    { key: "systems", label: "Systems & Certifications", done: completedSections["systems-certs"] },
  ];
  const completedCount = sectionStatuses.filter(s => s.done).length;
  const completenessPercent = Math.round((completedCount / sectionStatuses.length) * 100);

  /* ---- loading / error ---- */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      {/* ---- Sidebar ---- */}
      <CertSidebar user={user} certId={certId} activePage="submit" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {OASIS_SECTIONS.map(section => {
            const isActive = section.id === "submit";
            const isComplete = completedSections[section.id];
            return (
              <a key={section.id} href={`/certifications/${certId}/oasis-plus/${section.id}`} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: "var(--r)",
                background: isActive ? "rgba(200,155,60,.15)" : "transparent",
                border: isActive ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
                color: isActive ? "var(--gold2)" : isComplete ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)",
                textDecoration: "none", fontSize: 12.5, fontWeight: isActive ? 500 : 400, marginBottom: 1,
              }}>
                <span style={{ ...checkMark, width: 18, height: 18, fontSize: 9, background: isComplete ? "var(--green)" : "rgba(255,255,255,.08)", border: isComplete ? "none" : "1px solid rgba(255,255,255,.15)", color: isComplete ? "#fff" : "rgba(255,255,255,.3)" }}>
                  {isComplete ? "\u2713" : ""}
                </span>
                {section.label}
              </a>
            );
          })}
        </div>
      } />

      {/* ---- Main Content ---- */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
          {/* Breadcrumb */}
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            &larr; Back to Application
          </a>

          {/* Page Header */}
          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              GSA OASIS+ &mdash; Step 8 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              OSP Submission Companion
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 720 }}>
              Your complete OASIS+ application data organized by Symphony Portal (OSP) submission tabs.
              Use the copy buttons to transfer each field directly into the portal at{" "}
              <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", fontWeight: 500 }}>idiq.gsa.gov</a>.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}

          {/* ============================================================ */}
          {/*  Overall Completeness Banner                                  */}
          {/* ============================================================ */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 28, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 4 }}>Application Readiness</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "#fff", fontWeight: 300, lineHeight: 1 }}>
                  {completenessPercent}<span style={{ fontSize: 24 }}>%</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>{completedCount} of {sectionStatuses.length} data sections populated</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={`/certifications/${certId}/oasis-plus/review`} style={{
                  padding: "12px 22px", background: "rgba(99,102,241,.85)", border: "none",
                  borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600,
                  textDecoration: "none", boxShadow: "0 4px 20px rgba(99,102,241,.3)",
                }}>
                  Run GovCert Analysis
                </a>
                <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{
                  padding: "12px 22px",
                  background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                  border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600,
                  textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.3)",
                }}>
                  Open OASIS+ Symphony Portal &rarr;
                </a>
              </div>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${completenessPercent}%`, background: "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
            </div>
          </div>

          {cert?.clientId && <FinancialReadiness clientId={cert.clientId} certType="OASIS_PLUS" />}

          {/* ============================================================ */}
          {/*  TAB 1 — Company Information                                  */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("company")}>
              <div>
                <div style={sectionLabel}>Tab 1 &mdash; Company Information</div>
                <div style={sectionTitle}>Entity Registration &amp; Point of Contact</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CopyBtn label="company-all" text={[
                  `Legal Business Name: ${client?.businessName || ""}`,
                  `UEI: ${client?.uei || ""}`,
                  `CAGE Code: ${client?.cageCode || ""}`,
                  `Address: ${[client?.address, client?.city, client?.state, client?.zip].filter(Boolean).join(", ")}`,
                  `Phone: ${client?.phone || ""}`,
                  `Email: ${client?.email || ""}`,
                  `Website: ${client?.website || ""}`,
                ].join("\n")} />
                <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.company ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
              </div>
            </div>
            {expanded.company && (
              <div style={{ marginTop: 16 }}>
                {[
                  { label: "Legal Business Name", value: client?.businessName },
                  { label: "UEI (Unique Entity Identifier)", value: client?.uei },
                  { label: "CAGE Code", value: client?.cageCode },
                  { label: "EIN / Tax ID", value: client?.ein },
                  { label: "Address", value: client?.address },
                  { label: "City", value: client?.city },
                  { label: "State", value: client?.state },
                  { label: "ZIP Code", value: client?.zip },
                  { label: "Phone", value: client?.phone },
                  { label: "Email", value: client?.email },
                  { label: "Website", value: client?.website },
                ].map((f, i) => (
                  <div key={i} style={fieldRow}>
                    <span style={fieldLabel}>{f.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={fieldValue}>{f.value || <span style={{ color: "var(--ink4)", fontStyle: "italic" }}>Not provided</span>}</span>
                      {f.value && <CopyBtn text={f.value} label={`company-${i}`} />}
                    </div>
                  </div>
                ))}
                {/* SAM.gov registration status */}
                <div style={{ ...fieldRow, borderBottom: "none" }}>
                  <span style={fieldLabel}>SAM.gov Registration</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: client?.uei ? "var(--green)" : "#e74c3c" }}>
                    {client?.uei ? "Active (UEI on file)" : "Unverified -- add UEI to confirm"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 2 — Domain Selection Summary                             */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("domains")}>
              <div>
                <div style={sectionLabel}>Tab 2 &mdash; Domain Selection Summary</div>
                <div style={sectionTitle}>Selected Domains &amp; Self-Score Thresholds</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.domains ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.domains && (
              <div style={{ marginTop: 16 }}>
                <div style={{ ...fieldRow, borderBottom: "none", marginBottom: 12 }}>
                  <span style={fieldLabel}>Solicitation Pool</span>
                  <span style={{ ...fieldValue, fontWeight: 600 }}>{solType?.label || solicitation}</span>
                </div>
                {selectedDomains.length === 0 && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No domains selected. <a href={`/certifications/${certId}/oasis-plus/domains`} style={{ color: "var(--gold)", fontWeight: 500 }}>Select domains &rarr;</a>
                  </div>
                )}
                {selectedDomains.map(dId => {
                  const dom = OASIS_DOMAINS.find(d => d.id === dId);
                  if (!dom) return null;
                  const threshold = dom.scoringThreshold[solKey as keyof typeof dom.scoringThreshold] || 42;
                  const domainScores = scorecardData[dId] || {};
                  const totalScore = Object.values(domainScores).reduce((a, b) => a + b, 0);
                  const meetsThreshold = totalScore >= threshold;
                  return (
                    <div key={dId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={chipStyle}>
                          {dom.name}
                          {dom.phase === "II" && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 6px", borderRadius: 100, background: "rgba(99,102,241,.1)", color: "#6366F1", fontWeight: 600 }}>Phase II</span>}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12, color: "var(--ink3)" }}>
                          Score: <strong style={{ color: meetsThreshold ? "var(--green)" : "#e74c3c" }}>{totalScore}</strong> / {dom.maxCredits}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: meetsThreshold ? "rgba(26,102,68,.08)" : "rgba(231,76,60,.08)", color: meetsThreshold ? "var(--green)" : "#e74c3c" }}>
                          {meetsThreshold ? `\u2713 Meets ${threshold}` : `Below ${threshold}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 3 — Qualifying Projects                                  */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("qps")}>
              <div>
                <div style={sectionLabel}>Tab 3 &mdash; Qualifying Projects</div>
                <div style={sectionTitle}>QP Detail Cards ({qps.length} project{qps.length !== 1 ? "s" : ""})</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.qps ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.qps && (
              <div style={{ marginTop: 16 }}>
                {qps.length === 0 && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No qualifying projects entered. <a href={`/certifications/${certId}/oasis-plus/qualifying-projects`} style={{ color: "var(--gold)", fontWeight: 500 }}>Add projects &rarr;</a>
                  </div>
                )}
                {qps.map((qp, idx) => {
                  const aav = calcAAV(qp.totalValue, qp.startDate, qp.endDate);
                  const qpAllText = [
                    `Contract Number: ${qp.contractNumber || "N/A"}`,
                    `Agency/Client: ${qp.agencyName || "N/A"}`,
                    `Contract Type: ${qp.contractType || "N/A"}`,
                    `Period of Performance: ${qp.startDate || "?"} - ${qp.endDate || "?"}`,
                    `Total Contract Value: ${fmtCurrency(qp.totalValue)}`,
                    `Average Annual Value: ${aav}`,
                    `NAICS Code(s): ${qp.naicsCodes || "N/A"}`,
                    `Personnel Count: ${qp.personnelCount || "N/A"}`,
                    `Clearance Level: ${qp.clearanceLevel || "None"}`,
                    ``,
                    `--- Scope / Performance Narrative ---`,
                    qp.scopeNarrative || "(not provided)",
                    ``,
                    `--- Management & Staffing Narrative ---`,
                    qp.managementNarrative || "(not provided)",
                  ].join("\n");

                  return (
                    <div key={qp.id || idx} style={{ padding: "20px", background: "var(--cream)", borderRadius: "var(--r)", marginBottom: 14, border: "1px solid var(--border)" }}>
                      {/* QP Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{qp.contractNumber || `QP ${idx + 1}`}</div>
                            <div style={{ fontSize: 12, color: "var(--ink3)" }}>{qp.agencyName || "Agency not specified"}</div>
                          </div>
                        </div>
                        <CopyBtn text={qpAllText} label={`qp-all-${idx}`} />
                      </div>

                      {/* QP Fields Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 20px", marginBottom: 16 }}>
                        {[
                          { l: "Contract Number", v: qp.contractNumber },
                          { l: "Agency / Client", v: qp.agencyName },
                          { l: "Contract Type", v: qp.contractType },
                          { l: "Start Date", v: qp.startDate },
                          { l: "End Date", v: qp.endDate },
                          { l: "Total Value", v: fmtCurrency(qp.totalValue) },
                          { l: "Avg. Annual Value", v: aav },
                          { l: "NAICS Code(s)", v: qp.naicsCodes },
                          { l: "Personnel Count", v: qp.personnelCount },
                          { l: "Clearance Level", v: qp.clearanceLevel || "None" },
                        ].map((f, fi) => (
                          <div key={fi}>
                            <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{f.l}</div>
                            <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{f.v || "--"}</div>
                          </div>
                        ))}
                      </div>

                      {/* Scope Narrative */}
                      {qp.scopeNarrative && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: ".06em" }}>Scope / Performance Narrative</div>
                            <CopyBtn text={qp.scopeNarrative} label={`qp-scope-${idx}`} />
                          </div>
                          <div style={narrativeBox}>{qp.scopeNarrative}</div>
                        </div>
                      )}

                      {/* Management Narrative */}
                      {qp.managementNarrative && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: ".06em" }}>Management &amp; Staffing Narrative</div>
                            <CopyBtn text={qp.managementNarrative} label={`qp-mgmt-${idx}`} />
                          </div>
                          <div style={narrativeBox}>{qp.managementNarrative}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 4 — Past Performance                                     */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("pp")}>
              <div>
                <div style={sectionLabel}>Tab 4 &mdash; Past Performance</div>
                <div style={sectionTitle}>CPARS Ratings &amp; References ({ppData.length})</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.pp ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.pp && (
              <div style={{ marginTop: 16 }}>
                {ppData.length === 0 && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No past performance data entered. <a href={`/certifications/${certId}/oasis-plus/past-performance`} style={{ color: "var(--gold)", fontWeight: 500 }}>Add past performance &rarr;</a>
                  </div>
                )}
                {ppData.map((pp, idx) => {
                  const ppText = [
                    `Contract: ${pp.contractNumber || "N/A"}`,
                    `CPARS Rating: ${pp.cparsRating || "N/A"}`,
                    `Narrative: ${pp.narrative || "(none)"}`,
                    `Reference: ${pp.refName || "N/A"}, ${pp.refTitle || ""}, ${pp.refEmail || ""}, ${pp.refPhone || ""}`,
                  ].join("\n");
                  const ratingColor = pp.cparsRating === "Exceptional" ? "var(--green)" : pp.cparsRating === "Very Good" ? "#2ecc71" : pp.cparsRating === "Satisfactory" ? "var(--gold)" : pp.cparsRating === "Marginal" ? "#f39c12" : pp.cparsRating === "Unsatisfactory" ? "#e74c3c" : "var(--ink3)";
                  return (
                    <div key={pp.qpId || idx} style={{ padding: "18px 20px", background: "var(--cream)", borderRadius: "var(--r)", marginBottom: 12, border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{pp.qpLabel || pp.contractNumber || `PP Reference ${idx + 1}`}</div>
                          <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>Contract: {pp.contractNumber || "--"}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: `${ratingColor}15`, color: ratingColor }}>
                            {pp.cparsRating || "No rating"}
                          </span>
                          <CopyBtn text={ppText} label={`pp-${idx}`} />
                        </div>
                      </div>

                      {/* Narrative */}
                      {pp.narrative && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: ".06em" }}>Past Performance Narrative</div>
                            <CopyBtn text={pp.narrative} label={`pp-narr-${idx}`} />
                          </div>
                          <div style={narrativeBox}>{pp.narrative}</div>
                        </div>
                      )}

                      {/* Reference Contact */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                        {[
                          { l: "Reference Name", v: pp.refName },
                          { l: "Title", v: pp.refTitle },
                          { l: "Email", v: pp.refEmail },
                          { l: "Phone", v: pp.refPhone },
                        ].map((f, fi) => (
                          <div key={fi}>
                            <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{f.l}</div>
                            <div style={{ fontSize: 12, color: "var(--navy)", fontWeight: 500 }}>{f.v || "--"}</div>
                          </div>
                        ))}
                      </div>

                      {/* PPQ Status placeholder */}
                      <div style={{ marginTop: 10, fontSize: 11, color: "var(--ink4)" }}>
                        PPQ Status: <span style={{ fontWeight: 600, color: pp.refEmail ? "var(--green)" : "var(--ink4)" }}>{pp.refEmail ? "Reference on file" : "Pending"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 5 — Federal Experience Projects                          */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("fep")}>
              <div>
                <div style={sectionLabel}>Tab 5 &mdash; Federal Experience Projects</div>
                <div style={sectionTitle}>Federal Prime Contract Experience ({feData.length})</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {feData.length > 0 && (
                  <CopyBtn label="fep-all" text={feData.map((fe, i) => [
                    `FEP ${i + 1}:`,
                    `  Agency: ${fe.agency || "N/A"}`,
                    `  Contract: ${fe.contractNumber || "N/A"}`,
                    `  Value: ${fmtCurrency(fe.value)}`,
                    `  Period: ${fe.popStart || "?"} - ${fe.popEnd || "?"}`,
                    `  Description: ${fe.description || "N/A"}`,
                  ].join("\n")).join("\n\n")} />
                )}
                <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.fep ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
              </div>
            </div>
            {expanded.fep && (
              <div style={{ marginTop: 16 }}>
                {feData.length === 0 && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No federal experience entries. <a href={`/certifications/${certId}/oasis-plus/federal-experience`} style={{ color: "var(--gold)", fontWeight: 500 }}>Add federal experience &rarr;</a>
                  </div>
                )}
                {feData.length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                          {["#", "Agency", "Contract Number", "Value", "Period", "Description"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--navy)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {feData.map((fe, idx) => (
                          <tr key={fe.id || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{idx + 1}</td>
                            <td style={{ padding: "10px 12px", color: "var(--navy)", fontWeight: 500 }}>{fe.agency || "--"}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)", fontFamily: "monospace", fontSize: 11 }}>{fe.contractNumber || "--"}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{fmtCurrency(fe.value)}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{fe.popStart && fe.popEnd ? `${fe.popStart} \u2013 ${fe.popEnd}` : "--"}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>{fe.description || "--"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 6 — Business Systems & Certifications                    */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("systems")}>
              <div>
                <div style={sectionLabel}>Tab 6 &mdash; Business Systems &amp; Certifications</div>
                <div style={sectionTitle}>Contractor Systems, Clearances &amp; Third-Party Certs</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.systems ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.systems && (
              <div style={{ marginTop: 16 }}>
                {!systemsData && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No systems data entered. <a href={`/certifications/${certId}/oasis-plus/systems-certs`} style={{ color: "var(--gold)", fontWeight: 500 }}>Add systems &amp; certs &rarr;</a>
                  </div>
                )}

                {/* Business Systems */}
                {systemsData?.businessSystems && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>Contractor Business Systems</div>
                    {systemsData.businessSystems.map((bs: any, idx: number) => (
                      <div key={idx} style={fieldRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ ...checkMark, background: bs.approved ? "var(--green)" : "var(--cream2)", border: bs.approved ? "none" : "1px solid var(--border2)", color: bs.approved ? "#fff" : "var(--ink4)" }}>
                            {bs.approved ? "\u2713" : ""}
                          </span>
                          <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{bs.name}</span>
                        </div>
                        <span style={{ fontSize: 12, color: bs.approved ? "var(--green)" : "var(--ink4)" }}>
                          {bs.approved ? `Approved by ${bs.approvalAgency || "agency"}` : "Not approved"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Facility Clearance */}
                {systemsData?.facilityClearance && systemsData.facilityClearance.level !== "None" && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>Facility Clearance</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "12px 16px", background: "var(--cream)", borderRadius: "var(--r)" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Clearance Level</div>
                        <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600 }}>{systemsData.facilityClearance.level}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Facility</div>
                        <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{systemsData.facilityClearance.facilityName || "--"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Expiration</div>
                        <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{systemsData.facilityClearance.expirationDate || "--"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {systemsData?.certifications && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>Third-Party Certifications</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(systemsData.certifications.standard || []).map((certId: string) => (
                        <span key={certId} style={{ ...chipStyle, background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", color: "#6366F1" }}>
                          {STANDARD_CERTS[certId] || certId}
                        </span>
                      ))}
                      {(systemsData.certifications.custom || []).map((c: any, i: number) => (
                        <span key={c.id || i} style={{ ...chipStyle, background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.2)", color: "var(--gold)" }}>
                          {c.name}{c.issuingBody ? ` (${c.issuingBody})` : ""}
                        </span>
                      ))}
                      {(systemsData.certifications.standard || []).length === 0 && (systemsData.certifications.custom || []).length === 0 && (
                        <span style={{ fontSize: 12, color: "var(--ink4)", fontStyle: "italic" }}>No certifications on file</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 7 — OASIS+ Submission Document Guide                     */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("docs")}>
              <div>
                <div style={sectionLabel}>Tab 7 &mdash; Required Documents</div>
                <div style={sectionTitle}>OASIS+ Submission Document Guide</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ padding: "8px 16px", background: "var(--navy)", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "var(--gold2)", textDecoration: "none", whiteSpace: "nowrap" as const }}>
                  Open Symphony Portal &#8599;
                </a>
                <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.docs ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
              </div>
            </div>
            {expanded.docs && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 6 }}>Every document required for your OASIS+ proposal. Click any item for detailed guidance on what it is, where to find it, and exactly where to upload it on the Symphony Portal.</p>
                <div style={{ padding: "10px 14px", background: "rgba(200,155,60,.05)", borderRadius: "var(--r)", border: "1px solid rgba(200,155,60,.12)", marginBottom: 16, fontSize: 12, color: "var(--ink3)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--gold)" }}>Tip:</strong> Work through this list top to bottom. Items with green checkmarks have matching documents already uploaded. For remaining items, click to expand and follow the guidance.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {OASIS_PLUS_CHECKLIST.map(item => {
                    const complete = manualChecks[item.id] || (item.docCategory ? (clientDocs[item.docCategory] || []).length > 0 : false);
                    const isExpanded = manualChecks[`expanded_${item.id}`];
                    return (
                      <div key={item.id} style={{
                        border: `1px solid ${complete ? "var(--green-b)" : isExpanded ? "rgba(200,155,60,.25)" : "var(--border)"}`,
                        borderRadius: "var(--r)", overflow: "hidden",
                        background: complete ? "var(--green-bg)" : isExpanded ? "rgba(200,155,60,.02)" : "#fff",
                      }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                          cursor: "pointer",
                        }}
                          onClick={() => setManualChecks(prev => ({ ...prev, [`expanded_${item.id}`]: !prev[`expanded_${item.id}`] }))}>
                          <div onClick={(e) => { e.stopPropagation(); setManualChecks(prev => ({ ...prev, [item.id]: !prev[item.id] })); }} style={{
                            width: 22, height: 22, borderRadius: 4,
                            border: `2px solid ${complete ? "var(--green)" : "var(--border2)"}`,
                            background: complete ? "var(--green)" : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0,
                          }}>
                            {complete ? "\u2713" : ""}
                          </div>
                          <span style={{ fontSize: 14, color: complete ? "var(--green)" : "var(--navy)", fontWeight: complete ? 500 : 400, flex: 1 }}>{item.label}</span>
                          {complete && item.docCategory && (clientDocs[item.docCategory] || []).length > 0 && (
                            <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500, marginRight: 8 }}>Docs on file</span>
                          )}
                          <span style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600 }}>{isExpanded ? "\u25B2" : "\u25BC"}</span>
                        </div>

                        {isExpanded && (
                          <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                              <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>What is this?</div>
                                <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{item.what}</div>
                              </div>
                              <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>Where to find it</div>
                                <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{item.where}</div>
                              </div>
                              <div style={{ padding: "12px", background: "rgba(11,25,41,.03)", borderRadius: 8, border: "1px solid rgba(11,25,41,.06)" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--navy)", marginBottom: 6 }}>On the Symphony Portal</div>
                                <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{item.sbaPortal}</div>
                              </div>
                              <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>Format requirements</div>
                                <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{item.format}</div>
                              </div>
                            </div>
                            {/* Show matching uploaded documents */}
                            {item.docCategory && (clientDocs[item.docCategory] || []).length > 0 && (
                              <div style={{ marginTop: 12, padding: "12px", background: "var(--green-bg)", borderRadius: 8, border: "1px solid var(--green-b)" }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--green)", marginBottom: 8 }}>Your uploaded files -- ready to submit</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {(clientDocs[item.docCategory] || []).map((doc: any) => (
                                    <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#fff", borderRadius: 6, border: "1px solid var(--border)" }}>
                                      <div>
                                        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)" }}>{doc.originalName}</div>
                                        {doc.documentYear && <span style={{ fontSize: 10, color: "var(--ink4)" }}>{doc.documentYear}</span>}
                                      </div>
                                      <button onClick={async () => {
                                        try {
                                          const resp = await fetch(
                                            `${process.env.NEXT_PUBLIC_API_URL || ''}/api/documents/download/${doc.id}`,
                                            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                                          );
                                          if (!resp.ok) { alert('Download failed'); return; }
                                          const blob = await resp.blob();
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url; a.download = doc.originalName || 'document'; a.click();
                                          URL.revokeObjectURL(url);
                                        } catch { alert('Download failed'); }
                                      }} style={{
                                        padding: "4px 12px", fontSize: 11, fontWeight: 600,
                                        color: "var(--green)", border: "1px solid var(--green-b)",
                                        borderRadius: 5, background: "transparent", cursor: "pointer",
                                      }}>
                                        Download
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.docCategory && (!clientDocs[item.docCategory] || clientDocs[item.docCategory].length === 0) && (
                              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(200,60,60,.03)", borderRadius: 8, border: "1px solid rgba(200,60,60,.1)", fontSize: 12, color: "var(--red)" }}>
                                No matching file uploaded yet. Upload this document in <a href={`/portal/documents`} style={{ color: "var(--gold)", fontWeight: 600 }}>My Documents</a> or gather it from the source described above.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 8 — Review & Submit                                      */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("review")}>
              <div>
                <div style={sectionLabel}>Tab 8 &mdash; Review &amp; Submit</div>
                <div style={sectionTitle}>Final Review &amp; Portal Submission</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.review ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.review && (
              <div style={{ marginTop: 16 }}>
                {/* Completeness Score */}
                <div style={{ textAlign: "center", padding: "24px 0 20px", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 6 }}>Overall Completeness</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, color: completenessPercent >= 80 ? "var(--green)" : completenessPercent >= 50 ? "var(--gold)" : "#e74c3c", fontWeight: 400, lineHeight: 1 }}>
                    {completenessPercent}%
                  </div>
                </div>

                {/* Per-section status */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>Section Status</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {sectionStatuses.map(s => (
                      <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: s.done ? "rgba(26,102,68,.04)" : "var(--cream)", borderRadius: "var(--r)", border: `1px solid ${s.done ? "rgba(26,102,68,.12)" : "var(--border)"}` }}>
                        <span style={{ ...checkMark, width: 18, height: 18, fontSize: 9, background: s.done ? "var(--green)" : "var(--cream2)", border: s.done ? "none" : "1px solid var(--border2)", color: s.done ? "#fff" : "var(--ink4)" }}>
                          {s.done ? "\u2713" : ""}
                        </span>
                        <span style={{ fontSize: 12, color: s.done ? "var(--navy)" : "var(--ink3)", fontWeight: s.done ? 500 : 400 }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                  <a href={`/certifications/${certId}/oasis-plus/review`} style={{
                    flex: 1, padding: "16px", background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)",
                    borderRadius: "var(--rl)", textDecoration: "none", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Run GovCert Analysis</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)" }}>AI-powered compliance review</div>
                  </a>
                  <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{
                    flex: 1, padding: "16px", background: "rgba(26,102,68,.06)", border: "1px solid rgba(26,102,68,.15)",
                    borderRadius: "var(--rl)", textDecoration: "none", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Open OASIS+ Symphony Portal &rarr;</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)" }}>Submit at idiq.gsa.gov</div>
                  </a>
                </div>

                {/* Step-by-step instructions */}
                <div style={{ padding: "20px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>Submission Steps</div>
                  {[
                    "Navigate to idiq.gsa.gov and log in with your SAM.gov credentials.",
                    "Select the OASIS+ solicitation and choose your pool (Unrestricted or Small Business set-aside).",
                    "In Tab 1 (Company Information), verify your entity data matches SAM.gov. Use the Copy buttons above to transfer fields.",
                    "In Tab 2 (Domain Selection), select the same domains you chose in GovCert and confirm your self-score meets the threshold.",
                    "In Tab 3 (Qualifying Projects), enter each QP using the detail cards above. Copy narratives directly.",
                    "In Tab 4 (Past Performance), enter CPARS ratings and upload PPQ forms for each qualifying project.",
                    "In Tab 5 (Federal Experience), enter your federal prime contracts from the FEP table above.",
                    "Upload all required attachments listed in Tab 7 (J.P-1 through J.P-7, subcontracting plan, pricing spreadsheet).",
                    "Review all sections in the portal for completeness. Run the GovCert Analysis for a final compliance check.",
                    "Submit your proposal in the Symphony Portal before the solicitation deadline.",
                  ].map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  Bottom Navigation                                            */}
          {/* ============================================================ */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}/oasis-plus/review`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              &larr; Previous: GovCert Review
            </a>
            <a href={user?.role === "CUSTOMER" ? "/portal" : "/dashboard"} style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
              border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(200,155,60,.3)",
            }}>
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
