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

const SIN_LABELS: Record<string, string> = {
  "541511": "Custom Computer Programming",
  "541512": "Computer Systems Design",
  "541519": "Other Computer Related Services",
  "541611": "Management Consulting",
  "541613": "Marketing Consulting",
  "541618": "Other Management Consulting",
  "541690": "Scientific & Technical Consulting",
  "561110": "Office Administrative Services",
  "561210": "Facilities Support Services",
  "611430": "Professional & Management Training",
};

export default function CertificationDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCert();
  }, []);

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

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "⬛" },
    { label: "Clients", href: "/clients", icon: "👥" },
    { label: "Certifications", href: "/certifications", icon: "📋", active: true },
    { label: "Documents", href: "/documents", icon: "📄" },
    { label: "Calendar", href: "/calendar", icon: "📅" },
    { label: "Integrations", href: "/integrations", icon: "🔗" },
    { label: "Plan", href: "/plan", icon: "📊" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const app = cert?.application;
  const selectedSINs = app?.selectedSINs ? app.selectedSINs.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  const yearsInBusiness = parseFloat(app?.yearsInBusiness || "99");
  const needsSpringboard = yearsInBusiness < 2;

  const sections = [
    {
      id: "corporate",
      label: "Corporate Experience",
      desc: "Company overview, capabilities, federal marketing plan",
      icon: "🏢",
      href: `/certifications/${certId}/corporate`,
      complete: !!app?.narrativeCorp,
      chars: (() => { try { const p = JSON.parse(app?.narrativeCorp || "{}"); return Object.values(p.answers || p).join("").length; } catch { return app?.narrativeCorp?.length || 0; } })(),
      charLimit: 10000,
    },
    {
      id: "qcp",
      label: "Quality Control Plan",
      desc: "Review procedures, QC personnel, corrective actions",
      icon: "✅",
      href: `/certifications/${certId}/qcp`,
      complete: !!app?.narrativeQCP,
      chars: (() => { try { const p = JSON.parse(app?.narrativeQCP || "{}"); return Object.values(p.answers || p).join("").length; } catch { return app?.narrativeQCP?.length || 0; } })(),
      charLimit: 10000,
    },
    ...selectedSINs.map((sin: string) => ({
      id: `experience-${sin}`,
      label: `Project Experience — SIN ${sin}`,
      desc: SIN_LABELS[sin] || sin,
      icon: "📋",
      href: `/certifications/${certId}/experience/${sin}`,
      complete: false,
      chars: 0,
      charLimit: 10000,
    })),
    {
      id: "past-performance",
      label: "Past Performance",
      desc: "3 references required — CPARS reports or PPQs",
      icon: "⭐",
      href: `/certifications/${certId}/past-performance`,
      complete: (app?.pastPerformance?.length || 0) >= 3,
      count: app?.pastPerformance?.length || 0,
      needed: 3,
      chars: null,
      charLimit: null,
    },
    {
      id: "financials",
      label: "Financial Statements",
      desc: "2 years P&L and Balance Sheet",
      icon: "📊",
      href: `/certifications/${certId}/financials`,
      complete: false,
      chars: null,
      charLimit: null,
    },
    {
      id: "pricing",
      label: "Pricing (CSP-1)",
      desc: "Labor categories, rates, Most Favored Customer pricing",
      icon: "💰",
      href: `/certifications/${certId}/pricing`,
      complete: false,
      chars: null,
      charLimit: null,
    },
  ];

  const completedCount = sections.filter(s => s.complete).length;
  const pct = Math.round(completedCount / sections.length * 100);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {navItems.map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: (item as any).active ? "rgba(200,155,60,.15)" : "transparent",
              border: (item as any).active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: (item as any).active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: (item as any).active ? 500 : 400, marginBottom: 2
            }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
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

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px" }}>
          <a href="/certifications" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>← Back to Certifications</a>

          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              {CERT_LABELS[cert?.type] || cert?.type}
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              {cert?.client?.businessName}
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Application Progress Dashboard</p>
          </div>

          {needsSpringboard && (
            <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--amber)", marginBottom: 6 }}>Startup Springboard Program Detected</div>
              <p style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6, marginBottom: 12 }}>
                This client has less than 2 years of corporate experience. They may qualify for the GSA Startup Springboard Program, which waives the 2-year requirement.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ padding: "8px 18px", background: "var(--amber)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Apply for Startup Springboard</button>
                <button style={{ padding: "8px 18px", background: "transparent", border: "1px solid var(--amber-b)", borderRadius: "var(--r)", color: "var(--amber)", fontSize: 13, cursor: "pointer" }}>Learn More</button>
              </div>
            </div>
          )}

          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 28, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 4 }}>Overall Progress</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "#fff", fontWeight: 300, lineHeight: 1 }}>
                  {pct}<span style={{ fontSize: 24 }}>%</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>{completedCount} of {sections.length} sections complete</div>
              </div>
              <a href={`/certifications/${certId}/submit`} style={{ padding: "12px 24px", background: pct === 100 ? "var(--gold)" : "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                {pct === 100 ? "Generate eOffer Package" : "View Submission Package"}
              </a>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Data Sources</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 16 }}>Connected Integrations</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { name: "QuickBooks", icon: "📗", desc: "Financial data" },
                { name: "Gusto", icon: "🟡", desc: "Payroll & employees" },
                { name: "SAM.gov", icon: "🏛️", desc: "Entity registration" },
                { name: "CPARS", icon: "⭐", desc: "Performance reports" },
              ].map(int => (
                <div key={int.name} style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--cream)" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{int.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{int.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 8 }}>{int.desc}</div>
                  <a href={`/clients/${cert?.client?.id}`} style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>Connect</a>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 12 }}>Application Sections</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sections.map((section, i) => (
              <a key={section.id} href={section.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", border: `1px solid ${section.complete ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", padding: "20px 24px", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", gap: 16, transition: "all .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow-lg)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "var(--shadow)")}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: section.complete ? "var(--green)" : "var(--cream2)", border: `2px solid ${section.complete ? "var(--green)" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, color: section.complete ? "#fff" : "var(--ink3)", fontWeight: 600 }}>
                    {section.complete ? "✓" : i + 1}
                  </div>
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{section.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{section.label}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink3)" }}>{section.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {section.charLimit && section.chars !== null && (
                      <div style={{ fontSize: 11, color: "var(--ink4)", fontFamily: "monospace", marginBottom: 4 }}>
                        {(section.chars as number).toLocaleString()} / {section.charLimit.toLocaleString()} chars
                      </div>
                    )}
                    {(section as any).count !== undefined && (
                      <div style={{ fontSize: 11, color: "var(--ink4)", marginBottom: 4 }}>
                        {(section as any).count} / {(section as any).needed} references
                      </div>
                    )}
                    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: section.complete ? "var(--green-bg)" : "var(--cream2)", color: section.complete ? "var(--green)" : "var(--ink3)" }}>
                      {section.complete ? "Complete" : "Not Started"}
                    </span>
                  </div>
                  <div style={{ fontSize: 18, color: "var(--gold)", flexShrink: 0 }}>→</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}