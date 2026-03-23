"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_DOMAINS, OASIS_SECTIONS } from "@/lib/oasis-domains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

export default function ContractHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-contract-history");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      const app = data.application;
      if (app?.oasisDomains) {
        try { setSelectedDomains(JSON.parse(app.oasisDomains)); } catch {}
      }
      if (app?.oasisContractHistory) {
        try { setContractData(JSON.parse(app.oasisContractHistory)); } catch {}
      }
      // Count existing docs
      try {
        const docs = await apiRequest(`/api/upload/documents?clientId=${data.clientId}`);
        setTotalDocs(Array.isArray(docs) ? docs.length : 0);
      } catch {}
      // Completed sections
      const completed: Record<string, boolean> = {};
      if (app) {
        if (app.oasisDomains) completed["domains"] = true;
        if (app.oasisContractHistory) completed["contract-history"] = true;
        if (app.oasisScorecardData) completed["scorecard"] = true;
        if (app.oasisQPData) completed["qualifying-projects"] = true;
        if (app.oasisFEPData) completed["federal-experience"] = true;
        if (app.oasisSystemsData) completed["systems-certs"] = true;
      }
      setCompletedSections(completed);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !cert?.clientId) return;
    setUploading(true);
    setError(null);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("clientId", cert.clientId);
        fd.append("category", "CONTRACT");
        fd.append("description", "OASIS+ contract history upload");
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (res.ok) uploaded++;
      }
      setUploadedCount(prev => prev + uploaded);
      setTotalDocs(prev => prev + uploaded);
    } catch (err: any) {
      setError("Upload failed: " + (err.message || "Please try again."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function analyzeContracts() {
    setAnalyzing(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/oasis/analyze-contracts", {
        method: "POST",
        body: JSON.stringify({ clientId: cert?.clientId, domains: selectedDomains }),
      });
      setContractData(data);
      // Save to application
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert?.clientId,
          certType: "OASIS_PLUS",
          oasisContractHistory: JSON.stringify(data),
        }),
      });
    } catch (err: any) {
      setError("Analysis failed: " + (err.message || "Please try again. Upload more contract documents for better results."));
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveAndNext() {
    setSaving(true);
    try {
      if (contractData) {
        await apiRequest("/api/applications", {
          method: "POST",
          body: JSON.stringify({
            certificationId: certId,
            clientId: cert?.clientId,
            certType: "OASIS_PLUS",
            oasisContractHistory: JSON.stringify(contractData),
          }),
        });
      }
      router.push(`/certifications/${certId}/oasis-plus/scorecard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const contracts = contractData?.contracts || [];
  const summary = contractData?.summary || {};
  const recommendations = contractData?.recommendations || {};

  const UPDATED_SECTIONS = [
    { id: "domains", label: "Domain Selection" },
    { id: "contract-history", label: "Contract History" },
    ...OASIS_SECTIONS.filter(s => s.id !== "domains"),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="contract-history" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase" as const, letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {UPDATED_SECTIONS.map(section => {
            const isActive = section.id === "contract-history";
            const isComplete = completedSections[section.id];
            return (
              <a key={section.id} href={`/certifications/${certId}/oasis-plus/${section.id}`} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: "var(--r)",
                background: isActive ? "rgba(200,155,60,.15)" : "transparent",
                border: isActive ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
                color: isActive ? "var(--gold2)" : isComplete ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)",
                textDecoration: "none", fontSize: 12.5, fontWeight: isActive ? 500 : 400, marginBottom: 1,
              }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: isComplete ? "var(--green)" : "rgba(255,255,255,.08)", border: isComplete ? "none" : "1px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: isComplete ? "#fff" : "rgba(255,255,255,.3)", fontWeight: 600, flexShrink: 0 }}>
                  {isComplete ? "\u2713" : ""}
                </span>
                {section.label}
              </a>
            );
          })}
        </div>
      } />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1000 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            &larr; Back to Application
          </a>

          <div style={{ marginTop: 20, marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              GSA OASIS+ &mdash; Step 2 of 9
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Contract History Upload
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 700 }}>
              Upload your contract history &mdash; every contract, task order, and subcontract from the past 5 years. Our AI will analyze each one to identify your strongest Qualifying Projects, calculate scores, and recommend which domains to target.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}

          {/* Upload Section */}
          <div style={{ background: "#fff", border: "2px solid var(--gold)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
              <span style={{ fontSize: 36, flexShrink: 0 }}>📂</span>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>Upload Your Contract Documents</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>
                  Upload everything: prime contracts, task orders, subcontracts, SOWs, PWS, CPARS reports, award letters, and CLINs. The more you upload, the better the AI can identify your strongest qualifying projects.
                </p>
              </div>
            </div>

            <div style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--gold)", marginBottom: 8 }}>What to upload</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { icon: "📄", label: "Contract awards & modifications" },
                  { icon: "📋", label: "Statements of Work (SOW/PWS)" },
                  { icon: "⭐", label: "CPARS / past performance reports" },
                  { icon: "💰", label: "Task order documents & CLINs" },
                  { icon: "🤝", label: "Subcontract agreements" },
                  { icon: "📊", label: "Invoices showing contract values" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink2)" }}>
                    <span>{item.icon}</span> {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(200,155,60,.04)", border: "1px solid rgba(200,155,60,.15)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "var(--ink2)" }}>
              <strong>OASIS+ Eligibility Window:</strong> Projects completed within 5 years before June 15, 2023, or ongoing with 6+ months of completed performance. Upload everything from 2018 onward.
            </div>

            <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv,.pptx" style={{ display: "none" }} onChange={handleFileUpload} />

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ padding: "12px 28px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 500, color: "var(--gold2)", cursor: "pointer" }}>
                {uploading ? "Uploading..." : `Upload Documents (${totalDocs} on file)`}
              </button>
              {uploadedCount > 0 && (
                <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>&check; {uploadedCount} new documents uploaded this session</span>
              )}
            </div>
          </div>

          {/* Analyze Button */}
          {totalDocs > 0 && (
            <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,.06) 0%, rgba(200,155,60,.06) 100%)", border: "1px solid rgba(99,102,241,.15)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Ready to analyze</div>
                  <div style={{ fontSize: 13, color: "var(--ink3)" }}>
                    AI will read {totalDocs} documents, extract every contract, calculate AAVs, match domains, and identify your top QP candidates.
                  </div>
                </div>
                <button onClick={analyzeContracts} disabled={analyzing}
                  style={{
                    padding: "12px 28px",
                    background: analyzing ? "var(--ink4)" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: "#fff",
                    cursor: analyzing ? "wait" : "pointer",
                    boxShadow: "0 4px 16px rgba(99,102,241,.3)",
                    whiteSpace: "nowrap" as const,
                  }}>
                  {analyzing ? "Analyzing contracts..." : "🤖 Analyze Contract History"}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {contractData && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Contracts Found", value: summary.totalContracts || contracts.length, color: "var(--navy)" },
                  { label: "Strong QP Candidates", value: summary.strongQPCandidates || contracts.filter((c: any) => c.qpPotential === "strong").length, color: "var(--green)" },
                  { label: "Total Contract Value", value: `$${((summary.totalContractValue || 0) / 1000000).toFixed(1)}M`, color: "var(--gold)" },
                  { label: "Unique Agencies", value: summary.uniqueAgencies || new Set(contracts.map((c: any) => c.agency)).size, color: "#6366F1" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "18px 20px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 4, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* AI Recommendations */}
              {recommendations.bestDomainsToTarget?.length > 0 && (
                <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--rl)", padding: "18px 22px", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", marginBottom: 6 }}>AI Recommended Domains (strongest QP match):</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                    {recommendations.bestDomainsToTarget.map((domId: string) => {
                      const dom = OASIS_DOMAINS.find(d => d.id === domId);
                      return (
                        <span key={domId} style={{ padding: "4px 12px", background: "#fff", border: "1px solid var(--green-b)", borderRadius: 100, fontSize: 12, fontWeight: 500, color: "var(--green)" }}>
                          {dom?.name || domId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {recommendations.gapsToAddress?.length > 0 && (
                <div style={{ background: "rgba(200,155,60,.04)", border: "1px solid rgba(200,155,60,.15)", borderRadius: "var(--rl)", padding: "14px 18px", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", marginBottom: 6 }}>Gaps to Address:</div>
                  {recommendations.gapsToAddress.map((gap: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 3, display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--gold)" }}>&bull;</span> {gap}
                    </div>
                  ))}
                </div>
              )}

              {/* Contract Table */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--cream)" }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>Extracted Contracts ({contracts.length})</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>AI-analyzed from your uploaded documents. Strong QP candidates are highlighted.</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "8px 22px", borderBottom: "1px solid var(--border)", fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--ink4)" }}>
                  <div>Project</div>
                  <div>Agency</div>
                  <div>AAV</div>
                  <div>Domains</div>
                  <div>QP Potential</div>
                </div>
                {contracts.map((c: any, i: number) => {
                  const potentialColors: Record<string, { color: string; bg: string }> = {
                    strong: { color: "var(--green)", bg: "var(--green-bg)" },
                    moderate: { color: "var(--gold)", bg: "rgba(200,155,60,.06)" },
                    weak: { color: "var(--ink4)", bg: "var(--cream2)" },
                  };
                  const pc = potentialColors[c.qpPotential] || potentialColors.weak;
                  return (
                    <div key={c.id || i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", padding: "12px 22px", borderBottom: "1px solid var(--border)", alignItems: "center", fontSize: 13, background: c.qpPotential === "strong" ? "rgba(34,197,94,.02)" : "transparent" }}>
                      <div>
                        <div style={{ fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{c.title || c.contractNumber || "Untitled"}</div>
                        <div style={{ fontSize: 11, color: "var(--ink4)" }}>{c.contractNumber} &middot; {c.contractType}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink2)" }}>{c.agency}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: (c.annualAverageValue || 0) >= 500000 ? "var(--green)" : "var(--red)" }}>
                        ${((c.annualAverageValue || 0) / 1000).toFixed(0)}K
                      </div>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" as const }}>
                        {(c.relevantDomains || []).slice(0, 2).map((d: string) => (
                          <span key={d} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 100, background: "rgba(99,102,241,.08)", color: "#6366F1" }}>
                            {OASIS_DOMAINS.find(dom => dom.id === d)?.name?.split(" ")[0] || d}
                          </span>
                        ))}
                      </div>
                      <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 100, fontSize: 10, fontWeight: 600, color: pc.color, background: pc.bg }}>
                        {c.qpPotential}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
            <a href={`/certifications/${certId}/oasis-plus/domains`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
              &larr; Previous: Domain Selection
            </a>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveAndNext} disabled={saving}
                style={{ padding: "10px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {saving ? "Saving..." : "Save & Next \u2192"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
