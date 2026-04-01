"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { usePaywall } from "@/lib/usePaywall";
import PaywallModal from "@/components/PaywallModal";
import CertSidebar from "@/components/CertSidebar";

const EIGHT_A_SECTIONS = [
  { id: "social-disadvantage", label: "Social Disadvantage" },
  { id: "economic-disadvantage", label: "Economic Disadvantage" },
  { id: "business-plan", label: "Business Plan" },
  { id: "corporate", label: "Corporate Experience" },
  { id: "past-performance", label: "Past Performance" },
  { id: "financials", label: "Financials" },
  { id: "submit", label: "Submit" },
];

const SBA_FORM_1010_CHECKLIST = [
  { id: "socialNarrative", label: "Social Disadvantage Narrative", section: "social-disadvantage", field: "socialDisadvantageNarrative",
    what: "A personal statement explaining how you've been socially disadvantaged based on race, ethnicity, gender, or other qualifying factors. This is the heart of your 8(a) application.",
    where: "GovCert drafted this for you in Section 1. Review and refine it — it should be personal and specific.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Social Disadvantage → paste your narrative into the text field.",
    format: "Text narrative, typically 2-5 pages. No character limit on certify.sba.gov but be concise and specific.",
    docCategory: null,
  },
  { id: "economicData", label: "SBA Form 413 (Personal Financial Statement)", section: "economic-disadvantage", field: "economicDisadvantageData",
    what: "A detailed breakdown of your personal net worth, assets, liabilities, and income. SBA uses this to verify economic disadvantage (net worth must be below $850K excluding primary residence and business equity).",
    where: "Download SBA Form 413 from sba.gov/document/sba-form-413. Fill it out with your CPA or use the figures from your tax return.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Economic Disadvantage → upload the completed Form 413 PDF.",
    format: "PDF. Must be the official SBA Form 413. Handwritten or typed both accepted.",
    docCategory: "FINANCIAL_STATEMENT",
  },
  { id: "businessPlan", label: "Comprehensive Business Plan", section: "business-plan", field: "businessPlanData",
    what: "A forward-looking plan covering your business goals, target markets, marketing strategy, management team, and financial projections. SBA wants to see you have a viable path to growth.",
    where: "GovCert drafted key sections for you. Review in Section 3. For projections, work with your accountant.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Business Plan → upload as a single PDF document.",
    format: "PDF, typically 15-30 pages. Include financial projections for at least 3 years.",
    docCategory: null,
  },
  { id: "corporateNarrative", label: "Corporate Experience Narrative", section: "corporate", field: "narrativeCorp8a",
    what: "A description of your company's history, capabilities, key contracts, and relevant experience that demonstrates you can perform government work.",
    where: "GovCert drafted this from your capability statement and past performance data. Review in Section 4.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Entity Information → Business Description field.",
    format: "Text narrative. Keep under 5,000 characters for the certify.sba.gov text field.",
    docCategory: "CAPABILITY_STATEMENT",
  },
  { id: "pastPerformance", label: "Past Performance References", section: "past-performance", field: null,
    what: "Details on your completed and active government/commercial contracts — agency name, contract number, value, period of performance, and a reference contact (Contracting Officer).",
    where: "GovCert pre-populated these from your uploaded documents. Review and add reference contacts in Section 5.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Past Performance → enter each contract individually in the provided fields.",
    format: "Entered directly in the portal. Have contract numbers, values, and CO contact info ready.",
    docCategory: "CONTRACT",
  },
  { id: "financials", label: "2 Years Business Financial Statements", section: "financials", field: "financialData8a",
    what: "Profit & Loss statement and Balance Sheet for the 2 most recent complete fiscal years. Must be prepared by your accountant — SBA may cross-reference with your tax returns.",
    where: "Your accountant or bookkeeper has these. If you use QuickBooks, export P&L and Balance Sheet reports. They must show the company name, period covered, and be signed or on letterhead.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Financial Information → Documents → upload as PDF.",
    format: "PDF. One file per year or combined. Must include P&L AND Balance Sheet.",
    docCategory: "FINANCIAL_STATEMENT",
  },
  { id: "personalFinancials", label: "Personal Financial Statements (each owner)", section: "financials", field: "financialData8a",
    what: "SBA Form 413 for EACH owner with 20%+ ownership. Lists all personal assets (real estate, vehicles, investments, bank accounts) and liabilities (mortgages, loans, credit cards).",
    where: "Download from sba.gov/document/sba-form-413. Each qualifying owner fills out their own form with their CPA.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Financial Information → Personal Financial Statement → upload per owner.",
    format: "PDF. Official SBA Form 413 required. One per qualifying owner.",
    docCategory: "FINANCIAL_STATEMENT",
  },
  { id: "birthCert", label: "Birth Certificate or Naturalization Papers", section: null, field: null,
    what: "Proof of U.S. citizenship for each disadvantaged owner. SBA requires this to verify eligibility — the 8(a) program is only available to U.S. citizens.",
    where: "Your birth certificate is typically in your personal records. If lost, order a replacement from your state's vital records office (vitalchek.com). For naturalized citizens, use your Certificate of Naturalization (N-550 or N-570).",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Individual Information → Documents → upload scan/photo.",
    format: "PDF or image (JPG/PNG). Clear, legible scan of the full document.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "taxReturns", label: "3 Years Personal Tax Returns", section: null, field: null,
    what: "Complete personal federal tax returns (Form 1040 with ALL schedules and attachments) for the 3 most recent tax years. SBA uses these to verify your personal income and net worth claims.",
    where: "Your tax preparer/CPA has copies. You can also download from the IRS at irs.gov/individuals/get-transcript. Select 'Tax Return Transcript' for each year needed.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Tax Information → upload all 3 years as separate PDFs.",
    format: "PDF. Complete returns including all schedules. One file per year is easiest for the reviewer.",
    docCategory: "TAX_RETURN",
  },
  { id: "bizTaxReturns", label: "3 Years Business Tax Returns", section: null, field: null,
    what: "Complete business federal tax returns for the 3 most recent years. For LLCs this is typically Form 1065, for S-Corps Form 1120-S, for C-Corps Form 1120.",
    where: "Your business CPA/tax preparer has these. Also available from irs.gov/businesses/get-transcript for the business EIN.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Tax Information → Business Tax Returns → upload per year.",
    format: "PDF. Complete returns with all schedules and K-1s.",
    docCategory: "TAX_RETURN",
  },
  { id: "articles", label: "Articles of Incorporation / Organization", section: null, field: null,
    what: "The founding document filed with your state to create your business entity. Shows formation date, registered agent, initial members/shareholders.",
    where: "Your state's Secretary of State website. Search your business name at the state website to find and download. In most states you can get a certified copy for $5-15.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Entity Information → Documents → upload.",
    format: "PDF. State-certified copy preferred but filed copy is acceptable.",
    docCategory: "BUSINESS_LICENSE",
  },
  { id: "bylaws", label: "Bylaws or Operating Agreement", section: null, field: null,
    what: "The internal governance document for your company. For LLCs this is the Operating Agreement; for corporations it's the Bylaws. Shows ownership percentages, voting rights, management structure.",
    where: "You should have a copy from when the business was formed. Your business attorney created this. If you don't have one, you need to create one — SBA requires it.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Entity Information → Documents → upload.",
    format: "PDF. Must show current ownership percentages and be signed by all members/shareholders.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "stockCerts", label: "Stock Certificates / Membership Certificates", section: null, field: null,
    what: "Proof of ownership in the company. For corporations, these are stock certificates showing who owns what shares. For LLCs, membership interest certificates or the relevant section of the Operating Agreement.",
    where: "Your corporate records book or your attorney's files. If your LLC doesn't issue certificates, the Operating Agreement suffices.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Ownership → Documents → upload.",
    format: "PDF or image. Clear scan showing names, ownership percentages, and signatures.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "resume", label: "Resume of Disadvantaged Owner", section: null, field: null,
    what: "A professional resume for each disadvantaged owner showing education, work history, relevant experience, and qualifications. SBA uses this to assess the owner's ability to manage the business.",
    where: "Update your current resume to emphasize management experience, industry knowledge, and technical skills relevant to your NAICS codes.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Individual Information → Resume → upload.",
    format: "PDF. Standard professional resume format. 1-3 pages.",
    docCategory: "RESUME",
  },
  { id: "bankStatements", label: "6 Months Business Bank Statements", section: null, field: null,
    what: "The 6 most recent consecutive monthly bank statements for ALL business bank accounts. SBA uses these to verify cash flow, revenue claims, and current financial health.",
    where: "Download from your business bank's online portal. Log into your bank → Statements → download each month as PDF.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Financial Information → Bank Statements → upload all as a single combined PDF or individual files.",
    format: "PDF. Must show account holder name (your business), account number, and full transaction history for each month.",
    docCategory: "BANK_STATEMENT",
  },
  { id: "leases", label: "Business Lease / Rental Agreement", section: null, field: null,
    what: "Your current commercial lease or rental agreement for your business location. If you work from home, a home office declaration may suffice. SBA wants to verify your place of business.",
    where: "Your landlord or property manager has a copy. Check your email for the signed lease. If home-based, write a simple declaration stating your home office address.",
    sbaPortal: "In certify.sba.gov → 8(a) Application → Entity Information → Lease → upload.",
    format: "PDF. Current lease showing business name, address, term, and signatures. For home-based, a signed declaration.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
];

export default function Submit8aPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const pw = usePaywall("EIGHT_A");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      const completed: Record<string, boolean> = {};
      const app = data.application;
      if (app) {
        if (app.socialDisadvantageNarrative?.trim()) completed["social-disadvantage"] = true;
        if (app.economicDisadvantageData) completed["economic-disadvantage"] = true;
        if (app.businessPlanData) completed["business-plan"] = true;
        if (app.narrativeCorp8a) completed["corporate"] = true;
        if (app.pastPerformance8a?.length > 0 || app.pastPerformance?.length > 0) completed["past-performance"] = true;
        if (app.financialData8a) completed["financials"] = true;
      }
      setCompletedSections(completed);
    } catch (err) { console.error(err); setError("Failed to load."); }
    finally { setLoading(false); }
  }

  function isItemComplete(item: typeof SBA_FORM_1010_CHECKLIST[0]): boolean {
    if (manualChecks[item.id]) return true;
    if (!cert?.application) return false;

    if (item.field === "socialDisadvantageNarrative") return !!cert.application.socialDisadvantageNarrative?.trim();
    if (item.field === "economicDisadvantageData") return !!cert.application.economicDisadvantageData;
    if (item.field === "businessPlanData") return !!cert.application.businessPlanData;
    if (item.field === "narrativeCorp8a") return !!cert.application.narrativeCorp8a;
    if (item.field === "financialData8a") return !!cert.application.financialData8a;
    if (item.id === "pastPerformance") return (cert.application.pastPerformance8a?.length > 0 || cert.application.pastPerformance?.length > 0);

    return false;
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {
      setError("Failed to copy to clipboard.");
    }
  }

  function getNarrativeText(field: string): string {
    if (!cert?.application) return "";
    const val = cert.application[field];
    if (!val) return "";
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed.narratives) {
        return Object.entries(parsed.narratives).map(([k, v]) => `## ${k}\n${v}`).join("\n\n");
      }
      if (typeof parsed === "object") {
        return Object.entries(parsed).map(([k, v]) => `## ${k}\n${v}`).join("\n\n");
      }
      return String(val);
    } catch {
      return String(val);
    }
  }

  async function downloadPackage() {
    setDownloading(true);
    try {
      const data = await apiRequest(`/api/applications/${cert.application.id}/export`, { method: "POST" });
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    } catch {
      setError("Download not yet available. Please copy individual sections.");
    } finally {
      setDownloading(false);
    }
  }

  const completedCount = SBA_FORM_1010_CHECKLIST.filter(item => isItemComplete(item)).length;
  const totalCount = SBA_FORM_1010_CHECKLIST.length;
  const appSectionsDone = Object.values(completedSections).filter(Boolean).length;

  const narrativeSections = [
    { label: "Social Disadvantage Narrative", field: "socialDisadvantageNarrative" },
    { label: "Corporate Experience (8a)", field: "narrativeCorp8a" },
    { label: "Business Plan", field: "businessPlanData" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const sidebarContent = (
    <div>
      <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>8(a) Sections</div>
      {EIGHT_A_SECTIONS.map((s, i) => {
        const isActive = s.id === "submit";
        const isCompleted = completedSections[s.id];
        return (
          <a key={s.id} href={`/certifications/${certId}/8a/${s.id}`} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)",
            marginBottom: 2, textDecoration: "none",
            background: isActive ? "rgba(200,155,60,.15)" : "transparent",
            border: isActive ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
            color: isActive ? "var(--gold2)" : isCompleted ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)",
            fontSize: 12,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: isCompleted ? "var(--green)" : isActive ? "rgba(200,155,60,.3)" : "rgba(255,255,255,.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: "#fff", fontWeight: 700, flexShrink: 0,
            }}>
              {isCompleted ? "\u2713" : i + 1}
            </div>
            {s.label}
          </a>
        );
      })}
      <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>&larr; Back to Dashboard</a>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="certifications" sidebarContent={sidebarContent} />

      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {pw.loading && (
          <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)", fontSize: 14 }}>
            Checking access...
          </div>
        )}
        {!pw.loading && !pw.generationAccess && (
          <PaywallModal
            certType="EIGHT_A"
            price={pw.price}
            betaMode={pw.betaMode}
            onUnlock={pw.onUnlock}
            onClose={pw.closePaywall}
          />
        )}
        <div style={!pw.loading && !pw.generationAccess ? { filter: "blur(8px)", pointerEvents: "none" as const, userSelect: "none" as const } : {}}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 7 of 7</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Submit 8(a) Application</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Review your submission checklist, copy narrative sections, and submit through the SBA Certify portal.
            </p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* Readiness Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>Application Sections</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: appSectionsDone === 6 ? "var(--green)" : "var(--navy)", fontWeight: 400 }}>
                {appSectionsDone}<span style={{ fontSize: 18, color: "var(--ink3)" }}> / 6 complete</span>
              </div>
              <div style={{ height: 6, background: "var(--cream2)", borderRadius: 100, overflow: "hidden", marginTop: 10 }}>
                <div style={{ height: "100%", width: `${(appSectionsDone / 6) * 100}%`, background: appSectionsDone === 6 ? "var(--green)" : "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>SBA Checklist Items</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: completedCount === totalCount ? "var(--green)" : "var(--navy)", fontWeight: 400 }}>
                {completedCount}<span style={{ fontSize: 18, color: "var(--ink3)" }}> / {totalCount} ready</span>
              </div>
              <div style={{ height: 6, background: "var(--cream2)", borderRadius: 100, overflow: "hidden", marginTop: 10 }}>
                <div style={{ height: "100%", width: `${(completedCount / totalCount) * 100}%`, background: completedCount === totalCount ? "var(--green)" : "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
              </div>
            </div>
          </div>

          {/* Gap Analysis */}
          {appSectionsDone < 6 && (
            <div style={{ background: "#FFF8E1", border: "2px solid #FFB300", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#F57F17", marginBottom: 8 }}>Missing Sections</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {EIGHT_A_SECTIONS.filter(s => s.id !== "submit" && !completedSections[s.id]).map(s => (
                  <a key={s.id} href={`/certifications/${certId}/8a/${s.id}`}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#F57F17", textDecoration: "none" }}>
                    <span style={{ color: "#F57F17" }}>{"\u2717"}</span>
                    {s.label} — <span style={{ textDecoration: "underline" }}>Complete now</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* SBA Form 1010 Submission Wizard */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>SBA Form 1010 Submission Guide</h3>
              <a href="https://certify.sba.gov" target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 16px", background: "var(--navy)", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "var(--gold2)", textDecoration: "none", whiteSpace: "nowrap" }}>
                Open certify.sba.gov ↗
              </a>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 6 }}>Every document required for your 8(a) application. Click any item for detailed guidance on what it is, where to find it, and exactly where to upload it on certify.sba.gov.</p>
            <div style={{ padding: "10px 14px", background: "rgba(200,155,60,.05)", borderRadius: "var(--r)", border: "1px solid rgba(200,155,60,.12)", marginBottom: 16, fontSize: 12, color: "var(--ink3)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--gold)" }}>💡 Tip:</strong> Work through this list top to bottom. GovCert has already prepared several items for you (marked green). For remaining items, click to expand and follow the guidance.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SBA_FORM_1010_CHECKLIST.map(item => {
                const complete = isItemComplete(item);
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
                      <div onClick={(e) => { e.stopPropagation(); if (!item.field) setManualChecks(prev => ({ ...prev, [item.id]: !prev[item.id] })); }} style={{
                        width: 22, height: 22, borderRadius: 4,
                        border: `2px solid ${complete ? "var(--green)" : "var(--border2)"}`,
                        background: complete ? "var(--green)" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0,
                      }}>
                        {complete ? "\u2713" : ""}
                      </div>
                      <span style={{ fontSize: 14, color: complete ? "var(--green)" : "var(--navy)", fontWeight: complete ? 500 : 400, flex: 1 }}>{item.label}</span>
                      {item.section && !complete && (
                        <a href={`/certifications/${certId}/8a/${item.section}`}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none", fontWeight: 500, marginRight: 8 }}>
                          Complete →
                        </a>
                      )}
                      {complete && item.field && (
                        <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500, marginRight: 8 }}>Auto-detected</span>
                      )}
                      <span style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600 }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                          <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>📄 What is this?</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{(item as any).what}</div>
                          </div>
                          <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>📍 Where to find it</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{(item as any).where}</div>
                          </div>
                          <div style={{ padding: "12px", background: "rgba(11,25,41,.03)", borderRadius: 8, border: "1px solid rgba(11,25,41,.06)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--navy)", marginBottom: 6 }}>🏛️ On certify.sba.gov</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{(item as any).sbaPortal}</div>
                          </div>
                          <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>📋 Format requirements</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{(item as any).format}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Copy Narratives */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Copy Narratives for SBA Certify</h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16 }}>Click to copy each section for pasting into the SBA Certify portal.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {narrativeSections.map(ns => {
                const text = getNarrativeText(ns.field);
                const hasText = text.trim().length > 0;
                return (
                  <div key={ns.field} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px",
                    background: hasText ? "var(--cream)" : "var(--cream2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r)",
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: hasText ? "var(--navy)" : "var(--ink4)" }}>{ns.label}</div>
                      <div style={{ fontSize: 12, color: "var(--ink4)" }}>
                        {hasText ? `${text.length.toLocaleString()} characters` : "Not yet drafted"}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(text, ns.label)}
                      disabled={!hasText}
                      style={{
                        padding: "8px 16px",
                        background: hasText ? (copySuccess === ns.label ? "var(--green)" : "var(--gold)") : "var(--cream2)",
                        border: "none",
                        borderRadius: "var(--r)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: hasText ? "#fff" : "var(--ink4)",
                        cursor: hasText ? "pointer" : "not-allowed",
                      }}
                    >
                      {copySuccess === ns.label ? "\u2713 Copied!" : "\uD83D\uDCCB Copy to Clipboard"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Download & Submit */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "28px 32px", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#fff", fontWeight: 400, marginBottom: 6 }}>Ready to Submit?</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>
                  Download your full submission package, then submit through the SBA Certify portal.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={downloadPackage}
                  disabled={downloading}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(255,255,255,.1)",
                    border: "1px solid rgba(255,255,255,.2)",
                    borderRadius: "var(--r)",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {downloading ? "Preparing..." : "\u2B07 Download Package"}
                </button>
                <a
                  href={`/certifications/${certId}/8a/review`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    border: "none",
                    borderRadius: "var(--r)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    textDecoration: "none",
                    boxShadow: "0 4px 16px rgba(99,102,241,.3)",
                  }}
                >
                  🔍 Run GovCert Analysis
                </a>
                <a
                  href="https://certify.sba.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 28px",
                    background: "var(--gold)",
                    border: "none",
                    borderRadius: "var(--r)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  Go to SBA Certify &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* Back nav */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 20 }}>
            <a href={`/certifications/${certId}/8a/financials`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Previous: Financials</a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
