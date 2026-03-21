"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const CONTRACT_TYPES = ["Federal Government", "State/Local Government", "Commercial", "Non-Profit"];

type PPQStatus = "NOT_SENT" | "PENDING" | "SENT" | "OPENED" | "COMPLETED" | "DECLINED";

const PPQ_STATUS_STYLES: Record<PPQStatus, { bg: string; color: string; label: string }> = {
  NOT_SENT: { bg: "var(--cream2)", color: "var(--ink3)", label: "Not Sent" },
  PENDING: { bg: "var(--amber-bg)", color: "var(--amber)", label: "Pending" },
  SENT: { bg: "var(--blue-bg,#E8EEF8)", color: "var(--blue,#1A3F7A)", label: "Sent" },
  OPENED: { bg: "var(--purple-bg,#F0E8F8)", color: "var(--purple,#4A1A7A)", label: "Opened" },
  COMPLETED: { bg: "var(--green-bg)", color: "var(--green)", label: "Completed" },
  DECLINED: { bg: "var(--red-bg)", color: "var(--red)", label: "Declined" },
};

const EMPTY_CONTRACT = {
  agencyName: "",
  contractNumber: "",
  contractType: "Federal Government",
  contractValue: "",
  periodStart: "",
  periodEnd: "",
  sowDescription: "",
  hasCPARS: null as boolean | null,
  cparsUploaded: false,
  referenceFirstName: "",
  referenceLastName: "",
  referenceEmail: "",
  referencePhone: "",
  referenceTitle: "",
  ppqStatus: "NOT_SENT" as PPQStatus,
  narrative: "",
  id: "",
};

