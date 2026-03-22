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
  pdf: "📄", docx: "📝", doc: "📝", xlsx: "📊", xls: "📊",
  csv: "📊", txt: "📃", pptx: "📑", ppt: "📑", png: "🖼️",
  jpg: "🖼️", jpeg: "🖼️",
};

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function PortalDocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ clientId: "", category: "OTHER", description: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "ADMIN" || parsed.role === "ADVISOR") { router.push("/documents"); return; }
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
      // Extract client info from certifications
      if (certsData.length > 0) {
        setClients([{ id: certsData[0].clientId, businessName: certsData[0].client?.businessName }]);
        setUploadForm(prev => ({ ...prev, clientId: certsData[0].clientId }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadForm.clientId) {
      setUploadError("Please select a file.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("clientId", uploadForm.clientId);
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

      setUploadSuccess("✓ Document uploaded successfully");
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
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>🏠</span> My Applications
          </a>
          <a href="/portal/documents" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
            <span>📄</span> My Documents
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
        <div style={{ padding: "40px 48px", maxWidth: 860 }}>

          <a href="/portal" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Portal
          </a>

          <div style={{ marginTop: 20, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Client Portal</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>My Documents</h1>
              <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Files you and your advisor have uploaded for your certification application.</p>
            </div>
            <button onClick={() => setShowUpload(true)}
              style={{ padding: "12px 22px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)", flexShrink: 0 }}>
              + Upload Document
            </button>
          </div>

          {uploadSuccess && (
            <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--green)", fontWeight: 500 }}>
              {uploadSuccess}
            </div>
          )}

          {/* Upload panel */}
          {showUpload && (
            <div style={{ background: "#fff", border: "2px solid var(--gold)", borderRadius: "var(--rl)", padding: "24px", marginBottom: 24, boxShadow: "var(--shadow-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Upload a Document</h3>
                <button onClick={() => { setShowUpload(false); setUploadError(""); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ink3)" }}>✕</button>
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
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Click to select file</div>
                  <div style={{ fontSize: 12, color: "var(--ink4)" }}>PDF, DOCX, XLSX, CSV, TXT — up to 10MB</div>
                </div>
              ) : (
                <div style={{ padding: "12px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--green)" }}>{uploadFile.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink3)" }}>{formatBytes(uploadFile.size)}</div>
                  </div>
                  <button onClick={() => setUploadFile(null)} style={{ background: "none", border: "none", color: "var(--green)", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowUpload(false); setUploadError(""); }}
                  style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleUpload} disabled={uploading || !uploadFile}
                  style={{ padding: "10px 28px", background: uploadFile ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: uploadFile ? "#fff" : "var(--ink4)", fontSize: 13, fontWeight: 500, cursor: uploading || !uploadFile ? "not-allowed" : "pointer" }}>
                  {uploading ? "Uploading..." : "Upload →"}
                </button>
              </div>
            </div>
          )}

          {/* Document list */}
          {documents.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "60px 40px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📂</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>No documents uploaded yet</h3>
              <p style={{ fontSize: 13.5, color: "var(--ink3)", maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>
                Upload financial statements, capability statements, past proposals, and other supporting documents for your certification.
              </p>
              <button onClick={() => setShowUpload(true)}
                style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                Upload First Document
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {documents.map(doc => {
                const catColor = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.OTHER;
                const catLabel = CATEGORY_OPTIONS.find(o => o.value === doc.category)?.label || doc.category;
                const fileIcon = FILE_ICONS[doc.fileType?.toLowerCase()] || "📎";
                return (
                  <div key={doc.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 20px", boxShadow: "var(--shadow)", display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 44, height: 44, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: "var(--r)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {fileIcon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{doc.originalName || doc.name}</div>
                        <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10.5, fontWeight: 500, background: catColor.bg, color: catColor.color }}>
                          {catLabel}
                        </span>
                      </div>
                      {doc.section && (
                        <div style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "var(--gold)", fontWeight: 600 }}>Contributing to:</span>
                          <span>{doc.section}</span>
                        </div>
                      )}
                      {doc.description && (
                        <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 4 }}>{doc.description}</div>
                      )}
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
                        <span style={{ fontSize: 11, color: "var(--ink4)" }}>
                          👤 {doc.uploadedBy ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : "Unknown"}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--ink4)" }}>{formatBytes(doc.fileSize)}</span>
                        <span style={{ fontSize: 11, color: "var(--ink4)", fontFamily: "monospace" }}>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "6px 14px", background: "var(--navy)", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500, textDecoration: "none", flexShrink: 0 }}>
                      Download
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}