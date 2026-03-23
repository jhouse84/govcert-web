"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

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

const AI_CLASSIFICATION: Record<string, string> = {
  FINANCIAL_STATEMENT: "Used for: Size Standard Calculation, Financial Capability Narrative, Revenue Verification",
  TAX_RETURN: "Used for: Size Standard Verification, 3-Year Revenue History, Economic Disadvantage Assessment",
  CAPABILITY_STATEMENT: "Used for: Corporate Experience Narrative, Company Overview, Technical Approach",
  QMS_MANUAL: "Used for: Quality Control Plan (QCP), ISO/CMMI Compliance Evidence",
  PAST_PROPOSAL: "Used for: Corporate Experience, Writing Samples, Pricing Methodology Reference",
  SOW: "Used for: Past Performance Descriptions, Scope of Work Evidence",
  CPARS_REPORT: "Used for: Past Performance Ratings, Government Reference Verification",
  PPQ_COMPLETED: "Used for: Past Performance Questionnaire Evidence, Reference Ratings",
  ORG_CHART: "Used for: Organizational Structure, Key Personnel, Management Approach",
  RATE_CARD: "Used for: CSP-1 Labor Category Pricing, Commercial Price List",
  CONTRACT: "Used for: Past Performance Evidence, Period of Performance, Contract Values",
  CERTIFICATION_DOCUMENT: "Used for: Existing Certification Verification, Eligibility Documentation",
  OTHER: "Will be analyzed by our AI to determine relevance to your applications",
};

/* ── Recommended Documents ── */

interface RecommendedDoc {
  name: string;
  why: string;
  category: string;
  mandatory: boolean;
  certTypes?: string[]; // undefined = universal
}

