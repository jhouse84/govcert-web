"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchClient();
  }, []);

  async function fetchClient() {
    try {
      const data = await apiRequest(`/api/clients/${params.id}`);
      setClient(data);
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

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading...
    </div>
  );

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
              background: item.active ? "rgba(200,155,60,.15)" : "transparent",
              border: item.active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: item.active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: item.active ? 500 : 400, marginBottom: 2
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
          {/* Back + Header */}
          <div style={{ marginBottom: 36 }}>
            <a href="/clients" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>← Back to Clients</a>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Client Profile</div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
                  {client?.businessName}
                </h1>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {client?.entityType && (
                    <span style={{ fontSize: 13, color: "var(--ink3)" }}>{client.entityType}</span>
                  )}
                  {client?.ein && (
                    <span style={{ fontSize: 13, color: "var(--ink3)", fontFamily: "monospace" }}>EIN: {client.ein}</span>
                  )}
                  <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: "var(--green-bg)", color: "var(--green)" }}>Active</span>
                </div>
              </div>
              <a href={`/clients/${params.id}/edit`} style={{ padding: "10px 20px", background: "#fff", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                Edit Client
              </a>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Contact Info */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Contact</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 18 }}>Contact Information</h2>
              {[
                { label: "Email", value: client?.email },
                { label: "Phone", value: client?.phone },
                { label: "Website", value: client?.website },
                { label: "Owner", value: client?.ownerName },
              ].map(row => row.value ? (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--ink4)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: "var(--ink)" }}>{row.value}</span>
                </div>
              ) : null)}
            </div>

            {/* Business Info */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Business</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 18 }}>Business Details</h2>
              {[
                { label: "EIN", value: client?.ein },
                { label: "Entity Type", value: client?.entityType },
                { label: "UEI", value: client?.uei },
                { label: "CAGE Code", value: client?.cageCode },
                { label: "Address", value: [client?.address, client?.city, client?.state, client?.zip].filter(Boolean).join(", ") },
              ].map(row => row.value ? (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--ink4)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: "var(--ink)" }}>{row.value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Certifications */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Certifications</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400 }}>Active Certifications</h2>
              </div>
              <a href="/certifications/new" style={{ padding: "8px 16px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                + Add Certification
              </a>
            </div>
            {client?.certifications?.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink4)" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13 }}>No certifications yet. Add one to get started.</div>
              </div>
            ) : (
              client?.certifications?.map((cert: any) => (
                <div key={cert.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{cert.type}</div>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "var(--amber-bg)", color: "var(--amber)", fontWeight: 500 }}>{cert.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}