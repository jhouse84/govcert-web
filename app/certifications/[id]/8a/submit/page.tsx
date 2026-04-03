"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { usePaywall } from "@/lib/usePaywall";
import PaywallModal from "@/components/PaywallModal";
import CertSidebar from "@/components/CertSidebar";
import FinancialReadiness from "@/components/FinancialReadiness";

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
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Social Disadvantage → you can either fill out the structured questionnaire (1,000 characters per incident box, 2 incidents required) OR upload a complete narrative as a PDF. GovCert prepares both formats for you.",
    format: "Text narrative (1,000 characters per incident box on certifications.sba.gov) or PDF upload. Be concise and specific.",
    docCategory: null,
  },
  { id: "economicData", label: "SBA Form 413 (Personal Financial Statement)", section: "economic-disadvantage", field: "economicDisadvantageData",
    what: "A detailed breakdown of your personal net worth, assets, liabilities, and income. SBA uses this to verify economic disadvantage (net worth must be below $850K excluding primary residence and business equity).",
    where: "GovCert can generate a pre-filled Form 413 from your Economic Disadvantage data. Download it, review with your CPA, sign it, and upload to the portal. You can also download the blank form from sba.gov/document/sba-form-413.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Financial Information → Personal Financial Statement → upload the signed PDF.",
    format: "PDF. Must be the official SBA Form 413. Review all figures, sign, then upload. Handwritten or typed both accepted.",
    docCategory: null,
    generateForm413: true,
  },
  { id: "businessPlan", label: "Comprehensive Business Plan", section: "business-plan", field: "businessPlanData",
    what: "A forward-looking plan covering your business goals, target markets, marketing strategy, management team, and financial projections. SBA wants to see you have a viable path to growth.",
    where: "GovCert drafted key sections for you. Review in Section 3. For projections, work with your accountant.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Business Information → fill in structured fields for market analysis, competitive environment, goals, and projections. These are individual text fields, not a single document upload.",
    format: "PDF, typically 15-30 pages. Include financial projections for at least 3 years.",
    docCategory: null,
  },
  { id: "corporateNarrative", label: "Corporate Experience Narrative", section: "corporate", field: "narrativeCorp8a",
    what: "A description of your company's history, capabilities, key contracts, and relevant experience that demonstrates you can perform government work.",
    where: "GovCert drafted this from your capability statement and past performance data. Review in Section 4.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Entity Information → Business Description. This is a text field — paste your narrative directly.",
    format: "Text narrative. Paste directly into the certifications.sba.gov text field.",
    docCategory: "CAPABILITY_STATEMENT",
  },
  { id: "pastPerformance", label: "Past Performance References", section: "past-performance", field: null,
    what: "Details on your completed and active government/commercial contracts — agency name, contract number, value, period of performance, and a reference contact (Contracting Officer). Completed PPQ forms and CPARS reports also satisfy this requirement.",
    where: "GovCert pre-populated these from your uploaded documents. Review and add reference contacts in Section 5. If you have completed PPQ forms or CPARS reports, upload them — they will be matched here automatically.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Past Performance → enter each contract individually in the provided fields. Upload any completed PPQ forms or CPARS reports as supporting documents.",
    format: "Entered directly in the portal + supporting PDFs. Have contract numbers, values, and CO contact info ready.",
    docCategory: ["CONTRACT", "PPQ_RESPONSE", "PPQ_COMPLETED", "CPARS_REPORT"],
  },
  { id: "financials", label: "2 Years Business Financial Statements", section: "financials", field: "financialData8a",
    what: "Profit & Loss statement and Balance Sheet for the 2 most recent complete fiscal years. Must be prepared by your accountant — SBA may cross-reference with your tax returns.",
    where: "Your accountant or bookkeeper has these. If you use QuickBooks, export P&L and Balance Sheet reports. They must show the company name, period covered, and be signed or on letterhead.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload as PDF. Name the file: FIRM NAME_DUNS NUMBER_TYPE OF FILE.pdf",
    format: "PDF. One file per year or combined. Must include P&L AND Balance Sheet.",
    docCategory: "FINANCIAL_STATEMENT",
  },
  { id: "personalFinancials", label: "Personal Financial Statements (each owner)", section: "financials", field: "financialData8a",
    what: "SBA Form 413 for EACH owner with 20%+ ownership. Lists all personal assets (real estate, vehicles, investments, bank accounts) and liabilities (mortgages, loans, credit cards).",
    where: "Download from sba.gov/document/sba-form-413. Each qualifying owner fills out their own form with their CPA.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Financial Information → Personal Financial Statement → upload the signed PDF.",
    format: "PDF. Official SBA Form 413 required. One per qualifying owner.",
    docCategory: "FINANCIAL_STATEMENT",
  },
  { id: "birthCert", label: "Birth Certificate or Naturalization Papers", section: null, field: null,
    what: "Proof of U.S. citizenship for each disadvantaged owner. SBA requires this to verify eligibility — the 8(a) program is only available to U.S. citizens.",
    where: "Your birth certificate is typically in your personal records. If lost, order a replacement from your state's vital records office (vitalchek.com). For naturalized citizens, use your Certificate of Naturalization (N-550 or N-570).",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload as PDF. Name the file: FIRM NAME_DUNS NUMBER_TYPE OF FILE.pdf",
    format: "PDF or image (JPG/PNG). Clear, legible scan of the full document.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "taxReturns", label: "3 Years Personal Tax Returns", section: null, field: null,
    what: "Complete personal federal tax returns (Form 1040 with ALL schedules and attachments) for the 3 most recent tax years. SBA uses these to verify your personal income and net worth claims.",
    where: "Your tax preparer/CPA has copies. You can also download from the IRS at irs.gov/individuals/get-transcript. Select 'Tax Return Transcript' for each year needed.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload as PDF. Name the file: FIRM NAME_DUNS NUMBER_TYPE OF FILE.pdf",
    format: "PDF. Complete returns including all schedules. One file per year is easiest for the reviewer.",
    docCategory: "TAX_RETURN",
  },
  { id: "bizTaxReturns", label: "3 Years Business Tax Returns", section: null, field: null,
    what: "Complete business federal tax returns for the 3 most recent years. For LLCs this is typically Form 1065, for S-Corps Form 1120-S, for C-Corps Form 1120.",
    where: "Your business CPA/tax preparer has these. Also available from irs.gov/businesses/get-transcript for the business EIN.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload as PDF. Name the file: FIRM NAME_DUNS NUMBER_TYPE OF FILE.pdf",
    format: "PDF. Complete returns with all schedules and K-1s.",
    docCategory: "TAX_RETURN",
  },
  { id: "articles", label: "Articles of Incorporation / Organization", section: null, field: null,
    what: "The founding document filed with your state to create your business entity. Shows formation date, registered agent, initial members/shareholders.",
    where: "Your state's Secretary of State website. Search your business name at the state website to find and download. In most states you can get a certified copy for $5-15.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload as PDF. Name the file: FIRM NAME_DUNS NUMBER_TYPE OF FILE.pdf",
    format: "PDF. State-certified copy preferred but filed copy is acceptable.",
    docCategory: "BUSINESS_LICENSE",
  },
  { id: "bylaws", label: "Bylaws or Operating Agreement", section: null, field: null,
    what: "The internal governance document for your company. For LLCs this is the Operating Agreement; for corporations it's the Bylaws. Shows ownership percentages, voting rights, management structure.",
    where: "You should have a copy from when the business was formed. Your business attorney created this. If you don't have one, you need to create one — SBA requires it.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload as PDF. Name the file: FIRM NAME_DUNS NUMBER_TYPE OF FILE.pdf",
    format: "PDF. Must show current ownership percentages and be signed by all members/shareholders.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "stockCerts", label: "Stock Certificates / Membership Certificates", section: null, field: null,
    what: "Proof of ownership in the company. For corporations, these are stock certificates showing who owns what shares. For LLCs, membership interest certificates or the relevant section of the Operating Agreement.",
    where: "Your corporate records book or your attorney's files. If your LLC doesn't issue certificates, the Operating Agreement suffices.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload as PDF. Name the file: FIRM NAME_DUNS NUMBER_TYPE OF FILE.pdf",
    format: "PDF or image. Clear scan showing names, ownership percentages, and signatures.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "form1010", label: "SBA Form 1010 — Personal History Statement", section: null, field: null,
    what: "Required for every owner with 20%+ ownership AND every officer/director/key employee. This form covers personal background, criminal history, financial obligations, and prior government contracting experience. One form per individual.",
    where: "Download the blank Form 1010 from sba.gov/document/sba-form-1010. Print it, fill it out by hand or electronically, sign, and scan as PDF. Each person listed on the ownership section needs their own form.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload. Upload each signed Form 1010 as a separate PDF. Name: FIRM NAME_INDIVIDUAL NAME_FORM 1010.pdf",
    format: "PDF. Must be signed by the individual. One form per person. Incomplete or unsigned forms will delay your application.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "resume", label: "Resumes — All Owners & Key Management Personnel", section: null, field: null,
    what: "Professional resumes for the disadvantaged owner(s), all other owners with 20%+ interest, and key management personnel. SBA assesses whether the disadvantaged owner has the capability and experience to control the business.",
    where: "Update resumes to emphasize management experience, industry knowledge, and technical skills relevant to your NAICS codes. Include federal contracting experience if any.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload each as PDF. Name: FIRM NAME_INDIVIDUAL NAME_RESUME.pdf",
    format: "PDF. Standard professional resume format. 1-3 pages per person.",
    docCategory: "RESUME",
  },
  { id: "bankStatements", label: "6 Months Business Bank Statements", section: null, field: null,
    what: "The 6 most recent consecutive monthly bank statements for ALL business bank accounts. SBA uses these to verify cash flow, revenue claims, and current financial health.",
    where: "Download from your business bank's online portal. Log into your bank → Statements → download each month as PDF.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload as PDF. Name the file: FIRM NAME_DUNS NUMBER_TYPE OF FILE.pdf",
    format: "PDF. Must show account holder name (your business), account number, and full transaction history for each month.",
    docCategory: "BANK_STATEMENT",
  },
  { id: "leases", label: "Business Lease / Rental Agreement", section: null, field: null,
    what: "Your current commercial lease or rental agreement for your business location. If you work from home, a home office declaration may suffice. SBA wants to verify your place of business.",
    where: "Your landlord or property manager has a copy. Check your email for the signed lease. If home-based, write a simple declaration stating your home office address.",
    sbaPortal: "In certifications.sba.gov → 8(a) Application → Document Upload section → upload as PDF. Name the file: FIRM NAME_DUNS NUMBER_TYPE OF FILE.pdf",
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
  const [clientDocs, setClientDocs] = useState<Record<string, any[]>>({});
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);

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
      // Fetch all client documents grouped by category
      if (data.clientId) {
        try {
          const allCats = "FINANCIAL_STATEMENT,TAX_RETURN,CAPABILITY_STATEMENT,CONTRACT,CERTIFICATION_DOCUMENT,RESUME,BANK_STATEMENT,BUSINESS_LICENSE,INVOICE,OTHER";
          const docs = await apiRequest(`/api/upload/documents/by-category/${data.clientId}/${allCats}`);
          const grouped: Record<string, any[]> = {};
          for (const doc of docs) {
            if (!grouped[doc.category]) grouped[doc.category] = [];
            grouped[doc.category].push(doc);
          }
          setClientDocs(grouped);
        } catch {}
      }
    } catch (err) { console.error(err); setError("Failed to load."); }
    finally { setLoading(false); }
  }

  function isItemComplete(item: typeof SBA_FORM_1010_CHECKLIST[0]): boolean {
    if (manualChecks[item.id]) return true;
    if (uploadedFiles[item.id]) return true;
    // Auto-complete if matching documents are uploaded
    if ((item as any).docCategory) {
      const cats = Array.isArray((item as any).docCategory) ? (item as any).docCategory : [(item as any).docCategory];
      const hasFiles = cats.some((c: string) => (clientDocs[c] || []).length > 0);
      if (hasFiles) return true;
    }
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

  async function handleChecklistDrop(itemId: string, files: FileList | File[], docCategory: string | null) {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    setDragOverItem(null);
    setUploadingItem(itemId);
    const names: string[] = [];
    try {
      const token = localStorage.getItem("token");
      const cat = Array.isArray(docCategory) ? docCategory[0] : docCategory;
      for (const file of fileArr) {
        const formData = new FormData();
        formData.append("file", file);
        if (cert?.clientId) formData.append("clientId", cert.clientId);
        if (cat) formData.append("category", cat);
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!resp.ok) throw new Error(`Upload failed for ${file.name}`);
        names.push(file.name);
      }
      setUploadedFiles(prev => ({ ...prev, [itemId]: names.length === 1 ? names[0] : `${names.length} files uploaded` }));
      setManualChecks(prev => ({ ...prev, [itemId]: true }));
    } catch (err: any) {
      setError("Failed to upload: " + (err.message || "Unknown error"));
    } finally {
      setUploadingItem(null);
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

          {/* Financial Readiness Check */}
          {cert?.clientId && <FinancialReadiness clientId={cert.clientId} certType="EIGHT_A" />}

          {/* SBA Form 1010 Submission Wizard */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>SBA Form 1010 Submission Guide</h3>
              <a href="https://certifications.sba.gov" target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 16px", background: "var(--navy)", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "var(--gold2)", textDecoration: "none", whiteSpace: "nowrap" }}>
                Open certifications.sba.gov ↗
              </a>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 6 }}>Every document required for your 8(a) application. Click any item for detailed guidance on what it is, where to find it, and exactly where to upload it on certifications.sba.gov.</p>
            <div style={{ padding: "10px 14px", background: "rgba(200,155,60,.05)", borderRadius: "var(--r)", border: "1px solid rgba(200,155,60,.12)", marginBottom: 16, fontSize: 12, color: "var(--ink3)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--gold)" }}>💡 Tip:</strong> Work through this list top to bottom. GovCert has already prepared several items for you (marked green). For remaining items, click to expand and follow the guidance.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SBA_FORM_1010_CHECKLIST.map(item => {
                const complete = isItemComplete(item);
                const isExpanded = manualChecks[`expanded_${item.id}`];
                const isDragTarget = dragOverItem === item.id;
                return (
                  <div key={item.id}
                    onDragOver={(e) => { e.preventDefault(); setDragOverItem(item.id); }}
                    onDragLeave={() => { if (dragOverItem === item.id) setDragOverItem(null); }}
                    onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleChecklistDrop(item.id, e.dataTransfer.files, (item as any).docCategory || null); }}
                    style={{
                    border: `1px solid ${isDragTarget ? "var(--gold)" : complete ? "var(--green-b)" : isExpanded ? "rgba(200,155,60,.25)" : "var(--border)"}`,
                    borderRadius: "var(--r)", overflow: "hidden",
                    background: isDragTarget ? "rgba(200,155,60,.08)" : complete ? "var(--green-bg)" : isExpanded ? "rgba(200,155,60,.02)" : "#fff",
                    borderStyle: isDragTarget ? "dashed" : "solid",
                    transition: "all .15s",
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
                      {uploadingItem === item.id && (
                        <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 500, marginRight: 8 }}>Uploading...</span>
                      )}
                      {uploadedFiles[item.id] && (
                        <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500, marginRight: 8, display: "flex", alignItems: "center", gap: 4 }}>
                          &#x2713; {uploadedFiles[item.id]}
                        </span>
                      )}
                      {item.section && !complete && !uploadedFiles[item.id] && (
                        <a href={`/certifications/${certId}/8a/${item.section}`}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none", fontWeight: 500, marginRight: 8 }}>
                          Complete →
                        </a>
                      )}
                      {complete && item.field && !uploadedFiles[item.id] && (
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
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--navy)", marginBottom: 6 }}>🏛️ On certifications.sba.gov</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{(item as any).sbaPortal}</div>
                          </div>
                          <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>📋 Format requirements</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{(item as any).format}</div>
                          </div>
                        </div>
                        {/* Generate Form 413 button */}
                        {(item as any).generateForm413 && cert?.clientId && (() => {
                          // Check if economic data has enough for Form 413
                          let econData: any = {};
                          try { if (cert?.application?.economicDisadvantageData) econData = JSON.parse(cert.application.economicDisadvantageData); } catch {}
                          const hasAssets = !!(econData.cashOnHand || econData.cash || econData.savings || econData.realEstate || econData.retirement);
                          const hasLiabilities = !!(econData.mortgage || econData.mortgageBalance || econData.notesPayable || econData.installmentDebt);
                          const hasIncome = !!(econData.salary || econData.adjustedGrossIncome);
                          const fieldsPresent = [hasAssets, hasLiabilities, hasIncome].filter(Boolean).length;
                          const isReady = fieldsPresent >= 2;

                          return (
                          <div style={{ marginTop: 12, padding: "14px", background: isReady ? "rgba(200,155,60,.06)" : "rgba(200,60,60,.04)", borderRadius: 8, border: `1px solid ${isReady ? "rgba(200,155,60,.2)" : "rgba(200,60,60,.15)"}` }}>
                            {!isReady && (
                              <div style={{ marginBottom: 10, padding: "8px 10px", background: "var(--red-bg)", borderRadius: 6, border: "1px solid var(--red-b)", fontSize: 12, color: "var(--red)", lineHeight: 1.6 }}>
                                <strong>⚠️ Not enough data to generate Form 413.</strong> The Economic Disadvantage section needs more detail:
                                {!hasAssets && <div style={{ marginLeft: 12 }}>• Assets: cash on hand, savings, real estate values, retirement accounts</div>}
                                {!hasLiabilities && <div style={{ marginLeft: 12 }}>• Liabilities: mortgages, loans, installment debt</div>}
                                {!hasIncome && <div style={{ marginLeft: 12 }}>• Income: salary, investment income</div>}
                                <div style={{ marginTop: 6 }}><a href={`/certifications/${certId}/8a/economic-disadvantage`} style={{ color: "var(--gold)", fontWeight: 600 }}>Complete Economic Disadvantage section →</a></div>
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>📄 {isReady ? "Pre-Filled SBA Form 413" : "SBA Form 413 — Data Incomplete"}</div>
                                <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 2 }}>
                                  {isReady
                                    ? "Generated from your Economic Disadvantage data. Review with your CPA, sign, and upload to the portal."
                                    : "Complete the Economic Disadvantage section before generating. The Form 413 requires complete asset, liability, and income data to be valid."}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={async () => {
                                  try {
                                    const resp = await fetch(
                                      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/applications/generate-form-413/${cert.clientId}`,
                                      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                                    );
                                    if (!resp.ok) { alert('Failed to generate Form 413'); return; }
                                    const blob = await resp.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url; a.download = `SBA_Form_413_${cert.client?.businessName?.replace(/\s+/g, '_') || 'Company'}.pdf`; a.click();
                                    URL.revokeObjectURL(url);
                                  } catch { alert('Failed to generate Form 413'); }
                                }} disabled={!isReady} style={{
                                  padding: "8px 16px", fontSize: 12, fontWeight: 600,
                                  background: isReady ? "var(--gold)" : "var(--cream2)", color: isReady ? "#fff" : "var(--ink4)",
                                  border: "none", borderRadius: "var(--r)", cursor: isReady ? "pointer" : "not-allowed",
                                  opacity: isReady ? 1 : 0.6,
                                }}>
                                  {isReady ? "⬇ Download Pre-Filled 413" : "🔒 Complete Data First"}
                                </button>
                                <a href="https://www.sba.gov/document/sba-form-413" target="_blank" rel="noopener noreferrer" style={{
                                  padding: "8px 16px", fontSize: 12, fontWeight: 500,
                                  color: "var(--gold)", border: "1px solid rgba(200,155,60,.3)",
                                  borderRadius: "var(--r)", textDecoration: "none",
                                  display: "inline-flex", alignItems: "center",
                                }}>
                                  Blank Form ↗
                                </a>
                              </div>
                            </div>
                          </div>
                          );
                        })()}

                        {/* Show matching uploaded documents */}
                        {(item as any).docCategory && (() => {
                          const cats = Array.isArray((item as any).docCategory) ? (item as any).docCategory : [(item as any).docCategory];
                          const matchedDocs = cats.flatMap((c: string) => clientDocs[c] || []);
                          return matchedDocs.length > 0 ? true : false;
                        })() && (
                          <div style={{ marginTop: 12, padding: "12px", background: "var(--green-bg)", borderRadius: 8, border: "1px solid var(--green-b)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--green)", marginBottom: 8 }}>📁 Your uploaded files — ready to submit</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {(() => {
                                const cats = Array.isArray((item as any).docCategory) ? (item as any).docCategory : [(item as any).docCategory];
                                return cats.flatMap((c: string) => clientDocs[c] || []);
                              })().map((doc: any) => (
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
                                    ⬇ Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(item as any).docCategory && (!clientDocs[(item as any).docCategory] || clientDocs[(item as any).docCategory].length === 0) && (
                          <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(200,60,60,.03)", borderRadius: 8, border: "1px solid rgba(200,60,60,.1)", fontSize: 12, color: "var(--red)" }}>
                            ⚠️ No matching file uploaded yet. Upload this document in <a href={`/portal/documents`} style={{ color: "var(--gold)", fontWeight: 600 }}>My Documents</a> or gather it from the source described above.
                          </div>
                        )}
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

          {/* Past Performance — Ready to Enter in Portal */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Past Performance for certifications.sba.gov</h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 8, lineHeight: 1.6 }}>
              On certifications.sba.gov, you enter each contract separately into structured fields. Below is each of your contracts formatted and ready to copy into the portal fields.
            </p>
            <div style={{ padding: "8px 12px", background: "rgba(200,155,60,.05)", borderRadius: "var(--r)", border: "1px solid rgba(200,155,60,.12)", marginBottom: 16, fontSize: 12, color: "var(--ink3)" }}>
              <strong style={{ color: "var(--gold)" }}>Portal navigation:</strong> certifications.sba.gov → 8(a) Application → Business Activity → Government & Commercial Contracts → Add Contract
            </div>

            {(() => {
              let contracts: any[] = [];
              try {
                const pp = cert?.application?.pastPerformance8a || cert?.application?.pastPerformance;
                if (pp) contracts = typeof pp === "string" ? JSON.parse(pp) : pp;
              } catch {}

              if (contracts.length === 0) return (
                <div style={{ padding: "20px", background: "var(--cream2)", borderRadius: "var(--r)", textAlign: "center", color: "var(--ink4)", fontSize: 13 }}>
                  No past performance contracts entered yet. <a href={`/certifications/${certId}/8a/past-performance`} style={{ color: "var(--gold)", fontWeight: 600 }}>Add contracts →</a>
                </div>
              );

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {contracts.map((c: any, i: number) => {
                    const fields = [
                      { label: "Agency / Client Name", value: c.agencyName },
                      { label: "Contract Number", value: c.contractNumber },
                      { label: "Contract Type", value: c.contractType },
                      { label: "Contract Value", value: c.contractValue },
                      { label: "Period of Performance", value: `${c.periodStart || ''} to ${c.periodEnd || ''}` },
                      { label: "Description / Scope", value: c.sowDescription || c.description },
                      { label: "Reference Name", value: `${c.referenceFirstName || ''} ${c.referenceLastName || ''}`.trim() },
                      { label: "Reference Title", value: c.referenceTitle },
                      { label: "Reference Email", value: c.referenceEmail },
                      { label: "Reference Phone", value: c.referencePhone },
                    ].filter(f => f.value && f.value.trim());

                    const copyText = fields.map(f => `${f.label}: ${f.value}`).join('\n');

                    return (
                      <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{c.agencyName || `Contract ${i + 1}`}</span>
                            {c.contractValue && <span style={{ fontSize: 12, color: "var(--ink4)", marginLeft: 8 }}>{c.contractValue}</span>}
                          </div>
                          <button onClick={() => copyToClipboard(copyText, `contract-${i}`)} style={{
                            padding: "6px 14px", fontSize: 12, fontWeight: 600,
                            background: copySuccess === `contract-${i}` ? "var(--green)" : "var(--gold)",
                            color: "#fff", border: "none", borderRadius: "var(--r)", cursor: "pointer",
                          }}>
                            {copySuccess === `contract-${i}` ? "✓ Copied!" : "📋 Copy All Fields"}
                          </button>
                        </div>
                        <div style={{ padding: "12px 16px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {fields.map((f, fi) => (
                              <div key={fi} style={{ padding: "6px 0" }}>
                                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink4)", fontWeight: 600 }}>{f.label}</div>
                                <div style={{ fontSize: 13, color: "var(--navy)", marginTop: 2 }}>{f.value}</div>
                              </div>
                            ))}
                          </div>
                          {c.narrative && (
                            <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(200,155,60,.04)", borderRadius: 6, border: "1px solid rgba(200,155,60,.1)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--gold)", fontWeight: 600 }}>Performance Narrative</span>
                                <button onClick={() => copyToClipboard(c.narrative, `narrative-${i}`)} style={{
                                  padding: "3px 10px", fontSize: 11, fontWeight: 600,
                                  background: copySuccess === `narrative-${i}` ? "var(--green)" : "transparent",
                                  color: copySuccess === `narrative-${i}` ? "#fff" : "var(--gold)",
                                  border: `1px solid ${copySuccess === `narrative-${i}` ? "var(--green)" : "rgba(200,155,60,.3)"}`,
                                  borderRadius: 4, cursor: "pointer",
                                }}>
                                  {copySuccess === `narrative-${i}` ? "✓" : "Copy"}
                                </button>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.6 }}>{c.narrative.substring(0, 300)}{c.narrative.length > 300 ? "..." : ""}</div>
                            </div>
                          )}
                          {(!c.referenceEmail) && (
                            <div style={{ marginTop: 8, padding: "6px 10px", background: "var(--red-bg)", borderRadius: 4, border: "1px solid var(--red-b)", fontSize: 11, color: "var(--red)" }}>
                              ⚠️ Missing reference contact — SBA may contact your references. <a href={`/certifications/${certId}/8a/past-performance`} style={{ color: "var(--gold)", fontWeight: 600 }}>Add reference →</a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
                  href="https://certifications.sba.gov"
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
