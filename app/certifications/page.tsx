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

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  NOT_STARTED: { bg: "var(--cream2)", color: "var(--ink3)", label: "Not Started" },
  IN_PROGRESS: { bg: "var(--amber-bg)", color: "var(--amber)", label: "In Progress" },
  SUBMITTED: { bg: "var(--blue-bg)", color: "var(--blue)", label: "Submitted" },
  APPROVED: { bg: "var(--green-bg)", color: "var(--green)", label: "Approved" },
  EXPIRED: { bg: "var(--red-bg)", color: "var(--red)", label: "Expired" },
  REJECTED: { bg: "var(--red-bg)", color: "var(--red)", label: "Rejected" },
};

export default function CertificationsPage() {
  const router = useRouter();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCerts();
  }, []);

  async function fetchCerts() {
    try {
      const data = await apiRequest("/api/certifications");
      setCerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Certification Management</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Certifications</h1>
              <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>{certs.length} certification{certs.length !== 1 ? "s" : ""} across all clients</p>
            </div>
            <a href="/certifications/new" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
              + Start New Certification
            </a>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--ink4)" }}>Loading...</div>
          ) : certs.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "80px 40px", textAlign: "center", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 10 }}>No certifications yet</h2>
              <p style={{ color: "var(--ink3)", fontSize: 14, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>Start a new certification application for one of your clients.</p>
              <a href="/certifications/new" style={{ display: "inline-flex", padding: "12px 28px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                + Start First Certification
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {certs.map(cert => {
                const style = STATUS_STYLES[cert.status] || STATUS_STYLES.NOT_STARTED;
                return (
                  <div key={cert.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", gap: 20 }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow-lg)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "var(--shadow)")}>
                    <div style={{ width: 44, height: 44, background: "var(--gold-bg)", border: "1px solid rgba(200,155,60,.25)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📋</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{CERT_LABELS[cert.type] || cert.type}</div>
                      <div style={{ fontSize: 12, color: "var(--ink3)" }}>{cert.client?.businessName || "Unknown client"}</div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                    <a href={`/certifications/${cert.id}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500, flexShrink: 0 }}>
                      Open →
                    </a>
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