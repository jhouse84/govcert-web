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
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", borderLeft: "3px solid var(--gold)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
            <span>🏠</span> Home
          </a>
          <a href="/portal/applications" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
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
        <div style={{ padding: "40px 48px", maxWidth: 860 }}>

          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Client Portal</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 4 }}>
              Welcome, {user?.firstName}
            </h1>
            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", borderRadius: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Track your certification application progress and work directly on your application sections below.
            </p>
          </div>

          {/* How it works */}
          <div style={{ background: "linear-gradient(135deg, #0B1929 0%, #1A3357 50%, #0B1929 100%)", borderRadius: 12, padding: "22px 26px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 12 }}>How GovCert Works</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                { icon: "✦", title: "AI drafts your narratives", body: "GovCert uses AI to draft your application sections from documents you upload and answers you provide." },
                { icon: "✏️", title: "You review and refine", body: "Read every drafted section, make edits, and use voice input or re-draft any section until it's exactly right." },
                { icon: "📬", title: "References receive PPQ emails", body: "Your past performance references automatically receive a questionnaire by email to complete online." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, borderLeft: "3px solid var(--gold)", paddingLeft: 10 }}>
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
              <div style={{ background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, padding: "36px 32px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>Get Started</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>
                  Your certification journey starts here
                </h3>
                <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 28, lineHeight: 1.6 }}>
                  Follow these steps to find out which certifications you qualify for and start your applications.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
                  {/* Connecting line */}
                  <div style={{ position: "absolute", left: 43, top: 56, bottom: 56, width: 2, borderLeft: "2px dotted rgba(200,155,60,.25)", zIndex: 0 }} />
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
                      href: "/portal/integrations",
                      done: false,
                      cta: "Connect Tools →",
                    },
                  ].map(item => (
                    <a key={item.step} href={item.href} style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
                      background: item.done ? "var(--green-bg)" : "var(--cream)",
                      border: `1px solid ${item.done ? "var(--green-b)" : "var(--border)"}`,
                      borderRadius: 8, textDecoration: "none", transition: "all .2s",
                      position: "relative", zIndex: 1,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderLeft = "3px solid var(--gold)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; e.currentTarget.style.borderLeft = `1px solid ${item.done ? "var(--green-b)" : "var(--border)"}`; }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: item.done ? "var(--green)" : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 16, fontWeight: 600, flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(200,155,60,.25)",
                      }}>
                        {item.done ? "✓" : item.step}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{item.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: "var(--ink4)", marginBottom: 4 }}>{item.time}</div>
                        <span style={{ padding: "5px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500, background: item.done ? "var(--green-bg)" : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)", color: item.done ? "var(--green)" : "#fff", border: item.done ? "1px solid var(--green-b)" : "none", boxShadow: item.done ? "none" : "0 4px 20px rgba(200,155,60,.35)" }}>
                          {item.done ? "Complete" : item.cta}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Connect Your Tools */}
              <div style={{ background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, padding: "28px 28px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>Integrations</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>Connect your tools</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.5 }}>Link your financial and business tools so GovCert can pull data directly into your applications.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { id: "quickbooks", name: "QuickBooks", icon: "📗", desc: "P&L, Balance Sheet, revenue data", color: "#2CA01C" },
                    { id: "gusto", name: "Gusto", icon: "🟡", desc: "Payroll totals, employee roster", color: "#F45D48" },
                    { id: "sam", name: "SAM.gov", icon: "🏛️", desc: "Entity registration, NAICS codes", color: "#1A3F7A" },
                  ].map(tool => (
                    <div key={tool.id} style={{ padding: "16px", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, textAlign: "center" as const, transition: "all .2s" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.background = "rgba(200,155,60,.03)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{tool.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>{tool.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink4)", marginBottom: 12, lineHeight: 1.4 }}>{tool.desc}</div>
                      <button onClick={() => {
                        if (tool.id === "sam") { router.push("/portal/integrations"); return; }
                        const token = localStorage.getItem("token");
                        if (clientId) window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app"}/api/oauth/${tool.id}/start?clientId=${clientId}&token=${token}`;
                      }} style={{ padding: "7px 16px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                        Connect →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start an Application */}
              <div style={{ background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, padding: "28px 28px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>Applications</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>Start a certification application</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.5 }}>Choose a certification type to begin. We recommend completing the eligibility assessment first.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { type: "GSA_MAS", label: "GSA Multiple Award Schedule", badge: "GSA", badgeColor: "#1A6644", badgeBg: "#E6F4EE", desc: "Pre-negotiated federal contracts. The fastest path to government revenue.", available: true },
                    { type: "EIGHT_A", label: "8(a) Business Development", badge: "SBA", badgeColor: "#1A3F7A", badgeBg: "#E8EEF8", desc: "Nine-year program for socially and economically disadvantaged businesses.", available: true },
                    { type: "WOSB", label: "WOSB / EDWOSB", badge: "SBA", badgeColor: "#8A5E10", badgeBg: "#FBF0DC", desc: "Women-Owned Small Business certification for set-aside contracts.", available: false },
                    { type: "HUBZONE", label: "HUBZone", badge: "SBA", badgeColor: "#1A3F7A", badgeBg: "#E8EEF8", desc: "10% price evaluation preference for businesses in underutilized zones.", available: false },
                    { type: "SDVOSB", label: "SDVOSB / VOSB", badge: "VA", badgeColor: "#5A1A6A", badgeBg: "#F0E8F8", desc: "Service-Disabled Veteran-Owned Small Business certification.", available: false },
                    { type: "MBE", label: "State MBE / DBE", badge: "State", badgeColor: "#5A1A6A", badgeBg: "#F0E8F8", desc: "Minority and Disadvantaged Business Enterprise for state contracts.", available: false },
                  ].map(cert => (
                    <div key={cert.type} style={{ padding: "18px", border: `1px solid rgba(200,155,60,.08)`, borderRadius: 12, position: "relative", opacity: cert.available ? 1 : 0.6, borderTop: cert.available ? "3px solid transparent" : undefined, backgroundImage: cert.available ? "linear-gradient(#fff, #fff), linear-gradient(90deg, #C89B3C, #E8B84B)" : undefined, backgroundOrigin: "border-box", backgroundClip: cert.available ? "padding-box, border-box" : undefined, transition: "all .2s" }}>
                      {!cert.available && (
                        <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", borderRadius: 100, fontSize: 9.5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".06em", background: "var(--navy)", color: "var(--gold2)", border: "1px solid rgba(200,155,60,.2)" }}>
                          Coming Soon
                        </div>
                      )}
                      <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 100, marginBottom: 10, color: cert.badgeColor, background: cert.badgeBg }}>{cert.badge}</span>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>{cert.label}</div>
                      <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5, marginBottom: 14 }}>{cert.desc}</div>
                      {cert.available ? (
                        <button onClick={async () => {
                          if (!clientId) return;
                          try {
                            const newCert = await apiRequest("/api/certifications", {
                              method: "POST",
                              body: JSON.stringify({ clientId, type: cert.type, status: "IN_PROGRESS" }),
                            });
                            const wizardBase = cert.type === "EIGHT_A" ? `/certifications/${newCert.id}/8a/social-disadvantage` : `/certifications/${newCert.id}/corporate`;
                            router.push(wizardBase);
                          } catch (err: any) {
                            if (err.message?.includes("already has")) {
                              alert(err.message);
                            } else {
                              console.error(err);
                            }
                          }
                        }} style={{ padding: "8px 20px", background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 20px rgba(200,155,60,.35)", transition: "all .2s" }}>
                          Start Application →
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--ink4)" }}>Under development</span>
                      )}
                    </div>
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
                  <a href="/portal/upgrade" style={{ padding: "10px 22px", background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" as const, boxShadow: "0 4px 20px rgba(200,155,60,.35)" }}>
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
                    <div key={cert.id} style={{ background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)" }}>
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

          <div style={{ marginTop: 28, padding: "20px 24px", background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", display: "flex", gap: 16, alignItems: "center" }}>
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