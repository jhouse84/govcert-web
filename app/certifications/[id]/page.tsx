// app/certifications/[id]/page.tsx - REPLACE entire file
"use client";
import { useEffect, useState } from "react";
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

export default function CertificationDashboard({ params }: { params: { id: string } }) {
  const router = useRouter();
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
      const data = await apiRequest(`/api/certifications/${params.id}`);
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

  // Calculate completion per section
  const sections = [
    {
      id: "corporate",
      label: "Corporate Experience",
      desc: "Company overview, capabilities, federal marketing plan",
      icon: "🏢",
      required: true,
      charLimit: 10000,
      href: `/certifications/${params.id}/corporate`,
      complete: !!app?.narrativeCorp,
      chars: app?.narrativeCorp?.length || 0,
    },
    {
      id: "qcp",
      label: "Quality Control Plan",
      desc: "Review procedures, QC personnel, corrective actions",
      icon: "✅",
      required: true,
      charLimit: 10000,
      href: `/certifications/${params.id}/qcp`,
      complete: !!app?.narrativeQCP,
      chars: app?.narrativeQCP?.length || 0,
    },
    ...selectedSINs.map((sin: string) => ({
      id: `experience-${sin}`,
      label: `Project Experience — SIN ${sin}`,
      desc: SIN_LABELS[sin] || sin,
      icon: "📋",
      required: true,
      charLimit: 10000,
      href: `/certifications/${params.id}/experience/${sin}`,
      complete: false,
      chars: 0,
    })),
    {
      id: "past-performance",
      label: "Past Performance",
      desc: "3 references required — CPARS reports or PPQs",
      icon: "⭐",
      required: true,
      charLimit: null,
      href: `/certifications/${params.id}/past-performance`,
      complete: (app?.pastPerformance?.length || 0) >= 3,
      chars: null,
      count: app?.pastPerformance?.length || 0,
      needed: 3,
    },
    {
      id: "financials",
      label: "Financial Statements",
      desc: "2 years P&L and Balance Sheet",
      icon: "📊",
      required: true,
      charLimit: null,
      href: `/certifications/${params.id}/financials`,
      complete: false,
      chars: null,
    },
    {
      id: "pricing",
      label: "Pricing (CSP-1)",
      desc: "Labor categories, rates, Most Favored Customer pricing",
      icon: "💰",
      required: true,
      charLimit: null,
      href: `/certifications/${params.id}/pricing`,
      complete: false,
      chars: null,
    },
  ];

  const completedCount = sections.filter(s => s.complete).length;
  const pct = Math.round(completedCount / sections.length * 100);

  // Waiver detection
  const yearsInBusiness = parseFloat(app?.yearsInBusiness || "99");
  const needsWaiver = yearsInBusiness < 2;
  const needsStartupSpringboard = yearsInBusiness < 2;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      {/* Sidebar */}
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

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px" }}>
          <a href="/certifications" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>← Back to Certifications</a>

          {/* Header */}
          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              {CERT_LABELS[cert?.type] || cert?.type}
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              {cert?.client?.businessName}
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Application Progress Dashboard</p>
          </div>

          {/* Waiver / Springboard Alert */}
          {needsStartupSpringboard && (
            <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--amber)", marginBottom: 6 }}>⚡ Startup Springboard P