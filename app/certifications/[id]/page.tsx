"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";

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

import { GSA_SIN_LIST, SIN_LABELS, SIN_CATEGORIES } from "@/lib/sins";

export default function CertificationDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sinPickerOpen, setSinPickerOpen] = useState(false);
  const [selectedSINsPicker, setSelectedSINsPicker] = useState<string[]>([]);
  const [savingSINs, setSavingSINs] = useState(false);
  const [sinSearch, setSinSearch] = useState("");
  const [sinCategoryFilter, setSinCategoryFilter] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("cert-dashboard");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function saveSINs() {
    if (selectedSINsPicker.length === 0) return;
    setSavingSINs(true);
    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert.clientId,
          certType: cert.type,
          currentStep: cert?.application?.currentStep || 1,
          selectedSINs: selectedSINsPicker.join(","),
        }),
      });
      // Refresh cert to pick up new SINs
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      setSinPickerOpen(false);
    } catch (err: any) {
      alert("Failed to save SINs: " + (err.message || "Unknown error"));
    } finally {
      setSavingSINs(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const isCustomer = user?.role === "CUSTOMER";

  const adminNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: "⬛" },
    { label: "Clients", href: "/clients", icon: "👥" },
    { label: "Certifications", href: "/certifications", icon: "📋", active: true },
    { label: "Documents", href: "/documents", icon: "📄" },
    { label: "Calendar", href: "/calendar", icon: "📅" },
    { label: "Integrations", href: "/integrations", icon: "🔗" },
    { label: "Plan", href: "/plan", icon: "📊" },
  ];

  const customerNavItems = [
    { label: "My Application", href: `/certifications/${certId}`, icon: "📋", active: true },
    { label: "Back to Portal", href: "/portal", icon: "🏠" },
  ];

  const navItems = isCustomer ? customerNavItems : adminNavItems;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const app = cert?.application;
  const selectedSINs = app?.selectedSINs ? app.selectedSINs.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  const yearsInBusiness = parseFloat(app?.yearsInBusiness || "99");
  const needsSpringboard = yearsInBusiness < 2;

  const isEightA = cert?.type === "EIGHT_A";
  const isOASIS = cert?.type === "OASIS_PLUS";

  const oasisPlusSections = [
    {
      id: "domains",
      label: "Domain Selection",
      desc: "Select OASIS+ domains and solicitation type for your proposal",
      icon: "🎯",
      href: `/certifications/${certId}/oasis-plus/domains`,
      complete: !!app?.oasisDomains,
      chars: null,
      charLimit: null,
    },
    {
      id: "contract-history",
      label: "Contract History",
      desc: "Upload and AI-analyze your contract history to identify qualifying projects",
      icon: "📂",
      href: `/certifications/${certId}/oasis-plus/contract-history`,
      complete: !!app?.oasisContractHistory,
      chars: null,
      charLimit: null,
    },
    {
      id: "scorecard",
      label: "Self-Scoring Worksheet",
      desc: "Interactive scoring matrix for each selected domain",
      icon: "📊",
      href: `/certifications/${certId}/oasis-plus/scorecard`,
      complete: !!app?.oasisScorecardData,
      chars: null,
      charLimit: null,
    },
    {
      id: "qualifying-projects",
      label: "Qualifying Projects",
      desc: "Up to 5 qualifying projects with narratives and AAV calculations",
      icon: "📋",
      href: `/certifications/${certId}/oasis-plus/qualifying-projects`,
      complete: !!app?.oasisQPData,
      chars: null,
      charLimit: null,
    },
    {
      id: "past-performance-oasis",
      label: "Past Performance",
      desc: "CPARS ratings and references for each qualifying project",
      icon: "⭐",
      href: `/certifications/${certId}/oasis-plus/past-performance`,
      complete: !!app?.oasisPPData,
      chars: null,
      charLimit: null,
    },
    {
      id: "federal-experience",
      label: "Federal Experience",
      desc: "Additional federal prime contracts beyond qualifying projects",
      icon: "🏛️",
      href: `/certifications/${certId}/oasis-plus/federal-experience`,
      complete: !!app?.oasisFEPData,
      chars: null,
      charLimit: null,
    },
    {
      id: "systems-certs",
      label: "Systems & Certifications",
      desc: "Business systems, facility clearances, and third-party certifications",
      icon: "🔒",
      href: `/certifications/${certId}/oasis-plus/systems-certs`,
      complete: !!app?.oasisSystemsData,
      chars: null,
      charLimit: null,
    },
  ];

  const gsaSections = [
    {
      id: "corporate",
      label: "Corporate Experience",
      desc: "Company overview, capabilities, federal marketing plan",
      icon: "🏢",
      href: `/certifications/${certId}/corporate`,
      complete: !!app?.narrativeCorp,
      chars: (() => { try { const p = JSON.parse(app?.narrativeCorp || "{}"); return Object.values(p.answers || p.narratives || p).join("").length; } catch { return app?.narrativeCorp?.length || 0; } })(),
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

  const eightASections = [
    {
      id: "social-disadvantage",
      label: "Social Disadvantage Narrative",
      desc: "Personal narrative describing social disadvantage based on race, ethnicity, gender, or other qualifying factors",
      icon: "👥",
      href: `/certifications/${certId}/8a/social-disadvantage`,
      complete: !!app?.socialDisadvantage,
      chars: app?.socialDisadvantage?.length || 0,
      charLimit: 8000,
    },
    {
      id: "economic-disadvantage",
      label: "Economic Disadvantage",
      desc: "Personal financial statements, net worth analysis, and economic hardship documentation",
      icon: "💵",
      href: `/certifications/${certId}/8a/economic-disadvantage`,
      complete: !!app?.economicDisadvantage,
      chars: app?.economicDisadvantage?.length || 0,
      charLimit: 6000,
    },
    {
      id: "business-plan",
      label: "Business Plan",
      desc: "Strategic business plan including market analysis, growth targets, and management approach",
      icon: "📝",
      href: `/certifications/${certId}/8a/business-plan`,
      complete: !!app?.businessPlan,
      chars: app?.businessPlan?.length || 0,
      charLimit: 15000,
    },
    {
      id: "corporate-8a",
      label: "Corporate Experience",
      desc: "Company background, capabilities, and operational history",
      icon: "🏢",
      href: `/certifications/${certId}/8a/corporate`,
      complete: !!app?.narrativeCorp,
      chars: (() => { try { const p = JSON.parse(app?.narrativeCorp || "{}"); return Object.values(p.answers || p.narratives || p).join("").length; } catch { return app?.narrativeCorp?.length || 0; } })(),
      charLimit: 10000,
    },
    {
      id: "past-performance-8a",
      label: "Past Performance",
      desc: "Contract history, performance references, and project outcomes",
      icon: "⭐",
      href: `/certifications/${certId}/8a/past-performance`,
      complete: (app?.pastPerformance?.length || 0) >= 3,
      count: app?.pastPerformance?.length || 0,
      needed: 3,
      chars: null,
      charLimit: null,
    },
    {
      id: "financials-8a",
      label: "Financials & Net Worth",
      desc: "Personal financial statement, business tax returns, and SBA Form 413",
      icon: "📊",
      href: `/certifications/${certId}/8a/financials`,
      complete: !!app?.financialData,
      chars: null,
      charLimit: null,
    },
  ];

  const sections = isOASIS ? oasisPlusSections : isEightA ? eightASections : gsaSections;

  const completedCount = sections.filter(s => s.complete).length;
  const pct = Math.round(completedCount / sections.length * 100);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <a href={isCustomer ? "/portal" : "/dashboard"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {isCustomer && (
            <div style={{ padding: "4px 9px 8px" }}>
              <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase" as const, letterSpacing: ".08em", fontWeight: 600 }}>Client Portal</div>
            </div>
          )}
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
            {isCustomer && <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Client Portal</div>}
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px" }}>
          <a href={isCustomer ? "/portal" : "/certifications"} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← {isCustomer ? "Back to Portal" : "Back to Certifications"}
          </a>

          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
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
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 4 }}>Overall Progress</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "#fff", fontWeight: 300, lineHeight: 1 }}>
                  {pct}<span style={{ fontSize: 24 }}>%</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>{completedCount} of {sections.length} sections complete</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={`/certifications/${certId}/${isOASIS ? "oasis-plus/review" : isEightA ? "8a/review" : "review"}`} style={{ padding: "12px 20px", background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                  🔍 GovCert Review
                </a>
                <a href={`/certifications/${certId}/${isOASIS ? "oasis-plus/submit" : isEightA ? "8a/submit" : "submit"}`} style={{ padding: "12px 24px", background: pct === 100 ? "var(--gold)" : "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                  {isOASIS ? (pct === 100 ? "View OSP Package" : "Prepare Submission") : isEightA ? (pct === 100 ? "View SBA Package" : "Submit to SBA") : (pct === 100 ? "Generate eOffer Package" : "View Submission Package")}
                </a>
              </div>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
            </div>
          </div>

          {!isCustomer && (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Data Sources</div>
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
                    <a href={isCustomer ? "/portal/integrations" : `/clients/${cert?.client?.id}`} style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>Connect</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIN Selection — show if GSA_MAS and no SINs selected */}
          {cert?.type === "GSA_MAS" && (selectedSINs.length === 0 || sinPickerOpen) && (() => {
            const filteredSINs = GSA_SIN_LIST.filter(s =>
              (!sinCategoryFilter || s.category === sinCategoryFilter) &&
              (!sinSearch || s.code.toLowerCase().includes(sinSearch.toLowerCase()) || s.label.toLowerCase().includes(sinSearch.toLowerCase()) || s.category.toLowerCase().includes(sinSearch.toLowerCase()))
            );
            return (
            <div style={{ background: "#fff", border: "2px solid var(--gold)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 20, boxShadow: "var(--shadow-lg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>
                    {selectedSINs.length === 0 ? "Select Your SIN Codes" : "Edit SIN Codes"}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--ink3)" }}>Choose the Special Item Numbers (SINs) you want to offer under your GSA Schedule. Search or filter by category.</p>
                </div>
                {sinPickerOpen && selectedSINs.length > 0 && (
                  <button onClick={() => { setSinPickerOpen(false); setSinSearch(""); setSinCategoryFilter(""); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--ink4)" }}>&#x2715;</button>
                )}
              </div>
              {/* Search + Category filter */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input type="text" value={sinSearch} onChange={e => setSinSearch(e.target.value)} placeholder="Search SINs by code, name, or category..."
                  style={{ flex: 1, padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }} />
                <select value={sinCategoryFilter} onChange={e => setSinCategoryFilter(e.target.value)}
                  style={{ padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink)", background: "#fff", outline: "none", minWidth: 180 }}>
                  <option value="">All Categories ({GSA_SIN_LIST.length} SINs)</option>
                  {SIN_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat} ({GSA_SIN_LIST.filter(s => s.category === cat).length})</option>
                  ))}
                </select>
              </div>
              {/* Selected count */}
              {selectedSINsPicker.length > 0 && (
                <div style={{ padding: "8px 14px", background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.2)", borderRadius: "var(--r)", marginBottom: 12, fontSize: 13, color: "var(--gold)", fontWeight: 500 }}>
                  {selectedSINsPicker.length} SIN{selectedSINsPicker.length !== 1 ? "s" : ""} selected: {selectedSINsPicker.join(", ")}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20, maxHeight: 400, overflowY: "auto" }}>
                {filteredSINs.map(({ code, label, category }) => {
                  const isSelected = selectedSINsPicker.includes(code);
                  return (
                    <div key={code} onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSINsPicker(prev => prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]);
                    }} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: "var(--r)",
                      border: `1.5px solid ${isSelected ? "var(--gold)" : "var(--border)"}`,
                      background: isSelected ? "rgba(200,155,60,.06)" : "#fff",
                      cursor: "pointer", transition: "all .12s", userSelect: "none",
                    }}>
                      <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: "var(--gold)", pointerEvents: "none", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? "var(--gold)" : "var(--navy)" }}>{code}</div>
                        <div style={{ fontSize: 11, color: "var(--ink3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{label}</div>
                        <div style={{ fontSize: 10, color: "var(--ink4)" }}>{category}</div>
                      </div>
                    </div>
                  );
                })}
                {filteredSINs.length === 0 && (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center" as const, padding: 20, color: "var(--ink4)", fontSize: 13 }}>No SINs match your search. Try a different term or clear filters.</div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={saveSINs} disabled={savingSINs || selectedSINsPicker.length === 0}
                  style={{ padding: "10px 28px", background: selectedSINsPicker.length > 0 ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: selectedSINsPicker.length > 0 ? "#fff" : "var(--ink4)", cursor: selectedSINsPicker.length > 0 ? "pointer" : "not-allowed", boxShadow: selectedSINsPicker.length > 0 ? "0 4px 16px rgba(200,155,60,.3)" : "none" }}>
                  {savingSINs ? "Saving..." : `Save ${selectedSINsPicker.length} SIN${selectedSINsPicker.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
            );
          })()}

          {/* Edit SINs link */}
          {cert?.type === "GSA_MAS" && selectedSINs.length > 0 && !sinPickerOpen && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button onClick={() => { setSinPickerOpen(true); setSelectedSINsPicker([...selectedSINs]); }}
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--gold)", cursor: "pointer", textDecoration: "underline" }}>
                Edit SIN codes
              </button>
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 12 }}>Application Sections</div>
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
                  <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
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
                      {section.complete ? "Complete" : "Start →"}
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