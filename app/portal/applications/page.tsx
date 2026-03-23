"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const CERT_LABELS: Record<string, string> = {
  GSA_MAS: "GSA Multiple Award Schedule",
  EIGHT_A: "8(a) Business Development",
  WOSB: "Women-Owned Small Business",
  HUBZONE: "HUBZone",
  MBE: "Minority Business Enterprise",
  SDVOSB: "Service-Disabled Veteran-Owned",
  VOSB: "Veteran-Owned Small Business",
};

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  IN_PROGRESS: { label: "In Progress", bg: "rgba(200,155,60,.1)", color: "var(--gold)", border: "rgba(200,155,60,.2)" },
  SUBMITTED: { label: "Submitted", bg: "var(--green-bg)", color: "var(--green)", border: "var(--green-b)" },
  APPROVED: { label: "Approved", bg: "var(--green-bg)", color: "var(--green)", border: "var(--green-b)" },
  REJECTED: { label: "Rejected", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  UNDER_REVIEW: { label: "Under Review", bg: "var(--blue-bg)", color: "var(--blue)", border: "rgba(26,63,122,.2)" },
};

const GSA_SECTIONS = [
  { key: "narrativeCorp", label: "Corporate Experience", icon: "🏢", path: "corporate" },
  { key: "narrativeQCP", label: "Quality Control Plan", icon: "✅", path: "qcp" },
  { key: "pp", label: "Past Performance", icon: "⭐", path: "past-performance" },
  { key: "narrativeExp", label: "Project Experience", icon: "📋", path: "experience" },
  { key: "financialData", label: "Financials", icon: "📊", path: "financials" },
  { key: "pricingData", label: "Pricing", icon: "💰", path: "pricing" },
];

const EIGHT_A_SECTIONS = [
  { key: "socialDisadvantage", label: "Social Disadvantage", icon: "👥", path: "8a/social-disadvantage" },
  { key: "economicDisadvantage", label: "Economic Disadvantage", icon: "💵", path: "8a/economic-disadvantage" },
  { key: "businessPlan", label: "Business Plan", icon: "📝", path: "8a/business-plan" },
  { key: "narrativeCorp", label: "Corporate Experience", icon: "🏢", path: "8a/corporate" },
  { key: "pp", label: "Past Performance", icon: "⭐", path: "8a/past-performance" },
  { key: "financialData", label: "Financials", icon: "📊", path: "8a/financials" },
];

function isSectionComplete(app: any, key: string): boolean {
  if (!app) return false;
  if (key === "pp") return (app.pastPerformance?.length || 0) >= 3;
  return !!app[key];
}

