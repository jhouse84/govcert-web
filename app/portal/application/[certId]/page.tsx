"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { ApplicationCoachingModal } from "@/components/ApplicationCoachingModal";

const CERT_LABELS: Record<string, string> = {
  GSA_MAS: "GSA Multiple Award Schedule",
  EIGHT_A: "8(a) Business Development",
  OASIS_PLUS: "GSA OASIS+",
  WOSB: "Women-Owned Small Business",
  HUBZONE: "HUBZone",
  MBE: "Minority Business Enterprise",
  SDVOSB: "Service-Disabled Veteran-Owned",
  VOSB: "Veteran-Owned Small Business",
};

function extractNarrative(json: string | undefined, key: string): string {
  if (!json) return "";
  try {
    const p = JSON.parse(json);
    if (p.narratives) return p.narratives[key] || "";
    if (p.answers) return p.answers[key] || "";
    return p[key] || "";
  } catch { return ""; }
}

export default function PortalApplicationPage({ params }: { params: Promise<{ certId: string }> }) {
  const router = useRouter();
  const { certId } = React.use(params);
  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("corporate");
  const [showCoaching, setShowCoaching] = useState(false);
  const [coachingCertType, setCoachingCertType] = useState<string>("GSA_MAS");
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCert();
    fetchClientId();
  }, []);

  async function fetchClientId() {
    try {
      const clients = await apiRequest("/api/clients");
      if (Array.isArray(clients) && clients.length > 0) {
        setClientId(clients[0].id);
        checkCoaching(clients[0].id);
      }
    } catch {}
  }

  async function checkCoaching(cId: string) {
    try {
      const certData = await apiRequest(`/api/certifications/${certId}`);
      const certType = certData?.certType || certData?.type || "GSA_MAS";
      setCoachingCertType(certType);
      const coachingKey = `govcert_coaching_done_${certId}`;
      if (!localStorage.getItem(coachingKey)) {
        setShowCoaching(true);
      }
    } catch (err) { console.error("Coaching check failed:", err); }
  }

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const app = cert?.application;

  const SECTIONS = [
    {
      id: "corporate",
      label: "Corporate Experience",
      icon: "🏢",
      hasData: !!app?.narrativeCorp,
      content: app?.narrativeCorp ? (() => {
        try {
          const p = JSON.parse(app.narrativeCorp);
          const narratives = p.narratives || p.answers || p;
          return Object.entries(narratives).filter(([, v]) => v && String(v).trim()).map(([k, v]) => ({
            label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            text: String(v),
          }));
        } catch { return [{ label: "Narrative", text: app.narrativeCorp }]; }
      })() : [],
    },
    {
      id: "qcp",
      label: "Quality Control Plan",
      icon: "✅",
      hasData: !!app?.narrativeQCP,
      content: app?.narrativeQCP ? (() => {
        try {
          const p = JSON.parse(app.narrativeQCP);
          const answers = p.answers || p;
          return Object.entries(answers).filter(([, v]) => v && String(v).trim()).map(([k, v]) => ({
            label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            text: String(v),
          }));
        } catch { return [{ label: "Narrative", text: app.narrativeQCP }]; }
      })() : [],
    },
    {
      id: "pastperformance",
      label: "Past Performance",
      icon: "⭐",
      hasData: (app?.pastPerformance?.length || 0) > 0,
      pastPerformance: app?.pastPerformance || [],
    },
    {
      id: "financials",
      label: "Financial Statements",
      icon: "📊",
      hasData: !!app?.financialData,
      content: app?.financialData ? (() => {
        try {
          const p = JSON.parse(app.financialData);
          return [{ label: `FY ${p.year1Label} Revenue`, text: p.year1?.revenue ? `$${Number(p.year1.revenue).toLocaleString()}` : "Not provided" },
                  { label: `FY ${p.year2Label} Revenue`, text: p.year2?.revenue ? `$${Number(p.year2.revenue).toLocaleString()}` : "Not provided" }];
        } catch { return []; }
      })() : [],
    },
    {
      id: "pricing",
      label: "Pricing (CSP-1)",
      icon: "💰",
      hasData: !!app?.pricingData,
      content: app?.pricingData ? (() => {
        try {
          const p = JSON.parse(app.pricingData);
          return (p.lcats || []).map((l: any) => ({ label: l.title, text: `MFC: $${l.mfcRate}/hr · GSA: $${l.gsaRate}/hr` }));
        } catch { return []; }
      })() : [],
    },
  ];

  const activeS = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>

      {/* Document Coaching Modal — shows on first visit to any application */}
      {showCoaching && clientId && (
        <ApplicationCoachingModal
          clientId={clientId}
          certType={coachingCertType}
          onClose={() => {
            setShowCoaching(false);
            localStorage.setItem(`govcert_coaching_done_${certId}`, new Date().toISOString());
          }}
          onUploadClick={() => {
            setShowCoaching(false);
            localStorage.setItem(`govcert_coaching_done_${certId}`, new Date().toISOString());
            router.push("/portal/documents");
          }}
        />
      )}

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
        <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>Sections</div>
          {SECTIONS.map(section => (
            <button key={section.id} onClick={() => setActiveSection(section.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 9px", borderRadius: "var(--r)", marginBottom: 2, cursor: "pointer", background: activeSection === section.id ? "rgba(200,155,60,.15)" : "transparent", border: activeSection === section.id ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent", color: activeSection === section.id ? "var(--gold2)" : "rgba(255,255,255,.45)", fontSize: 12.5, textAlign: "left" as const }}>
              <span>{section.icon}</span>
              <span style={{ flex: 1 }}>{section.label}</span>
              {section.hasData && <span style={{ fontSize: 9, color: "var(--green)", background: "rgba(26,102,68,.2)", padding: "2px 5px", borderRadius: 3 }}>✓</span>}
            </button>
          ))}
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>
            ← Back to Portal
          </a>
        </div>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 860 }}>
          <a href="/portal" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Portal
          </a>

          <div style={{ marginTop: 20, marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              {CERT_LABELS[cert?.type] || cert?.type}
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 6 }}>
              {cert?.client?.businessName}
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink3)", fontWeight: 300 }}>Review your application drafts below. Contact your advisor with any questions or change requests.</p>
          </div>

          {/* Info banner */}
          <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--rl)", padding: "14px 18px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
            <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--amber)" }}>Read-only view.</strong> These are your AI-drafted narratives. Your advisor manages the content — if you'd like changes, email them directly with your feedback.
            </div>
          </div>

          {/* Active section content */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
            <div style={{ padding: "18px 24px", background: "var(--navy)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{activeS.icon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "#fff" }}>{activeS.label}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                  {activeS.hasData ? "Draft prepared by your advisor" : "Not yet drafted — your advisor is working on this"}
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: activeS.hasData ? "rgba(26,102,68,.3)" : "rgba(255,255,255,.1)", color: activeS.hasData ? "var(--green)" : "rgba(255,255,255,.4)" }}>
                  {activeS.hasData ? "✓ Draft ready" : "In progress"}
                </span>
              </div>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {!activeS.hasData ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink4)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink3)", marginBottom: 6 }}>Not yet drafted</div>
                  <div style={{ fontSize: 13, color: "var(--ink4)", lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
                    Your advisor is working on this section. You'll be notified when it's ready for review.
                  </div>
                </div>
              ) : activeS.id === "pastperformance" ? (
                <div>
                  {(activeS.pastPerformance || []).map((pp: any, i: number) => (
                    <div key={i} style={{ padding: "16px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)", marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{pp.agencyName}</div>
                        <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: pp.ppqs?.[0]?.status === "COMPLETED" ? "var(--green-bg)" : "var(--amber-bg)", color: pp.ppqs?.[0]?.status === "COMPLETED" ? "var(--green)" : "var(--amber)" }}>
                          PPQ: {pp.ppqs?.[0]?.status || "Pending"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 6 }}>
                        {pp.contractNumber && <span style={{ marginRight: 12 }}>#{pp.contractNumber}</span>}
                        {pp.contractValue && <span style={{ marginRight: 12 }}>{pp.contractValue}</span>}
                        {pp.periodStart && <span>{pp.periodStart} – {pp.periodEnd || "Present"}</span>}
                      </div>
                      {pp.description && <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 }}>{pp.description}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {(activeS.content || []).map((item: any, i: number) => (
                    <div key={i}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 8 }}>{item.label}</div>
                      <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif" }}>{item.text}</div>
                      {i < (activeS.content || []).length - 1 && <div style={{ height: 1, background: "var(--border)", marginTop: 20 }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}