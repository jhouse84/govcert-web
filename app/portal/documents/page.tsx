"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const CATEGORY_OPTIONS = [
  { value: "FINANCIAL_STATEMENT", label: "Financial Statement" },
  { value: "TAX_RETURN", label: "Tax Return / IRS Transcript" },
  { value: "CAPABILITY_STATEMENT", label: "Capability Statement" },
  { value: "QMS_MANUAL", label: "QMS Manual" },
  { value: "PAST_PROPOSAL", label: "Past Proposal" },
  { value: "SOW", label: "Statement of Work (SOW)" },
  { value: "CPARS_REPORT", label: "CPARS Report" },
  { value: "PPQ_COMPLETED", label: "Completed PPQ" },
  { value: "ORG_CHART", label: "Org Chart" },
  { value: "RATE_CARD", label: "Rate Card / Pricing" },
  { value: "CONTRACT", label: "Contract" },
  { value: "CERTIFICATION_DOCUMENT", label: "Certification Document" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  FINANCIAL_STATEMENT: { bg: "var(--teal-bg)", color: "var(--teal)" },
  TAX_RETURN: { bg: "var(--teal-bg)", color: "var(--teal)" },
  CAPABILITY_STATEMENT: { bg: "var(--purple-bg)", color: "var(--purple)" },
  QMS_MANUAL: { bg: "var(--blue-bg)", color: "var(--blue)" },
  PAST_PROPOSAL: { bg: "var(--amber-bg)", color: "var(--amber)" },
  SOW: { bg: "var(--amber-bg)", color: "var(--amber)" },
  CPARS_REPORT: { bg: "var(--green-bg)", color: "var(--green)" },
  PPQ_COMPLETED: { bg: "var(--green-bg)", color: "var(--green)" },
  ORG_CHART: { bg: "var(--purple-bg)", color: "var(--purple)" },
  RATE_CARD: { bg: "rgba(200,155,60,.12)", color: "var(--gold)" },
  CONTRACT: { bg: "var(--blue-bg)", color: "var(--blue)" },
  CERTIFICATION_DOCUMENT: { bg: "var(--navy)", color: "rgba(255,255,255,.7)" },
  OTHER: { bg: "var(--cream2)", color: "var(--ink3)" },
};

const FILE_ICONS: Record<string, string> = {
  pdf: "\u{1F4C4}", docx: "\u{1F4DD}", doc: "\u{1F4DD}", xlsx: "\u{1F4CA}", xls: "\u{1F4CA}",
  csv: "\u{1F4CA}", txt: "\u{1F4C3}", pptx: "\u{1F4D1}", ppt: "\u{1F4D1}", png: "\u{1F5BC}\uFE0F",
  jpg: "\u{1F5BC}\uFE0F", jpeg: "\u{1F5BC}\uFE0F",
};

/* ── AI analysis mapping: category → application components it informs ── */
const CATEGORY_INFORMS: Record<string, string> = {
  FINANCIAL_STATEMENT: "Informs: Size Standard Calculation, Financial Capability Narrative, CSP-1 Pricing",
  TAX_RETURN: "Informs: Size Standard Verification, Revenue History for Past 3 Years",
  CAPABILITY_STATEMENT: "Informs: Corporate Experience Narrative, Technical Approach, Company Overview",
  QMS_MANUAL: "Informs: Quality Control Plan (QCP), ISO/CMMI Compliance Evidence",
  PAST_PROPOSAL: "Informs: Corporate Experience, Technical Writing Samples, Pricing Methodology",
  SOW: "Informs: Past Performance Descriptions, Scope of Work Evidence",
  CPARS_REPORT: "Informs: Past Performance Ratings, Government Reference Verification",
  PPQ_COMPLETED: "Informs: Past Performance Questionnaire Evidence, Reference Ratings",
  ORG_CHART: "Informs: Organizational Structure, Key Personnel, Management Approach",
  RATE_CARD: "Informs: CSP-1 Labor Category Pricing, Commercial Price List",
  CONTRACT: "Informs: Past Performance Contract Evidence, Period of Performance, Contract Values",
  CERTIFICATION_DOCUMENT: "Informs: Existing Certification Verification, Eligibility Documentation",
  OTHER: "Review needed: This document may contain relevant information for your application",
};

