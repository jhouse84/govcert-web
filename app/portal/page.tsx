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

const SECTION_LABELS: Record<string, { label: string; icon: string }> = {
  narrativeCorp: { label: "Corporate Experience", icon: "🏢" },
  narrativeQCP: { label: "Quality Control Plan", icon: "✅" },
  narrativeExp: { label: "Project Experience", icon: "📋" },
  financialData: { label: "Financial Statements", icon: "📊" },
  pricingData: { label: "Pricing (CSP-1)", icon: "💰" },
};

export default function PortalPage() {
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
      // Redirect admins away from portal
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
      setCerts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  function getSectionProgress(app: any) {
    const sections = [
      !!app?.narrativeCorp,
      !!app?.narrativeQCP,
      !!app?.narrativeExp,
      !!app?.financialData,
      !!app?.pricingData,
      (app?.pastPerformance?.length || 0) >= 3,
    ];
    const done = sections.filter(Boolean).length;
    return { done, total: sections.length, pct: Math.round(done / sections.length * 100) };
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading your workspace...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
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
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>My Portal</div>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
            <span>🏠</span> My Applications
          </a>
          <a href="/portal/documents" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>📄</span> My Documents
          </a>
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Client Portal</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 860 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Client Portal</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Welcome, {user?.firstName}
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Track your certification application progress, review your drafted narratives, and see what's needed next.
            </p>
          </div>

          {/* How it works */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "22px 26px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 12 }}>How GovCert Works</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                { icon: "✦", title: "Your advisor drafts narratives", body: "Your GovCert advisor uses AI to draft your application sections from documents you provide and answers you give." },
                { icon: "👀", title: "You review and approve", body: "You read every drafted section before it's submitted. Nothing goes to GSA without your review and approval." },
                { icon: "📬", title: "References receive PPQ emails", body: "Your past performance references automatically receive a questionnaire by email. Their responses strengthen your application." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, color: "var(--gold2)" }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {certs.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "60px 40px", textAlign: "center", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
                Your certification application hasn't been set up yet
              </h3>
              <p style={{ fontSize: 13.5, color: "var(--ink3)", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
                Your advisor will create your certification and send you next steps. If you haven't heard from them yet, reach out directly.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 14 }}>
                My Certifications
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {certs.map(cert => {
                  const progress = getSectionProgress(cert.application);
                  return (
                    <div key={cert.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                      {/* Cert header */}
                      <div style={{ padding: "22px 28px", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 4 }}>
                            {CERT_LABELS[cert.type] || cert.type}
                          </div>
                          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#fff", fontWeight: 400 }}>
                            {cert.client?.businessName}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: progress.pct === 100 ? "var(--green)" : "var(--gold2)", lineHeight: 1 }}>{progress.pct}%</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 4 }}>{progress.done}/{progress.total} sections</div>
                          <div style={{ height: 4, width: 80, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden", marginTop: 8, marginLeft: "auto" }}>
                            <div style={{ height: "100%", width: `${progress.pct}%`, background: progress.pct === 100 ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
                          </div>
                        </div>
                      </div>

                      {/* Section status */}
                      <div style={{ padding: "20px 28px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)", marginBottom: 14 }}>Application Sections</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                          {[
                            { key: "narrativeCorp", label: "Corporate Experience", icon: "🏢", hasData: !!cert.application?.narrativeCorp },
                            { key: "narrativeQCP", label: "Quality Control Plan", icon: "✅", hasData: !!cert.application?.narrativeQCP },
                            { key: "pp", label: "Past Performance", icon: "⭐", hasData: (cert.application?.pastPerformance?.length || 0) >= 3, count: cert.application?.pastPerformance?.length || 0 },
                            { key: "narrativeExp", label: "Project Experience", icon: "📋", hasData: !!cert.application?.narrativeExp },
                            { key: "financialData", label: "Financial Statements", icon: "📊", hasData: !!cert.application?.financialData },
                            { key: "pricingData", label: "Pricing (CSP-1)", icon: "💰", hasData: !!cert.application?.pricingData },
                          ].map(section => (
                            <div key={section.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: section.hasData ? "var(--green-bg)" : "var(--cream)", border: `1px solid ${section.hasData ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--r)" }}>
                              <span style={{ fontSize: 16, flexShrink: 0 }}>{section.icon}</span>
                              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{section.label}</span>
                              {section.key === "pp" && !section.hasData && (
                                <span style={{ fontSize: 12, color: "var(--amber)" }}>{section.count}/3 references</span>
                              )}
                              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: section.hasData ? "var(--green-bg)" : "var(--cream2)", color: section.hasData ? "var(--green)" : "var(--ink4)", border: `1px solid ${section.hasData ? "var(--green-b)" : "var(--border2)"}` }}>
                                {section.hasData ? "✓ Draft ready" : "In progress"}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 12 }}>
                          <a href={`/portal/application/${cert.id}`}
                            style={{ flex: 1, padding: "12px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 14, fontWeight: 500, textDecoration: "none", textAlign: "center" as const, boxShadow: "0 4px 16px rgba(11,25,41,.2)" }}>
                            View My Application →
                          </a>
                          {progress.pct === 100 && (
                            <a href={`/certifications/${cert.id}/submit`}
                              style={{ flex: 1, padding: "12px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", textAlign: "center" as const, boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                              View eOffer Package →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Need help */}
          <div style={{ marginTop: 28, padding: "20px 24px", background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", boxShadow: "var(--shadow)", display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>💬</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>Questions about your application?</div>
              <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>
                Contact your GovCert advisor directly. They can answer questions, update your application, and guide you through the next steps.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}