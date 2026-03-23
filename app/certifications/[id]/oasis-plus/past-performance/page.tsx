"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_SECTIONS } from "@/lib/oasis-domains";

const CPARS_RATINGS = ["Exceptional", "Very Good", "Satisfactory", "Marginal", "Unsatisfactory", "N/A"];

interface PPEntry {
  qpId: string;
  qpLabel: string;
  contractNumber: string;
  cparsRating: string;
  narrative: string;
  refName: string;
  refTitle: string;
  refEmail: string;
  refPhone: string;
}

export default function OASISPastPerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingPPQ, setSendingPPQ] = useState<string | null>(null);

  const [ppEntries, setPPEntries] = useState<PPEntry[]>([]);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-past-performance");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      const app = data.application;

      // Build PP entries from QPs
      let qps: any[] = [];
      if (app?.oasisQPData) {
        try { qps = JSON.parse(app.oasisQPData); } catch { }
      }

      // Load existing PP data if it exists
      let existingPP: PPEntry[] = [];
      if (app?.oasisPPData) {
        try { existingPP = JSON.parse(app.oasisPPData); } catch { }
      }

      // Load contract history for CPARS data
      let contractHistoryMap: Record<string, any> = {};
      if (app?.oasisContractHistory) {
        try {
          const ch = JSON.parse(app.oasisContractHistory);
          (ch.contracts || []).forEach((c: any) => {
            if (c.contractNumber) contractHistoryMap[c.contractNumber] = c;
          });
        } catch {}
      }

      // Merge QPs with existing PP data + contract history CPARS
      const entries: PPEntry[] = qps.map((qp: any) => {
        const existing = existingPP.find(e => e.qpId === qp.id);
        if (existing) return existing;
        // Try to pull CPARS from contract history
        const ch = contractHistoryMap[qp.contractNumber];
        return {
          qpId: qp.id,
          qpLabel: qp.contractNumber || `QP`,
          contractNumber: qp.contractNumber || "",
          cparsRating: ch?.cparsRating && ch.cparsRating !== "Unknown" && ch.cparsRating !== "N/A" ? ch.cparsRating : "",
          narrative: ch?.servicesPerformed || "",
          refName: "",
          refTitle: "",
          refEmail: "",
          refPhone: "",
        };
      });
      setPPEntries(entries);

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

  function updateEntry(qpId: string, field: keyof PPEntry, value: string) {
    setPPEntries(prev => prev.map(e => e.qpId === qpId ? { ...e, [field]: value } : e));
    setSaved(false);
  }

  async function sendPPQ(entry: PPEntry) {
    if (!entry.refEmail) {
      setError("Please enter a reference email address first.");
      return;
    }
    setSendingPPQ(entry.qpId);
    try {
      await apiRequest("/api/ppq", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert?.clientId,
          contractNumber: entry.contractNumber,
          refName: entry.refName,
          refTitle: entry.refTitle,
          refEmail: entry.refEmail,
          refPhone: entry.refPhone,
        }),
      });
      alert(`PPQ sent to ${entry.refEmail}`);
    } catch (err: any) {
      setError("Failed to send PPQ: " + (err.message || "Please try again."));
    } finally {
      setSendingPPQ(null);
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
          oasisPPData: JSON.stringify(ppEntries),
        }),
      });
      setSaved(true);
      if (andNavigate) {
        router.push(`/certifications/${certId}/oasis-plus/federal-experience`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="past-performance" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {OASIS_SECTIONS.map(section => {
            const isActive = section.id === "past-performance";
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
              GSA OASIS+ — Step 4 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Past Performance
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 680 }}>
              Provide past performance information for each Qualifying Project. CPARS ratings and reference contacts strengthen your scoring in the Past Performance category.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}
          {saved && (
            <div style={{ padding: "12px 18px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "var(--green)" }}>Past performance data saved successfully.</div>
          )}

          {ppEntries.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>No qualifying projects entered yet</div>
              <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20 }}>Add qualifying projects first, then return here to add past performance data.</div>
              <a href={`/certifications/${certId}/oasis-plus/qualifying-projects`} style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Enter Qualifying Projects →</a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {ppEntries.map((entry, idx) => (
                <div key={entry.qpId} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                  <div style={{ padding: "16px 24px", background: "var(--cream)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff" }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>QP {idx + 1}: {entry.contractNumber || "Unknown Contract"}</div>
                    </div>
                  </div>

                  <div style={{ padding: "24px" }}>
                    {/* CPARS Rating */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>CPARS Rating</label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {CPARS_RATINGS.map(rating => {
                          const isSelected = entry.cparsRating === rating;
                          const color = rating === "Exceptional" ? "var(--green)" : rating === "Very Good" ? "#27ae60" : rating === "Satisfactory" ? "var(--gold)" : rating === "Marginal" ? "#f39c12" : rating === "Unsatisfactory" ? "#e74c3c" : "var(--ink4)";
                          return (
                            <button key={rating} onClick={() => updateEntry(entry.qpId, "cparsRating", rating)} style={{
                              padding: "8px 16px", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                              border: isSelected ? `2px solid ${color}` : "1px solid var(--border)",
                              background: isSelected ? `${color}10` : "#fff",
                              color: isSelected ? color : "var(--ink3)",
                            }}>
                              {rating}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Narrative */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Past Performance Narrative</label>
                      <textarea value={entry.narrative} onChange={e => updateEntry(entry.qpId, "narrative", e.target.value)}
                        placeholder="Describe the quality of performance, adherence to schedule, cost control, and any notable achievements..."
                        rows={4}
                        style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", resize: "vertical", boxSizing: "border-box" }} />
                    </div>

                    {/* Reference Contact */}
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Reference Contact</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--ink3)", marginBottom: 3 }}>Name</label>
                        <input type="text" value={entry.refName} onChange={e => updateEntry(entry.qpId, "refName", e.target.value)}
                          placeholder="Contact name"
                          style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--ink3)", marginBottom: 3 }}>Title</label>
                        <input type="text" value={entry.refTitle} onChange={e => updateEntry(entry.qpId, "refTitle", e.target.value)}
                          placeholder="e.g., Contracting Officer"
                          style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--ink3)", marginBottom: 3 }}>Email</label>
                        <input type="email" value={entry.refEmail} onChange={e => updateEntry(entry.qpId, "refEmail", e.target.value)}
                          placeholder="email@agency.gov"
                          style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: "var(--ink3)", marginBottom: 3 }}>Phone</label>
                        <input type="tel" value={entry.refPhone} onChange={e => updateEntry(entry.qpId, "refPhone", e.target.value)}
                          placeholder="(202) 555-0123"
                          style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                      </div>
                    </div>

                    {/* Send PPQ Button */}
                    <button onClick={() => sendPPQ(entry)} disabled={sendingPPQ === entry.qpId || !entry.refEmail} style={{
                      padding: "8px 18px", background: entry.refEmail ? "rgba(99,102,241,.08)" : "var(--cream2)",
                      border: `1px solid ${entry.refEmail ? "rgba(99,102,241,.2)" : "var(--border)"}`,
                      borderRadius: "var(--r)", color: entry.refEmail ? "#6366F1" : "var(--ink4)", fontSize: 12, fontWeight: 500,
                      cursor: entry.refEmail ? "pointer" : "not-allowed",
                    }}>
                      {sendingPPQ === entry.qpId ? "Sending..." : "Send PPQ Request"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}/oasis-plus/qualifying-projects`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              ← Qualifying Projects
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
                Save & Next → Federal Experience
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
