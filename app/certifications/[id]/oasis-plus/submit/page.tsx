"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { usePaywall } from "@/lib/usePaywall";
import PaywallModal from "@/components/PaywallModal";
import { generatePDF, generateDOCX } from "@/lib/generatePDF";
import ExecutiveReview from "@/components/ExecutiveReview";

/* ═══════════════════════════════════════════════════════════════════
   OASIS+ Proposal Submission Package
   ONE integrated flow mirroring the exact Symphony Portal sequence.
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

export default function OASISSubmitPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [samValidation, setSamValidation] = useState<any>(null);
  const [samValidating, setSamValidating] = useState(false);
  const [homeLink, setHomeLink] = useState("/portal");
  const pw = usePaywall("OASIS_PLUS");

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

      // Fetch ALL client documents
      if (data.clientId) {
        try {
          const rawDocs = await apiRequest(`/api/upload/documents?clientId=${data.clientId}`);
          const grouped: Record<string, any[]> = {};
          for (const doc of (Array.isArray(rawDocs) ? rawDocs : [])) {
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

  // ── Build steps ──
  const app = cert?.application;
  const client = cert?.client;
  const corpNarrative = (key: string) => extractNarrativeField(app?.narrativeCorp, key);

  // Parse OASIS data — check for review fixes from AI review panel
  let qpData: any[] = [];
  try {
    const qpParsed = JSON.parse(app?.oasisQPData || "[]");
    qpData = Array.isArray(qpParsed) ? qpParsed : (qpParsed._reviewFixes ? qpParsed : []);
  } catch {}

  type Step = { id: string; label: string; portalLocation: string; type: "info" | "text" | "files" | "confirm"; status: "ready" | "partial" | "missing"; content?: any };

  const steps: Step[] = [
    // ── PREREQUISITES ──
    { id: "prereq-sam", label: "SAM.gov Registration", portalLocation: "Prerequisite — Symphony Portal validates against SAM", type: "info",
      status: samValidation?.status === "pass" ? "ready" : samValidation?.status === "warn" ? "partial" : "missing",
      content: { samValidation, samValidating, text: `UEI: ${client?.uei || "Not set"} | CAGE: ${client?.cageCode || "Not set"}. Must be active with correct NAICS codes for your domains. Symphony Portal auto-validates.` } },

    { id: "prereq-symphony", label: "Symphony Portal Account", portalLocation: "Prerequisite — register at idiq.gsa.gov", type: "info",
      status: "missing",
      content: { text: "Register for an account at idiq.gsa.gov. You will need your SAM.gov credentials and UEI. The Symphony Portal is the sole submission channel for OASIS+ proposals." } },

    // ── PORTAL FLOW: QUALIFYING PROJECTS (paste narratives) ──
    { id: "corp-experience", label: "Corporate Experience Narratives", portalLocation: "Symphony Portal \u2192 Qualifying Projects \u2192 Corporate Experience", type: "text",
      status: corpNarrative("overview") ? "ready" : "missing",
      content: { narratives: [
        { label: "Company Overview", value: corpNarrative("overview"), id: "nc-overview", charLimit: 1500 },
        { label: "Core Capabilities & Services", value: corpNarrative("capabilities"), id: "nc-cap", charLimit: 1500 },
        { label: "Employee Experience", value: corpNarrative("employees"), id: "nc-emp", charLimit: 1500 },
        { label: "Organizational Controls", value: corpNarrative("org_controls"), id: "nc-org", charLimit: 1500 },
        { label: "Resources & Capacity", value: corpNarrative("resources"), id: "nc-res", charLimit: 1500 },
        { label: "Past Projects", value: corpNarrative("past_projects"), id: "nc-pp", charLimit: 1500 },
      ],
      pdfDownload: corpNarrative("overview") ? () => generatePDF({
        title: "Corporate Experience Narratives",
        companyName: client?.businessName || "",
        content: ["overview", "capabilities", "employees", "org_controls", "resources", "past_projects"]
          .map(k => { const v = corpNarrative(k); return v ? `${k.replace(/([A-Z_])/g, " $1").replace(/^./, s => s.toUpperCase())}:\n${v}` : ""; })
          .filter(Boolean).join("\n\n"),
        fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Corporate_Experience.pdf`,
        clientId: cert?.clientId || client?.id,
        category: "CORPORATE_EXPERIENCE_GENERATED",
        apiUrl: API_URL,
        headerLabel: "OASIS+ \u2014 Symphony Portal Submission",
      }) : null,
      docxDownload: corpNarrative("overview") ? () => generateDOCX({
        title: "Corporate Experience Narratives",
        companyName: client?.businessName || "",
        content: ["overview", "capabilities", "employees", "org_controls", "resources", "past_projects"]
          .map(k => { const v = corpNarrative(k); return v ? `${k.replace(/([A-Z_])/g, " $1").replace(/^./, s => s.toUpperCase())}:\n${v}` : ""; })
          .filter(Boolean).join("\n\n"),
        fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Corporate_Experience.docx`,
      }) : null,
      docs: clientDocs.CORPORATE_EXPERIENCE_GENERATED || [],
      } },

    { id: "qualifying-projects", label: "Qualifying Projects (up to 5 per domain)", portalLocation: "Symphony Portal \u2192 Qualifying Projects \u2192 J.P-3 Forms", type: "text",
      status: qpData.length > 0 ? "ready" : "missing",
      content: { narratives: qpData.map((qp: any, i: number) => ({
        label: `QP ${i + 1}: ${qp.agencyName || qp.contractNumber || "Project " + (i + 1)}`,
        value: [qp.scopeNarrative, qp.managementNarrative].filter(Boolean).join("\n\n") || `${qp.agencyName || ""} \u2014 ${qp.contractType || ""} \u2014 $${qp.totalValue || "?"}`,
        id: `qp-${i}`, charLimit: 3000,
      })),
      emptyMessage: "Add qualifying projects on the Qualifying Projects page.",
      pdfDownload: qpData.length > 0 ? () => generatePDF({
        title: "Qualifying Projects",
        companyName: client?.businessName || "",
        content: qpData.map((qp: any, i: number) => {
          const label = `QP ${i + 1}: ${qp.agencyName || qp.contractNumber || "Project " + (i + 1)}`;
          const body = [qp.scopeNarrative, qp.managementNarrative].filter(Boolean).join("\n\n") || `${qp.agencyName || ""} \u2014 ${qp.contractType || ""} \u2014 $${qp.totalValue || "?"}`;
          return `${label}\n${body}`;
        }).join("\n\n---\n\n"),
        fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Qualifying_Projects.pdf`,
        clientId: cert?.clientId || client?.id,
        category: "QUALIFYING_PROJECTS_GENERATED",
        apiUrl: API_URL,
        headerLabel: "OASIS+ \u2014 Symphony Portal Submission",
      }) : null,
      docxDownload: qpData.length > 0 ? () => generateDOCX({
        title: "Qualifying Projects",
        companyName: client?.businessName || "",
        content: qpData.map((qp: any, i: number) => {
          const label = `QP ${i + 1}: ${qp.agencyName || qp.contractNumber || "Project " + (i + 1)}`;
          const body = [qp.scopeNarrative, qp.managementNarrative].filter(Boolean).join("\n\n") || `${qp.agencyName || ""} \u2014 ${qp.contractType || ""} \u2014 $${qp.totalValue || "?"}`;
          return `${label}\n${body}`;
        }).join("\n\n---\n\n"),
        fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Qualifying_Projects.docx`,
      }) : null,
      docs: clientDocs.QUALIFYING_PROJECTS_GENERATED || [],
      } },

    // ── PORTAL FLOW: PAST PERFORMANCE ──
    { id: "past-perf", label: "Past Performance \u2014 CPARS Reports (5+)", portalLocation: "Symphony Portal \u2192 Past Performance", type: "files",
      status: (clientDocs.CPARS_REPORT || []).length + (clientDocs.CONTRACT || []).length >= 5 ? "ready" : (clientDocs.CPARS_REPORT || []).length > 0 ? "partial" : "missing",
      content: { docs: [...(clientDocs.CPARS_REPORT || []), ...(clientDocs.CONTRACT || []), ...(clientDocs.PPQ_RESPONSE || [])], dropCategory: "CPARS_REPORT", note: "Minimum 5 relevant contracts with CPARS ratings. Drag and drop here." } },

    // ── PORTAL FLOW: BUSINESS SYSTEMS ──
    { id: "accounting", label: "Accounting System Documentation", portalLocation: "Symphony Portal \u2192 Business Systems", type: "files",
      status: "missing",
      content: { docs: [], dropCategory: "FINANCIAL_STATEMENT", note: "DCAA pre-award survey or CPA-prepared accounting system description." } },

    { id: "qms", label: "Quality Management System (ISO/CMMI)", portalLocation: "Symphony Portal \u2192 Business Systems \u2192 Certifications", type: "files",
      status: (clientDocs.CERTIFICATION_DOCUMENT || []).length > 0 ? "partial" : "missing",
      content: { docs: clientDocs.CERTIFICATION_DOCUMENT || [], dropCategory: "CERTIFICATION_DOCUMENT", note: "ISO 9001 certificate, CMMI appraisal letter, or QMS policy document." } },

    { id: "security", label: "Security Clearance (FCL Letter)", portalLocation: "Symphony Portal \u2192 Business Systems \u2192 Security", type: "files",
      status: "missing",
      content: { docs: [], dropCategory: "CERTIFICATION_DOCUMENT", note: "Facility Clearance Letter from DCSA if applicable. Not required for all domains." } },

    // ── PORTAL FLOW: REPRESENTATIONS ──
    { id: "representations", label: "Mandatory Representations & Certifications", portalLocation: "Symphony Portal \u2192 Representations", type: "confirm",
      status: "ready",
      content: { fields: [
        { label: "Trade Agreements Act (TAA) Compliance", value: "Yes", rec: "Required", id: "rep-taa" },
        { label: "Small Business Representation", value: client?.smallBusiness ? "Small Business" : "Other than Small Business", id: "rep-sb" },
        { label: "OCI Disclosure", value: "No known conflicts", rec: "Disclose if applicable", id: "rep-oci" },
        { label: "NAICS Codes for Domains", value: app?.selectedSINs || "Per domain selection", id: "rep-naics" },
      ] } },

    // ── PORTAL FLOW: REQUIRED DOCUMENTS ──
    { id: "financials", label: "Financial Statements (3 Years, Audited)", portalLocation: "Symphony Portal \u2192 Required Documents", type: "files",
      status: (clientDocs.FINANCIAL_STATEMENT || []).length > 0 ? "ready" : "missing",
      content: { docs: clientDocs.FINANCIAL_STATEMENT || [], dropCategory: "FINANCIAL_STATEMENT", note: "Balance Sheet, Income Statement, and Cash Flow for 3 years. Audited preferred." } },

    { id: "oci", label: "OCI Mitigation Plan", portalLocation: "Symphony Portal \u2192 Required Documents", type: "files",
      status: "missing",
      content: { docs: [], dropCategory: "CERTIFICATION_DOCUMENT", note: "Organizational Conflict of Interest plan per FAR Subpart 9.5." } },

    { id: "key-personnel", label: "Key Personnel Resumes", portalLocation: "Symphony Portal \u2192 Key Personnel", type: "files",
      status: (clientDocs.RESUME || []).length > 0 ? "ready" : "missing",
      content: { docs: clientDocs.RESUME || [], dropCategory: "RESUME", note: "Program Manager, domain leads, technical experts. Include clearances and certifications." } },

    { id: "subcon-plan", label: "Subcontracting Plan (Large Business Only)", portalLocation: "Symphony Portal \u2192 Required Documents", type: "info",
      status: "ready",
      content: { text: "Required for large businesses on the Unrestricted pool. Small businesses are exempt. If required, generate on the Subcontracting Plan page." } },

    // ── FINAL ──
    { id: "submit-final", label: "Review & Submit Proposal", portalLocation: "Symphony Portal \u2192 Submit", type: "info",
      status: "missing",
      content: { text: "Review all volumes in the Symphony Portal. Ensure qualifying projects, past performance, and all required documents are uploaded. Submit before the solicitation deadline. Late submissions are automatically rejected." } },
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
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 6, fontWeight: 600 }}>Symphony Portal Flow</div>
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
        {!pw.loading && !pw.generationAccess && <PaywallModal certType="OASIS_PLUS" price={pw.price} betaMode={pw.betaMode} onUnlock={pw.onUnlock} onClose={pw.closePaywall} />}
        <div style={!pw.loading && !pw.generationAccess ? { filter: "blur(8px)", pointerEvents: "none" as const } : {}}>
        <div style={{ padding: "40px 48px", maxWidth: 920 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>{"\u2190"} Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Final Step</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>OASIS+ Submission Package</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Everything you need, in the order the Symphony Portal expects it. Open <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", fontWeight: 500 }}>idiq.gsa.gov</a> side by side and work through each step.
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
            <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 20px", background: "var(--gold)", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none" }}>
              Open Symphony Portal {"\u2192"}
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
          <a href={`/certifications/${certId}/oasis-plus/review`}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", marginBottom: 20,
              background: "linear-gradient(135deg, #1A2332 0%, #2D3748 100%)", borderRadius: "var(--rl)", textDecoration: "none",
              border: "1px solid rgba(99,102,241,.3)", boxShadow: "0 4px 20px rgba(99,102,241,.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {"\uD83D\uDD0D"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Run GovCert Analysis</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>AI review of your OASIS+ proposal — domain scoring, competitiveness assessment, gap analysis.</div>
              </div>
            </div>
            <div style={{ padding: "10px 20px", background: "rgba(99,102,241,.2)", border: "1px solid rgba(99,102,241,.4)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              Analyze {"\u2192"}
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
                      <div style={{ fontSize: 11, color: "var(--ink4)" }}>{step.portalLocation}</div>
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
                                <div key={label as string} style={{ fontSize: 12 }}><strong>{label}:</strong> {val || "\u2014"}</div>
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
                                    {n.charLimit && <div style={{ fontSize: 10, fontFamily: "monospace", color: isOver ? "var(--red)" : "var(--ink4)" }}>{charCount.toLocaleString()} / {n.charLimit.toLocaleString()} chars{isOver ? " \u2014 over limit!" : ""}</div>}
                                  </div>
                                  {n.value && (
                                    <button onClick={() => copyText(n.value, n.id)}
                                      style={{ padding: "5px 14px", background: copiedId === n.id ? "var(--green)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 600, color: copiedId === n.id ? "#fff" : "var(--gold2)", cursor: "pointer" }}>
                                      {copiedId === n.id ? "\u2713 Copied" : "Copy \u2192"}
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
                                {"\u2B07"} Download PDF (for Symphony Portal upload)
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
                              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--green)", marginBottom: 6 }}>Saved PDF — ready for Symphony Portal</div>
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
                                {f.rec && <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 500 }}>{f.rec}</span>}
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
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>Open the Symphony Portal side by side and work through each step above.</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <a href={`/certifications/${certId}`} style={{ padding: "10px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, textDecoration: "none" }}>{"\u2190"} Dashboard</a>
              <a href={`/certifications/${certId}/oasis-plus/review`} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Run Analysis</a>
              <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 24px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Open Symphony Portal {"\u2192"}</a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
