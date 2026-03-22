"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ clients: 0, certifications: 0, pending: 0, expiring: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "CUSTOMER") {
        router.push("/portal");
        return;
      }
      setUser(parsed);
    }
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [clients, certs] = await Promise.all([
        apiRequest("/api/clients"),
        apiRequest("/api/certifications"),
      ]);
      const pending = certs.filter((c: any) => c.status === "IN_PROGRESS" || c.status === "NOT_STARTED").length;
      setStats({
        clients: clients.length,
        certifications: certs.length,
        pending,
        expiring: 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top right, rgba(200,155,60,.03) 0%, transparent 50%), var(--cream)", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "linear-gradient(180deg, #0B1929 0%, #0D1F35 100%)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
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
          {[
            { label: "Dashboard", icon: "⬛", href: "/dashboard", active: true },
            { label: "Eligibility", icon: "✅", href: "/clients" },
            { label: "Clients", icon: "👥", href: "/clients" },
            { label: "Certifications", icon: "📋", href: "/certifications" },
            { label: "Documents", icon: "📄", href: "/documents" },
            { label: "Calendar", icon: "📅", href: "/calendar" },
            { label: "Integrations", icon: "🔗", href: "/integrations" },
            { label: "Team & Advisors", icon: "👤", href: "/settings/team" },
            { label: "Usage & Costs", icon: "📊", href: "/usage" },
            { label: "Pricing", icon: "💰", href: "/settings/pricing" },
          ].map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
              background: item.active ? "rgba(200,155,60,.15)" : "transparent",
              border: item.active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              borderLeft: item.active ? "3px solid var(--gold)" : "3px solid transparent",
              color: item.active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: item.active ? 500 : 400,
              marginBottom: 2, transition: "all .15s"
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Overview</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 4 }}>
              Welcome back, {user.firstName}
            </h1>
            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", borderRadius: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Your certification management dashboard</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Active Clients", value: String(stats.clients), change: "View all clients" },
              { label: "Certifications", value: String(stats.certifications), change: "View certifications" },
              { label: "Pending Items", value: String(stats.pending), change: stats.pending === 0 ? "All clear" : "In progress" },
              { label: "Expiring Soon", value: String(stats.expiring), change: stats.expiring === 0 ? "No upcoming expirations" : "Review soon" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#fff", borderRadius: 12, padding: "24px 20px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", border: "1px solid rgba(200,155,60,.08)", borderTop: "3px solid var(--gold)", transition: "all .2s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)"; }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "var(--navy)", fontWeight: 400, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: "8px 0 4px" }}>{stat.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink4)" }}>{stat.change}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", border: "1px solid rgba(200,155,60,.08)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Actions</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Quick Actions</h2>
              {[
                { label: "Add New Client", sub: "Register a business for certification tracking", href: "/clients/new" },
                { label: "Start Certification", sub: "Begin a new certification application", href: "/certifications/new" },
                { label: "View All Clients", sub: "Browse and manage your client roster", href: "/clients" },
              ].map(action => (
                <a key={action.label} href={action.href} style={{ display: "block", padding: "14px 0", borderBottom: "1px solid var(--border)", textDecoration: "none" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{action.label} <span style={{ color: "var(--gold)" }}>→</span></div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>{action.sub}</div>
                </a>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", border: "1px solid rgba(200,155,60,.08)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Activity</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Recent Activity</h2>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "var(--ink4)", textAlign: "center" as const }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink3)", marginBottom: 4 }}>No activity yet</div>
                <div style={{ fontSize: 12, color: "var(--ink4)" }}>Add your first client to get started</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}