const RECOMMENDED_DOCS: RecommendedDoc[] = [
  // ── Universal MANDATORY ──
  { name: "Financial Statements (P&L, Balance Sheet) — last 3 years", why: "Required for size standard calculation and financial capability verification.", category: "FINANCIAL_STATEMENT", mandatory: true },
  { name: "Business Tax Returns — last 3 years", why: "Required to verify revenue history and business structure.", category: "TAX_RETURN", mandatory: true },
  { name: "Capability Statement", why: "Required as the foundation for your corporate experience narrative.", category: "CAPABILITY_STATEMENT", mandatory: true },
  { name: "Organizational Chart", why: "Required to demonstrate management structure and key personnel.", category: "ORG_CHART", mandatory: true },

  // ── Universal USEFUL ──
  { name: "Personal Tax Returns (owner) — last 3 years", why: "Strengthens economic disadvantage assessment and owner income verification.", category: "TAX_RETURN", mandatory: false },
  { name: "Business Licenses & Registrations", why: "Provides legal entity verification and good standing proof.", category: "CERTIFICATION_DOCUMENT", mandatory: false },
  { name: "Invoices (recent projects)", why: "Excellent for rate card development, pricing justification, and service documentation.", category: "OTHER", mandatory: false },
  { name: "Contracts (government or commercial)", why: "Strong past performance evidence with contract values and scope of work.", category: "CONTRACT", mandatory: false },
  { name: "Employee Resumes (key personnel)", why: "Documents staff qualifications, certifications, and relevant experience.", category: "OTHER", mandatory: false },
  { name: "Company Website / Marketing Materials", why: "Helps AI extract service descriptions, client testimonials, and market positioning.", category: "OTHER", mandatory: false },
  { name: "Insurance Certificates", why: "Verifies business insurance and liability coverage.", category: "CERTIFICATION_DOCUMENT", mandatory: false },
  { name: "Bank Statements", why: "Demonstrates financial stability, cash flow, and working capital.", category: "FINANCIAL_STATEMENT", mandatory: false },
  { name: "Letters of Recommendation / Client References", why: "Adds credibility to past performance claims and client relationships.", category: "OTHER", mandatory: false },
  { name: "Project Photos / Deliverable Samples", why: "Visual evidence of completed work quality and project scope.", category: "OTHER", mandatory: false },

  // ── GSA MAS MANDATORY ──
  { name: "Commercial Price List / Rate Card", why: "Required as the pricing baseline for your GSA Schedule CSP-1.", category: "RATE_CARD", mandatory: true, certTypes: ["GSA_MAS"] },
  { name: "Past Performance References (3+ contracts)", why: "Required — GSA requires documented past performance for evaluation.", category: "CONTRACT", mandatory: true, certTypes: ["GSA_MAS"] },
  // ── GSA MAS USEFUL ──
  { name: "Past Proposals or SOWs", why: "Technical writing samples and scope of work examples strengthen your narrative.", category: "PAST_PROPOSAL", mandatory: false, certTypes: ["GSA_MAS"] },
  { name: "CPARS Reports", why: "Government performance ratings provide strong verified past performance.", category: "CPARS_REPORT", mandatory: false, certTypes: ["GSA_MAS"] },
  { name: "QMS Manual or SOPs", why: "Supports your Quality Control Plan with documented processes.", category: "QMS_MANUAL", mandatory: false, certTypes: ["GSA_MAS"] },
  { name: "Subcontractor Agreements", why: "Documents teaming arrangements and subcontractor management.", category: "CONTRACT", mandatory: false, certTypes: ["GSA_MAS"] },

  // ── 8(a) MANDATORY ──
  { name: "Personal Financial Statement (SBA Form 413)", why: "Required — SBA uses this to determine economic disadvantage.", category: "FINANCIAL_STATEMENT", mandatory: true, certTypes: ["SBA_8A"] },
  { name: "Proof of Citizenship", why: "Required — US citizenship verification for all disadvantaged owners.", category: "CERTIFICATION_DOCUMENT", mandatory: true, certTypes: ["SBA_8A"] },
  { name: "Operating Agreement / Bylaws", why: "Required — must demonstrate 51%+ ownership and control by disadvantaged individual.", category: "CERTIFICATION_DOCUMENT", mandatory: true, certTypes: ["SBA_8A"] },
  // ── 8(a) USEFUL ──
  { name: "Social Disadvantage Narrative drafts", why: "Supporting evidence strengthens your personal narrative significantly.", category: "CERTIFICATION_DOCUMENT", mandatory: false, certTypes: ["SBA_8A"] },
  { name: "Business Plan", why: "SBA expects growth projections and market analysis for 8(a) applicants.", category: "OTHER", mandatory: false, certTypes: ["SBA_8A"] },
  { name: "Resumes of ALL owners", why: "Demonstrates owner qualifications and management capability.", category: "OTHER", mandatory: false, certTypes: ["SBA_8A"] },
  { name: "Corporate Meeting Minutes", why: "Shows evidence of owner control and decision-making authority.", category: "OTHER", mandatory: false, certTypes: ["SBA_8A"] },
  { name: "Personal Tax Returns (owner) — last 3 years", why: "Verifies AGI for economic disadvantage threshold.", category: "TAX_RETURN", mandatory: false, certTypes: ["SBA_8A"] },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function formatBytes(bytes: number) {
  if (!bytes) return "\u2014";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getFileIcon(filename: string) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || "\u{1F4CE}";
}

function getCategoryLabel(value: string) {
  return CATEGORY_OPTIONS.find(c => c.value === value)?.label || value;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sidebar links
   ═══════════════════════════════════════════════════════════════════════════ */

const SIDEBAR_LINKS = [
  { href: "/portal", icon: "\u{1F3E0}", label: "Home" },
  { href: "/portal/applications", icon: "\u{1F4CB}", label: "My Applications" },
  { href: "/portal/eligibility", icon: "\u2705", label: "Eligibility" },
  { href: "/portal/integrations", icon: "\u{1F517}", label: "Integrations" },
  { href: "/portal/documents", icon: "\u{1F4C4}", label: "My Documents" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function PortalDocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploadCategory, setUploadCategory] = useState("OTHER");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Auth + data fetch ── */
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

  const fetchData = useCallback(async () => {
    try {
      const [clientsData, docsData, certsData] = await Promise.all([
        apiRequest("/api/clients"),
        apiRequest("/api/upload/documents"),
        apiRequest("/api/certifications"),
      ]);
      if (Array.isArray(clientsData) && clientsData.length > 0) {
        setClientId(clientsData[0].id);
      }
      setDocuments(Array.isArray(docsData) ? docsData : []);
      setCertifications(Array.isArray(certsData) ? certsData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  /* ── Upload handler ── */
  async function handleUpload() {
    if (uploadFiles.length === 0 || !clientId) {
      setUploadError("Please select at least one file.");
      return;
    }
    setUploading(true);
    setUploadError("");
    const token = localStorage.getItem("token");

    try {
      for (const file of uploadFiles) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", clientId);
        formData.append("category", uploadCategory);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Upload failed for ${file.name}`);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }

      setUploadSuccess(`\u2713 ${uploadFiles.length} document${uploadFiles.length > 1 ? "s" : ""} uploaded successfully`);
      setUploadFiles([]);
      setUploadProgress({});
      setTimeout(() => setUploadSuccess(""), 5000);
      fetchData();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  /* ── Delete handler ── */
  async function handleDelete(docId: string) {
    try {
      await apiRequest(`/api/upload/documents/${docId}`, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchData();
    } catch (err) { console.error(err); }
  }

  /* ── Drag & drop handlers ── */
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragOver(true); }
  function onDragLeave(e: React.DragEvent) { e.preventDefault(); setIsDragOver(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) setUploadFiles(prev => [...prev, ...files]);
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) setUploadFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeQueuedFile(idx: number) {
    setUploadFiles(prev => prev.filter((_, i) => i !== idx));
  }

  /* ── Documents disclaimer popup ── */
  const [showDocsDisclaimer, setShowDocsDisclaimer] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("govcert_docs_disclaimer_dismissed") !== "true";
  });

  function dismissDocsDisclaimer(neverAgain: boolean) {
    if (neverAgain) localStorage.setItem("govcert_docs_disclaimer_dismissed", "true");
    setShowDocsDisclaimer(false);
  }

  /* ── Recommended docs logic ── */
  const activeCertTypes = certifications.map((c: any) => c.type || c.certificationType);
  const hasActiveCerts = activeCertTypes.length > 0;

  function isDocUploaded(category: string) {
    return documents.some(d => d.category === category);
  }

  const universalMandatory = RECOMMENDED_DOCS.filter(d => !d.certTypes && d.mandatory);
  const universalUseful = RECOMMENDED_DOCS.filter(d => !d.certTypes && !d.mandatory);
  const gsaMandatory = RECOMMENDED_DOCS.filter(d => d.certTypes?.includes("GSA_MAS") && d.mandatory);
  const gsaUseful = RECOMMENDED_DOCS.filter(d => d.certTypes?.includes("GSA_MAS") && !d.mandatory);
  const eightAMandatory = RECOMMENDED_DOCS.filter(d => d.certTypes?.includes("SBA_8A") && d.mandatory);
  const eightAUseful = RECOMMENDED_DOCS.filter(d => d.certTypes?.includes("SBA_8A") && !d.mandatory);

  function renderDocItem(doc: RecommendedDoc, i: number, total: number) {
    const uploaded = isDocUploaded(doc.category);
    return (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < total - 1 ? "1px solid rgba(11,25,41,.04)" : "none" }}>
        <span style={{ fontSize: 16, color: uploaded ? "#27ae60" : doc.mandatory ? "#e74c3c" : "var(--ink4)", flexShrink: 0 }}>{uploaded ? "✓" : doc.mandatory ? "●" : "○"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>
            {doc.name}
            {doc.mandatory && !uploaded && <span style={{ fontSize: 10, fontWeight: 600, color: "#e74c3c", marginLeft: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Required</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink4)", lineHeight: 1.4, marginTop: 2 }}>{doc.why}</div>
        </div>
        {!uploaded && (
          <button onClick={() => { setUploadCategory(doc.category); fileInputRef.current?.click(); }}
            style={{ padding: "5px 14px", background: doc.mandatory ? "linear-gradient(135deg, #C89B3C, #E8B84B)" : "var(--cream)", border: doc.mandatory ? "none" : "1px solid var(--border)", borderRadius: 6, fontSize: 11, fontWeight: 500, color: doc.mandatory ? "#fff" : "var(--ink3)", cursor: "pointer", flexShrink: 0 }}>
            Upload
          </button>
        )}
      </div>
    );
  }

  const showGsa = !hasActiveCerts || activeCertTypes.some((t: string) => t?.includes("GSA"));
  const show8a = !hasActiveCerts || activeCertTypes.some((t: string) => t?.includes("8A") || t?.includes("8a"));

  function startUploadForCategory(category: string) {
    setUploadCategory(category);
    fileInputRef.current?.click();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#0B1929" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(200,155,60,.2)", borderTopColor: "#C89B3C", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 14, color: "rgba(11,25,41,.5)" }}>Loading documents...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  const totalDocs = documents.length;

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", display: "flex", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Documents Disclaimer Popup */}
      {showDocsDisclaimer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,25,41,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 540, width: "100%", padding: "32px 28px", boxShadow: "0 12px 40px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>📄</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, textAlign: "center", marginBottom: 12 }}>About Your Documents</h3>
            <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.7, marginBottom: 16, textAlign: "center" }}>
              Your documents are the foundation of your certification applications. The more you provide, the stronger your application will be.
            </p>
            <div style={{ background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.2)", borderRadius: 8, padding: "16px", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <span style={{ color: "#e74c3c", fontWeight: 700, fontSize: 16 }}>●</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>Mandatory Documents</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>These are <strong>required</strong> to fully complete your application. Without them, your application cannot be submitted.</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ color: "var(--ink4)", fontSize: 16 }}>○</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>Recommended Documents</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>These are optional but <strong>significantly strengthen</strong> your application. Our AI uses them to generate more detailed, accurate narratives.</div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--ink4)", lineHeight: 1.6, marginBottom: 20, textAlign: "center", fontStyle: "italic" }}>
              Tip: Invoices, contracts, and past proposals are especially valuable — they contain pricing data, service descriptions, and performance evidence that directly feeds into your application sections.
            </p>
            <button onClick={() => dismissDocsDisclaimer(false)} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 500, cursor: "pointer", marginBottom: 10 }}>
              Got It
            </button>
            <button onClick={() => dismissDocsDisclaimer(true)} style={{ width: "100%", padding: "10px", background: "transparent", border: "none", color: "var(--ink4)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
              Don't show this again
            </button>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div style={{
        width: 252,
        background: "linear-gradient(195deg, #0f2236 0%, #0B1929 40%, #091520 100%)",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh",
        borderRight: "1px solid rgba(200,155,60,.15)",
        boxShadow: "4px 0 24px rgba(11,25,41,.15)",
      }}>
        {/* Gold accent line */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #C89B3C, #E8B84B, #C89B3C)" }} />

        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 34, height: 34,
              background: "linear-gradient(135deg, #C89B3C, #E8B84B)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(200,155,60,.35)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "#E8B84B", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>
        </div>

        {/* Nav */}
        <nav style={{ padding: "20px 12px", flex: 1 }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "rgba(255,255,255,.22)", padding: "0 10px", marginBottom: 10, fontWeight: 600 }}>
            My Portal
          </div>
          {SIDEBAR_LINKS.map(link => {
            const isActive = link.href === "/portal/documents";
            return (
              <a key={link.href} href={link.href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8, marginBottom: 2,
                textDecoration: "none", fontSize: 13.5, fontWeight: isActive ? 500 : 400,
                background: isActive ? "rgba(200,155,60,.12)" : "transparent",
                border: isActive ? "1px solid rgba(200,155,60,.2)" : "1px solid transparent",
                borderLeft: isActive ? "3px solid #C89B3C" : "3px solid transparent",
                color: isActive ? "#E8B84B" : "rgba(255,255,255,.45)",
                transition: "all .15s ease",
              }}>
                <span style={{ fontSize: 15 }}>{link.icon}</span> {link.label}
              </a>
            );
          })}
        </nav>

        {/* User area */}
        <div style={{ padding: "16px 14px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.55)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Client Portal</div>
          </div>
          <button onClick={logout} style={{
            width: "100%", padding: "8px 12px",
            background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 8, color: "rgba(255,255,255,.45)", fontSize: 13, cursor: "pointer",
            textAlign: "left" as const, transition: "all .15s ease",
          }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1040 }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "#C89B3C", marginBottom: 10 }}>
              Client Portal
            </div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 44,
              color: "#0B1929", fontWeight: 400, lineHeight: 1.1, marginBottom: 10,
            }}>
              My Documents
            </h1>
            <p style={{ fontSize: 15, color: "rgba(11,25,41,.5)", fontWeight: 300, lineHeight: 1.7, maxWidth: 680 }}>
              Upload documents to support your certification applications. Our AI analyzes each document to determine how it contributes to your applications.
            </p>
          </div>

          {/* Success banner */}
          {uploadSuccess && (
            <div style={{
              background: "rgba(34,139,34,.06)", border: "1px solid rgba(34,139,34,.2)",
              borderRadius: 10, padding: "13px 18px", marginBottom: 24,
              fontSize: 13.5, color: "#228B22", fontWeight: 500,
            }}>
              {uploadSuccess}
            </div>
          )}

          {/* ═══ Section 2: Recommended Documents ═══ */}
          <div style={{
            background: "#fff", borderRadius: 14,
            border: "1px solid rgba(200,155,60,.15)",
            boxShadow: "0 1px 4px rgba(11,25,41,.04), 0 8px 24px rgba(11,25,41,.03)",
            padding: "28px 32px", marginBottom: 28,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{"\u{1F4CB}"}</span>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#0B1929", fontWeight: 400 }}>
                Recommended Documents
              </h2>
            </div>
            <p style={{ fontSize: 13, color: "rgba(11,25,41,.45)", marginBottom: 24, lineHeight: 1.6 }}>
              Based on your active certifications, these documents will strengthen your applications.
            </p>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 11, color: "var(--ink4)" }}>
              <span><span style={{ color: "#e74c3c", fontWeight: 700 }}>●</span> Mandatory — required to complete your application</span>
              <span><span style={{ color: "var(--ink4)" }}>○</span> Useful — strengthens your application</span>
              <span><span style={{ color: "#27ae60", fontWeight: 700 }}>✓</span> Uploaded</span>
            </div>

            {/* Universal Mandatory */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "#e74c3c", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid rgba(231,76,60,.2)" }}>
                Mandatory Documents (all certifications)
              </div>
              {universalMandatory.map((doc, i) => renderDocItem(doc, i, universalMandatory.length))}
            </div>

            {/* Universal Useful */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "#C89B3C", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid rgba(200,155,60,.15)" }}>
                Recommended Documents (all certifications)
              </div>
              {universalUseful.map((doc, i) => renderDocItem(doc, i, universalUseful.length))}
            </div>

            {/* GSA MAS */}
            {showGsa && (
              <>
                {gsaMandatory.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "#e74c3c", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid rgba(231,76,60,.2)" }}>
                      Mandatory for GSA MAS
                    </div>
                    {gsaMandatory.map((doc, i) => renderDocItem(doc, i, gsaMandatory.length))}
                  </div>
                )}
                {gsaUseful.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "#C89B3C", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid rgba(200,155,60,.15)" }}>
                      Recommended for GSA MAS
                    </div>
                    {gsaUseful.map((doc, i) => renderDocItem(doc, i, gsaUseful.length))}
                  </div>
                )}
              </>
            )}

            {/* 8(a) */}
            {show8a && (
              <>
                {eightAMandatory.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "#e74c3c", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid rgba(231,76,60,.2)" }}>
                      Mandatory for 8(a)
                    </div>
                    {eightAMandatory.map((doc, i) => renderDocItem(doc, i, eightAMandatory.length))}
                  </div>
                )}
                {eightAUseful.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "#C89B3C", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid rgba(200,155,60,.15)" }}>
                      Recommended for 8(a)
                    </div>
                    {eightAUseful.map((doc, i) => renderDocItem(doc, i, eightAUseful.length))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ═══ Section 3: Upload Area ═══ */}
          <div style={{
            background: "#fff", borderRadius: 14,
            border: "1px solid rgba(200,155,60,.15)",
            boxShadow: "0 1px 4px rgba(11,25,41,.04), 0 8px 24px rgba(11,25,41,.03)",
            padding: "28px 32px", marginBottom: 28,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 18 }}>{"\u{1F4E4}"}</span>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#0B1929", fontWeight: 400 }}>
                Upload Documents
              </h2>
            </div>

            {uploadError && (
              <div style={{
                background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "#DC2626",
              }}>
                {uploadError}
              </div>
            )}

            {/* Category picker */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B1929", marginBottom: 6 }}>
                Document Category
              </label>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                style={{
                  width: "100%", maxWidth: 400, padding: "10px 14px",
                  fontSize: 13.5, border: "1px solid rgba(200,155,60,.25)",
                  borderRadius: 8, background: "#fff", color: "#0B1929",
                  fontFamily: "'DM Sans', sans-serif",
                  outline: "none",
                }}
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragOver ? "#C89B3C" : "rgba(200,155,60,.3)"}`,
                borderRadius: 12,
                padding: "36px 24px",
                textAlign: "center" as const,
                cursor: "pointer",
                background: isDragOver ? "rgba(200,155,60,.04)" : "rgba(245,241,232,.4)",
                transition: "all .2s ease",
                marginBottom: uploadFiles.length > 0 ? 16 : 0,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.5 }}>{"\u{1F4C1}"}</div>
              <div style={{ fontSize: 14, color: "#0B1929", fontWeight: 500, marginBottom: 4 }}>
                Drag & drop files here
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(11,25,41,.4)" }}>
                or click to choose files
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={onFileSelect}
                style={{ display: "none" }}
              />
            </div>

            {/* Queued files */}
            {uploadFiles.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {uploadFiles.map((file, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", background: "rgba(245,241,232,.6)",
                    borderRadius: 8, marginBottom: 4,
                    border: "1px solid rgba(200,155,60,.1)",
                  }}>
                    <span style={{ fontSize: 16 }}>{getFileIcon(file.name)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#0B1929", fontWeight: 500 }}>{file.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(11,25,41,.4)" }}>{formatBytes(file.size)}</div>
                    </div>
                    {uploadProgress[file.name] !== undefined && (
                      <div style={{ width: 80, height: 4, background: "rgba(11,25,41,.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${uploadProgress[file.name]}%`,
                          background: "linear-gradient(90deg, #C89B3C, #E8B84B)",
                          borderRadius: 2, transition: "width .3s ease",
                        }} />
                      </div>
                    )}
                    {!uploading && (
                      <button onClick={(e) => { e.stopPropagation(); removeQueuedFile(i); }} style={{
                        background: "none", border: "none", fontSize: 14,
                        color: "rgba(11,25,41,.3)", cursor: "pointer", padding: "2px 6px",
                      }}>
                        {"\u2715"}
                      </button>
                    )}
                  </div>
                ))}

                <button onClick={handleUpload} disabled={uploading} style={{
                  marginTop: 12, padding: "11px 28px",
                  background: uploading ? "rgba(200,155,60,.5)" : "linear-gradient(135deg, #C89B3C, #E8B84B)",
                  border: "none", borderRadius: 8, color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: uploading ? "default" : "pointer",
                  boxShadow: uploading ? "none" : "0 4px 14px rgba(200,155,60,.3)",
                  transition: "all .15s ease",
                }}>
                  {uploading ? "Uploading..." : `Upload ${uploadFiles.length} File${uploadFiles.length > 1 ? "s" : ""}`}
                </button>
              </div>
            )}
          </div>

          {/* ═══ Section 4: Uploaded Documents Table ═══ */}
          {totalDocs > 0 ? (
            <div style={{
              background: "#fff", borderRadius: 14,
              border: "1px solid rgba(200,155,60,.15)",
              boxShadow: "0 1px 4px rgba(11,25,41,.04), 0 8px 24px rgba(11,25,41,.03)",
              padding: "28px 32px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{"\u{1F4C2}"}</span>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#0B1929", fontWeight: 400 }}>
                    Uploaded Documents
                  </h2>
                </div>
                <div style={{
                  padding: "5px 14px", background: "#0B1929", borderRadius: 100,
                  fontSize: 12, color: "#E8B84B", fontWeight: 500,
                }}>
                  {totalDocs} document{totalDocs !== 1 ? "s" : ""}
                </div>
              </div>

              <div style={{ overflowX: "auto" as const }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid rgba(200,155,60,.12)" }}>
                      {["", "Filename", "Category", "Uploaded By", "Date", "Size", "AI Classification", "", ""].map((h, i) => (
                        <th key={i} style={{
                          textAlign: "left" as const, padding: "10px 12px",
                          fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
                          letterSpacing: ".08em", color: "rgba(11,25,41,.4)",
                          whiteSpace: "nowrap" as const,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc: any) => {
                      const catColor = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.OTHER;
                      const aiText = AI_CLASSIFICATION[doc.category] || AI_CLASSIFICATION.OTHER;
                      return (
                        <tr key={doc.id} style={{ borderBottom: "1px solid rgba(11,25,41,.04)" }}>
                          {/* Icon */}
                          <td style={{ padding: "12px 8px 12px 12px", fontSize: 18, width: 36 }}>
                            {getFileIcon(doc.originalName || doc.fileName || "")}
                          </td>
                          {/* Filename */}
                          <td style={{ padding: "12px 12px", fontWeight: 500, color: "#0B1929", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                            {doc.originalName || doc.fileName || "Untitled"}
                          </td>
                          {/* Category badge + AI classification */}
                          <td style={{ padding: "12px 12px" }}>
                            <span style={{
                              display: "inline-block", padding: "3px 10px",
                              borderRadius: 100, fontSize: 11, fontWeight: 600,
                              background: catColor.bg, color: catColor.color,
                              whiteSpace: "nowrap" as const,
                            }}>
                              {getCategoryLabel(doc.category)}
                            </span>
                          </td>
                          {/* Uploaded by */}
                          <td style={{ padding: "12px 12px", color: "rgba(11,25,41,.55)", whiteSpace: "nowrap" as const }}>
                            {doc.uploadedBy?.firstName ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName || ""}`.trim() : "\u2014"}
                          </td>
                          {/* Date */}
                          <td style={{ padding: "12px 12px", color: "rgba(11,25,41,.55)", whiteSpace: "nowrap" as const }}>
                            {formatDate(doc.createdAt || doc.uploadedAt)}
                          </td>
                          {/* Size */}
                          <td style={{ padding: "12px 12px", color: "rgba(11,25,41,.55)", whiteSpace: "nowrap" as const }}>
                            {formatBytes(doc.fileSize || doc.size || 0)}
                          </td>
                          {/* AI Classification */}
                          <td style={{ padding: "12px 12px", maxWidth: 260 }}>
                            <div style={{
                              fontStyle: "italic", fontSize: 11, color: "rgba(11,25,41,.45)",
                              lineHeight: 1.5,
                            }}>
                              {aiText}
                            </div>
                          </td>
                          {/* Download */}
                          <td style={{ padding: "12px 8px", whiteSpace: "nowrap" as const }}>
                            {doc.fileUrl && (
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "4px 10px", fontSize: 11.5, fontWeight: 500,
                                color: "#C89B3C", textDecoration: "none",
                                border: "1px solid rgba(200,155,60,.25)", borderRadius: 6,
                                background: "rgba(200,155,60,.04)",
                              }}>
                                {"\u2B07"} Download
                              </a>
                            )}
                          </td>
                          {/* Delete */}
                          <td style={{ padding: "12px 12px 12px 4px" }}>
                            {deleteConfirm === doc.id ? (
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => handleDelete(doc.id)} style={{
                                  padding: "4px 10px", fontSize: 11, fontWeight: 600,
                                  background: "#DC2626", color: "#fff", border: "none",
                                  borderRadius: 5, cursor: "pointer",
                                }}>
                                  Confirm
                                </button>
                                <button onClick={() => setDeleteConfirm(null)} style={{
                                  padding: "4px 8px", fontSize: 11,
                                  background: "rgba(11,25,41,.05)", color: "rgba(11,25,41,.5)",
                                  border: "none", borderRadius: 5, cursor: "pointer",
                                }}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(doc.id)} style={{
                                padding: "4px 10px", fontSize: 11.5, fontWeight: 500,
                                color: "rgba(220,38,38,.6)", background: "rgba(220,38,38,.04)",
                                border: "1px solid rgba(220,38,38,.12)", borderRadius: 6,
                                cursor: "pointer",
                              }}>
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ═══ Section 5: Empty State ═══ */
            <div style={{
              background: "#fff", borderRadius: 14,
              border: "1px solid rgba(200,155,60,.15)",
              boxShadow: "0 1px 4px rgba(11,25,41,.04), 0 8px 24px rgba(11,25,41,.03)",
              padding: "48px 32px", textAlign: "center" as const,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>{"\u{1F4C2}"}</div>
              <h3 style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: 28,
                color: "#0B1929", fontWeight: 400, marginBottom: 10,
              }}>
                No documents uploaded yet
              </h3>
              <p style={{
                fontSize: 14, color: "rgba(11,25,41,.45)", lineHeight: 1.7,
                maxWidth: 480, margin: "0 auto 24px",
              }}>
                Start by uploading your key business documents. Our AI will analyze them to help build your certification applications. Check the recommended documents list above for guidance on what to upload first.
              </p>
              <button onClick={() => fileInputRef.current?.click()} style={{
                padding: "14px 36px", fontSize: 15, fontWeight: 600,
                background: "linear-gradient(135deg, #C89B3C, #E8B84B)",
                border: "none", borderRadius: 10, color: "#fff", cursor: "pointer",
                boxShadow: "0 4px 18px rgba(200,155,60,.35)",
              }}>
                Upload Your First Document
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