/* ── Section recommended-document hints ── */
const SECTION_HINTS: Record<string, { hint: string; recommended: number }> = {
  "corporate-experience": {
    hint: "Typically needs: Capability statement, 2\u20133 past proposals, relevant SOWs",
    recommended: 3,
  },
  "quality-control": {
    hint: "Typically needs: QMS manual or quality assurance policy document",
    recommended: 1,
  },
  "past-performance": {
    hint: "Typically needs: 3\u20135 CPARS reports or PPQs, plus supporting contracts",
    recommended: 3,
  },
  "financial-statements": {
    hint: "Typically needs: 3 years of P&L, Balance Sheet, Tax Returns",
    recommended: 6,
  },
  pricing: {
    hint: "Typically needs: Current rate card or commercial price list",
    recommended: 1,
  },
  general: {
    hint: "Typically needs: Org chart, certifications, any additional evidence",
    recommended: 2,
  },
};

interface SectionDef {
  key: string;
  name: string;
  icon: string;
  description: string;
  categories: string[];
}

const APPLICATION_SECTIONS: SectionDef[] = [
  {
    key: "corporate-experience",
    name: "Corporate Experience",
    icon: "\u{1F3E2}",
    description: "Capability statements, past proposals, and statements of work that demonstrate your company\u2019s experience and qualifications.",
    categories: ["CAPABILITY_STATEMENT", "PAST_PROPOSAL", "SOW"],
  },
  {
    key: "quality-control",
    name: "Quality Control Plan",
    icon: "\u2705",
    description: "Your Quality Management System (QMS) manual and related quality assurance documentation.",
    categories: ["QMS_MANUAL"],
  },
  {
    key: "past-performance",
    name: "Past Performance",
    icon: "\u2B50",
    description: "CPARS reports, completed Past Performance Questionnaires (PPQs), and contract documentation proving successful past work.",
    categories: ["CPARS_REPORT", "PPQ_COMPLETED", "CONTRACT"],
  },
  {
    key: "financial-statements",
    name: "Financial Statements",
    icon: "\u{1F4CA}",
    description: "Audited financial statements, balance sheets, income statements, and IRS tax return transcripts.",
    categories: ["FINANCIAL_STATEMENT", "TAX_RETURN"],
  },
  {
    key: "pricing",
    name: "Pricing (CSP-1)",
    icon: "\u{1F4B0}",
    description: "Rate cards, labor category pricing, and Commercial Sales Practices documentation.",
    categories: ["RATE_CARD"],
  },
  {
    key: "general",
    name: "General / Other",
    icon: "\u{1F4C1}",
    description: "Organizational charts, certifications, and any other supporting documents for your application.",
    categories: ["ORG_CHART", "CERTIFICATION_DOCUMENT", "OTHER"],
  },
];

