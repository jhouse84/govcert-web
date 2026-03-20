"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function NewClientPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", ein: "", entityType: "", address: "",
    city: "", state: "", zip: "", phone: "", email: "", website: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiRequest("/api/clients", { method: "POST", body: JSON.stringify(form) });
      router.push("/clients");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const inputStyle = { width: "100%", padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const, background: "#fff", fontFamily: "'DM Sans', sans-serif" };
  const labelStyle = { display: "block" as const, fontSize: 12, fontWeight: 500 as const, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".07em" };

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
              marginBottom: 2
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
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 800 }}>
          <div style={{ marginBottom: 36 }}>
            <a href="/clients" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>← Back to Clients</a>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8, marginTop: 20 }}>New Client</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Add New Client</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Enter the business details for your new client.</p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 24, color: "var(--red)", fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Business Info */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Business Information</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Company Details</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Business Name *</label>
                  <input style={inputStyle} value={form.name} onChange={e => update("name", e.target.value)} required placeholder="Meridian Solutions LLC" />
                </div>
                <div>
                  <label style={labelStyle}>EIN (Tax ID)</label>
                  <input style={inputStyle} value={form.ein} onChange={e => update("ein", e.target.value)} placeholder="XX-XXXXXXX" />
                </div>
                <div>
                  <label style={labelStyle}>Entity Type</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={form.entityType} onChange={e => update("entityType", e.target.value)}>
                    <option value="">Select type...</option>
                    <option value="LLC">LLC</option>
                    <option value="Corporation">Corporation</option>
                    <option value="S-Corporation">S-Corporation</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Non-Profit">Non-Profit</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Contact</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Contact Information</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" style={inputStyle} value={form.email} onChange={e => update("email", e.target.value)} placeholder="contact@company.com" />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(555) 000-0000" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Website</label>
                  <input style={inputStyle} value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://company.com" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 28, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Location</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Business Address</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Street Address</label>
                  <input style={inputStyle} value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main Street" />
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input style={inputStyle} value={form.city} onChange={e => update("city", e.target.value)} placeholder="Washington" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input style={inputStyle} value={form.state} onChange={e => update("state", e.target.value)} placeholder="DC" maxLength={2} />
                  </div>
                  <div>
                    <label style={labelStyle}>ZIP</label>
                    <input style={inputStyle} value={form.zip} onChange={e => update("zip", e.target.value)} placeholder="20001" />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={loading} style={{ padding: "13px 32px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                {loading ? "Saving..." : "Save Client →"}
              </button>
              <a href="/clients" style={{ padding: "13px 24px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 15, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}