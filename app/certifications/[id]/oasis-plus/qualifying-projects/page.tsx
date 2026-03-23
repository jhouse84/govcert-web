"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_SECTIONS } from "@/lib/oasis-domains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

const CLEARANCE_LEVELS = ["None", "Confidential", "Secret", "Top Secret", "TS/SCI"];

interface QualifyingProject {
  id: string;
  contractNumber: string;
  agencyName: string;
  contractType: string;
  startDate: string;
  endDate: string;
  totalValue: string;
  naicsCodes: string;
  scopeNarrative: string;
  managementNarrative: string;
  personnelCount: string;
  clearanceLevel: string;
}

function createEmptyQP(): QualifyingProject {
  return {
    id: crypto.randomUUID(),
    contractNumber: "",
    agencyName: "",
    contractType: "",
    startDate: "",
    endDate: "",
    totalValue: "",
    naicsCodes: "",
    scopeNarrative: "",
    managementNarrative: "",
    personnelCount: "",
    clearanceLevel: "None",
  };
}

function calculateAAV(totalValue: string, startDate: string, endDate: string): { aav: number; years: number } | null {
  const val = parseFloat(totalValue.replace(/[^0-9.]/g, ""));
  if (!val || !startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const years = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  if (years <= 0) return null;
  return { aav: val / years, years };
}

export default function OASISQualifyingProjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<QualifyingProject[]>([createEmptyQP()]);
  const [expandedQP, setExpandedQP] = useState<string | null>(null);
  const [draftingQP, setDraftingQP] = useState<string | null>(null);
  const [solicitation, setSolicitation] = useState("unrestricted");
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQP, setUploadingQP] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-qualifying-projects");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      const app = data.application;
      if (app?.oasisSolicitation) setSolicitation(app.oasisSolicitation);
      if (app?.oasisQPData) {
        try {
          const parsed = JSON.parse(app.oasisQPData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProjects(parsed);
            setExpandedQP(parsed[0].id);
          }
        } catch { }
      }
      if (!expandedQP && projects.length > 0) setExpandedQP(projects[0].id);
      // Build completed sections
      const completed: Record<string, boolean> = {};
      if (app) {
        if (app.oasisDomains) completed["domains"] = true;
        if (app.oasisScorecardData) completed["scorecard"] = true;
        if (app.oasisQPData) completed["qualifying-projects"] = true;
        if (app.oasisPPData) completed["past-performance"] = true;
        if (app.oasisFEPData) completed["federal-experience"] = true;
        if (app.oasisSystemsData) completed["systems-certs"] = true;
      }
      setCompletedSections(completed);
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  function updateProject(projectId: string, field: keyof QualifyingProject, value: string) {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, [field]: value } : p));
    setSaved(false);
  }

  function addProject() {
    if (projects.length >= 5) return;
    const newQP = createEmptyQP();
    setProjects(prev => [...prev, newQP]);
    setExpandedQP(newQP.id);
  }

  function removeProject(projectId: string) {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (expandedQP === projectId) {
      setExpandedQP(projects.find(p => p.id !== projectId)?.id || null);
    }
  }

  async function aiDraftNarrative(projectId: string, section: "scope" | "management") {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    setDraftingQP(projectId);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: section === "scope" ? "OASIS+ QP Scope Narrative" : "OASIS+ QP Management & Staffing Narrative",
          context: JSON.stringify({
            contractNumber: project.contractNumber,
            agencyName: project.agencyName,
            contractType: project.contractType,
            totalValue: project.totalValue,
            naicsCodes: project.naicsCodes,
            personnelCount: project.personnelCount,
            startDate: project.startDate,
            endDate: project.endDate,
          }),
          clientId: cert?.clientId,
          certType: "OASIS_PLUS",
        }),
      });
      const field = section === "scope" ? "scopeNarrative" : "managementNarrative";
      updateProject(projectId, field, data.draft || data.narrative || "");
    } catch (err: any) {
      setError("AI draft failed: " + (err.message || "Please try again."));
    } finally {
      setDraftingQP(null);
    }
  }

  async function handleFileUpload(projectId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingQP(projectId);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("clientId", cert?.clientId || "");
        formData.append("category", "OASIS_QP_EVIDENCE");
        formData.append("description", `QP Evidence — ${projects.find(p => p.id === projectId)?.contractNumber || "Unknown"}`);
        const token = localStorage.getItem("token");
        await fetch(`${API}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
    } catch (err: any) {
      setError("Upload failed: " + (err.message || "Please try again."));
    } finally {
      setUploadingQP(null);
    }
  }

  async function save(andNavigate?: boolean) {
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert?.clientId,
          certType: "OASIS_PLUS",
          oasisQPData: JSON.stringify(projects),
        }),
      });
      setSaved(true);
      if (andNavigate) {
        router.push(`/certifications/${certId}/oasis-plus/past-performance`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const isSmallBusiness = solicitation !== "unrestricted";
  const aavThreshold = isSmallBusiness ? 500000 : 1000000;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="qualifying-projects" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {OASIS_SECTIONS.map(section => {
            const isActive = section.id === "qualifying-projects";
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
                  {isComplete ? "✓" : ""}
                </span>
                {section.label}
              </a>
            );
          })}
        </div>
      } />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application
          </a>

          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              GSA OASIS+ — Step 3 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Qualifying Projects
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 720 }}>
              Enter up to 5 Qualifying Projects (QPs) that demonstrate your company{"'"}s relevant experience. Each QP should be a completed or ongoing contract with an Average Annual Value (AAV) of at least <strong>${(aavThreshold / 1000000).toFixed(1)}M</strong> for your solicitation type.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}
          {saved && (
            <div style={{ padding: "12px 18px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "var(--green)" }}>Qualifying projects saved successfully.</div>
          )}

          {/* QP Summary Bar */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "20px 28px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 4 }}>Qualifying Projects</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>{projects.length} of 5 QPs entered</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: i <= projects.length ? "var(--gold)" : "rgba(255,255,255,.08)",
                  border: i <= projects.length ? "none" : "1px solid rgba(255,255,255,.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, color: i <= projects.length ? "#fff" : "rgba(255,255,255,.3)",
                }}>
                  {i}
                </div>
              ))}
            </div>
          </div>

          {/* QP Cards */}
          {projects.map((qp, idx) => {
            const isExpanded = expandedQP === qp.id;
            const aavCalc = calculateAAV(qp.totalValue, qp.startDate, qp.endDate);
            const aavBelow = aavCalc && aavCalc.aav < aavThreshold;

            return (
              <div key={qp.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", marginBottom: 16, overflow: "hidden", boxShadow: "var(--shadow)" }}>
                {/* Header — click to expand/collapse */}
                <div onClick={() => setExpandedQP(isExpanded ? null : qp.id)} style={{
                  padding: "18px 24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: isExpanded ? "var(--cream)" : "#fff", borderBottom: isExpanded ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>
                        {qp.contractNumber ? `QP ${idx + 1}: ${qp.contractNumber}` : `Qualifying Project ${idx + 1}`}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                        {qp.agencyName || "No agency entered"} {aavCalc ? ` — AAV: $${Math.round(aavCalc.aav).toLocaleString()}` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {aavBelow && (
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "rgba(231,76,60,.08)", color: "#e74c3c", fontWeight: 500 }}>
                        AAV Below Threshold
                      </span>
                    )}
                    {aavCalc && !aavBelow && (
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "var(--green-bg)", color: "var(--green)", fontWeight: 500 }}>
                        AAV Meets Threshold
                      </span>
                    )}
                    <span style={{ fontSize: 18, color: "var(--ink4)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: "24px" }}>
                    {/* Row 1: Contract info */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Contract Number *</label>
                        <input type="text" value={qp.contractNumber} onChange={e => updateProject(qp.id, "contractNumber", e.target.value)}
                          placeholder="e.g., GS-00F-1234X"
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Agency Name *</label>
                        <input type="text" value={qp.agencyName} onChange={e => updateProject(qp.id, "agencyName", e.target.value)}
                          placeholder="e.g., Department of Defense"
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Contract Type</label>
                        <select value={qp.contractType} onChange={e => updateProject(qp.id, "contractType", e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, background: "#fff", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}>
                          <option value="">Select type...</option>
                          <option value="FFP">Firm Fixed Price (FFP)</option>
                          <option value="T&M">Time & Materials (T&M)</option>
                          <option value="CPFF">Cost Plus Fixed Fee (CPFF)</option>
                          <option value="CPAF">Cost Plus Award Fee (CPAF)</option>
                          <option value="IDIQ">IDIQ Task Order</option>
                          <option value="BPA">BPA Call Order</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Dates and Value */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Start Date *</label>
                        <input type="date" value={qp.startDate} onChange={e => updateProject(qp.id, "startDate", e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>End Date *</label>
                        <input type="date" value={qp.endDate} onChange={e => updateProject(qp.id, "endDate", e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Total Contract Value *</label>
                        <input type="text" value={qp.totalValue} onChange={e => updateProject(qp.id, "totalValue", e.target.value)}
                          placeholder="e.g., 5000000"
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                    </div>

                    {/* AAV Indicator */}
                    {aavCalc && (
                      <div style={{
                        padding: "14px 18px", borderRadius: "var(--r)", marginBottom: 20,
                        background: aavBelow ? "rgba(231,76,60,.06)" : "var(--green-bg)",
                        border: `1px solid ${aavBelow ? "rgba(231,76,60,.15)" : "var(--green-b)"}`,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: aavBelow ? "#e74c3c" : "var(--green)" }}>
                            Average Annual Value (Auto-Calculated)
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 2 }}>
                            ${parseFloat(qp.totalValue.replace(/[^0-9.]/g, "")).toLocaleString()} / {aavCalc.years.toFixed(1)} years
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: aavBelow ? "#e74c3c" : "var(--green)", fontWeight: 500 }}>
                          ${Math.round(aavCalc.aav).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Row 3: NAICS, Personnel, Clearance */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>NAICS Code(s)</label>
                        <input type="text" value={qp.naicsCodes} onChange={e => updateProject(qp.id, "naicsCodes", e.target.value)}
                          placeholder="e.g., 541611, 541612"
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Personnel / LCAT Count</label>
                        <input type="text" value={qp.personnelCount} onChange={e => updateProject(qp.id, "personnelCount", e.target.value)}
                          placeholder="e.g., 15"
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Clearance Level</label>
                        <select value={qp.clearanceLevel} onChange={e => updateProject(qp.id, "clearanceLevel", e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, background: "#fff", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}>
                          {CLEARANCE_LEVELS.map(cl => <option key={cl} value={cl}>{cl}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Scope Narrative */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", textTransform: "uppercase", letterSpacing: ".06em" }}>Scope Narrative *</label>
                        <button onClick={() => aiDraftNarrative(qp.id, "scope")} disabled={draftingQP === qp.id} style={{
                          padding: "5px 14px", background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)",
                          borderRadius: "var(--r)", color: "#6366F1", fontSize: 11, fontWeight: 500, cursor: "pointer",
                        }}>
                          {draftingQP === qp.id ? "Drafting..." : "AI Draft Scope"}
                        </button>
                      </div>
                      <textarea value={qp.scopeNarrative} onChange={e => updateProject(qp.id, "scopeNarrative", e.target.value)}
                        placeholder="Describe the scope of work performed, services delivered, and outcomes achieved on this contract..."
                        rows={5}
                        style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", resize: "vertical", boxSizing: "border-box" }} />
                      <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 2 }}>{qp.scopeNarrative.length} characters</div>
                    </div>

                    {/* Management Narrative */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", textTransform: "uppercase", letterSpacing: ".06em" }}>Management & Staffing Narrative</label>
                        <button onClick={() => aiDraftNarrative(qp.id, "management")} disabled={draftingQP === qp.id} style={{
                          padding: "5px 14px", background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)",
                          borderRadius: "var(--r)", color: "#6366F1", fontSize: 11, fontWeight: 500, cursor: "pointer",
                        }}>
                          {draftingQP === qp.id ? "Drafting..." : "AI Draft Management"}
                        </button>
                      </div>
                      <textarea value={qp.managementNarrative} onChange={e => updateProject(qp.id, "managementNarrative", e.target.value)}
                        placeholder="Describe your management approach, staffing plan, key personnel, and team structure..."
                        rows={4}
                        style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", resize: "vertical", boxSizing: "border-box" }} />
                    </div>

                    {/* Document Upload */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Supporting Evidence</label>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input type="file" ref={fileInputRef} multiple onChange={e => handleFileUpload(qp.id, e.target.files)} style={{ display: "none" }} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingQP === qp.id} style={{
                          padding: "8px 18px", background: "var(--cream)", border: "1px solid var(--border2)",
                          borderRadius: "var(--r)", color: "var(--navy)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                        }}>
                          {uploadingQP === qp.id ? "Uploading..." : "Upload Documents"}
                        </button>
                        <span style={{ fontSize: 11, color: "var(--ink4)" }}>PDF, Word, or Excel files</span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    {projects.length > 1 && (
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
                        <button onClick={() => removeProject(qp.id)} style={{
                          padding: "6px 16px", background: "rgba(231,76,60,.06)", border: "1px solid rgba(231,76,60,.15)",
                          borderRadius: "var(--r)", color: "#e74c3c", fontSize: 12, cursor: "pointer",
                        }}>
                          Remove QP {idx + 1}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add QP Button */}
          {projects.length < 5 && (
            <button onClick={addProject} style={{
              width: "100%", padding: "16px", border: "2px dashed var(--border2)", borderRadius: "var(--rl)",
              background: "transparent", color: "var(--gold)", fontSize: 14, fontWeight: 500, cursor: "pointer",
              marginBottom: 16, transition: "all .15s",
            }}>
              + Add Qualifying Project ({projects.length}/5)
            </button>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}/oasis-plus/scorecard`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              ← Scorecard
            </a>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => save(false)} disabled={saving} style={{
                padding: "12px 24px", background: "#fff", border: "1px solid var(--border2)", borderRadius: "var(--r)",
                color: "var(--navy)", fontSize: 14, fontWeight: 500, cursor: saving ? "wait" : "pointer",
              }}>
                {saving ? "Saving..." : "Save Progress"}
              </button>
              <button onClick={() => save(true)} disabled={saving} style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(200,155,60,.3)",
              }}>
                Save & Next → Past Performance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