function formatBytes(bytes: number) {
  if (!bytes) return "\u2014";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function PortalDocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ category: "OTHER", description: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* AI analysis state: docId → { loading, text } */
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, { loading: boolean; text: string | null }>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "ADMIN" || parsed.role === "ADVISOR") {
        router.push("/documents");
        return;
      }
      setUser(parsed);
    }
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [docsData, certsData] = await Promise.all([
        apiRequest("/api/upload/documents"),
        apiRequest("/api/certifications"),
      ]);
      setDocuments(docsData);
      if (certsData.length > 0) {
        setClientId(certsData[0].clientId);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function openUploadForSection(section: SectionDef) {
    const defaultCat = section.categories[0] || "OTHER";
    setUploadForm({ category: defaultCat, description: "" });
    setUploadFile(null);
    setUploadError("");
    setShowUpload(true);
  }

  async function handleUpload() {
    if (!uploadFile || !clientId) {
      setUploadError("Please select a file.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("clientId", clientId);
      formData.append("category", uploadForm.category);
      formData.append("description", uploadForm.description);

      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadSuccess("\u2713 Document uploaded successfully");
      setUploadFile(null);
      setShowUpload(false);
      setTimeout(() => setUploadSuccess(""), 4000);
      fetchData();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  /* ── AI analysis handler ── */
  async function analyzeDocument(doc: any) {
    setAiAnalysis(prev => ({ ...prev, [doc.id]: { loading: true, text: null } }));
    try {
      const result = await apiRequest("/api/applications/ai/extract", {
        method: "POST",
        body: JSON.stringify({ documentId: doc.id, fileUrl: doc.fileUrl, category: doc.category }),
      });
      const summary = result?.summary || result?.text || result?.extractedText || "Analysis complete. This document has been processed.";
      setAiAnalysis(prev => ({ ...prev, [doc.id]: { loading: false, text: summary } }));
    } catch (err: any) {
      setAiAnalysis(prev => ({
        ...prev,
        [doc.id]: { loading: false, text: "Unable to analyze this document at this time. Please try again later." },
      }));
    }
  }

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function getDocsForSection(section: SectionDef) {
    return documents.filter(doc => section.categories.includes(doc.category));
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading...
    </div>
  );

  const totalDocs = documents.length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>My Portal</div>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\u{1F3E0}"}</span> Home
          </a>
          <a href="/portal/applications" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83D\uDCCB"}</span> My Applications
          </a>
          <a href="/portal/eligibility" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\u2705"}</span> Eligibility
          </a>
          <a href="/portal/integrations" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83D\uDD17"}</span> Integrations
          </a>
          <a href="/portal/documents" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", borderLeft: "3px solid var(--gold)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
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

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>

          <a href="/portal" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            {"\u2190"} Back to Portal
          </a>

          <div style={{ marginTop: 20, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Client Portal</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>My Documents</h1>
              <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>
                Your documents organized by certification application section. Upload files directly to the section they support.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <div style={{ padding: "6px 14px", background: "var(--navy)", borderRadius: 100, fontSize: 12, color: "var(--gold2)", fontWeight: 500 }}>
                {totalDocs} document{totalDocs !== 1 ? "s" : ""}
              </div>
              <button onClick={() => { setUploadForm({ category: "OTHER", description: "" }); setUploadFile(null); setUploadError(""); setShowUpload(true); }}
                style={{ padding: "12px 22px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                + Upload Document
              </button>
            </div>
          </div>

          {uploadSuccess && (
            <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--green)", fontWeight: 500 }}>
              {uploadSuccess}
            </div>
          )}

          {/* Info callout */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "22px 26px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 12 }}>
              {"\u2726"} How Your Documents Are Used
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.55)", lineHeight: 1.7, marginBottom: 14 }}>
              Each section of your certification application requires specific supporting documents. GovCert uses AI to analyze your uploaded files and draft application narratives. Upload documents to the correct section below so the AI can reference them when building your application.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                { icon: "\u{1F4C2}", title: "Organize by section", body: "Documents are grouped by the application section they support." },
                { icon: "\u{1F916}", title: "AI reads your files", body: "Uploaded documents are analyzed to draft your certification narratives." },
                { icon: "\u{1F50D}", title: "Your advisor reviews", body: "Your advisor can see all uploads and provide guidance on what\u2019s needed." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "#fff", marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.4)", lineHeight: 1.5 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload panel */}
          {showUpload && (
            <div style={{ background: "#fff", border: "2px solid var(--gold)", borderRadius: "var(--rl)", padding: "24px", marginBottom: 24, boxShadow: "var(--shadow-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Upload a Document</h3>
                <button onClick={() => { setShowUpload(false); setUploadError(""); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ink3)" }}>{"\u2715"}</button>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>
                Upload financial statements, capability statements, past proposals, CPARS reports, or any other documents relevant to your certification. Your advisor will be notified.
              </p>

              {uploadError && (
                <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--red)" }}>
                  {uploadError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Document Type</label>
                  <select value={uploadForm.category} onChange={e => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", background: "#fff" }}>
                    {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Description (optional)</label>
                  <input type="text" value={uploadForm.description} onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. FY2023 audited P&L"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const }} />
                </div>
              </div>

              <input ref={fileInputRef} type="file" style={{ display: "none" }}
                accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv,.pptx,.ppt,.png,.jpg,.jpeg"
                onChange={e => setUploadFile(e.target.files?.[0] || null)} />
              {!uploadFile ? (
                <div onClick={() => fileInputRef.current?.click()}
                  style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "28px", textAlign: "center" as const, cursor: "pointer", marginBottom: 16 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{"\u{1F4CE}"}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Click to select file</div>
                  <div style={{ fontSize: 12, color: "var(--ink4)" }}>PDF, DOCX, XLSX, CSV, TXT {"\u2014"} up to 10MB</div>
                </div>
              ) : (
                <div style={{ padding: "12px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--green)" }}>{uploadFile.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink3)" }}>{formatBytes(uploadFile.size)}</div>
                  </div>
                  <button onClick={() => setUploadFile(null)} style={{ background: "none", border: "none", color: "var(--green)", cursor: "pointer", fontSize: 16 }}>{"\u2715"}</button>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowUpload(false); setUploadError(""); }}
                  style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleUpload} disabled={uploading || !uploadFile}
                  style={{ padding: "10px 28px", background: uploadFile ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: uploadFile ? "#fff" : "var(--ink4)", fontSize: 13, fontWeight: 500, cursor: uploading || !uploadFile ? "not-allowed" : "pointer" }}>
                  {uploading ? "Uploading..." : "Upload \u2192"}
                </button>
              </div>
            </div>
          )}

          {/* Application Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {APPLICATION_SECTIONS.map(section => {
              const sectionDocs = getDocsForSection(section);
              const isExpanded = expandedSections[section.key] !== undefined ? expandedSections[section.key] : sectionDocs.length > 0;
              const sectionHint = SECTION_HINTS[section.key];

              return (
                <div key={section.key} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                  {/* Section header */}
                  <div
                    onClick={() => toggleSection(section.key)}
                    style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", userSelect: "none" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--cream)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{section.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 500 }}>
                          {section.name}
                        </span>
                        <span style={{
                          padding: "2px 10px",
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 600,
                          background: sectionDocs.length > 0 ? "var(--green-bg)" : "var(--cream2)",
                          color: sectionDocs.length > 0 ? "var(--green)" : "var(--ink4)",
                          border: `1px solid ${sectionDocs.length > 0 ? "var(--green-b)" : "var(--border)"}`,
                        }}>
                          {sectionDocs.length} doc{sectionDocs.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5 }}>
                        {section.description}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); openUploadForSection(section); }}
                      style={{
                        padding: "7px 16px",
                        background: "var(--navy)",
                        border: "none",
                        borderRadius: "var(--r)",
                        color: "var(--gold2)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        flexShrink: 0,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      + Upload
                    </button>
                    <span style={{ fontSize: 14, color: "var(--ink4)", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
                      {"\u25BC"}
                    </span>
                  </div>

                  {/* Expanded documents list */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: "0" }}>

                      {/* Section progress indicator */}
                      {sectionHint && (
                        <div style={{ padding: "12px 24px", background: "var(--cream)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
                            <span style={{ color: "var(--gold)", fontWeight: 600, marginRight: 6 }}>{"\u2726"}</span>
                            {sectionHint.hint}
                          </div>
                          <div style={{
                            flexShrink: 0,
                            padding: "3px 12px",
                            borderRadius: 100,
                            fontSize: 11,
                            fontWeight: 600,
                            background: sectionDocs.length >= sectionHint.recommended ? "var(--green-bg)" : "rgba(200,155,60,.1)",
                            color: sectionDocs.length >= sectionHint.recommended ? "var(--green)" : "var(--gold)",
                            border: `1px solid ${sectionDocs.length >= sectionHint.recommended ? "var(--green-b)" : "rgba(200,155,60,.25)"}`,
                          }}>
                            {sectionDocs.length} / {sectionHint.recommended} recommended
                          </div>
                        </div>
                      )}

                      {sectionDocs.length === 0 ? (
                        <div style={{ padding: "28px 24px", textAlign: "center" as const }}>
                          <div style={{ fontSize: 13, color: "var(--ink4)", marginBottom: 10 }}>
                            No documents uploaded for this section yet.
                          </div>
                          <button
                            onClick={() => openUploadForSection(section)}
                            style={{
                              padding: "8px 20px",
                              background: "var(--cream)",
                              border: "1px solid var(--border2)",
                              borderRadius: "var(--r)",
                              color: "var(--navy)",
                              fontSize: 12.5,
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            Upload {section.name} Document
                          </button>
                        </div>
                      ) : (
                        <div>
                          {sectionDocs.map((doc, idx) => {
                            const catColor = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.OTHER;
                            const catLabel = CATEGORY_OPTIONS.find(o => o.value === doc.category)?.label || doc.category;
                            const ext = (doc.originalName || doc.name || "").split(".").pop()?.toLowerCase() || "";
                            const fileIcon = FILE_ICONS[ext] || "\u{1F4CE}";
                            const analysis = aiAnalysis[doc.id];
                            const informsText = CATEGORY_INFORMS[doc.category] || CATEGORY_INFORMS.OTHER;

                            return (
                              <div key={doc.id} style={{
                                padding: "14px 24px",
                                borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                              }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                  <div style={{
                                    width: 40,
                                    height: 40,
                                    background: "var(--cream)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--r)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 20,
                                    flexShrink: 0,
                                  }}>
                                    {fileIcon}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--navy)" }}>{doc.originalName || doc.name}</div>
                                      <span style={{
                                        padding: "2px 8px",
                                        borderRadius: 100,
                                        fontSize: 10,
                                        fontWeight: 500,
                                        background: catColor.bg,
                                        color: catColor.color,
                                      }}>
                                        {catLabel}
                                      </span>
                                    </div>
                                    {doc.description && (
                                      <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 4 }}>{doc.description}</div>
                                    )}
                                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
                                      <span style={{ fontSize: 11, color: "var(--ink4)" }}>
                                        {"\u{1F464}"} {doc.uploadedBy ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : "Unknown"}
                                      </span>
                                      <span style={{ fontSize: 11, color: "var(--ink4)" }}>{formatBytes(doc.fileSize)}</span>
                                      <span style={{ fontSize: 11, color: "var(--ink4)", fontFamily: "monospace" }}>
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                                    <button
                                      onClick={() => analyzeDocument(doc)}
                                      disabled={analysis?.loading}
                                      style={{
                                        padding: "6px 14px",
                                        background: analysis?.loading ? "var(--cream2)" : "rgba(200,155,60,.1)",
                                        border: "1px solid rgba(200,155,60,.25)",
                                        borderRadius: "var(--r)",
                                        color: analysis?.loading ? "var(--ink4)" : "var(--gold)",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        cursor: analysis?.loading ? "not-allowed" : "pointer",
                                        whiteSpace: "nowrap" as const,
                                      }}
                                    >
                                      {analysis?.loading ? (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                          <span style={{
                                            display: "inline-block",
                                            width: 12,
                                            height: 12,
                                            border: "2px solid var(--ink4)",
                                            borderTopColor: "transparent",
                                            borderRadius: "50%",
                                            animation: "spin 0.8s linear infinite",
                                          }} />
                                          Analyzing...
                                        </span>
                                      ) : (
                                        <span>{"\u2726"} Analyze Document</span>
                                      )}
                                    </button>
                                    <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer"
                                      style={{
                                        padding: "6px 14px",
                                        background: "var(--navy)",
                                        borderRadius: "var(--r)",
                                        color: "var(--gold2)",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        textDecoration: "none",
                                      }}>
                                      Download
                                    </a>
                                  </div>
                                </div>

                                {/* AI Analysis callout - always show the "informs" mapping */}
                                <div style={{
                                  marginTop: 10,
                                  marginLeft: 52,
                                  background: "rgba(200,155,60,.06)",
                                  border: "1px solid rgba(200,155,60,.2)",
                                  borderRadius: 8,
                                  padding: "10px 14px",
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                    <span style={{ color: "var(--gold)", fontSize: 12 }}>{"\u2726"}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--gold)" }}>AI Analysis</span>
                                  </div>
                                  <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6 }}>
                                    {informsText}
                                  </div>

                                  {/* Deep AI analysis result (from the API) */}
                                  {analysis?.loading && (
                                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(200,155,60,.12)", display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{
                                        display: "inline-block",
                                        width: 14,
                                        height: 14,
                                        border: "2px solid var(--gold)",
                                        borderTopColor: "transparent",
                                        borderRadius: "50%",
                                        animation: "spin 0.8s linear infinite",
                                      }} />
                                      <span style={{ fontSize: 12, color: "var(--ink4)" }}>Extracting document contents and matching to application sections...</span>
                                    </div>
                                  )}

                                  {analysis?.text && !analysis.loading && (
                                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(200,155,60,.12)" }}>
                                      <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6, fontStyle: "italic" }}>
                                        {analysis.text}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Help callout */}
          <div style={{ marginTop: 28, padding: "20px 24px", background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", boxShadow: "var(--shadow)", display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{"\u{1F4AC}"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>Not sure which documents to upload?</div>
              <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>
                Your GovCert advisor can tell you exactly which documents are still needed for each section. Reach out to them directly for guidance.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Spinner keyframe animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
