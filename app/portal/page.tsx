"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import EligibilityScorecard from "@/components/EligibilityScorecard";

const CERT_LABELS: Record<string, string> = {
  GSA_MAS: "GSA Multiple Award Schedule",
  EIGHT_A: "8(a) Business Development",
  WOSB: "Women-Owned Small Business",
  HUBZONE: "HUBZone",
  MBE: "Minority Business Enterprise",
  SDVOSB: "Service-Disabled Veteran-Owned",
  VOSB: "Veteran-Owned Small Business",
};

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
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

      // First-time customer: redirect to eligibility wizard with welcome video
      const onboarded = localStorage.getItem("govcert_onboarded");
      if (!onboarded) {
        router.push("/portal/eligibility?welcome=true");
        return;
      }
    }
    fetchMyCerts();
  }, []);

  async function fetchEligibility(cId: string) {
    try {
      const data = await apiRequest(`/api/eligibility/${cId}`);
      if (data?.assessmentResults) setEligibility(data.assessmentResults);
    } catch {}
  }

  async function fetchMyCerts() {
    try {
      const data = await apiRequest("/api/certifications");
      setCerts(data);
      if (data && data.length > 0 && data[0].clientId) {
        setClientId(data[0].clientId);
        fetchEligibility(data[0].clientId);
      } else {
        // Try to find client directly
        try {
          const clients = await apiRequest("/api/clients");
          if (clients && clients.length > 0) {
            setClientId(clients[0].id);
            fetchEligibility(clients[0].id);
          }
        } catch {}
      }
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
          <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>My Portal</div>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
            <span>🏠</span> My Applications
          </a>
          <a href="/portal/eligibility" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>✅</span> Eligibility
          </a>
          <a href="/portal/documents" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
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
        <div style={{ padding: "40px 48px", maxWidth: 860 }}>

          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Client Portal</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Welcome, {user?.firstName}
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Track your certification application progress and work directly on your application sections below.
            </p>
          </div>

          {/* How it works */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "22px 26px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 12 }}>How GovCert Works</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                { icon: "✦", title: "AI drafts your narratives", body: "GovCert uses AI to draft your application sections from documents you upload and answers you provide." },
                { icon: "✏️", title: "You review and refine", body: "Read every drafted section, make edits, and use voice input or re-draft any section until it's exactly right." },
                { icon: "📬", title: "References receive PPQ emails", body: "Your past performance references automatically receive a questionnaire by email to complete online." },
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

          {/* Eligibility Scorecard */}
          {clientId && (
            <div style={{ marginBottom: 28 }}>
              <EligibilityScorecard clientId={clientId} compact />
            </div>
          )}

          {/* Certifications */}
          {certs.length === 0 ? (
            <div>
              {/* Getting Started Steps */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "36px 32px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>Get Started</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>
                  Your certification journey starts here
                </h3>
                <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 28, lineHeight: 1.6 }}>
                  Follow these steps to find out which certifications you qualify for and start your applications.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    {
                      step: 1,
                      title: "Complete the Eligibility Assessment",
                      desc: "Answer questions about your business, ownership, and financials. We'll tell you which certifications you likely qualify for.",
                      time: "~12 min",
                      href: "/portal/eligibility",
                      done: !!eligibility,
                      cta: "Start Assessment →",
                    },
                    {
                      step: 2,
                      title: "Upload Key Documents",
                      desc: "Financial statements, tax returns, capability statement, and org chart. These feed into every application automatically.",
                      time: "~5 min",
                      href: "/portal/documents",
                      done: false,
                      cta: "Upload Documents →",
                    },
                    {
                      step: 3,
                      title: "Connect Your Financial Tools",
                      desc: "Link QuickBooks or upload financials manually. Revenue data is required for most certifications.",
                      time: "~2 min",
                      href: "/portal/eligibility",
                      done: false,
                      cta: "Connect Tools →",
                    },
                  ].map(item => (
                    <a key={item.step} href={item.href} style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
                      background: item.done ? "var(--green-bg)" : "var(--cream)",
                      border: `1px solid ${item.done ? "var(--green-b)" : "var(--border)"}`,
                      borderRadius: "var(--r)", textDecoration: "none", transition: "all .15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: item.done ? "var(--green)" : "var(--gold)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 15, fontWeight: 600, flexShrink: 0,
                      }}>
                        {item.done ? "✓" : item.step}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{item.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: "var(--ink4)", marginBottom: 4 }}>{item.time}</div>
                        <span style={{ padding: "5px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500, background: item.done ? "var(--green-bg)" : "var(--gold)", color: item.done ? "var(--green)" : "#fff", border: item.done ? "1px solid var(--green-b)" : "none" }}>
                          {item.done ? "Complete" : item.cta}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Managed Service CTA */}
              {user?.subscriptionTier === "PLATFORM" && (
                <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 20, display: "flex", gap: 20, alignItems: "center" }}>
                  <span style={{ fontSize: 32, flexShrink: 0 }}>✦</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 4 }}>Want an expert to handle everything?</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>
                      Upgrade to our Managed Service. A dedicated advisor will manage your entire certification process — you just review and approve.
                    </div>
                  </div>
                  <a href="/portal/eligibility" style={{ padding: "10px 22px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" as const, boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                    Learn More →
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 14 }}>
                My Certifications
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {certs.map(cert => {
                  const progress = getSectionProgress(cert.application);
                  return (
                    <div key={cert.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
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

                      <div style={{ padding: "20px 28px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)", marginBottom: 14 }}>Application Sections</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                          {[
                            { key: "narrativeCorp", label: "Corporate Experience", icon: "🏢", hasData: !!cert.application?.narrativeCorp, href: `/certifications/${cert.id}/corporate` },
                            { key: "narrativeQCP", label: "Quality Control Plan", icon: "✅", hasData: !!cert.application?.narrativeQCP, href: `/certifications/${cert.id}/qcp` },
                            { key: "pp", label: "Past Performance", icon: "⭐", hasData: (cert.application?.pastPerformance?.length || 0) >= 3, count: cert.application?.pastPerformance?.length || 0, href: `/certifications/${cert.id}/past-performance` },
                            { key: "narrativeExp", label: "Project Experience", icon: "📋", hasData: !!cert.application?.narrativeExp, href: `/certifications/${cert.id}/experience` },
                            { key: "financialData", label: "Financial Statements", icon: "📊", hasData: !!cert.application?.financialData, href: `/certifications/${cert.id}/financials` },
                            { key: "pricingData", label: "Pricing (CSP-1)", icon: "💰", hasData: !!cert.application?.pricingData, href: `/certifications/${cert.id}/pricing` },
                          ].map(section => (
                            <a key={section.key} href={section.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: section.hasData ? "var(--green-bg)" : "var(--cream)", border: `1px solid ${section.hasData ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--r)", textDecoration: "none" }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow)")}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                              <span style={{ fontSize: 16, flexShrink: 0 }}>{section.icon}</span>
                              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{section.label}</span>
                              {section.key === "pp" && !section.hasData && (
                                <span style={{ fontSize: 12, color: "var(--amber)" }}>{section.count}/3 references</span>
                              )}
                              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: section.hasData ? "var(--green-bg)" : "var(--cream2)", color: section.hasData ? "var(--green)" : "var(--ink4)", border: `1px solid ${section.hasData ? "var(--green-b)" : "var(--border2)"}` }}>
                                {section.hasData ? "✓ Complete" : "Start →"}
                              </span>
                            </a>
                          ))}
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                          <a href={`/certifications/${cert.id}`}
                            style={{ flex: 1, padding: "12px", background: "var(--navy)", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 14, fontWeight: 500, textDecoration: "none", textAlign: "center" as const, boxShadow: "0 4px 16px rgba(11,25,41,.2)" }}>
                            Open Full Application →
                          </a>
                          {progress.pct === 100 && (
                            <a href={`/certifications/${cert.id}/submit`}
                              style={{ flex: 1, padding: "12px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", textAlign: "center" as const, boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
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