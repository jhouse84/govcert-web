"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default function ClientsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", firstName: "", lastName: "", businessName: "" });
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

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

  async function sendInvite() {
    if (!inviteForm.email) { setInviteError("Email address is required."); return; }
    setInviteSending(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await apiRequest("/api/auth/invite", {
        method: "POST",
        body: JSON.stringify({ email: inviteForm.email, clientId: null }),
      });
      setInviteSuccess(`Invitation sent to ${inviteForm.email}`);
      setInviteForm({ email: "", firstName: "", lastName: "", businessName: "" });
    } catch (err: any) {
      setInviteError(err?.message || "Failed to send invitation.");
    } finally {
      setInviteSending(false);
    }
  }

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
          {ADMIN_NAV.map(item => {
            const active = pathname === item.href;
            return (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: active ? "rgba(200,155,60,.15)" : "transparent",
              border: active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: active ? 500 : 400,
              marginBottom: 2, transition: "all .15s"
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </a>
            );
          })}
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
              <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>{clients.length} client{clients.length !== 1 ? "s" : ""} across all workspaces</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowInviteModal(true); setInviteSuccess(""); setInviteError(""); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "transparent", border: "1px solid var(--gold)", borderRadius: "var(--r)", color: "var(--gold)", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all .2s" }}>
                Invite Client
              </button>
              <a href="/clients/new" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.35)", transition: "all .2s" }}>
                + Add New Client
              </a>
            </div>
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
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 160px", padding: "10px 20px", borderBottom: "1px solid var(--border)", background: "var(--cream)" }}>
                {["Client Name", "EIN", "Entity Type", "Status", ""].map(h => (
                  <div key={h} style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink3)" }}>{h}</div>
                ))}
              </div>
              {clients.map((client, i) => (
                <div key={client.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 160px", padding: "16px 20px", borderBottom: i < clients.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{client.businessName}</div>
                      {client._piiMasked && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 100, background: "rgba(200,155,60,.1)", color: "var(--gold)", fontWeight: 600 }}>PII MASKED</span>}
                    </div>
                    <div style={{ fontSize: 12, color: client._piiMasked ? "var(--ink4)" : "var(--ink3)" }}>{client.email || "No email"}</div>
                  </div>
                  <div style={{ fontSize: 13, color: client._piiMasked ? "var(--ink4)" : "var(--ink2)", fontFamily: "monospace" }}>{client.ein || "—"}</div>
                  <div style={{ fontSize: 13, color: "var(--ink2)" }}>{client.entityType || "—"}</div>
                  <div>
                    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: "var(--green-bg)", color: "var(--green)" }}>Active</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <a href={`/clients/${client.id}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>View</a>
                    <button onClick={async () => {
                      if (!confirm(`Delete "${client.businessName}" and ALL related data (certifications, documents, applications)? This cannot be undone.`)) return;
                      try {
                        await apiRequest(`/api/clients/${client.id}`, { method: "DELETE" });
                        setClients((prev: any) => prev.filter((c: any) => c.id !== client.id));
                      } catch (err: any) { alert("Delete failed: " + err.message); }
                    }}
                      style={{ fontSize: 11, color: "var(--red)", background: "none", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "3px 8px", cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Client Modal */}
      {showInviteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Backdrop */}
          <div onClick={() => setShowInviteModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(11,25,41,.6)", backdropFilter: "blur(4px)" }} />
          {/* Modal */}
          <div style={{ position: "relative", width: 480, background: "#F5F1E8", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(11,25,41,.35), 0 8px 24px rgba(11,25,41,.15)" }}>
            {/* Navy header */}
            <div style={{ background: "linear-gradient(135deg, #0B1929 0%, #142a42 100%)", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "#C89B3C", marginBottom: 4 }}>New Invitation</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#fff", fontWeight: 400, margin: 0 }}>Invite Client</h2>
              </div>
              <button onClick={() => setShowInviteModal(false)} style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, width: 32, height: 32, color: "rgba(255,255,255,.6)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: "28px" }}>
              <div style={{ background: "rgba(255,255,255,.7)", border: "1px solid rgba(200,155,60,.15)", borderRadius: 12, padding: "24px", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(11,25,41,.06)" }}>
                {inviteSuccess && (
                  <div style={{ padding: "12px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: 8, fontSize: 13, color: "var(--green)", fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>&#10003;</span> {inviteSuccess}
                  </div>
                )}
                {inviteError && (
                  <div style={{ padding: "12px 16px", background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: 8, fontSize: 13, color: "var(--red)", marginBottom: 16 }}>
                    {inviteError}
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B1929", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Email Address *</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="client@company.com"
                    style={{ width: "100%", padding: "11px 14px", border: "1px solid rgba(11,25,41,.15)", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#fff", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B1929", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>First Name</label>
                    <input
                      type="text"
                      value={inviteForm.firstName}
                      onChange={e => setInviteForm(f => ({ ...f, firstName: e.target.value }))}
                      placeholder="Jane"
                      style={{ width: "100%", padding: "11px 14px", border: "1px solid rgba(11,25,41,.15)", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#fff", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B1929", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Last Name</label>
                    <input
                      type="text"
                      value={inviteForm.lastName}
                      onChange={e => setInviteForm(f => ({ ...f, lastName: e.target.value }))}
                      placeholder="Smith"
                      style={{ width: "100%", padding: "11px 14px", border: "1px solid rgba(11,25,41,.15)", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#fff", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B1929", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Business Name <span style={{ fontWeight: 400, color: "var(--ink4)", textTransform: "none" }}>(optional)</span></label>
                  <input
                    type="text"
                    value={inviteForm.businessName}
                    onChange={e => setInviteForm(f => ({ ...f, businessName: e.target.value }))}
                    placeholder="Acme Corp"
                    style={{ width: "100%", padding: "11px 14px", border: "1px solid rgba(11,25,41,.15)", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#fff", boxSizing: "border-box" }}
                  />
                </div>
                <button
                  onClick={sendInvite}
                  disabled={inviteSending}
                  style={{
                    width: "100%", padding: "13px 24px",
                    background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                    border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: inviteSending ? "not-allowed" : "pointer",
                    opacity: inviteSending ? 0.7 : 1,
                    boxShadow: "0 4px 16px rgba(200,155,60,.35), 0 1px 3px rgba(200,155,60,.2)",
                    fontFamily: "'DM Sans', sans-serif", transition: "all .2s"
                  }}
                >
                  {inviteSending ? "Sending..." : "Send Invitation \u2192"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}