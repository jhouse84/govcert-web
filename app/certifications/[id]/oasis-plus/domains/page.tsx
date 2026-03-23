"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_DOMAINS, OASIS_SOLICITATION_TYPES, OASIS_SECTIONS } from "@/lib/oasis-domains";

export default function OASISDomainSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [solicitation, setSolicitation] = useState("unrestricted");
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-domains");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      if (data.application?.oasisDomains) {
        try {
          const parsed = JSON.parse(data.application.oasisDomains);
          setSelectedDomains(parsed);
        } catch { }
      }
      if (data.application?.oasisSolicitation) {
        setSolicitation(data.application.oasisSolicitation);
      }
      // Build completed sections
      const completed: Record<string, boolean> = {};
      const app = data.application;
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

  function toggleDomain(domainId: string) {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(d => d !== domainId)
        : [...prev, domainId]
    );
    setSaved(false);
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
          oasisDomains: JSON.stringify(selectedDomains),
          oasisSolicitation: solicitation,
        }),
      });
      setSaved(true);
      if (andNavigate) {
        router.push(`/certifications/${certId}/oasis-plus/contract-history`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const solType = OASIS_SOLICITATION_TYPES.find(s => s.id === solicitation);
  const isSmallBusiness = solicitation !== "unrestricted";

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="domains" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {OASIS_SECTIONS.map(section => {
            const isActive = section.id === "domains";
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
              GSA OASIS+ — Step 1 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Domain Selection
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 680 }}>
              OASIS+ offers 13 professional services domains. Select the domains where your company has the strongest qualifications. You need qualifying projects and sufficient scoring in each domain you select.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>
              {error}
            </div>
          )}

          {saved && (
            <div style={{ padding: "12px 18px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "var(--green)" }}>
              Domains and solicitation type saved successfully.
            </div>
          )}

          {/* Solicitation Type */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Solicitation Type</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>
              Which OASIS+ pool are you competing in?
            </h2>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16 }}>
              This affects your scoring threshold and minimum Average Annual Value requirements.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {OASIS_SOLICITATION_TYPES.map(sol => {
                const isSelected = solicitation === sol.id;
                return (
                  <div key={sol.id} onClick={() => { setSolicitation(sol.id); setSaved(false); }} style={{
                    padding: "14px 16px", borderRadius: "var(--r)", cursor: "pointer",
                    border: isSelected ? "2px solid var(--gold)" : "1px solid var(--border)",
                    background: isSelected ? "rgba(200,155,60,.06)" : "#fff",
                    transition: "all .15s",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "var(--gold)" : "var(--navy)", marginBottom: 2 }}>{sol.label}</div>
                    <div style={{ fontSize: 11, color: "var(--ink4)" }}>Threshold: {sol.threshold} credits</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Recommend Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 10 }}>
            <div style={{ fontSize: 13, color: "var(--ink3)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 600, color: "var(--navy)" }}>{selectedDomains.length}</span> domain{selectedDomains.length !== 1 ? "s" : ""} selected
            </div>
            <button onClick={() => setShowAiPopup(true)} style={{
              padding: "8px 18px", background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)",
              borderRadius: "var(--r)", color: "#6366F1", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>
              AI Recommend Domains
            </button>
          </div>

          {/* AI Popup */}
          {showAiPopup && (
            <div style={{ padding: "20px 24px", background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", borderRadius: "var(--rl)", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>AI Domain Recommendations</div>
                <div style={{ fontSize: 13, color: "var(--ink3)" }}>Coming soon — AI will analyze your company profile, NAICS codes, and past performance to recommend the best OASIS+ domains for your qualifications.</div>
              </div>
              <button onClick={() => setShowAiPopup(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--ink4)" }}>✕</button>
            </div>
          )}

          {/* Phase I Domains */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--navy)", marginBottom: 12 }}>Phase I Domains (8 Original)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {OASIS_DOMAINS.filter(d => d.phase === "I").map(domain => {
                const isSelected = selectedDomains.includes(domain.id);
                const threshold = isSmallBusiness ? domain.scoringThreshold.smallBusiness : domain.scoringThreshold.unrestricted;
                const minAAV = isSmallBusiness ? domain.minAAV.smallBusiness : domain.minAAV.unrestricted;
                return (
                  <div key={domain.id} onClick={() => toggleDomain(domain.id)} style={{
                    padding: "20px", borderRadius: "var(--rl)", cursor: "pointer",
                    border: isSelected ? "2px solid var(--gold)" : "1px solid var(--border)",
                    background: isSelected ? "rgba(200,155,60,.04)" : "#fff",
                    boxShadow: "var(--shadow)", transition: "all .15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow-lg)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "var(--shadow)")}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: "var(--gold)", marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: isSelected ? "var(--gold)" : "var(--navy)", marginBottom: 4 }}>{domain.name}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5, marginBottom: 10 }}>{domain.description}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                          {domain.naicsExamples.slice(0, 4).map(n => (
                            <span key={n} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "var(--cream)", border: "1px solid var(--border)", color: "var(--ink3)", fontFamily: "monospace" }}>{n}</span>
                          ))}
                          {domain.naicsExamples.length > 4 && (
                            <span style={{ fontSize: 10, color: "var(--ink4)" }}>+{domain.naicsExamples.length - 4} more</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--ink4)" }}>
                          <span>Min AAV: <strong style={{ color: "var(--navy)" }}>${(minAAV / 1000000).toFixed(0)}M</strong></span>
                          <span>Threshold: <strong style={{ color: "var(--navy)" }}>{threshold} credits</strong></span>
                          <span>Max: <strong style={{ color: "var(--navy)" }}>{domain.maxCredits} credits</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase II Domains */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--navy)" }}>Phase II Domains (5 New)</div>
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 100, background: "rgba(99,102,241,.1)", color: "#6366F1", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>NEW</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {OASIS_DOMAINS.filter(d => d.phase === "II").map(domain => {
                const isSelected = selectedDomains.includes(domain.id);
                const threshold = isSmallBusiness ? domain.scoringThreshold.smallBusiness : domain.scoringThreshold.unrestricted;
                const minAAV = isSmallBusiness ? domain.minAAV.smallBusiness : domain.minAAV.unrestricted;
                return (
                  <div key={domain.id} onClick={() => toggleDomain(domain.id)} style={{
                    padding: "20px", borderRadius: "var(--rl)", cursor: "pointer",
                    border: isSelected ? "2px solid var(--gold)" : "1px solid var(--border)",
                    background: isSelected ? "rgba(200,155,60,.04)" : "#fff",
                    boxShadow: "var(--shadow)", transition: "all .15s", position: "relative",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow-lg)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "var(--shadow)")}>
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 100, background: "rgba(99,102,241,.1)", color: "#6366F1", fontWeight: 600 }}>NEW</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: "var(--gold)", marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: isSelected ? "var(--gold)" : "var(--navy)", marginBottom: 4 }}>{domain.name}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5, marginBottom: 10 }}>{domain.description}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                          {domain.naicsExamples.slice(0, 4).map(n => (
                            <span key={n} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "var(--cream)", border: "1px solid var(--border)", color: "var(--ink3)", fontFamily: "monospace" }}>{n}</span>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--ink4)" }}>
                          <span>Min AAV: <strong style={{ color: "var(--navy)" }}>${(minAAV / 1000000).toFixed(0)}M</strong></span>
                          <span>Threshold: <strong style={{ color: "var(--navy)" }}>{threshold} credits</strong></span>
                          <span>Max: <strong style={{ color: "var(--navy)" }}>{domain.maxCredits} credits</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              ← Back to Dashboard
            </a>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => save(false)} disabled={saving} style={{
                padding: "12px 24px", background: "#fff", border: "1px solid var(--border2)", borderRadius: "var(--r)",
                color: "var(--navy)", fontSize: 14, fontWeight: 500, cursor: saving ? "wait" : "pointer",
              }}>
                {saving ? "Saving..." : "Save Progress"}
              </button>
              <button onClick={() => save(true)} disabled={saving || selectedDomains.length === 0} style={{
                padding: "12px 28px",
                background: selectedDomains.length > 0 ? "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)" : "var(--cream2)",
                border: "none", borderRadius: "var(--r)",
                color: selectedDomains.length > 0 ? "#fff" : "var(--ink4)",
                fontSize: 14, fontWeight: 600,
                cursor: selectedDomains.length > 0 ? "pointer" : "not-allowed",
                boxShadow: selectedDomains.length > 0 ? "0 4px 16px rgba(200,155,60,.3)" : "none",
              }}>
                Save & Next → Scorecard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
