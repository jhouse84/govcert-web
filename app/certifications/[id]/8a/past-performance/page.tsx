"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import CertSidebar from "@/components/CertSidebar";
import { SecurityBanner } from "@/components/SecurityBadge";

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
  referenceFirstName: "",
  referenceLastName: "",
  referenceEmail: "",
  referencePhone: "",
  referenceTitle: "",
  narrative: "",
  performanceType: "CORPORATE" as string,
  personnelName: "",
  personnelRole: "",
  ppqStatus: "NOT_SENT" as PPQStatus,
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

  // PPQ Flow Modal
  const [ppqModal, setPpqModal] = useState<{
    open: boolean; step: 1 | 2 | 3; contractIndex: number | null;
    referenceName: string; referenceEmail: string; referenceTitle: string;
    referenceAgency: string; relationship: string;
    emailSubject: string; emailBody: string;
    drafting: boolean; sending: boolean;
  }>({
    open: false, step: 1, contractIndex: null,
    referenceName: "", referenceEmail: "", referenceTitle: "",
    referenceAgency: "", relationship: "",
    emailSubject: "", emailBody: "",
    drafting: false, sending: false,
  });

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
          performanceType: pp.performanceType || "CORPORATE",
          personnelName: pp.personnelName || "",
          personnelRole: pp.personnelRole || "",
          ppqStatus: (pp.ppqs?.[0]?.status || "NOT_SENT") as PPQStatus,
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
          performanceType: newContract.performanceType,
          personnelName: newContract.personnelName,
          personnelRole: newContract.personnelRole,
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
        performanceType: contract.performanceType,
        personnelName: contract.personnelName,
        personnelRole: contract.personnelRole,
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

  function openPPQModal(index: number) {
    const contract = contracts[index];
    setPpqModal({
      open: true, step: 1, contractIndex: index,
      referenceName: `${contract.referenceFirstName} ${contract.referenceLastName}`.trim(),
      referenceEmail: contract.referenceEmail,
      referenceTitle: contract.referenceTitle,
      referenceAgency: contract.agencyName,
      relationship: "",
      emailSubject: "", emailBody: "",
      drafting: false, sending: false,
    });
  }

  async function draftPPQEmail() {
    if (ppqModal.contractIndex === null) return;
    const contract = contracts[ppqModal.contractIndex];
    setPpqModal(prev => ({ ...prev, drafting: true }));
    try {
      const data = await apiRequest("/api/ppq/draft-email", {
        method: "POST",
        body: JSON.stringify({
          pastPerformanceId: contract.id,
          referenceEmail: ppqModal.referenceEmail,
          referenceName: ppqModal.referenceName,
          referenceTitle: ppqModal.referenceTitle,
          referenceAgency: ppqModal.referenceAgency,
          relationship: ppqModal.relationship,
          contractDetails: contract.sowDescription,
          certType: "EIGHT_A",
          businessName: cert?.client?.businessName || "",
          senderName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          personnelName: contract.performanceType === "KEY_PERSONNEL" ? contract.personnelName : undefined,
          personnelRole: contract.performanceType === "KEY_PERSONNEL" ? contract.personnelRole : undefined,
        })
      });
      setPpqModal(prev => ({ ...prev, step: 2, drafting: false, emailSubject: data.subject || "", emailBody: data.body || "" }));
    } catch (err) {
      console.error(err);
      setError("Failed to draft email.");
      setPpqModal(prev => ({ ...prev, drafting: false }));
    }
  }

  async function sendPPQWithCustomEmail() {
    if (ppqModal.contractIndex === null) return;
    const contract = contracts[ppqModal.contractIndex];
    setPpqModal(prev => ({ ...prev, sending: true }));
    try {
      await apiRequest("/api/ppq", {
        method: "POST",
        body: JSON.stringify({
          pastPerformanceId: contract.id,
          referenceEmail: ppqModal.referenceEmail,
          referenceName: ppqModal.referenceName,
          referenceTitle: ppqModal.referenceTitle,
          referenceAgency: ppqModal.referenceAgency,
          customEmailBody: ppqModal.emailBody,
          customEmailSubject: ppqModal.emailSubject,
          senderName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        })
      });
      const updated = [...contracts];
      updated[ppqModal.contractIndex] = { ...contract, ppqStatus: "SENT" as PPQStatus };
      setContracts(updated);
      setPpqModal(prev => ({ ...prev, step: 3, sending: false }));
    } catch (err) {
      console.error(err);
      setError("Failed to send PPQ.");
      setPpqModal(prev => ({ ...prev, sending: false }));
    }
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

          <SecurityBanner
            message="Contract details and reference contact information are encrypted and access-controlled."
            badges={["encryption", "audit-logged"]}
          />

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
                  {/* PPQ Section */}
                  {contract.id && contract.referenceEmail && (
                    <div style={{ marginTop: 16, padding: "14px 18px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>PPQ Status</span>
                          <span style={{
                            padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                            background: PPQ_STATUS_STYLES[contract.ppqStatus]?.bg || "var(--cream2)",
                            color: PPQ_STATUS_STYLES[contract.ppqStatus]?.color || "var(--ink3)",
                          }}>
                            {PPQ_STATUS_STYLES[contract.ppqStatus]?.label || contract.ppqStatus}
                          </span>
                        </div>
                        {(contract.ppqStatus === "NOT_SENT" || contract.ppqStatus === "DECLINED") && (
                          <button onClick={() => openPPQModal(i)}
                            style={{ padding: "7px 18px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "var(--gold2)", cursor: "pointer" }}>
                            Send PPQ Request
                          </button>
                        )}
                      </div>
                    </div>
                  )}

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
              <button onClick={async () => {
                setSaving(true);
                try {
                  for (let i = 0; i < contracts.length; i++) {
                    await saveContract(contracts[i], i);
                  }
                  setSaved(true);
                  setTimeout(() => router.push(`/certifications/${certId}/8a/financials`), 500);
                } catch (err: any) {
                  setError("Failed to save: " + err.message);
                } finally {
                  setSaving(false);
                }
              }} disabled={saving}
                style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {saving ? "Saving..." : "Save & Next \u2192"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PPQ Flow Modal */}
      {ppqModal.open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => !ppqModal.drafting && !ppqModal.sending && setPpqModal(prev => ({ ...prev, open: false }))}
            style={{ position: "absolute", inset: 0, background: "rgba(11,25,41,.7)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", width: ppqModal.step === 2 ? 680 : 520, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,.25)", padding: ppqModal.step === 3 ? "48px 40px" : "32px 36px" }}>
            {ppqModal.step !== 3 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {[1, 2].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 100, background: s <= ppqModal.step ? "var(--gold)" : "var(--cream2)" }} />)}
              </div>
            )}
            <button onClick={() => !ppqModal.drafting && !ppqModal.sending && setPpqModal(prev => ({ ...prev, open: false }))}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ink4)", padding: 4 }}>
              &#x2715;
            </button>

            {ppqModal.step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Send PPQ Request</h2>
                <p style={{ fontSize: 13.5, color: "var(--ink3)", marginBottom: 24, lineHeight: 1.5 }}>Provide reference details and context. GovCert will draft a personalized email for you to review.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  {[
                    { label: "Reference Name *", key: "referenceName", placeholder: "Jane Smith" },
                    { label: "Reference Email *", key: "referenceEmail", placeholder: "jane@agency.gov", type: "email" },
                    { label: "Title / Role", key: "referenceTitle", placeholder: "Program Manager" },
                    { label: "Organization / Agency", key: "referenceAgency", placeholder: "Department of Navy" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "var(--ink3)", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>{f.label}</label>
                      <input type={f.type || "text"} value={(ppqModal as any)[f.key]}
                        onChange={e => setPpqModal(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "var(--ink3)", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>How do you know this person?</label>
                  <textarea value={ppqModal.relationship}
                    onChange={e => setPpqModal(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="Describe your working relationship and the reference's role on the project..."
                    style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setPpqModal(prev => ({ ...prev, open: false }))}
                    style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>Cancel</button>
                  <button onClick={draftPPQEmail}
                    disabled={!ppqModal.referenceName.trim() || !ppqModal.referenceEmail.trim() || ppqModal.drafting}
                    style={{ padding: "10px 28px", background: ppqModal.referenceName.trim() && ppqModal.referenceEmail.trim() ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: ppqModal.referenceName.trim() && ppqModal.referenceEmail.trim() ? "#fff" : "var(--ink4)", fontSize: 13, fontWeight: 500, cursor: !ppqModal.referenceName.trim() || !ppqModal.referenceEmail.trim() || ppqModal.drafting ? "not-allowed" : "pointer" }}>
                    {ppqModal.drafting ? "Drafting Email..." : "Draft Email with AI \u2192"}
                  </button>
                </div>
              </div>
            )}

            {ppqModal.step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Review &amp; Send</h2>
                <p style={{ fontSize: 13.5, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.5 }}>Review the AI-drafted email below. Edit anything you&apos;d like, then send.</p>
                <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 8 }}><strong>To:</strong> {ppqModal.referenceEmail}</div>
                  <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 8 }}><strong>From:</strong> {user?.firstName} {user?.lastName} via GovCert</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <strong style={{ fontSize: 13, color: "var(--ink3)" }}>Subj:</strong>
                    <input type="text" value={ppqModal.emailSubject} onChange={e => setPpqModal(prev => ({ ...prev, emailSubject: e.target.value }))}
                      style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#fff" }} />
                  </div>
                </div>
                <textarea value={ppqModal.emailBody} onChange={e => setPpqModal(prev => ({ ...prev, emailBody: e.target.value }))}
                  style={{ width: "100%", minHeight: 220, padding: "14px 16px", border: "1px solid var(--border2)", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" as const, color: "var(--ink)", marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                  <button onClick={() => setPpqModal(prev => ({ ...prev, step: 1 }))}
                    style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>&larr; Back</button>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={draftPPQEmail} disabled={ppqModal.drafting}
                      style={{ padding: "10px 18px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      {ppqModal.drafting ? "Regenerating..." : "Regenerate"}
                    </button>
                    <button onClick={sendPPQWithCustomEmail} disabled={ppqModal.sending || !ppqModal.emailBody.trim()}
                      style={{ padding: "10px 28px", background: ppqModal.emailBody.trim() ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: ppqModal.emailBody.trim() ? "#fff" : "var(--ink4)", fontSize: 13, fontWeight: 500, cursor: ppqModal.sending || !ppqModal.emailBody.trim() ? "not-allowed" : "pointer" }}>
                      {ppqModal.sending ? "Sending..." : "Send PPQ Request \u2192"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {ppqModal.step === 3 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--green-bg)", border: "2px solid var(--green-b,#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28, color: "var(--green)" }}>&#10003;</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>PPQ Request Sent</h2>
                <p style={{ fontSize: 15, color: "var(--ink3)", marginBottom: 6, lineHeight: 1.6 }}>
                  PPQ request sent to <strong>{ppqModal.referenceName}</strong> at <strong>{ppqModal.referenceEmail}</strong>.
                </p>
                <p style={{ fontSize: 13, color: "var(--ink4)", marginBottom: 28 }}>You&apos;ll be notified when they respond.</p>
                <button onClick={() => setPpqModal(prev => ({ ...prev, open: false }))}
                  style={{ padding: "12px 36px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
