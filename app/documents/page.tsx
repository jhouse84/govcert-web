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

function formatBytes(bytes: number) {
  if (!bytes) return "\u2014";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const UNASSIGNED_KEY = "__unassigned__";

export default function AdminDocumentsPage() {
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
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [collapsedClients, setCollapsedClients] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "CUSTOMER") {
        router.push("/portal/documents");
        return;
      }
      setUser(parsed);
    }
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [docsData, clientsData] = await Promise.all([
        apiRequest("/api/upload/documents"),
        apiRequest("/api/clients"),
      ]);
      setDocuments(docsData);
      setClients(clientsData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadForm.clientId) {
      setUploadError("Please select a file and a client.");
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

      setUploadSuccess("Document uploaded successfully.");
      setUploadFile(null);
      setUploadForm({ clientId: "", category: "OTHER", description: "" });
      setShowUpload(false);
      setTimeout(() => setUploadSuccess(""), 4000);
      fetchData();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    setDeleting(docId);
    try {
      await apiRequest(`/api/upload/documents/${docId}`, { method: "DELETE" });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) {
      alert("Failed to delete document: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(null);
    }
  }

  function toggleClient(clientId: string) {
    setCollapsedClients(prev => ({ ...prev, [clientId]: !prev[clientId] }));
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    if (filterCategory && doc.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (doc.originalName || doc.name || "").toLowerCase();
      const desc = (doc.description || "").toLowerCase();
      const clientName = (doc.client?.businessName || "").toLowerCase();
      if (!name.includes(q) && !desc.includes(q) && !clientName.includes(q)) return false;
    }
    return true;
  });

  // Group filtered documents by client
  const groupedByClient: Record<string, any[]> = {};
  filteredDocs.forEach(doc => {
    const clientId = doc.client?.id || doc.clientId || UNASSIGNED_KEY;
    if (!groupedByClient[clientId]) groupedByClient[clientId] = [];
    groupedByClient[clientId].push(doc);
  });

  // Build ordered client groups: real clients first (sorted by name), then unassigned
  const clientMap: Record<string, any> = {};
  clients.forEach(c => { clientMap[c.id] = c; });

  const clientGroups: { id: string; name: string; docs: any[] }[] = [];

  // Add clients that have documents (sorted alphabetically)
  const clientIdsWithDocs = Object.keys(groupedByClient).filter(id => id !== UNASSIGNED_KEY);
  clientIdsWithDocs.sort((a, b) => {
    const nameA = (clientMap[a]?.businessName || "").toLowerCase();
    const nameB = (clientMap[b]?.businessName || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });
  clientIdsWithDocs.forEach(id => {
    clientGroups.push({
      id,
      name: clientMap[id]?.businessName || "Unknown Client",
      docs: groupedByClient[id],
    });
  });

  // Add unassigned group if any
  if (groupedByClient[UNASSIGNED_KEY]) {
    clientGroups.push({
      id: UNASSIGNED_KEY,
      name: "Unassigned",
      docs: groupedByClient[UNASSIGNED_KEY],
    });
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
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {[
            { label: "Dashboard", icon: "\u2B1B", href: "/dashboard" },
            { label: "Clients", icon: "\u{1F465}", href: "/clients" },
            { label: "Certifications", icon: "\u{1F4CB}", href: "/certifications" },
            { label: "Documents", icon: "\u{1F4C4}", href: "/documents", active: true },
            { label: "Calendar", icon: "\u{1F4C5}", href: "/calendar" },
            { label: "Integrations", icon: "\u{1F517}", href: "/integrations" },
            { label: "Team & Users", icon: "\u{1F464}", href: "/settings/team" },
          ].map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: item.active ? "rgba(200,155,60,.15)" : "transparent",
              border: item.active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: item.active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: item.active ? 500 : 400,
              marginBottom: 2, transition: "all .15s"
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1100 }}>

          {/* Header */}
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Administration</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Document Vault</h1>
              <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>All client documents across your organization.</p>
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

          {/* Upload Modal */}
          {showUpload && (
            <>
              <div onClick={() => { setShowUpload(false); setUploadError(""); }}
                style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(11,25,41,.6)", zIndex: 999 }} />
              <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 540, background: "#fff", borderRadius: "var(--rl)", padding: "32px", boxShadow: "0 24px 80px rgba(0,0,0,.3)", zIndex: 1000, border: "2px solid var(--gold)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400 }}>Upload Document</h3>
                  <button onClick={() => { setShowUpload(false); setUploadError(""); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--ink3)" }}>{"\u2715"}</button>
                </div>

                {uploadError && (
                  <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--red)" }}>
                    {uploadError}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Client *</label>
                  <select value={uploadForm.clientId} onChange={e => setUploadForm(prev => ({ ...prev, clientId: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", background: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
                    <option value="">Select a client...</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Document Type</label>
                    <select value={uploadForm.category} onChange={e => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", background: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
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
                    style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "28px", textAlign: "center" as const, cursor: "pointer", marginBottom: 20 }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{"\u{1F4CE}"}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Click to select file</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>PDF, DOCX, XLSX, CSV, TXT — up to 10MB</div>
                  </div>
                ) : (
                  <div style={{ padding: "12px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                  <button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadForm.clientId}
                    style={{ padding: "10px 28px", background: (uploadFile && uploadForm.clientId) ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: (uploadFile && uploadForm.clientId) ? "#fff" : "var(--ink4)", fontSize: 13, fontWeight: 500, cursor: (uploading || !uploadFile || !uploadForm.clientId) ? "not-allowed" : "pointer" }}>
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Filter Bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              style={{ padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", background: "#fff", fontFamily: "'DM Sans', sans-serif", minWidth: 180 }}>
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              type="text"
              placeholder="Search by filename, description, or client..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#fff" }}
            />
            <div style={{ fontSize: 12, color: "var(--ink4)", flexShrink: 0 }}>
              {filteredDocs.length} document{filteredDocs.length !== 1 ? "s" : ""} across {clientGroups.length} client{clientGroups.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Client-Grouped Document List */}
          {clientGroups.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "60px 40px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{"\u{1F4C2}"}</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
                {documents.length === 0 ? "No documents uploaded yet" : "No documents match your filters"}
              </h3>
              <p style={{ fontSize: 13.5, color: "var(--ink3)", maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>
                {documents.length === 0
                  ? "Upload documents for your clients to get started."
                  : "Try adjusting your category filter or search query."}
              </p>
              {documents.length === 0 && (
                <button onClick={() => setShowUpload(true)}
                  style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                  Upload First Document
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {clientGroups.map(group => {
                const isCollapsed = collapsedClients[group.id] === true;
                const isUnassigned = group.id === UNASSIGNED_KEY;
                return (
                  <div key={group.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
                    {/* Client Header */}
                    <button
                      onClick={() => toggleClient(group.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "16px 20px",
                        background: isUnassigned ? "var(--cream)" : "var(--navy)",
                        border: "none",
                        borderBottom: isCollapsed ? "none" : "1px solid var(--border)",
                        cursor: "pointer",
                        textAlign: "left" as const,
                      }}
                    >
                      {/* Chevron */}
                      <svg
                        width="12" height="12" viewBox="0 0 12 12"
                        fill={isUnassigned ? "var(--ink3)" : "rgba(255,255,255,.5)"}
                        style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform .15s", flexShrink: 0 }}
                      >
                        <path d="M2 4l4 4 4-4" stroke={isUnassigned ? "var(--ink3)" : "rgba(255,255,255,.5)"} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>

                      {/* Client Icon */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: isUnassigned ? "var(--cream2)" : "rgba(200,155,60,.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, flexShrink: 0,
                      }}>
                        {isUnassigned ? "\u{2753}" : "\u{1F3E2}"}
                      </div>

                      {/* Client Name */}
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 20,
                        fontWeight: 500,
                        color: isUnassigned ? "var(--ink3)" : "#fff",
                        flex: 1,
                      }}>
                        {group.name}
                      </span>

                      {/* Document Count Badge */}
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 600,
                        background: isUnassigned ? "var(--cream2)" : "rgba(200,155,60,.25)",
                        color: isUnassigned ? "var(--ink3)" : "var(--gold2)",
                        letterSpacing: ".02em",
                      }}>
                        {group.docs.length} doc{group.docs.length !== 1 ? "s" : ""}
                      </span>
                    </button>

                    {/* Documents inside this client */}
                    {!isCollapsed && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {group.docs.map((doc, idx) => {
                          const catColor = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.OTHER;
                          const catLabel = CATEGORY_OPTIONS.find(o => o.value === doc.category)?.label || doc.category;
                          const fileIcon = FILE_ICONS[doc.fileType?.toLowerCase()] || "\u{1F4CE}";
                          const isLast = idx === group.docs.length - 1;
                          return (
                            <div key={doc.id} style={{
                              padding: "14px 20px 14px 20px",
                              display: "flex", alignItems: "flex-start", gap: 14,
                              borderBottom: isLast ? "none" : "1px solid var(--border)",
                            }}>
                              <div style={{ width: 40, height: 40, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: "var(--r)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                {fileIcon}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{doc.originalName || doc.name}</div>
                                  <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10.5, fontWeight: 500, background: catColor.bg, color: catColor.color }}>
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
                                <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer"
                                  style={{ padding: "6px 14px", background: "var(--navy)", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
                                  Download
                                </a>
                                <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                                  style={{ padding: "6px 14px", background: deleting === doc.id ? "var(--cream2)" : "rgba(220,50,50,.08)", border: "1px solid rgba(220,50,50,.2)", borderRadius: "var(--r)", color: deleting === doc.id ? "var(--ink4)" : "#c03030", fontSize: 12, fontWeight: 500, cursor: deleting === doc.id ? "not-allowed" : "pointer" }}>
                                  {deleting === doc.id ? "..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
