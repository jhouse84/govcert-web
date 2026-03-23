"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_SECTIONS } from "@/lib/oasis-domains";

interface FederalExperienceEntry {
  id: string;
  agency: string;
  contractNumber: string;
  value: string;
  popStart: string;
  popEnd: string;
  description: string;
}

function createEmptyFE(): FederalExperienceEntry {
  return {
    id: crypto.randomUUID(),
    agency: "",
    contractNumber: "",
    value: "",
    popStart: "",
    popEnd: "",
    description: "",
  };
}

export default function OASISFederalExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<FederalExperienceEntry[]>([createEmptyFE()]);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-federal-experience");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      const app = data.application;
      if (app?.oasisFEPData) {
        try {
          const parsed = JSON.parse(app.oasisFEPData);
          if (Array.isArray(parsed) && parsed.length > 0) setEntries(parsed);
        } catch { }
      }
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

  function updateEntry(entryId: string, field: keyof FederalExperienceEntry, value: string) {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, [field]: value } : e));
    setSaved(false);
  }

  function addEntry() {
    if (entries.length >= 10) return;
    setEntries(prev => [...prev, createEmptyFE()]);
  }

  function removeEntry(entryId: string) {
    setEntries(prev => prev.filter(e => e.id !== entryId));
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
          oasisFEPData: JSON.stringify(entries),
        }),
      });
      setSaved(true);
      if (andNavigate) {
        router.push(`/certifications/${certId}/oasis-plus/systems-certs`);
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
      <CertSidebar user={user} certId={certId} activePage="federal-experience" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {OASIS_SECTIONS.map(section => {
            const isActive = section.id === "federal-experience";
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
              GSA OASIS+ — Step 5 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Federal Experience
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 680 }}>
              List additional federal prime contracts separate from your Qualifying Projects. These demonstrate breadth of experience and contribute to the Federal Prime Experience scoring category.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}
          {saved && (
            <div style={{ padding: "12px 18px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "var(--green)" }}>Federal experience data saved successfully.</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {entries.map((entry, idx) => (
              <div key={entry.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Federal Contract {idx + 1}</div>
                  {entries.length > 1 && (
                    <button onClick={() => removeEntry(entry.id)} style={{ padding: "4px 12px", background: "rgba(231,76,60,.06)", border: "1px solid rgba(231,76,60,.15)", borderRadius: "var(--r)", color: "#e74c3c", fontSize: 11, cursor: "pointer" }}>
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Agency</label>
                    <input type="text" value={entry.agency} onChange={e => updateEntry(entry.id, "agency", e.target.value)}
                      placeholder="e.g., Department of Defense"
                      style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Contract Number</label>
                    <input type="text" value={entry.contractNumber} onChange={e => updateEntry(entry.id, "contractNumber", e.target.value)}
                      placeholder="e.g., W91CRB-20-C-0001"
                      style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Contract Value</label>
                    <input type="text" value={entry.value} onChange={e => updateEntry(entry.id, "value", e.target.value)}
                      placeholder="e.g., 2500000"
                      style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>PoP Start</label>
                    <input type="date" value={entry.popStart} onChange={e => updateEntry(entry.id, "popStart", e.target.value)}
                      style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>PoP End</label>
                    <input type="date" value={entry.popEnd} onChange={e => updateEntry(entry.id, "popEnd", e.target.value)}
                      style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Brief Description</label>
                    <input type="text" value={entry.description} onChange={e => updateEntry(entry.id, "description", e.target.value)}
                      placeholder="Brief description of work performed"
                      style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {entries.length < 10 && (
            <button onClick={addEntry} style={{
              width: "100%", padding: "16px", border: "2px dashed var(--border2)", borderRadius: "var(--rl)",
              background: "transparent", color: "var(--gold)", fontSize: 14, fontWeight: 500, cursor: "pointer",
              marginTop: 16, transition: "all .15s",
            }}>
              + Add Federal Experience ({entries.length}/10)
            </button>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}/oasis-plus/past-performance`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              ← Past Performance
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
                Save & Next → Systems & Certs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
