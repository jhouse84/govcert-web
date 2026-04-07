"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════════
   OASIS+ Proposal Submission Package
   ONE integrated flow mirroring the Symphony Portal (idiq.gsa.gov).
   ═══════════════════════════════════════════════════════════════════ */

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
  const [homeLink, setHomeLink] = useState("/portal");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

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
        } catch {}
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function copyText(text: string, id: string) {
    try { await navigator.clipboard.writeText(text); } catch { const el = document.createElement("textarea"); el.value = text; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  }

  async function downloadDoc(doc: any) {
    try {
      const resp = await fetch(`${API_URL}/api/documents/download/${doc.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!resp.ok) { setError("Download failed"); return; }
      const blob = await resp.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = doc.originalName || "document"; a.click(); URL.revokeObjectURL(url);
    } catch { setError("Download failed"); }
  }

  async function handleFileDrop(stepId: string, files: FileList, category: string) {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    setUploadingStep(stepId); setDragOverStep(null);
    try {
      const token = localStorage.getItem("token");
      const clientId = cert?.clientId || cert?.client?.id;
      for (const file of fileArr) {
        const formData = new FormData();
        formData.append("file", file);
        if (clientId) formData.append("clientId", clientId);
        formData.append("category", category);
        await fetch(`${API_URL}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      }
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
    } catch (err: any) { setError("Upload failed: " + (err.message || "")); }
    finally { setUploadingStep(null); }
  }

  const app = cert?.application;
  const client = cert?.client;

  // Parse OASIS data — check for review fixes from AI review panel
  let qpData: any[] = [];
  try {
    const qpParsed = JSON.parse(app?.oasisQPData || "[]");
    qpData = Array.isArray(qpParsed) ? qpParsed : (qpParsed._reviewFixes ? qpParsed : []);
  } catch {}
  let ppData: any[] = [];
  try { ppData = JSON.parse(app?.oasisPPData || "[]"); } catch {}
  let systemsData: any = {};
  try {
    const sysParsed = JSON.parse(app?.oasisSystemsData || "{}");
    systemsData = sysParsed;
  } catch {}
  let corpNarratives: Record<string, string> = {};
  try {
    const p = JSON.parse(app?.narrativeCorp || "{}");
    if (p._reviewFixes?.["corporate"]?.content) {
      corpNarratives = { ...(p.narratives || p), _reviewFixed: p._reviewFixes["corporate"].content };
    } else {
      corpNarratives = p.narratives || p;
    }
  } catch {}

  type Step = { id: string; label: string; portalLocation: string; type: "info" | "text" | "files"; status: "ready" | "partial" | "missing"; content?: any };

  const steps: Step[] = [
    // ── NARRATIVES ──
    { id: "corp-experience", label: "Corporate Experience Narratives", portalLocation: "Symphony Portal → Qualifying Projects → Corporate Experience", type: "text",
      status: Object.values(corpNarratives).some(v => v) ? "ready" : "missing",
      content: { narratives: Object.entries(corpNarratives).filter(([, v]) => v).map(([k, v]) => ({
        label: k.replace(/([A-Z_])/g, " $1").replace(/^./, s => s.toUpperCase()), value: v, id: `oc-${k}`, charLimit: null,
      })), emptyMessage: "Generate on the Corporate Experience page." } },

    { id: "qualifying-projects", label: "Qualifying Projects (up to 5 per domain)", portalLocation: "Symphony Portal → Qualifying Projects → J.P-3 Forms", type: "text",
      status: qpData.length > 0 ? "ready" : "missing",
      content: { narratives: qpData.map((qp: any, i: number) => ({
        label: `QP ${i + 1}: ${qp.agencyName || qp.contractNumber || "Project " + (i + 1)}`,
        value: [qp.scopeNarrative, qp.managementNarrative].filter(Boolean).join("\n\n") || `${qp.agencyName || ""} — ${qp.contractType || ""} — $${qp.totalValue || "?"}`,
        id: `qp-${i}`, charLimit: null,
      })), emptyMessage: "Add qualifying projects on the Qualifying Projects page." } },

    // ── FILES ──
    { id: "past-perf", label: "Past Performance — CPARS Reports (5+)", portalLocation: "Symphony Portal → Past Performance", type: "files",
      status: (clientDocs.CPARS_REPORT || []).length + (clientDocs.CONTRACT || []).length >= 5 ? "ready" : (clientDocs.CPARS_REPORT || []).length > 0 ? "partial" : "missing",
      content: { docs: [...(clientDocs.CPARS_REPORT || []), ...(clientDocs.CONTRACT || []), ...(clientDocs.PPQ_RESPONSE || [])], dropCategory: "CPARS_REPORT", note: "Minimum 5 relevant contracts with CPARS ratings. Drag and drop here." } },

    { id: "financials", label: "Financial Statements (3 Years, Audited)", portalLocation: "Symphony Portal → Required Documents", type: "files",
      status: (clientDocs.FINANCIAL_STATEMENT || []).length > 0 ? "ready" : "missing",
      content: { docs: clientDocs.FINANCIAL_STATEMENT || [], dropCategory: "FINANCIAL_STATEMENT", note: "Balance Sheet, Income Statement, and Cash Flow for 3 years. Audited preferred." } },

    { id: "accounting", label: "Accounting System Documentation", portalLocation: "Symphony Portal → Business Systems", type: "files",
      status: "missing",
      content: { docs: [], dropCategory: "FINANCIAL_STATEMENT", note: "DCAA pre-award survey or CPA-prepared accounting system description." } },

    { id: "oci", label: "OCI Mitigation Plan", portalLocation: "Symphony Portal → Required Documents", type: "files",
      status: "missing",
      content: { docs: [], dropCategory: "CERTIFICATION_DOCUMENT", note: "Organizational Conflict of Interest plan per FAR Subpart 9.5." } },

    { id: "qms", label: "Quality Management System (ISO/CMMI)", portalLocation: "Symphony Portal → Business Systems → Certifications", type: "files",
      status: (clientDocs.CERTIFICATION_DOCUMENT || []).length > 0 ? "partial" : "missing",
      content: { docs: clientDocs.CERTIFICATION_DOCUMENT || [], dropCategory: "CERTIFICATION_DOCUMENT", note: "ISO 9001 certificate, CMMI appraisal letter, or QMS policy document." } },

    { id: "key-personnel", label: "Key Personnel Resumes", portalLocation: "Symphony Portal → Key Personnel", type: "files",
      status: (clientDocs.RESUME || []).length > 0 ? "ready" : "missing",
      content: { docs: clientDocs.RESUME || [], dropCategory: "RESUME", note: "Program Manager, domain leads, technical experts. Include clearances and certifications." } },

    { id: "security", label: "Security Clearance (FCL Letter)", portalLocation: "Symphony Portal → Business Systems → Security", type: "files",
      status: "missing",
      content: { docs: [], dropCategory: "CERTIFICATION_DOCUMENT", note: "Facility Clearance Letter from DCSA if applicable. Not required for all domains." } },

    { id: "subcon-plan", label: "Subcontracting Plan (Large Business Only)", portalLocation: "Symphony Portal → Required Documents", type: "info",
      status: "ready",
      content: { text: "Required for large businesses on the Unrestricted pool. Small businesses are exempt. If required, generate on the Subcontracting Plan page." } },

    { id: "sam", label: "SAM.gov Registration", portalLocation: "Symphony Portal validates against SAM.gov", type: "info",
      status: client?.uei ? "ready" : "missing",
      content: { text: `UEI: ${client?.uei || "Not set"} | CAGE: ${client?.cageCode || "Not set"}. Must be active with correct NAICS codes for your domains. Symphony Portal auto-validates.` } },

    // ── SUBMIT ──
    { id: "submit-final", label: "Review & Submit Proposal", portalLocation: "Symphony Portal → Submit", type: "info",
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
          <div style={{ padding: "10px 12px" }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 920 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>← Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Final Step</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>OASIS+ Proposal Package</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Everything you need for the Symphony Portal at <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", fontWeight: 500 }}>idiq.gsa.gov</a>.
            </p>
          </div>

          {/* Progress */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              Open Symphony Portal →
            </a>
          </div>

          {/* Analysis CTA */}
          <a href={`/certifications/${certId}/oasis-plus/review`}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", marginBottom: 20,
              background: "linear-gradient(135deg, #1A2332 0%, #2D3748 100%)", borderRadius: "var(--rl)", textDecoration: "none",
              border: "1px solid rgba(99,102,241,.3)", boxShadow: "0 4px 20px rgba(99,102,241,.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{"\uD83D\uDD0D"}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Run GovCert Analysis</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>AI review of your OASIS+ proposal — domain scoring, competitiveness assessment, gap analysis.</div>
              </div>
            </div>
            <div style={{ padding: "10px 20px", background: "rgba(99,102,241,.2)", border: "1px solid rgba(99,102,241,.4)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Analyze →</div>
          </a>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>&times;</button>
            </div>
          )}

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map(step => {
              const isOpen = expandedStep === step.id;
              const statusBg = step.status === "ready" ? "var(--green-bg)" : step.status === "partial" ? "var(--amber-bg)" : "var(--cream2)";
              const statusColor = step.status === "ready" ? "var(--green)" : step.status === "partial" ? "var(--amber)" : "var(--ink4)";

              return (
                <div key={step.id} style={{ background: "#fff", border: `1px solid ${step.status === "ready" ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
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
                      {step.status === "ready" ? "Ready" : step.status === "partial" ? "Partial" : "Missing"}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--gold)" }}>{isOpen ? "\u25B2" : "\u25BC"}</span>
                  </div>

                  {isOpen && (
                    <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
                      {step.type === "info" && step.content?.text && (
                        <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.7 }}>{step.content.text}</div>
                      )}

                      {step.type === "text" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {(step.content?.narratives || []).length === 0 && step.content?.emptyMessage && (
                            <div style={{ fontSize: 13, color: "var(--ink4)", fontStyle: "italic" }}>{step.content.emptyMessage}</div>
                          )}
                          {(step.content?.narratives || []).map((n: any) => (
                            <div key={n.id} style={{ border: `1px solid ${n.value ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--r)", overflow: "hidden" }}>
                              <div style={{ padding: "10px 14px", background: n.value ? "var(--green-bg)" : "var(--cream)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: n.value ? "var(--navy)" : "var(--ink4)" }}>{n.value ? "\u2713 " : ""}{n.label}</div>
                                {n.value && (
                                  <button onClick={() => copyText(n.value, n.id)}
                                    style={{ padding: "5px 14px", background: copiedId === n.id ? "var(--green)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 600, color: copiedId === n.id ? "#fff" : "var(--gold2)", cursor: "pointer" }}>
                                    {copiedId === n.id ? "\u2713 Copied" : "Copy →"}
                                  </button>
                                )}
                              </div>
                              {n.value && (
                                <div style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--ink)", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>{n.value}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {step.type === "files" && (
                        <div
                          onDragOver={step.content?.dropCategory ? (e) => { e.preventDefault(); setDragOverStep(step.id); } : undefined}
                          onDragLeave={step.content?.dropCategory ? () => setDragOverStep(null) : undefined}
                          onDrop={step.content?.dropCategory ? (e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleFileDrop(step.id, e.dataTransfer.files, step.content.dropCategory); } : undefined}
                          style={dragOverStep === step.id ? { border: "2px dashed var(--gold)", borderRadius: "var(--r)", padding: 8, background: "rgba(200,155,60,.04)" } : {}}>
                          {uploadingStep === step.id && <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500, marginBottom: 8 }}>Uploading...</div>}
                          {step.content?.note && <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 10, lineHeight: 1.6 }}>{step.content.note}</div>}
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
                          ) : (
                            <div style={{ padding: "14px", background: "rgba(200,60,60,.03)", borderRadius: "var(--r)", border: "1px solid rgba(200,60,60,.08)", fontSize: 12, color: "var(--red)" }}>
                              No files uploaded yet. Drag and drop files here or upload on the relevant wizard page.
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

          {/* Bottom */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "24px 28px", marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 4 }}>Ready to submit?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>Open the Symphony Portal and work through each section above.</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <a href={`/certifications/${certId}`} style={{ padding: "10px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, textDecoration: "none" }}>← Dashboard</a>
              <a href={`/certifications/${certId}/oasis-plus/review`} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Run Analysis</a>
              <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 24px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Open Symphony Portal →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
