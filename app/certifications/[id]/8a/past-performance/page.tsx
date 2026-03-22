"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import CertSidebar from "@/components/CertSidebar";

const EIGHT_A_SECTIONS = [
  { id: "social-disadvantage", label: "Social Disadvantage" },
  { id: "economic-disadvantage", label: "Economic Disadvantage" },
  { id: "business-plan", label: "Business Plan" },
  { id: "corporate", label: "Corporate Experience" },
  { id: "past-performance", label: "Past Performance" },
  { id: "financials", label: "Financials" },
  { id: "submit", label: "Submit" },
];

const CONTRACT_TYPES = ["Federal Government", "State/Local Government", "Commercial", "Non-Profit"];

const EMPTY_CONTRACT = {
  agencyName: "",
  contractNumber: "",
  contractType: "Federal Government",
  contractValue: "",
  periodStart: "",
  periodEnd: "",
  sowDescription: "",
  referenceFirstName: "",
  referenceLastName: "",
  referenceEmail: "",
  referencePhone: "",
  referenceTitle: "",
  narrative: "",
  id: "",
};

export default function PastPerformance8aPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  const [contracts, setContracts] = useState<typeof EMPTY_CONTRACT[]>([]);
  const [expandedContract, setExpandedContract] = useState<number | null>(null);
  const [addingContract, setAddingContract] = useState(false);
  const [newContract, setNewContract] = useState({ ...EMPTY_CONTRACT });
  const [generatingNarrative, setGeneratingNarrative] = useState<string | null>(null);

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
      if (data.application?.pastPerformance8a?.length > 0) {
        setContracts(data.application.pastPerformance8a.map((pp: any) => ({
          ...EMPTY_CONTRACT,
          id: pp.id || "",
          agencyName: pp.agencyName || "",
          contractNumber: pp.contractNumber || "",
          contractType: pp.contractType || "Federal Government",
          contractValue: pp.contractValue || "",
          periodStart: pp.periodStart || "",
          periodEnd: pp.periodEnd || "",
          sowDescription: pp.description || pp.sowDescription || "",
          referenceFirstName: pp.referenceFirstName || "",
          referenceLastName: pp.referenceLastName || "",
          referenceEmail: pp.referenceEmail || "",
          referencePhone: pp.referencePhone || "",
          referenceTitle: pp.referenceTitle || "",
          narrative: pp.narrative || "",
        })));
      } else if (data.application?.pastPerformance?.length > 0) {
        // Copy from GSA MAS past performance if available
        setContracts(data.application.pastPerformance.map((pp: any) => ({
          ...EMPTY_CONTRACT,
          agencyName: pp.agencyName || "",
          contractNumber: pp.contractNumber || "",
          contractType: pp.contractType || "Federal Government",
          contractValue: pp.contractValue || "",
          periodStart: pp.periodStart || "",
          periodEnd: pp.periodEnd || "",
          sowDescription: pp.description || "",
          referenceFirstName: pp.referenceFirstName || "",
          referenceLastName: pp.referenceLastName || "",
          referenceEmail: pp.referenceEmail || "",
          referencePhone: pp.referencePhone || "",
          referenceTitle: pp.referenceTitle || "",
          narrative: pp.narrative || "",
        })));
      }
      const completed: Record<string, boolean> = {};
      const app = data.application;
      if (app) {
        if (app.socialDisadvantageNarrative?.trim()) completed["social-disadvantage"] = true;
        if (app.economicDisadvantageData) completed["economic-disadvantage"] = true;
        if (app.businessPlanData) completed["business-plan"] = true;
        if (app.narrativeCorp8a) completed["corporate"] = true;
        if (app.pastPerformance8a?.length > 0) completed["past-performance"] = true;
        if (app.financialData8a) completed["financials"] = true;
      }
      setCompletedSections(completed);
    } catch (err) { console.error(err); setError("Failed to load."); }
    finally { setLoading(false); }
  }

  async function ensureApplication() {
    let appId = cert?.application?.id;
    if (!appId) {
      const app = await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({ certificationId: certId, clientId: cert.clientId, certType: cert.type, currentStep: 1 }),
      });
      appId = app.id;
      setCert((prev: any) => ({ ...prev, application: app }));
    }
    return appId;
  }

  async function addNewContract() {
    if (!newContract.agencyName.trim()) { setError("Agency name is required."); return; }
    setSaving(true);
    setError(null);
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
          referenceFirstName: newContract.referenceFirstName,
          referenceLastName: newContract.referenceLastName,
          referenceEmail: newContract.referenceEmail,
          referencePhone: newContract.referencePhone,
          referenceTitle: newContract.referenceTitle,
          narrative: newContract.narrative,
          certType: "8a",
        }),
      });
      setContracts(prev => [...prev, { ...newContract, id: result.id }]);
      setNewContract({ ...EMPTY_CONTRACT });
      setAddingContract(false);
      setExpandedContract(contracts.length);
    } catch (err: any) { setError("Failed to save: " + err.message); }
    finally { setSaving(false); }
  }

  async function saveContract(contract: typeof EMPTY_CONTRACT, index: number) {
    setSaving(true);
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
        referenceFirstName: contract.referenceFirstName,
        referenceLastName: contract.referenceLastName,
        referenceEmail: contract.referenceEmail,
        referencePhone: contract.referencePhone,
        referenceTitle: contract.referenceTitle,
        narrative: contract.narrative,
        certType: "8a",
      };
      if (contract.id) {
        await apiRequest(`/api/applications/${appId}/past-performance/${contract.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        const result = await apiRequest(`/api/applications/${appId}/past-performance`, { method: "POST", body: JSON.stringify(payload) });
        const updated = [...contracts];
        updated[index] = { ...contract, id: result.id };
        setContracts(updated);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) { setError("Failed to save: " + err.message); }
    finally { setSaving(false); }
  }

  async function generateNarrative(index: number) {
    const contract = contracts[index];
    setGeneratingNarrative(contract.id || String(index));
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: "Past Performance Narrative",
          certType: "8a",
          prompt: `Write a past performance narrative for an 8(a) application. Describe the work performed, results achieved, and relevance to the applicant's core capabilities.`,
          context: {
            businessName: cert?.client?.businessName,
            otherSections: `Agency: ${contract.agencyName}\nContract: ${contract.contractNumber}\nValue: ${contract.contractValue}\nPeriod: ${contract.periodStart} to ${contract.periodEnd}\nType: ${contract.contractType}\nScope: ${contract.sowDescription}`,
          },
        }),
      });
      const updated = [...contracts];
      updated[index] = { ...contract, narrative: data.text };
      setContracts(updated);
      if (updated[index].id) await saveContract(updated[index], index);
    } catch { setError("Failed to generate narrative."); }
    finally { setGeneratingNarrative(null); }
  }

  function updateContract(index: number, field: string, value: any) {
    const updated = [...contracts];
    updated[index] = { ...updated[index], [field]: value };
    setContracts(updated);
  }

  async function deleteContract(index: number) {
    const contract = contracts[index];
    try {
      if (contract.id && cert?.application?.id) {
        await apiRequest(`/api/applications/${cert.application.id}/past-performance/${contract.id}`, { method: "DELETE" });
      }
      setContracts(prev => prev.filter((_, i) => i !== index));
      if (expandedContract === index) setExpandedContract(null);
    } catch (err) { console.error(err); }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const sidebarContent = (
    <div>
      <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>8(a) Sections</div>
      {EIGHT_A_SECTIONS.map((s, i) => {
        const isActive = s.id === "past-performance";
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

      {/* Contract list in sidebar */}
      <div style={{ marginTop: 12, padding: "0 9px" }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.2)", marginBottom: 6, fontWeight: 600 }}>Contracts</div>
        {contracts.map((c, i) => (
          <div key={i} onClick={() => setExpandedContract(expandedContract === i ? null : i)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 4px", borderRadius: "var(--r)", marginBottom: 2, cursor: "pointer", background: expandedContract === i ? "rgba(200,155,60,.1)" : "transparent" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: c.narrative?.trim() ? "var(--green)" : "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff", flexShrink: 0 }}>
              {c.narrative?.trim() ? "\u2713" : String(i + 1)}
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{c.agencyName || "Unnamed"}</span>
          </div>
        ))}
      </div>

      <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>&larr; Back to Dashboard</a>
    </div>
  );

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="certifications" sidebarContent={sidebarContent} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 5 of 7</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Past Performance</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Add your past contracts to demonstrate capability. At least 2-3 relevant contracts recommended for 8(a).
            </p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* Progress */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "var(--ink3)" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400 }}>{contracts.length}</span>
                {" "}contract{contracts.length !== 1 ? "s" : ""} added
              </span>
              <button onClick={() => setAddingContract(true)}
                style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                + Add Contract
              </button>
            </div>
          </div>

          {/* Add contract form */}
          {addingContract && (
            <div style={{ background: "#fff", border: "2px solid var(--gold)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>New Contract</h3>
                <button onClick={() => setAddingContract(false)} style={{ background: "none", border: "none", fontSize: 18, color: "var(--ink4)", cursor: "pointer" }}>&times;</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Agency / Client Name *</label>
                  <input value={newContract.agencyName} onChange={e => setNewContract(p => ({ ...p, agencyName: e.target.value }))} style={inputStyle} placeholder="e.g. Department of Defense" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Contract Number</label>
                  <input value={newContract.contractNumber} onChange={e => setNewContract(p => ({ ...p, contractNumber: e.target.value }))} style={inputStyle} placeholder="e.g. GS-00F-1234X" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Contract Type</label>
                  <select value={newContract.contractType} onChange={e => setNewContract(p => ({ ...p, contractType: e.target.value }))} style={{ ...inputStyle, background: "#fff" }}>
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Contract Value</label>
                  <input value={newContract.contractValue} onChange={e => setNewContract(p => ({ ...p, contractValue: e.target.value }))} style={inputStyle} placeholder="e.g. $500,000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Period Start</label>
                  <input type="date" value={newContract.periodStart} onChange={e => setNewContract(p => ({ ...p, periodStart: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Period End</label>
                  <input type="date" value={newContract.periodEnd} onChange={e => setNewContract(p => ({ ...p, periodEnd: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Scope of Work</label>
                <textarea value={newContract.sowDescription} onChange={e => setNewContract(p => ({ ...p, sowDescription: e.target.value }))} rows={4} style={{ ...inputStyle, resize: "vertical" as const }} placeholder="Describe the work performed..." />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>Reference Contact</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <input value={newContract.referenceFirstName} onChange={e => setNewContract(p => ({ ...p, referenceFirstName: e.target.value }))} style={inputStyle} placeholder="First Name" />
                <input value={newContract.referenceLastName} onChange={e => setNewContract(p => ({ ...p, referenceLastName: e.target.value }))} style={inputStyle} placeholder="Last Name" />
                <input value={newContract.referenceEmail} onChange={e => setNewContract(p => ({ ...p, referenceEmail: e.target.value }))} style={inputStyle} placeholder="Email" />
                <input value={newContract.referencePhone} onChange={e => setNewContract(p => ({ ...p, referencePhone: e.target.value }))} style={inputStyle} placeholder="Phone" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setAddingContract(false)} style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>Cancel</button>
                <button onClick={addNewContract} disabled={saving} style={{ padding: "10px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                  {saving ? "Saving..." : "Add Contract"}
                </button>
              </div>
            </div>
          )}

          {/* Existing contracts */}
          {contracts.map((contract, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${expandedContract === i ? "var(--gold)" : "var(--border)"}`, borderRadius: "var(--rl)", marginBottom: 12, boxShadow: "var(--shadow)", overflow: "hidden" }}>
              <div onClick={() => setExpandedContract(expandedContract === i ? null : i)}
                style={{ padding: "18px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: contract.narrative?.trim() ? "var(--green-bg)" : "var(--cream2)", border: `2px solid ${contract.narrative?.trim() ? "var(--green)" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: contract.narrative?.trim() ? "var(--green)" : "var(--ink4)", fontWeight: 700 }}>
                    {contract.narrative?.trim() ? "\u2713" : i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>{contract.agencyName || "Unnamed Contract"}</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>{contract.contractType} {contract.contractValue ? `\u00B7 ${contract.contractValue}` : ""}</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, color: "var(--ink4)", transform: expandedContract === i ? "rotate(180deg)" : "none", transition: "transform .2s" }}>{"\u25BC"}</span>
              </div>

              {expandedContract === i && (
                <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Agency Name</label>
                      <input value={contract.agencyName} onChange={e => updateContract(i, "agencyName", e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Contract Number</label>
                      <input value={contract.contractNumber} onChange={e => updateContract(i, "contractNumber", e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Value</label>
                      <input value={contract.contractValue} onChange={e => updateContract(i, "contractValue", e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Type</label>
                      <select value={contract.contractType} onChange={e => updateContract(i, "contractType", e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
                        {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 4, display: "block" }}>Scope of Work</label>
                    <textarea value={contract.sowDescription} onChange={e => updateContract(i, "sowDescription", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" as const }} />
                  </div>
                  {/* Narrative */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500 }}>Performance Narrative</label>
                      <button onClick={() => generateNarrative(i)} disabled={generatingNarrative === (contract.id || String(i))}
                        style={{ padding: "6px 14px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: generatingNarrative === (contract.id || String(i)) ? 0.7 : 1 }}>
                        {generatingNarrative === (contract.id || String(i)) ? "Drafting..." : "\u2728 Draft Narrative"}
                      </button>
                    </div>
                    <textarea value={contract.narrative} onChange={e => updateContract(i, "narrative", e.target.value)} rows={6} style={{ ...inputStyle, resize: "vertical" as const }} placeholder="Describe the work performed, results, and relevance..." />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                    <button onClick={() => deleteContract(i)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--red-b)", borderRadius: "var(--r)", fontSize: 12, color: "var(--red)", cursor: "pointer" }}>Delete</button>
                    <button onClick={() => saveContract(contract, i)} disabled={saving}
                      style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                      {saving ? "Saving..." : "Save Contract"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {contracts.length === 0 && !addingContract && (
            <div style={{ textAlign: "center" as const, padding: "40px", background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{"\uD83D\uDCCB"}</div>
              <p style={{ fontSize: 15, color: "var(--ink3)", marginBottom: 16 }}>No contracts added yet. Add your past performance to support your 8(a) application.</p>
              <button onClick={() => setAddingContract(true)} style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>+ Add Your First Contract</button>
            </div>
          )}

          {/* Save / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <a href={`/certifications/${certId}/8a/corporate`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Previous: Corporate Experience</a>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saved && <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>{"\u2713"} Saved</span>}
              <button onClick={() => router.push(`/certifications/${certId}/8a/financials`)}
                style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Next: Financials &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
