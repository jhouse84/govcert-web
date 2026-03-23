"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_DOMAINS, OASIS_SCORING_CATEGORIES, OASIS_SOLICITATION_TYPES, OASIS_SECTIONS } from "@/lib/oasis-domains";

export default function OASISScorecardPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [activeDomainTab, setActiveDomainTab] = useState("");
  // scorecardData: { [domainId]: { [categoryId]: number } }
  const [scorecardData, setScorecardData] = useState<Record<string, Record<string, number>>>({});
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-scorecard");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      const app = data.application;
      let domains: string[] = [];
      if (app?.oasisDomains) {
        try { domains = JSON.parse(app.oasisDomains); } catch { }
      }
      setSelectedDomains(domains);
      if (domains.length > 0) setActiveDomainTab(domains[0]);
      if (app?.oasisSolicitation) setSolicitation(app.oasisSolicitation);
      if (app?.oasisScorecardData) {
        try { setScorecardData(JSON.parse(app.oasisScorecardData)); } catch { }
      }
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

  function updateScore(domainId: string, categoryId: string, value: number) {
    setScorecardData(prev => ({
      ...prev,
      [domainId]: {
        ...(prev[domainId] || {}),
        [categoryId]: value,
      },
    }));
    setSaved(false);
  }

  function getDomainTotal(domainId: string): number {
    const d = scorecardData[domainId] || {};
    return Object.values(d).reduce((sum, v) => sum + v, 0);
  }

  function getThreshold(): number {
    const sol = OASIS_SOLICITATION_TYPES.find(s => s.id === solicitation);
    return sol?.threshold || 42;
  }

  function getScoreColor(score: number, threshold: number): string {
    if (score >= threshold) return "var(--green)";
    if (score >= threshold - 5) return "var(--amber, #f39c12)";
    return "#e74c3c";
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
          oasisScorecardData: JSON.stringify(scorecardData),
        }),
      });
      setSaved(true);
      if (andNavigate) {
        router.push(`/certifications/${certId}/oasis-plus/qualifying-projects`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const threshold = getThreshold();

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="scorecard" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {OASIS_SECTIONS.map(section => {
            const isActive = section.id === "scorecard";
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
              GSA OASIS+ — Step 2 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Self-Scoring Worksheet
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 680 }}>
              Estimate your score for each selected domain using the OASIS+ Qualifications Matrix. The scoring threshold for your pool ({OASIS_SOLICITATION_TYPES.find(s => s.id === solicitation)?.label || "Unrestricted"}) is <strong>{threshold} credits</strong>.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}
          {saved && (
            <div style={{ padding: "12px 18px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "var(--green)" }}>Scorecard saved successfully.</div>
          )}

          {selectedDomains.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>No domains selected</div>
              <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20 }}>Go back to Domain Selection to choose your target domains first.</div>
              <a href={`/certifications/${certId}/oasis-plus/domains`} style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Select Domains →</a>
            </div>
          ) : (
            <>
              {/* Running Score Summary */}
              <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, color: "#fff" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 12 }}>Score Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(selectedDomains.length, 4)}, 1fr)`, gap: 16 }}>
                  {selectedDomains.map(domId => {
                    const dom = OASIS_DOMAINS.find(d => d.id === domId);
                    const total = getDomainTotal(domId);
                    const color = getScoreColor(total, threshold);
                    const pct = Math.min((total / 50) * 100, 100);
                    return (
                      <div key={domId} style={{ cursor: "pointer" }} onClick={() => setActiveDomainTab(domId)}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 4, fontWeight: activeDomainTab === domId ? 600 : 400 }}>{dom?.name}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color, lineHeight: 1 }}>{total}</span>
                          <span style={{ fontSize: 14, color: "rgba(255,255,255,.3)" }}>/ 50</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden", marginTop: 8 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 100, transition: "width .3s" }} />
                        </div>
                        <div style={{ fontSize: 10, marginTop: 4, color: total >= threshold ? "var(--green)" : "rgba(255,255,255,.4)" }}>
                          {total >= threshold ? "Above threshold" : `Need ${threshold - total} more`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Domain Tabs */}
              {selectedDomains.length > 1 && (
                <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
                  {selectedDomains.map(domId => {
                    const dom = OASIS_DOMAINS.find(d => d.id === domId);
                    const isActive = activeDomainTab === domId;
                    const total = getDomainTotal(domId);
                    return (
                      <button key={domId} onClick={() => setActiveDomainTab(domId)} style={{
                        padding: "8px 16px", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer",
                        background: isActive ? "var(--navy)" : "#fff",
                        color: isActive ? "#fff" : "var(--ink3)",
                        border: isActive ? "none" : "1px solid var(--border)",
                        fontWeight: isActive ? 500 : 400,
                      }}>
                        {dom?.name} ({total}/{threshold})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Scoring Categories for Active Domain */}
              {activeDomainTab && (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                  <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)", background: "var(--cream)" }}>
                    <div style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)" }}>
                      {OASIS_DOMAINS.find(d => d.id === activeDomainTab)?.name} — Scoring Matrix
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>
                      Check off credits you expect to claim. Each category has a maximum credit value.
                    </div>
                  </div>
                  {OASIS_SCORING_CATEGORIES.map(cat => {
                    const currentVal = scorecardData[activeDomainTab]?.[cat.id] || 0;
                    const creditOptions = [];
                    for (let i = 0; i <= cat.maxCredits; i++) {
                      creditOptions.push(i);
                    }
                    return (
                      <div key={cat.id} style={{ padding: "18px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{cat.label}</div>
                          <div style={{ fontSize: 12, color: "var(--ink3)" }}>{cat.description}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <select
                            value={currentVal}
                            onChange={e => updateScore(activeDomainTab, cat.id, parseInt(e.target.value))}
                            style={{ padding: "6px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--navy)", background: "#fff", minWidth: 70, textAlign: "center" }}
                          >
                            {creditOptions.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                          <span style={{ fontSize: 12, color: "var(--ink4)", minWidth: 60 }}>/ {cat.maxCredits} max</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ padding: "18px 28px", background: "var(--cream)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Domain Total</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: getScoreColor(getDomainTotal(activeDomainTab), threshold), fontWeight: 500 }}>
                      {getDomainTotal(activeDomainTab)} / 50
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}/oasis-plus/domains`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              ← Domains
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
                Save & Next → Qualifying Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
