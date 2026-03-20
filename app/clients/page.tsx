"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const data = await apiRequest("/api/clients");
      setClients(data);
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
    { label: "Clients", href: "/clients", icon: "👥", active: true },
    { label: "Certifications", href: "/certifications", icon: "📋" },
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
          {navItems.map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: item.active ? "rgba(200,155,60,.15)" : "transparent",
              border: item.active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
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
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Client Management</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Clients</h1>
              <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>{clients.length} client{clients.length !== 1 ? "s" : ""} in your workspace</p>
            </div>
            <a href="/clients/new" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.35)", transition: "all .2s" }}>
              + Add New Client
            </a>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--ink4)" }}>Loading clients...</div>
          ) : clients.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "80px 40px", textAlign: "center", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>👥</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 10 }}>No clients yet</h2>
              <p style={{ color: "var(--ink3)", fontSize: 14, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>Add your first client to start tracking their certifications and compliance requirements.</p>
              <a href="/clients/new" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                + Add Your First Client
              </a>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", padding: "10px 20px", borderBottom: "1px solid var(--border)", background: "var(--cream)" }}>
                {["Client Name", "EIN", "Entity Type", "Status", ""].map(h => (
                  <div key={h} style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink3)" }}>{h}</div>
                ))}
              </div>
              {clients.map((client, i) => (
                <div key={client.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", padding: "16px 20px", borderBottom: i < clients.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{client.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)" }}>{client.email || "No email"}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink2)", fontFamily: "monospace" }}>{client.ein || "—"}</div>
                  <div style={{ fontSize: 13, color: "var(--ink2)" }}>{client.entityType || "—"}</div>
                  <div>
                    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: "var(--green-bg)", color: "var(--green)" }}>Active</span>
                  </div>
                  <div>
                    <a href={`/clients/${client.id}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>View →</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}