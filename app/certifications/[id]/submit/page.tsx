"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { usePaywall } from "@/lib/usePaywall";
import PaywallModal from "@/components/PaywallModal";
import { generatePDF, generateDOCX } from "@/lib/generatePDF";
import ExecutiveReview from "@/components/ExecutiveReview";

/* ═══════════════════════════════════════════════════════════════════
   GSA MAS eOffer Submission Package
   ONE integrated flow mirroring the exact eOffer screen sequence.
   Each step is either: copy text, download file, or confirm a value.
   ═══════════════════════════════════════════════════════════════════ */

function extractNarrativeField(narrativeJson: string | undefined, key: string): string {
  if (!narrativeJson) return "";
  try {
    const parsed = JSON.parse(narrativeJson);
    // If a review-fixed version exists for this specific subsection, prefer it
    if (parsed._reviewFixes?.[key]?.content) return parsed._reviewFixes[key].content;
    if (parsed.narratives) return parsed.narratives[key] || "";
    if (parsed.answers) return parsed.answers[key] || "";
    return parsed[key] || "";
  } catch { return ""; }
}

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [clientDocs, setClientDocs] = useState<Record<string, any[]>>({});
  const [dragOverStep, setDragOverStep] = useState<string | null>(null);
  const [uploadingStep, setUploadingStep] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";
  const [sinNarratives, setSinNarratives] = useState<Record<string, string>>({});
  const [eofferData, setEofferData] = useState<any>({});
  const [samValidation, setSamValidation] = useState<any>(null);
  const [samValidating, setSamValidating] = useState(false);
  const [homeLink, setHomeLink] = useState("/portal");
  const pw = usePaywall("GSA_MAS");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role === "ADMIN" || payload.role === "ADVISOR") setHomeLink("/dashboard");
      }
    } catch {}
  }, []);

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

      // Parse eofferData
      try { setEofferData(JSON.parse(data.application?.eofferData || "{}")); } catch {}

      // Parse SIN narratives
      if (data.application?.sinNarratives) {
        try { setSinNarratives(JSON.parse(data.application.sinNarratives)); } catch {}
      }

      // Fetch ALL client documents (use the documents list endpoint, not by-category)
      if (data.clientId) {
        try {
          const rawDocs = await apiRequest(`/api/upload/documents?clientId=${data.clientId}`);
          const grouped: Record<string, any[]> = {};
          for (const doc of (Array.isArray(rawDocs) ? rawDocs : [])) {
            // Strip heavy fields — submit page only needs id, name, category for download
            const light = { id: doc.id, originalName: doc.originalName, category: doc.category, documentYear: doc.documentYear };
            if (!grouped[light.category]) grouped[light.category] = [];
            grouped[light.category].push(light);
          }
          setClientDocs(grouped);
        } catch (e) { console.error("Failed to load documents:", e); }
      }

      // SAM.gov validation (non-blocking)
      if (data.clientId) {
        setSamValidating(true);
        apiRequest(`/api/sam/validate/${data.clientId}`)
          .then(r => setSamValidation(r))
          .catch(() => {})
          .finally(() => setSamValidating(false));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  // ── Helpers ──
  async function copyText(text: string, id: string) {
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement("textarea"); el.value = text; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function downloadDoc(doc: any) {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/documents/download/${doc.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!resp.ok) { setError("Download failed"); return; }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = doc.originalName || "document"; a.click();
      URL.revokeObjectURL(url);
    } catch { setError("Download failed"); }
  }

  async function handleFileDrop(stepId: string, files: FileList, category: string) {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    setUploadingStep(stepId);
    setDragOverStep(null);
    try {
      const token = localStorage.getItem("token");
      const clientId = cert?.clientId || cert?.client?.id;
      for (const file of fileArr) {
        const formData = new FormData();
        formData.append("file", file);
        if (clientId) formData.append("clientId", clientId);
        formData.append("category", category);
        const resp = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!resp.ok) throw new Error(`Upload failed for ${file.name}`);
      }
      // Refresh docs
      if (clientId) {
        const rawDocs = await apiRequest(`/api/upload/documents?clientId=${clientId}`);
        const grouped: Record<string, any[]> = {};
        for (const doc of (Array.isArray(rawDocs) ? rawDocs : [])) {
          const light = { id: doc.id, originalName: doc.originalName, category: doc.category, documentYear: doc.documentYear };
          if (!grouped[light.category]) grouped[light.category] = [];
          grouped[light.category].push(light);
        }
        setClientDocs(grouped);
      }
    } catch (err: any) {
      setError("Upload failed: " + (err.message || ""));
    } finally {
      setUploadingStep(null);
    }
  }

  async function downloadCSP1() {
    const XLSX = await import("xlsx");
    let lcats: any[] = [];
    try { lcats = JSON.parse(cert?.application?.pricingData || "{}").lcats || []; } catch {}
    if (lcats.length === 0) return;
    const selectedSINs = cert?.application?.selectedSINs || "";
    const headers = ["SIN(s) Proposed", "Labor Category / Service Proposed (Title)", "Labor Category / Service Description", "Minimum Education / Certification Level", "Minimum Years of Experience", "Domestic / Overseas", "Commercial Rate", "Proposed GSA Rate (including IFF)", "Unit of Issue"];
    const rows = lcats.map((l: any) => {
      const base = parseFloat(l.baseRate || l.mfcRate || "0"), gsa = parseFloat(l.gsaRate || "0");
      return [selectedSINs, l.title || "", l.description || "", l.education || "", l.yearsExperience || l.experience || "", "Domestic", `$${base.toFixed(2)}`, `$${gsa.toFixed(2)}`, "Hourly"];
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [{ wch: 18 }, { wch: 35 }, { wch: 50 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 22 }, { wch: 22 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pricing Support Documentation");
    XLSX.writeFile(wb, `Pricing_${cert?.client?.businessName?.replace(/\s+/g, "_") || "pricing"}.xlsx`);
  }

  // ── Build steps ──
  const app = cert?.application;
  const client = cert?.client;
  const corpNarrative = (key: string) => extractNarrativeField(app?.narrativeCorp, key);
  const qcpNarrative = (key: string) => extractNarrativeField(app?.narrativeQCP, key);

  type Step = { id: string; label: string; eofferLocation: string; type: "info" | "text" | "files" | "confirm"; status: "ready" | "partial" | "missing"; content?: any };

  const steps: Step[] = [
    // ── PREREQUISITES ──
    { id: "prereq-pathways", label: "Pathways to Success Training", eofferLocation: "Prerequisite — complete before accessing eOffer", type: "info", status: "missing",
      content: { text: "Complete GSA's free Pathways to Success training at vsc.gsa.gov → Vendor Training. Save your completion certificate PDF — upload it to eOffer." } },
    { id: "prereq-cert", label: "Digital Certificate", eofferLocation: "Prerequisite — required for eOffer login & signing", type: "info", status: "missing",
      content: { text: "Request a digital certificate at vsc.gsa.gov → Digital Certificates. Install the .p12 file in your browser. You cannot access eOffer without this." } },
    { id: "prereq-sam", label: "SAM.gov Registration", eofferLocation: "Prerequisite — eOffer pulls your data from SAM", type: "info",
      status: samValidation?.status === "pass" ? "ready" : samValidation?.status === "warn" ? "partial" : "missing",
      content: { samValidation, samValidating } },

    // ── STEP 1: CORPORATE INFO ──
    { id: "corp-info", label: "Company Information", eofferLocation: "eOffer → Corporate Information", type: "text",
      status: client?.businessName && client?.uei ? "ready" : "partial",
      content: { fields: [
        { label: "Legal Business Name", value: client?.businessName || "", id: "f-name" },
        { label: "UEI", value: client?.uei || "", id: "f-uei" },
        { label: "CAGE Code", value: client?.cageCode || "", id: "f-cage" },
        { label: "EIN", value: client?.ein || "", id: "f-ein" },
      ] } },

    // ── STEP 2: NEGOTIATORS ──
    { id: "negotiators", label: "Authorized Negotiators", eofferLocation: "eOffer → Negotiators", type: "text",
      status: eofferData.negotiatorName ? "ready" : "missing",
      content: { fields: (eofferData.authorizedNegotiators || [{ name: eofferData.negotiatorName, title: eofferData.negotiatorTitle, email: eofferData.negotiatorEmail, phone: eofferData.negotiatorPhone }]).filter((n: any) => n?.name).map((n: any, i: number) => ([
        { label: `Negotiator ${i + 1} Name`, value: n.name || "", id: `neg-${i}-name` },
        { label: `Title`, value: n.title || "", id: `neg-${i}-title` },
        { label: `Email`, value: n.email || "", id: `neg-${i}-email` },
        { label: `Phone`, value: n.phone || "", id: `neg-${i}-phone` },
      ])).flat() } },

    // ── STEP 3: SINs ──
    { id: "sins", label: "SINs / Goods & Services", eofferLocation: "eOffer → Available Offerings → Select SINs", type: "text",
      status: app?.selectedSINs ? "ready" : "missing",
      content: { fields: [{ label: "Selected SINs (enter these in eOffer)", value: app?.selectedSINs || "No SINs selected", id: "f-sins" }] } },

    // ── STEP 4: STANDARD RESPONSES ──
    { id: "std-responses", label: "Standard Responses", eofferLocation: "eOffer → Standard Responses", type: "confirm",
      status: "ready",
      content: { fields: [
        { label: "Disaster Purchasing", value: eofferData.stdDisasterPurchasing || "Yes", rec: "Yes", id: "std-disaster" },
        { label: "Exceptions to Terms & Conditions", value: eofferData.stdExceptionsTC || "No", rec: "No", id: "std-tc" },
        { label: "Exceptions to Certs & Reps", value: eofferData.stdExceptionsReps || "No", rec: "No", id: "std-reps" },
        { label: "Minimum Order Value", value: eofferData.stdMinOrder || "$250.00", id: "std-min" },
        { label: "Subcontracting Plan", value: eofferData.stdSubcontractPlan || "Small Business Exempt", id: "std-sub" },
      ] } },

    // ── STEP 5: SOLICITATION CLAUSES ──
    { id: "clauses", label: "Solicitation Clauses", eofferLocation: "eOffer → Solicitation Clauses (acknowledge each)", type: "confirm",
      status: "ready",
      content: { fields: [
        { label: "TAA Compliance", value: eofferData.clauseTAA || "Yes", id: "cl-taa" },
        { label: "Place of Performance", value: eofferData.clausePOP || "", id: "cl-pop" },
        { label: "Service Contract Labor Standards", value: eofferData.clauseSCA || "Professional Exemption Applies", id: "cl-sca" },
        { label: "Small Business Representation", value: eofferData.clauseSmallBiz || "Small Business", id: "cl-sb" },
      ] } },

    // ── STEP 6a: CORPORATE EXPERIENCE NARRATIVES ──
    { id: "narr-corp", label: "Corporate Experience", eofferLocation: "eOffer → Solicitation Provisions → Factor 1", type: "text",
      status: corpNarrative("overview") ? "ready" : "missing",
      content: { narratives: [
        { label: "Company Overview", value: corpNarrative("overview"), id: "nc-overview", charLimit: 1500 },
        { label: "Core Capabilities & Services", value: corpNarrative("capabilities"), id: "nc-cap", charLimit: 1500 },
        { label: "Employee Experience", value: corpNarrative("employees"), id: "nc-emp", charLimit: 1500 },
        { label: "Organizational Controls", value: corpNarrative("org_controls"), id: "nc-org", charLimit: 1000 },
        { label: "Resources & Capacity", value: corpNarrative("resources"), id: "nc-res", charLimit: 800 },
        { label: "Past Projects", value: corpNarrative("past_projects"), id: "nc-pp", charLimit: 1500 },
        { label: "Marketing Plan", value: corpNarrative("marketing"), id: "nc-mkt", charLimit: 800 },
        { label: "Subcontractor Management", value: corpNarrative("subcontractors"), id: "nc-sub", charLimit: 400 },
      ] } },

    // ── STEP 6b: QCP NARRATIVES ──
    { id: "narr-qcp", label: "Quality Control Plan", eofferLocation: "eOffer → Solicitation Provisions → Factor 3", type: "text",
      status: qcpNarrative("overview") ? "ready" : "missing",
      content: { narratives: [
        { label: "QCP Overview", value: qcpNarrative("overview"), id: "nq-overview", charLimit: 2000 },
        { label: "Supervision", value: qcpNarrative("supervision"), id: "nq-sup", charLimit: 2000 },
        { label: "QC Personnel", value: qcpNarrative("personnel"), id: "nq-per", charLimit: 1500 },
        { label: "Subcontractor QC", value: qcpNarrative("subcontractors"), id: "nq-sub", charLimit: 1500 },
        { label: "Corrective Action", value: qcpNarrative("corrective"), id: "nq-cor", charLimit: 1500 },
        { label: "Urgent Requirements", value: qcpNarrative("urgent"), id: "nq-urg", charLimit: 1000 },
      ] } },

    // ── STEP 6c: SIN NARRATIVES ──
    { id: "narr-sin", label: "Relevant Project Experience", eofferLocation: "eOffer → Solicitation Provisions → Factor 4 (per SIN)", type: "text",
      status: Object.keys(sinNarratives).length > 0 ? "ready" : "missing",
      content: { narratives: Object.entries(sinNarratives).map(([sin, text]) => ({
        label: `SIN ${sin}`, value: text as string, id: `ns-${sin}`, charLimit: 10000,
      })) } },

    // ── STEP 7: UPLOAD DOCUMENTS ──
    { id: "upload-financials", label: "Financial Statements (2 Years)", eofferLocation: "eOffer → Upload Documents", type: "files",
      status: (clientDocs.FINANCIAL_STATEMENT || []).length > 0 ? "ready" : "missing",
      content: { docs: clientDocs.FINANCIAL_STATEMENT || [], note: "Upload your P&L + Balance Sheet for the 2 most recent fiscal years. Drag and drop files here.", dropCategory: "FINANCIAL_STATEMENT" } },

    { id: "upload-pp", label: "Past Performance References (CPARS / PPQs)", eofferLocation: "eOffer → Upload Documents", type: "files",
      status: (clientDocs.PPQ_RESPONSE || []).length + (clientDocs.PPQ_COMPLETED || []).length + (clientDocs.CPARS_REPORT || []).length > 0 ? "ready" : "missing",
      content: { docs: [...(clientDocs.PPQ_RESPONSE || []), ...(clientDocs.PPQ_COMPLETED || []), ...(clientDocs.CPARS_REPORT || [])], note: "Minimum 3 references. Each file = one reference for eOffer. Drag and drop files here.", dropCategory: "PPQ_RESPONSE" } },

    { id: "upload-csp1", label: "Pricing Support Documentation (Excel)", eofferLocation: "eOffer → Upload Documents", type: "files",
      status: (() => { try { return (JSON.parse(app?.pricingData || "{}").lcats || []).length > 0 ? "ready" : "missing"; } catch { return "missing"; } })(),
      content: { generated: true, generateLabel: "Download Pricing Excel", generateFn: downloadCSP1, docs: clientDocs.CSP1_GENERATED || [], note: "Generated from your Pricing page rate table." } },

    { id: "upload-price-proposal", label: "Price Proposal (TDR)", eofferLocation: "eOffer → Upload Documents (PDF)", type: "text",
      status: app?.priceProposal ? "ready" : "missing",
      content: {
        narratives: app?.priceProposal ? [{ label: "Price Proposal", value: app.priceProposal, id: "price-proposal", charLimit: null }] : [],
        emptyMessage: "Generate on the Pricing page → Price Proposal section.",
        pdfDownload: app?.priceProposal ? () => generatePDF({
          title: "Price Proposal",
          companyName: client?.businessName || "",
          content: app.priceProposal,
          fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Price_Proposal.pdf`,
          clientId: cert?.clientId || client?.id,
          category: "PRICE_PROPOSAL_GENERATED",
          apiUrl: API_URL,
        }) : null,
        docxDownload: app?.priceProposal ? () => generateDOCX({
          title: "Price Proposal",
          companyName: client?.businessName || "",
          content: app.priceProposal,
          fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Price_Proposal.docx`,
        }) : null,
        docs: clientDocs.PRICE_PROPOSAL_GENERATED || [],
      } },

    { id: "upload-neg-letter", label: "Authorized Negotiator Letter", eofferLocation: "eOffer → Upload Documents (PDF)", type: "text",
      status: eofferData.negotiatorLetter ? "ready" : "missing",
      content: {
        narratives: eofferData.negotiatorLetter ? [{ label: "Negotiator Letter", value: eofferData.negotiatorLetter, id: "neg-letter", charLimit: null }] : [],
        emptyMessage: "Generate on the Authorized Negotiator Letter page.",
        signatureImage: eofferData.signatureImage,
        pdfDownload: eofferData.negotiatorLetter ? () => generatePDF({
          title: "Authorized Negotiator Designation Letter",
          companyName: client?.businessName || "",
          content: eofferData.negotiatorLetter,
          fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Authorized_Negotiator_Letter.pdf`,
          signatureImage: eofferData.signatureImage || null,
          clientId: cert?.clientId || client?.id,
          category: "NEGOTIATOR_LETTER_GENERATED",
          apiUrl: API_URL,
        }) : null,
        docxDownload: eofferData.negotiatorLetter ? () => generateDOCX({
          title: "Authorized Negotiator Designation Letter",
          companyName: client?.businessName || "",
          content: eofferData.negotiatorLetter,
          fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Authorized_Negotiator_Letter.docx`,
        }) : null,
        docs: clientDocs.NEGOTIATOR_LETTER_GENERATED || [],
      } },

    { id: "upload-subcon", label: "Subcontracting Plan", eofferLocation: "eOffer → Upload Documents (PDF, if applicable)", type: "text",
      status: eofferData.clauseSmallBiz === "Small Business" ? "ready" : eofferData.subcontractingPlan ? "ready" : "missing",
      content: {
        narratives: eofferData.subcontractingPlan ? [{ label: "Subcontracting Plan", value: eofferData.subcontractingPlan, id: "subcon-plan", charLimit: null }] : [],
        emptyMessage: eofferData.clauseSmallBiz === "Small Business" ? "Small Business Exempt — no plan required. Select 'Small Business Exempt' in eOffer." : "Generate on the Subcontracting Plan page.",
        exempt: eofferData.clauseSmallBiz === "Small Business",
        pdfDownload: eofferData.subcontractingPlan ? () => generatePDF({
          title: "Subcontracting Plan (FAR 52.219-9)",
          companyName: client?.businessName || "",
          content: eofferData.subcontractingPlan,
          fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Subcontracting_Plan.pdf`,
          clientId: cert?.clientId || client?.id,
          category: "SUBCONTRACTING_PLAN_GENERATED",
          apiUrl: API_URL,
        }) : null,
        docxDownload: eofferData.subcontractingPlan ? () => generateDOCX({
          title: "Subcontracting Plan (FAR 52.219-9)",
          companyName: client?.businessName || "",
          content: eofferData.subcontractingPlan,
          fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Subcontracting_Plan.docx`,
        }) : null,
        docs: clientDocs.SUBCONTRACTING_PLAN_GENERATED || [],
      } },

    // ── STEP 8: SUBMIT ──
    { id: "submit-final", label: "Review & Submit", eofferLocation: "eOffer → Submit Proposal", type: "info",
      status: "missing",
      content: { text: "Review all sections in eOffer. Click 'Submit Proposal' to send your offer to GSA. Your digital certificate signs the submission. Save a copy of the confirmation." } },
  ];

  const readyCount = steps.filter(s => s.status === "ready").length;
  const totalSteps = steps.length;

  if (loading) return <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <a href={homeLink} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em></span>
          </a>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 6, fontWeight: 600 }}>eOffer Flow</div>
          {steps.map(step => (
            <div key={step.id} onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", borderRadius: "var(--r)", marginBottom: 1, cursor: "pointer",
                background: expandedStep === step.id ? "rgba(200,155,60,.15)" : "transparent",
                color: expandedStep === step.id ? "var(--gold2)" : "rgba(255,255,255,.45)", fontSize: 11 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff",
                background: step.status === "ready" ? "var(--green)" : step.status === "partial" ? "rgba(200,155,60,.5)" : "rgba(255,255,255,.12)" }}>
                {step.status === "ready" ? "\u2713" : ""}
              </div>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {pw.loading && <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Checking access...</div>}
        {!pw.loading && !pw.generationAccess && <PaywallModal certType="GSA_MAS" price={pw.price} betaMode={pw.betaMode} onUnlock={pw.onUnlock} onClose={pw.closePaywall} />}
        <div style={!pw.loading && !pw.generationAccess ? { filter: "blur(8px)", pointerEvents: "none" as const } : {}}>
        <div style={{ padding: "40px 48px", maxWidth: 920 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>← Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Final Step</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>eOffer Submission Package</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Everything you need, in the order eOffer expects it. Open <a href="https://eoffer.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", fontWeight: 500 }}>eoffer.gsa.gov</a> side by side and work through each step.
            </p>
          </div>

          {/* Progress */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 4 }}>
                {readyCount === totalSteps ? "\u2713 Ready to submit" : `${readyCount} of ${totalSteps} steps ready`}
              </div>
              <div style={{ height: 4, width: 200, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(readyCount / totalSteps) * 100}%`, background: readyCount === totalSteps ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
              </div>
            </div>
            <a href="https://eoffer.gsa.gov" target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 20px", background: "var(--gold)", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none" }}>
              Open eOffer →
            </a>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>&times;</button>
            </div>
          )}

          {/* Executive Review */}
          {cert && <ExecutiveReview cert={cert} certId={certId} />}

          {/* GovCert Analysis CTA */}
          <a href={`/certifications/${certId}/review`}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", marginBottom: 20,
              background: "linear-gradient(135deg, #1A2332 0%, #2D3748 100%)", borderRadius: "var(--rl)", textDecoration: "none",
              border: "1px solid rgba(99,102,241,.3)", boxShadow: "0 4px 20px rgba(99,102,241,.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {"\uD83D\uDD0D"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Run GovCert Analysis</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>AI review of your entire application — scores each section, identifies gaps, and recommends improvements before you submit.</div>
              </div>
            </div>
            <div style={{ padding: "10px 20px", background: "rgba(99,102,241,.2)", border: "1px solid rgba(99,102,241,.4)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              Analyze →
            </div>
          </a>

          {/* ═══ STEPS ═══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map(step => {
              const isOpen = expandedStep === step.id;
              const statusColor = step.status === "ready" ? "var(--green)" : step.status === "partial" ? "var(--amber)" : "var(--ink4)";
              const statusBg = step.status === "ready" ? "var(--green-bg)" : step.status === "partial" ? "var(--amber-bg)" : "var(--cream2)";

              return (
                <div key={step.id} style={{ background: "#fff", border: `1px solid ${step.status === "ready" ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                  {/* Header */}
                  <div onClick={() => setExpandedStep(isOpen ? null : step.id)}
                    style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: isOpen ? "var(--cream)" : "#fff" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: step.status === "ready" ? "var(--green)" : step.status === "partial" ? "var(--amber)" : "var(--cream2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                      {step.status === "ready" ? "\u2713" : ""}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{step.label}</div>
                      <div style={{ fontSize: 11, color: "var(--ink4)" }}>{step.eofferLocation}</div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 600, background: statusBg, color: statusColor, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      {step.status === "ready" ? "Ready" : step.status === "partial" ? "Partial" : step.type === "info" ? "Action needed" : "Missing"}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--gold)" }}>{isOpen ? "\u25B2" : "\u25BC"}</span>
                  </div>

                  {/* Expanded content */}
                  {isOpen && (
                    <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>

                      {/* INFO type */}
                      {step.type === "info" && step.content?.text && (
                        <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.7 }}>{step.content.text}</div>
                      )}

                      {/* SAM validation */}
                      {step.id === "prereq-sam" && step.content?.samValidation && (
                        <div>
                          {step.content.samValidation.samEntity && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                              {[
                                ["Legal Name", step.content.samValidation.samEntity.legalBusinessName],
                                ["UEI", step.content.samValidation.samEntity.uei],
                                ["CAGE", step.content.samValidation.samEntity.cageCode],
                                ["Status", step.content.samValidation.samEntity.status],
                                ["Expires", step.content.samValidation.samEntity.expirationDate],
                                ["NAICS", (step.content.samValidation.samEntity.naicsCodes || []).join(", ")],
                              ].map(([label, val]) => (
                                <div key={label as string} style={{ fontSize: 12 }}><strong>{label}:</strong> {val || "—"}</div>
                              ))}
                            </div>
                          )}
                          {(step.content.samValidation.checks || []).map((c: any) => (
                            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 8px", borderRadius: 4, marginBottom: 2, background: c.status === "pass" ? "rgba(46,125,50,.06)" : c.status === "warn" ? "rgba(200,155,60,.06)" : "rgba(200,60,60,.06)" }}>
                              <span style={{ color: c.status === "pass" ? "var(--green)" : c.status === "warn" ? "var(--amber)" : "var(--red)", fontWeight: 700 }}>
                                {c.status === "pass" ? "\u2713" : c.status === "warn" ? "\u26A0" : "\u2717"}
                              </span>
                              <span style={{ color: "var(--ink2)" }}>{c.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {step.id === "prereq-sam" && step.content?.samValidating && (
                        <div style={{ fontSize: 13, color: "var(--ink3)" }}>Checking SAM.gov...</div>
                      )}

                      {/* TEXT type — copyable fields */}
                      {step.type === "text" && step.content?.fields && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {step.content.fields.map((f: any) => (
                            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{f.label}</div>
                                <div style={{ fontSize: 14, color: f.value ? "var(--navy)" : "var(--ink4)", fontWeight: 500, marginTop: 2 }}>{f.value || "Not set"}</div>
                              </div>
                              {f.value && (
                                <button onClick={() => copyText(f.value, f.id)}
                                  style={{ padding: "5px 14px", background: copiedId === f.id ? "var(--green)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 600, color: copiedId === f.id ? "#fff" : "var(--gold2)", cursor: "pointer", flexShrink: 0 }}>
                                  {copiedId === f.id ? "\u2713 Copied" : "Copy"}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* TEXT type — narratives */}
                      {step.type === "text" && step.content?.narratives && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {/* Combined copy button for eOffer single-field paste */}
                          {(step.id === "narr-corp" || step.id === "narr-qcp") && step.content.narratives.some((n: any) => n.value) && (() => {
                            const combined = step.content.narratives
                              .filter((n: any) => n.value)
                              .map((n: any) => n.value)
                              .join("\n\n");
                            const combinedChars = combined.length;
                            const limit = 10000;
                            const isOver = combinedChars > limit;
                            return (
                              <div style={{
                                padding: "14px 18px", borderRadius: "var(--rl)",
                                background: isOver ? "rgba(220,50,50,.04)" : "var(--navy)",
                                border: isOver ? "1px solid rgba(220,50,50,.2)" : "none",
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                              }}>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: isOver ? "#b91c1c" : "#fff" }}>
                                    {step.id === "narr-corp" ? "eOffer Factor 1" : "eOffer Factor 3"} — Single Text Field
                                  </div>
                                  <div style={{ fontSize: 11, color: isOver ? "#b91c1c" : "rgba(255,255,255,.6)", marginTop: 2 }}>
                                    {combinedChars.toLocaleString()} / {limit.toLocaleString()} characters combined
                                    {isOver ? ` — ${(combinedChars - limit).toLocaleString()} over limit!` : ""}
                                  </div>
                                </div>
                                <button onClick={() => copyText(combined, `${step.id}-combined`)}
                                  style={{
                                    padding: "8px 20px",
                                    background: copiedId === `${step.id}-combined` ? "var(--green)" : isOver ? "#b91c1c" : "var(--gold)",
                                    border: "none", borderRadius: "var(--r)",
                                    fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer",
                                  }}>
                                  {copiedId === `${step.id}-combined` ? "✓ Copied All" : "Copy All for eOffer →"}
                                </button>
                              </div>
                            );
                          })()}
                          {step.content.narratives.length === 0 && step.content.emptyMessage && (
                            <div style={{ fontSize: 13, color: "var(--ink4)", fontStyle: "italic", padding: "12px 0" }}>{step.content.emptyMessage}</div>
                          )}
                          {step.content.narratives.map((n: any) => {
                            const charCount = (n.value || "").length;
                            const isOver = n.charLimit && charCount > n.charLimit;
                            return (
                              <div key={n.id} style={{ border: `1px solid ${isOver ? "var(--red-b)" : n.value ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--r)", overflow: "hidden" }}>
                                <div style={{ padding: "10px 14px", background: n.value ? "var(--green-bg)" : "var(--cream)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: n.value ? "var(--navy)" : "var(--ink4)" }}>
                                      {n.value ? "\u2713 " : ""}{n.label}
                                    </div>
                                    {n.charLimit && <div style={{ fontSize: 10, fontFamily: "monospace", color: isOver ? "var(--red)" : "var(--ink4)" }}>{charCount.toLocaleString()} / {n.charLimit.toLocaleString()} chars{isOver ? " — over limit!" : ""}</div>}
                                  </div>
                                  {n.value && (
                                    <button onClick={() => copyText(n.value, n.id)}
                                      style={{ padding: "5px 14px", background: copiedId === n.id ? "var(--green)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 600, color: copiedId === n.id ? "#fff" : "var(--gold2)", cursor: "pointer" }}>
                                      {copiedId === n.id ? "\u2713 Copied" : "Copy →"}
                                    </button>
                                  )}
                                </div>
                                {n.value && (
                                  <div style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--ink)", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>
                                    {n.value}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {/* Download buttons — PDF for upload, DOCX for editing */}
                          {step.content.pdfDownload && (
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button onClick={step.content.pdfDownload}
                                style={{ flex: 1, padding: "12px 20px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                {"\u2B07"} Download PDF (for eOffer upload)
                              </button>
                              {step.content.docxDownload && (
                                <button onClick={step.content.docxDownload}
                                  style={{ flex: 1, padding: "12px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--navy)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                                  {"\u2B07"} Download Word (to review &amp; edit)
                                </button>
                              )}
                            </div>
                          )}
                          {/* Previously generated PDF files */}
                          {(step.content.docs || []).length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--green)", marginBottom: 6 }}>Saved PDF — ready for eOffer</div>
                              {step.content.docs.map((doc: any) => (
                                <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--green-bg)", borderRadius: "var(--r)", border: "1px solid var(--green-b)", marginBottom: 4 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{doc.originalName}</div>
                                  <button onClick={() => downloadDoc(doc)}
                                    style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, color: "var(--green)", border: "1px solid var(--green-b)", borderRadius: 5, background: "transparent", cursor: "pointer" }}>
                                    Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Signature image for negotiator letter */}
                          {step.content.signatureImage && (
                            <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)" }}>
                              <div style={{ fontSize: 10, color: "var(--ink4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Signature</div>
                              <img src={step.content.signatureImage} alt="Signature" style={{ maxHeight: 60, border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 2, background: "#fff" }} />
                            </div>
                          )}
                          {/* Exempt notice */}
                          {step.content.exempt && (
                            <div style={{ padding: "12px 14px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 13, color: "var(--green)" }}>
                              {"\u2713"} {step.content.emptyMessage}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CONFIRM type */}
                      {step.type === "confirm" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {(step.content?.fields || []).map((f: any) => (
                            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                              <div style={{ fontSize: 13, color: "var(--ink2)" }}>{f.label}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{f.value}</span>
                                {f.rec && <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 500 }}>Recommended</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* FILES type — with drag-and-drop upload */}
                      {step.type === "files" && (
                        <div
                          onDragOver={step.content?.dropCategory ? (e) => { e.preventDefault(); setDragOverStep(step.id); } : undefined}
                          onDragLeave={step.content?.dropCategory ? () => setDragOverStep(null) : undefined}
                          onDrop={step.content?.dropCategory ? (e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleFileDrop(step.id, e.dataTransfer.files, step.content.dropCategory); } : undefined}
                          style={dragOverStep === step.id ? { border: "2px dashed var(--gold)", borderRadius: "var(--r)", padding: 8, background: "rgba(200,155,60,.04)" } : {}}>
                          {uploadingStep === step.id && <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Uploading...</div>}
                          {step.content?.note && <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 10, lineHeight: 1.6 }}>{step.content.note}</div>}
                          {/* Generated file button */}
                          {step.content?.generated && step.content?.generateFn && (
                            <button onClick={step.content.generateFn}
                              style={{ padding: "10px 20px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12, width: "100%" }}>
                              {"\u2B07"} {step.content.generateLabel}
                            </button>
                          )}
                          {/* File list */}
                          {(step.content?.docs || []).length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {step.content.docs.map((doc: any) => (
                                <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--green-bg)", borderRadius: "var(--r)", border: "1px solid var(--green-b)" }}>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{doc.originalName}</div>
                                    <div style={{ fontSize: 10, color: "var(--ink4)" }}>{doc.category?.replace(/_/g, " ")}{doc.documentYear ? ` \u00B7 ${doc.documentYear}` : ""}</div>
                                  </div>
                                  <button onClick={() => downloadDoc(doc)}
                                    style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, color: "var(--green)", border: "1px solid var(--green-b)", borderRadius: 5, background: "transparent", cursor: "pointer" }}>
                                    Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : !step.content?.generated && (
                            <div style={{ padding: "14px", background: "rgba(200,60,60,.03)", borderRadius: "var(--r)", border: "1px solid rgba(200,60,60,.08)", fontSize: 12, color: "var(--red)" }}>
                              No files uploaded yet. Upload in <a href="/portal/documents" style={{ color: "var(--gold)", fontWeight: 600 }}>My Documents</a> or on the relevant wizard page.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom actions */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "24px 28px", marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 4 }}>Ready to submit?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>Open eOffer side by side and work through each step above.</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <a href={`/certifications/${certId}`} style={{ padding: "10px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, textDecoration: "none" }}>← Dashboard</a>
              <a href={`/certifications/${certId}/review`} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Run Analysis</a>
              <a href="https://eoffer.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 24px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Open eOffer →</a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