export default function PastPerformancePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const certId = String(params.id); // single definition — used everywhere below
  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<typeof EMPTY_CONTRACT[]>([]);
  const [expandedContract, setExpandedContract] = useState<number | null>(null);
  const [addingContract, setAddingContract] = useState(false);
  const [newContract, setNewContract] = useState({ ...EMPTY_CONTRACT });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sendingPPQ, setSendingPPQ] = useState<string | null>(null);
  const [generatingNarrative, setGeneratingNarrative] = useState<string | null>(null);
  const [uploadingCPARS, setUploadingCPARS] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (data.application?.pastPerformance?.length > 0) {
        const mapped = data.application.pastPerformance.map((pp: any) => ({
          ...EMPTY_CONTRACT,
          id: pp.id,
          agencyName: pp.agencyName || "",
          contractNumber: pp.contractNumber || "",
          contractType: pp.contractType || "Federal Government",
          contractValue: pp.contractValue || "",
          periodStart: pp.periodStart || "",
          periodEnd: pp.periodEnd || "",
          sowDescription: pp.description || "",
          hasCPARS: pp.hasCPARS ?? null,
          cparsUploaded: pp.cparsUploaded || false,
          referenceFirstName: pp.referenceFirstName || "",
          referenceLastName: pp.referenceLastName || "",
          referenceEmail: pp.referenceEmail || "",
          referencePhone: pp.referencePhone || "",
          referenceTitle: pp.referenceTitle || "",
          ppqStatus: (pp.ppqs?.[0]?.status || "NOT_SENT") as PPQStatus,
          narrative: pp.narrative || "",
        }));
        setContracts(mapped);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  async function ensureApplication() {
    let appId = cert?.application?.id;
    if (!appId) {
      const app = await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert.clientId,
          certType: cert.type,
          currentStep: 1,
        })
      });
      appId = app.id;
      setCert((prev: any) => ({ ...prev, application: app }));
    }
    return appId;
  }

  const completedRefs = contracts.filter(c =>
    c.cparsUploaded || c.ppqStatus === "COMPLETED"
  ).length;

  const sentRefs = contracts.filter(c =>
    c.ppqStatus === "SENT" || c.ppqStatus === "OPENED" || c.ppqStatus === "PENDING"
  ).length;

  async function addNewContract() {
    if (!cert) return;
    if (!newContract.agencyName.trim()) { setError("Agency name is required."); return; }
    if (!newContract.sowDescription.trim()) { setError("Scope of work is required."); return; }
    setError(null);
    setSaving(true);
    try {
      const appId = await ensureApplication();
      const result = await apiRequest(`/api/applications/${appId}/past-performance`, {
        method: "POST",
        body: JSON.stringify({
          agencyName: newContract.agencyName,
          contractNumber: newContract.contractNumber,
          contractType: newContract.contractType,
          contractValue: newContract.contractValue,
          periodStart: newContract.periodStart,
          periodEnd: newContract.periodEnd,
          description: newContract.sowDescription,
          hasCPARS: newContract.hasCPARS,
          cparsUploaded: false,
          referenceFirstName: newContract.referenceFirstName,
          referenceLastName: newContract.referenceLastName,
          referenceEmail: newContract.referenceEmail,
          referencePhone: newContract.referencePhone,
          referenceTitle: newContract.referenceTitle,
          narrative: newContract.narrative,
        })
      });
      setContracts(prev => [...prev, { ...newContract, id: result.id }]);
      setNewContract({ ...EMPTY_CONTRACT });
      setAddingContract(false);
      setExpandedContract(contracts.length);
    } catch (err: any) {
      console.error(err);
      setError("Failed to save contract: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function saveContract(contract: typeof EMPTY_CONTRACT, index: number) {
    setSaving(true);
    setError(null);
    try {
      const appId = await ensureApplication();
      const payload = {
        agencyName: contract.agencyName,
        contractNumber: contract.contractNumber,
        contractType: contract.contractType,
        contractValue: contract.contractValue,
        periodStart: contract.periodStart,
        periodEnd: contract.periodEnd,
        description: contract.sowDescription,
        hasCPARS: contract.hasCPARS,
        cparsUploaded: contract.cparsUploaded,
        referenceFirstName: contract.referenceFirstName,
        referenceLastName: contract.referenceLastName,
        referenceEmail: contract.referenceEmail,
        referencePhone: contract.referencePhone,
        referenceTitle: contract.referenceTitle,
        narrative: contract.narrative,
      };

      let result;
      if (contract.id) {
        result = await apiRequest(`/api/applications/${appId}/past-performance/${contract.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        result = await apiRequest(`/api/applications/${appId}/past-performance`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const updated = [...contracts];
        updated[index] = { ...contract, id: result.id };
        setContracts(updated);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteContract(index: number) {
    const contract = contracts[index];
    try {
      if (contract.id && cert?.application?.id) {
        await apiRequest(`/api/applications/${cert.application.id}/past-performance/${contract.id}`, {
          method: "DELETE"
        });
      }
      setContracts(prev => prev.filter((_, i) => i !== index));
      if (expandedContract === index) setExpandedContract(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function sendPPQ(index: number) {
    const contract = contracts[index];
    if (!contract.referenceEmail || !contract.id) return;
    setSendingPPQ(contract.id);
    try {
      await apiRequest(`/api/ppq`, {
        method: "POST",
        body: JSON.stringify({
          pastPerformanceId: contract.id,
          referenceEmail: contract.referenceEmail,
          referenceFirstName: contract.referenceFirstName,
          referenceLastName: contract.referenceLastName,
          referenceTitle: contract.referenceTitle,
          contractorName: cert?.client?.businessName,
          agencyName: contract.agencyName,
          contractNumber: contract.contractNumber,
          periodStart: contract.periodStart,
          periodEnd: contract.periodEnd,
        })
      });
      const updated = [...contracts];
      updated[index] = { ...contract, ppqStatus: "SENT" };
      setContracts(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingPPQ(null);
    }
  }

  async function generateNarrative(index: number) {
    const contract = contracts[index];
    const key = contract.id || String(index);
    setGeneratingNarrative(key);
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: "Relevant Project Experience",
          prompt: `Write a GSA MAS Relevant Project Experience narrative for this contract. Describe the SIN-relevant work performed, results achieved, methodology used, compliance with applicable regulations, and how this work aligns with the proposed GSA Schedule offering. Be specific and professional.`,
          context: {
            businessName: cert?.client?.businessName,
            entityType: cert?.client?.entityType,
            naicsCode: cert?.application?.naicsCode,
            otherSections: `Agency: ${contract.agencyName}
Contract Number: ${contract.contractNumber}
Contract Value: ${contract.contractValue}
Period: ${contract.periodStart} to ${contract.periodEnd}
Contract Type: ${contract.contractType}
Scope of Work: ${contract.sowDescription}`,
          }
        })
      });
      const updated = [...contracts];
      updated[index] = { ...contract, narrative: data.text };
      setContracts(updated);
      if (updated[index].id) await saveContract(updated[index], index);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingNarrative(null);
    }
  }

  async function handleCPARSUpload(file: File, index: number) {
    setUploadingCPARS(String(index));
    try {
      const updated = [...contracts];
      updated[index] = { ...contracts[index], cparsUploaded: true };
      setContracts(updated);
      if (updated[index].id) await saveContract(updated[index], index);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingCPARS(null);
    }
  }

  function updateContract(index: number, field: string, value: any) {
    const updated = [...contracts];
    updated[index] = { ...updated[index], [field]: value };
    setContracts(updated);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
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
        <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>References</div>

          <div style={{ margin: "8px 9px 16px", padding: "12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>Complete</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: completedRefs >= 3 ? "var(--green)" : "var(--gold2)" }}>
                {completedRefs}<span style={{ fontSize: 13 }}>/3</span>
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, completedRefs / 3 * 100)}%`, background: completedRefs >= 3 ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
            </div>
            {sentRefs > 0 && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 6 }}>
                {sentRefs} PPQ{sentRefs !== 1 ? "s" : ""} awaiting response
              </div>
            )}
          </div>

          {contracts.map((c, i) => (
            <div key={i} onClick={() => setExpandedContract(expandedContract === i ? null : i)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, cursor: "pointer", background: expandedContract === i ? "rgba(200,155,60,.1)" : "transparent" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: c.cparsUploaded || c.ppqStatus === "COMPLETED" ? "var(--green)" : c.ppqStatus === "SENT" || c.ppqStatus === "OPENED" ? "#1A3F7A" : "rgba(255,255,255,.1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff" }}>
                {(c.cparsUploaded || c.ppqStatus === "COMPLETED") ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                {c.agencyName || "Unnamed contract"}
              </span>
            </div>
          ))}

          {contracts.length < 5 && (
            <button onClick={() => setAddingContract(true)}
              style={{ width: "100%", padding: "8px 9px", background: "rgba(200,155,60,.1)", border: "1px dashed rgba(200,155,60,.3)", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, cursor: "pointer", textAlign: "left" as const, marginTop: 4 }}>
              + Add Contract
            </button>
          )}
        </div>
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
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application Dashboard
          </a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 3 of 6</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Past Performance</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Add your past contracts and collect the 3 references GSA requires.</p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* GSA Requirements */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "22px 28px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 12 }}>GSA Requirements</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 16 }}>
              {[
                { icon: "📋", title: "3 references required", body: "GSA requires at least 3 past performance references. These can be a mix of CPARS reports and completed PPQs — you don't need all 3 to be the same type." },
                { icon: "📅", title: "Recency matters", body: "Each reference must be for work completed within the last 3 years, or an ongoing project with the first year completed. Work older than 3 years will not be accepted." },
                { icon: "🎯", title: "Relevance to your SINs", body: "Each reference should demonstrate experience similar in scope and complexity to the services you're proposing under your selected SINs. Stronger alignment = stronger application." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 14, display: "flex", gap: 24 }}>
              {[
                { icon: "⭐", text: "CPARS report: If you've done federal government work and have a CPARS report, upload it — this is the strongest form of past performance." },
                { icon: "📝", text: "PPQ: If you don't have a CPARS report, GovCert generates a GSA Past Performance Questionnaire and emails it to your reference for completion." },
                { icon: "✦", text: "Narrative: For each contract, GovCert drafts a Relevant Project Experience narrative using your contract details — you review and edit before submission." },
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{tip.icon}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>{tip.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reference Progress */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: completedRefs >= 3 ? "var(--green)" : "var(--navy)", fontWeight: 400 }}>{completedRefs}</span>
                <span style={{ fontSize: 16, color: "var(--ink3)" }}> / 3 references complete</span>
                {sentRefs > 0 && <span style={{ fontSize: 13, color: "var(--ink4)", marginLeft: 12 }}>· {sentRefs} PPQ{sentRefs !== 1 ? "s" : ""} awaiting response</span>}
              </div>
              {completedRefs >= 3 && (
                <span style={{ padding: "6px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: 100, fontSize: 13, fontWeight: 500, color: "var(--green)" }}>
                  ✓ Requirement Met
                </span>
              )}
            </div>
            <div style={{ height: 8, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, completedRefs / 3 * 100)}%`, background: completedRefs >= 3 ? "var(--green)" : "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink3)" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: i < completedRefs ? "var(--green)" : i < completedRefs + sentRefs ? "#1A3F7A" : "var(--cream2)", border: `2px solid ${i < completedRefs ? "var(--green)" : i < completedRefs + sentRefs ? "#1A3F7A" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
                    {i < completedRefs ? "✓" : i < completedRefs + sentRefs ? "→" : ""}
                  </div>
                  Reference {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Add Contract Form */}
          {addingContract && (
            <div style={{ background: "#fff", border: "2px solid var(--gold)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400 }}>Add Past Contract</h3>
                <button onClick={() => { setAddingContract(false); setError(null); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ink3)" }}>✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {[
                  { label: "Agency / Client Name *", field: "agencyName", placeholder: "e.g. U.S. Department of Defense" },
                  { label: "Contract Number", field: "contractNumber", placeholder: "e.g. W912DR-22-C-0001" },
                  { label: "Contract Value", field: "contractValue", placeholder: "e.g. $450,000" },
                  { label: "Contract Type", field: "contractType", type: "select" },
                  { label: "Period Start", field: "periodStart", type: "date" },
                  { label: "Period End", field: "periodEnd", type: "date" },
                ].map(f => (
                  <div key={f.field}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>{f.label}</label>
                    {f.type === "select" ? (
                      <select value={newContract.contractType} onChange={e => setNewContract(prev => ({ ...prev, contractType: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", background: "#fff", outline: "none", boxSizing: "border-box" as const }}>
                        {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    ) : (
                      <input type={f.type || "text"} value={(newContract as any)[f.field]}
                        onChange={e => setNewContract(prev => ({ ...prev, [f.field]: e.target.value }))}
                        placeholder={(f as any).placeholder || ""}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }} />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Scope of Work Description *</label>
                <textarea value={newContract.sowDescription}
                  onChange={e => setNewContract(prev => ({ ...prev, sowDescription: e.target.value }))}
                  placeholder="Describe the work performed — what services you provided, key deliverables, and outcomes achieved. This is used to draft your Project Experience narrative."
                  style={{ width: "100%", minHeight: 100, padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
              </div>

              {/* CPARS question */}
              <div style={{ marginBottom: 20, padding: "16px 18px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Do you have a CPARS report for this contract?</div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 12, lineHeight: 1.5 }}>
                  CPARS reports are issued by federal agencies for government contracts. If you have one, it is the strongest form of past performance.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[{ val: true, label: "Yes, I have a CPARS report" }, { val: false, label: "No, I need to send a PPQ" }].map(opt => (
                    <button key={String(opt.val)}
                      onClick={() => setNewContract(prev => ({ ...prev, hasCPARS: opt.val }))}
                      style={{ flex: 1, padding: "10px", border: `1.5px solid ${newContract.hasCPARS === opt.val ? "var(--gold)" : "var(--border2)"}`, borderRadius: "var(--r)", background: newContract.hasCPARS === opt.val ? "rgba(200,155,60,.08)" : "#fff", color: newContract.hasCPARS === opt.val ? "var(--gold)" : "var(--ink3)", fontSize: 13, fontWeight: newContract.hasCPARS === opt.val ? 500 : 400, cursor: "pointer" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Contact */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>
                  Reference Contact {newContract.hasCPARS === false ? "(for PPQ)" : ""}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 12, lineHeight: 1.5 }}>
                  {newContract.hasCPARS === false
                    ? "GovCert will email this person a PPQ form to complete online. Make sure to let them know it is coming."
                    : "Provide the contact information for the person who can verify this contract."}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "First Name", field: "referenceFirstName", placeholder: "Jane" },
                    { label: "Last Name", field: "referenceLastName", placeholder: "Smith" },
                    { label: "Email Address *", field: "referenceEmail", placeholder: "jane.smith@agency.gov" },
                    { label: "Phone Number", field: "referencePhone", placeholder: "(202) 555-0100" },
                    { label: "Title / Role", field: "referenceTitle", placeholder: "Contracting Officer" },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ display: "block", fontSize: 11.5, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>{f.label}</label>
                      <input type="text" value={(newContract as any)[f.field]}
                        onChange={e => setNewContract(prev => ({ ...prev, [f.field]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => { setAddingContract(false); setError(null); }}
                  style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={addNewContract} disabled={saving || !newContract.agencyName.trim() || !newContract.sowDescription.trim()}
                  style={{ padding: "10px 28px", background: !newContract.agencyName.trim() || !newContract.sowDescription.trim() ? "var(--cream2)" : "var(--gold)", border: "none", borderRadius: "var(--r)", color: !newContract.agencyName.trim() || !newContract.sowDescription.trim() ? "var(--ink4)" : "#fff", fontSize: 13, fontWeight: 500, cursor: saving || !newContract.agencyName.trim() || !newContract.sowDescription.trim() ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                  {saving ? "Saving..." : "Add Contract →"}
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {contracts.length === 0 && !addingContract && (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "60px 40px", textAlign: "center", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>No contracts added yet</h3>
              <p style={{ fontSize: 13.5, color: "var(--ink3)", maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.6 }}>
                Add your past contracts to get started. You need at least 3 references — a mix of CPARS reports and PPQs is fine.
              </p>
              <button onClick={() => setAddingContract(true)}
                style={{ padding: "12px 32px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                + Add First Contract
              </button>
            </div>
          )}

          {/* Contract Cards */}
          {contracts.map((contract, index) => {
            const isExpanded = expandedContract === index;
            const statusStyle = PPQ_STATUS_STYLES[contract.ppqStatus];
            const isComplete = contract.cparsUploaded || contract.ppqStatus === "COMPLETED";

            return (
              <div key={contract.id || index} style={{ background: "#fff", border: `1px solid ${isComplete ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", marginBottom: 12, boxShadow: "var(--shadow)", overflow: "hidden" }}>

                {/* Header */}
                <div onClick={() => setExpandedContract(isExpanded ? null : index)}
                  style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: "#fff", transition: "background .12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isComplete ? "var(--green)" : "var(--cream2)", border: `2px solid ${isComplete ? "var(--green)" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, color: isComplete ? "#fff" : "var(--ink3)", fontWeight: 600 }}>
                    {isComplete ? "✓" : index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{contract.agencyName || "Unnamed Contract"}</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)", display: "flex", gap: 12 }}>
                      {contract.contractNumber && <span>#{contract.contractNumber}</span>}
                      {contract.contractValue && <span>{contract.contractValue}</span>}
                      {contract.periodStart && <span>{contract.periodStart} – {contract.periodEnd || "Present"}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    {contract.hasCPARS === true && (
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: contract.cparsUploaded ? "var(--green-bg)" : "var(--cream2)", color: contract.cparsUploaded ? "var(--green)" : "var(--ink3)" }}>
                        {contract.cparsUploaded ? "✓ CPARS" : "CPARS Pending"}
                      </span>
                    )}
                    {contract.hasCPARS === false && (
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: statusStyle.bg, color: statusStyle.color }}>
                        PPQ: {statusStyle.label}
                      </span>
                    )}
                    {contract.hasCPARS === null && (
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: "var(--amber-bg)", color: "var(--amber)" }}>
                        Action needed
                      </span>
                    )}
                    {contract.narrative && (
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: "var(--green-bg)", color: "var(--green)" }}>
                        ✓ Narrative
                      </span>
                    )}
                    <span style={{ fontSize: 16, color: "var(--gold)" }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "24px" }}>

                    {/* Edit fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                      {[
                        { label: "Agency / Client Name", field: "agencyName" },
                        { label: "Contract Number", field: "contractNumber" },
                        { label: "Contract Value", field: "contractValue" },
                        { label: "Contract Type", field: "contractType", type: "select" },
                        { label: "Period Start", field: "periodStart", type: "date" },
                        { label: "Period End", field: "periodEnd", type: "date" },
                      ].map(f => (
                        <div key={f.field}>
                          <label style={{ display: "block", fontSize: 11.5, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>{f.label}</label>
                          {f.type === "select" ? (
                            <select value={contract.contractType} onChange={e => updateContract(index, "contractType", e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", background: "#fff" }}>
                              {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                          ) : (
                            <input type={f.type || "text"} value={(contract as any)[f.field]}
                              onChange={e => updateContract(index, f.field, e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }} />
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontSize: 11.5, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>Scope of Work</label>
                      <textarea value={contract.sowDescription} onChange={e => updateContract(index, "sowDescription", e.target.value)}
                        style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
                    </div>

                    {/* CPARS or PPQ */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <div style={{ padding: "16px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                        {contract.hasCPARS === null && (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 10 }}>Do you have a CPARS report?</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {[{ val: true, label: "Yes — upload CPARS" }, { val: false, label: "No — send PPQ" }].map(opt => (
                                <button key={String(opt.val)} onClick={() => updateContract(index, "hasCPARS", opt.val)}
                                  style={{ padding: "9px 14px", border: "1.5px solid var(--border2)", borderRadius: "var(--r)", background: "#fff", color: "var(--ink)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {contract.hasCPARS === true && (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 8 }}>CPARS Report</div>
                            {contract.cparsUploaded ? (
                              <div style={{ padding: "10px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 12, color: "var(--green)", fontWeight: 500 }}>
                                ✓ CPARS report uploaded
                              </div>
                            ) : (
                              <div>
                                <input type="file" accept=".pdf" style={{ display: "none" }} ref={fileInputRef}
                                  onChange={e => { if (e.target.files?.[0]) handleCPARSUpload(e.target.files[0], index); }} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingCPARS === String(index)}
                                  style={{ width: "100%", padding: "10px", border: "2px dashed var(--border2)", borderRadius: "var(--r)", background: "#fff", color: "var(--ink3)", fontSize: 13, cursor: "pointer" }}>
                                  {uploadingCPARS === String(index) ? "Uploading..." : "📄 Upload CPARS PDF"}
                                </button>
                              </div>
                            )}
                            <button onClick={() => updateContract(index, "hasCPARS", null)}
                              style={{ marginTop: 8, background: "none", border: "none", fontSize: 11, color: "var(--ink4)", cursor: "pointer", textDecoration: "underline" }}>
                              Switch to PPQ instead
                            </button>
                          </div>
                        )}
                        {contract.hasCPARS === false && (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>PPQ Status</div>
                            <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 100, background: statusStyle.bg, color: statusStyle.color, fontSize: 12, fontWeight: 500, marginBottom: 10 }}>
                              {statusStyle.label}
                            </div>
                            {(contract.ppqStatus === "NOT_SENT" || contract.ppqStatus === "PENDING") && (
                              <div>
                                <div style={{ fontSize: 11.5, color: "var(--ink3)", marginBottom: 10, lineHeight: 1.5 }}>
                                  GovCert will email a GSA-standard PPQ form to your reference. They complete it online — no PDF required.
                                </div>
                                <button onClick={() => sendPPQ(index)}
                                  disabled={!contract.referenceEmail || sendingPPQ === contract.id}
                                  style={{ width: "100%", padding: "10px", background: contract.referenceEmail ? "var(--navy)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: contract.referenceEmail ? "var(--gold2)" : "var(--ink4)", fontSize: 13, fontWeight: 500, cursor: contract.referenceEmail ? "pointer" : "not-allowed" }}>
                                  {sendingPPQ === contract.id ? "Sending..." : "📧 Send PPQ to Reference"}
                                </button>
                                {!contract.referenceEmail && (
                                  <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6 }}>Add reference email to send PPQ</div>
                                )}
                              </div>
                            )}
                            {contract.ppqStatus !== "NOT_SENT" && contract.ppqStatus !== "PENDING" && (
                              <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
                                {contract.ppqStatus === "COMPLETED" ? "✓ Your reference has completed the PPQ." : "Waiting for your reference to complete the PPQ."}
                              </div>
                            )}
                            <button onClick={() => updateContract(index, "hasCPARS", null)}
                              style={{ marginTop: 8, background: "none", border: "none", fontSize: 11, color: "var(--ink4)", cursor: "pointer", textDecoration: "underline" }}>
                              Switch to CPARS instead
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reference info */}
                      <div style={{ padding: "16px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 10 }}>Reference Contact</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {[
                            { label: "First Name", field: "referenceFirstName" },
                            { label: "Last Name", field: "referenceLastName" },
                            { label: "Email", field: "referenceEmail" },
                            { label: "Phone", field: "referencePhone" },
                            { label: "Title", field: "referenceTitle" },
                          ].map(f => (
                            <div key={f.field}>
                              <label style={{ display: "block", fontSize: 11, color: "var(--ink4)", marginBottom: 3 }}>{f.label}</label>
                              <input type="text" value={(contract as any)[f.field]}
                                onChange={e => updateContract(index, f.field, e.target.value)}
                                style={{ width: "100%", padding: "7px 9px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12.5, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif", background: "#fff" }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Project Experience Narrative */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>Relevant Project Experience Narrative</div>
                          <div style={{ fontSize: 12, color: "var(--ink3)" }}>Required for each SIN — describes work performed, methodology, and results.</div>
                        </div>
                        <button onClick={() => generateNarrative(index)}
                          disabled={generatingNarrative === (contract.id || String(index))}
                          style={{ padding: "8px 18px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: "pointer", flexShrink: 0, marginLeft: 16 }}>
                          {generatingNarrative === (contract.id || String(index)) ? "Drafting..." : "✦ Draft with AI"}
                        </button>
                      </div>
                      <textarea value={contract.narrative}
                        onChange={e => updateContract(index, "narrative", e.target.value)}
                        placeholder="Describe the work performed, results achieved, methodology, and how this project relates to your proposed GSA Schedule offering..."
                        style={{ width: "100%", minHeight: 140, padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--ink4)", fontFamily: "monospace" }}>{contract.narrative.length.toLocaleString()} chars</span>
                      </div>
                    </div>

                    {/* Save / Delete */}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                      <button onClick={() => deleteContract(index)}
                        style={{ padding: "8px 16px", background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", color: "var(--red)", fontSize: 13, cursor: "pointer" }}>
                        Delete Contract
                      </button>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                        <button onClick={() => saveContract(contract, index)} disabled={saving}
                          style={{ padding: "9px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                          {saving ? "Saving..." : "Save Contract"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add another */}
          {contracts.length > 0 && contracts.length < 5 && !addingContract && (
            <button onClick={() => setAddingContract(true)}
              style={{ width: "100%", padding: "14px", background: "#fff", border: "2px dashed var(--border2)", borderRadius: "var(--rl)", color: "var(--ink3)", fontSize: 14, cursor: "pointer", marginTop: 4, transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--ink3)"; }}>
              + Add Another Contract
            </button>
          )}

          {/* Bottom nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 32 }}>
            <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>← Back to Dashboard</a>
            <a href={`/certifications/${certId}`}
              style={{ padding: "12px 28px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
              Save & Continue →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