function getSectionProgress(app: any, sections: typeof GSA_SECTIONS) {
  const done = sections.filter(s => isSectionComplete(app, s.key)).length;
  const total = sections.length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export default function PortalApplicationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "ADMIN" || parsed.role === "ADVISOR") {
        router.push("/dashboard");
        return;
      }
      setUser(parsed);
    }
    fetchMyCerts();
  }, []);

  async function fetchMyCerts() {
    try {
      const data = await apiRequest("/api/certifications");
      setCerts(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading your applications...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top right, rgba(200,155,60,.03) 0%, transparent 50%), var(--cream)", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "linear-gradient(180deg, #0B1929 0%, #0D1F35 100%)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", flexShrink: 0 }} />
        <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </div>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>My Portal</div>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>🏠</span> Home
          </a>
          <a href="/portal/profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>🏢</span> Company Profile
          </a>
          <a href="/portal/applications" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", borderLeft: "3px solid var(--gold)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
            <span>📋</span> My Applications
          </a>
          <a href="/portal/eligibility" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>✅</span> Eligibility
          </a>
          <a href="/portal/integrations" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>🔗</span> Integrations
          </a>
          <a href="/portal/documents" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>📄</span> My Documents
          </a>
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Client Portal</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>

          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Client Portal</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 4 }}>
              My Applications
            </h1>
            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", borderRadius: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Track your certification applications and continue where you left off.
            </p>
          </div>

          {certs.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, padding: "60px 40px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", textAlign: "center" as const }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
                No applications started yet
              </h3>
              <p style={{ fontSize: 15, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
                Start your first certification application from the portal home page. Choose from GSA MAS, 8(a), and more.
              </p>
              <a href="/portal" style={{
                display: "inline-block", padding: "14px 32px",
                background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 500,
                textDecoration: "none", boxShadow: "0 4px 20px rgba(200,155,60,.35)",
                transition: "all .2s",
              }}>
                Start your first application
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {certs.map(cert => {
                const isEightA = cert.type === "EIGHT_A";
                const sections = isEightA ? EIGHT_A_SECTIONS : GSA_SECTIONS;
                const progress = getSectionProgress(cert.application, sections);
                const statusInfo = STATUS_LABELS[cert.status] || STATUS_LABELS.IN_PROGRESS;
                const firstIncomplete = sections.find(s => !isSectionComplete(cert.application, s.key));
                const submitPath = isEightA ? `/certifications/${cert.id}/8a/submit` : `/certifications/${cert.id}/submit`;
                const continuePath = firstIncomplete
                  ? `/certifications/${cert.id}/${firstIncomplete.path}`
                  : submitPath;

                return (
                  <div key={cert.id} style={{ background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)" }}>
                    {/* Navy header */}
                    <div style={{ padding: "22px 28px", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 4 }}>
                          {CERT_LABELS[cert.type] || cert.type}
                        </div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#fff", fontWeight: 400 }}>
                          {cert.client?.businessName}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" as const }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: progress.pct === 100 ? "var(--green)" : "var(--gold2)", lineHeight: 1 }}>{progress.pct}%</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 4 }}>{progress.done}/{progress.total} sections</div>
                        <div style={{ height: 4, width: 80, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden", marginTop: 8, marginLeft: "auto" }}>
                          <div style={{ height: "100%", width: `${progress.pct}%`, background: progress.pct === 100 ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "20px 28px" }}>
                      {/* Status and date row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                          textTransform: "uppercase" as const, letterSpacing: ".06em",
                          background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`,
                        }}>
                          {statusInfo.label}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--ink4)" }}>
                          Created {new Date(cert.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      {/* Section checklist */}
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)", marginBottom: 14 }}>Application Sections</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                        {sections.map(section => {
                          const complete = isSectionComplete(cert.application, section.key);
                          return (
                            <a key={section.key} href={`/certifications/${cert.id}/${section.path}`} style={{
                              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                              background: complete ? "var(--green-bg)" : "var(--cream)",
                              border: `1px solid ${complete ? "var(--green-b)" : "var(--border)"}`,
                              borderRadius: "var(--r)", textDecoration: "none",
                            }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow)")}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                              <span style={{ fontSize: 16, flexShrink: 0 }}>{section.icon}</span>
                              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{section.label}</span>
                              {section.key === "pp" && !complete && (
                                <span style={{ fontSize: 12, color: "var(--amber)" }}>{cert.application?.pastPerformance?.length || 0}/3 references</span>
                              )}
                              <span style={{
                                padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500,
                                background: complete ? "var(--green-bg)" : "var(--cream2)",
                                color: complete ? "var(--green)" : "var(--ink4)",
                                border: `1px solid ${complete ? "var(--green-b)" : "var(--border2)"}`,
                              }}>
                                {complete ? "✓ Complete" : "Start →"}
                              </span>
                            </a>
                          );
                        })}
                      </div>

                      {/* Action button */}
                      <div style={{ display: "flex", gap: 12 }}>
                        {progress.pct === 100 ? (
                          <a href={submitPath} style={{
                            flex: 1, padding: "12px", textAlign: "center" as const, textDecoration: "none",
                            background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                            borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500,
                            boxShadow: "0 4px 20px rgba(200,155,60,.35)",
                          }}>
                            View Submission Package →
                          </a>
                        ) : (
                          <a href={continuePath} style={{
                            flex: 1, padding: "12px", textAlign: "center" as const, textDecoration: "none",
                            background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                            borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500,
                            boxShadow: "0 4px 20px rgba(200,155,60,.35)",
                          }}>
                            Continue Application →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
