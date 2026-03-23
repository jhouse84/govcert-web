"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function TeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedAdvisor, setExpandedAdvisor] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== "ADMIN") { router.push("/dashboard"); return; }
      setUser(parsed);
    }
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [advisorData, clientData, usersData] = await Promise.all([
        apiRequest("/api/team"),
        apiRequest("/api/clients"),
        apiRequest("/api/team/users"),
      ]);
      setAdvisors(advisorData);
      setClients(clientData);
      setAllUsers(usersData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await apiRequest("/api/team/invite", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail }),
      });
      setInviteSuccess(`✓ Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setTimeout(() => setInviteSuccess(""), 5000);
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invite.");
    } finally {
      setInviting(false);
    }
  }

  async function assignClient(advisorId: string) {
    const clientId = selectedClient[advisorId];
    if (!clientId) return;
    setAssigning(advisorId);
    try {
      await apiRequest("/api/assignments", {
        method: "POST",
        body: JSON.stringify({ advisorId, clientId }),
      });
      setSelectedClient(prev => ({ ...prev, [advisorId]: "" }));
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to assign client.");
    } finally {
      setAssigning(null);
    }
  }

  async function removeAssignment(assignmentId: string) {
    if (!confirm("Remove this client assignment?")) return;
    try {
      await apiRequest(`/api/assignments/${assignmentId}`, { method: "DELETE" });
      fetchData();
    } catch (err) { console.error(err); }
  }

  async function deleteAdvisor(advisorId: string, name: string) {
    if (!confirm(`Remove ${name} from GovCert? This will delete their account, NDA record, and all client assignments. This cannot be undone.`)) return;
    setDeletingId(advisorId);
    try {
      await apiRequest(`/api/team/${advisorId}`, { method: "DELETE" });
      setAdvisors(prev => prev.filter(a => a.id !== advisorId));
    } catch (err: any) {
      alert(err.message || "Failed to remove advisor.");
    } finally {
      setDeletingId(null);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
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
          {[
            { label: "Dashboard", icon: "⬛", href: "/dashboard" },
            { label: "Clients", icon: "👥", href: "/clients" },
            { label: "Certifications", icon: "📋", href: "/certifications" },
          ].map(item => (
            <a key={item.label} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.07)" }}>
            <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 6, fontWeight: 600 }}>Settings</div>
            <a href="/settings/team" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)", background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
              <span>👤</span> Team & Users
            </a>
          </div>
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>Master Admin</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Admin Settings</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Team & Users</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Invite advisors, manage NDA status, and control client access.</p>
          </div>

          {/* Invite advisor */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Invite</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>Add a New Advisor</h2>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>
              Send an invitation email to a new advisor. They'll set their password and be required to sign the NDA before accessing any client data.
            </p>

            {inviteSuccess && (
              <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--green)", fontWeight: 500 }}>
                {inviteSuccess}
              </div>
            )}
            {inviteError && (
              <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "var(--red)" }}>
                {inviteError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendInvite()}
                placeholder="advisor@company.com"
                style={{ flex: 1, padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
              />
              <button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}
                style={{ padding: "11px 24px", background: inviteEmail.trim() ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: inviteEmail.trim() ? "#fff" : "var(--ink4)", fontSize: 14, fontWeight: 500, cursor: inviteEmail.trim() ? "pointer" : "not-allowed", boxShadow: inviteEmail.trim() ? "0 4px 16px rgba(200,155,60,.3)" : "none", whiteSpace: "nowrap" as const }}>
                {inviting ? "Sending..." : "Send Invitation →"}
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink4)", lineHeight: 1.6 }}>
              The advisor will receive an invitation email. After setting their password, they'll be shown the NDA and must sign it before seeing any client data.
            </div>
          </div>

          {/* Advisors list */}
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 12 }}>
            {advisors.length} Advisor{advisors.length !== 1 ? "s" : ""}
          </div>

          {advisors.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "60px 40px", textAlign: "center", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>👤</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>No advisors yet</h3>
              <p style={{ fontSize: 13.5, color: "var(--ink3)", maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
                Invite your first advisor above. They'll receive an email, set their password, and sign the NDA before accessing any clients.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {advisors.map(advisor => {
                const isExpanded = expandedAdvisor === advisor.id;
                const ndaSigned = !!advisor.nda;
                const assignedClients = advisor.clientAssignments || [];
                const unassignedClients = clients.filter(c => !assignedClients.some((a: any) => a.clientId === c.id));
                return (
                  <div key={advisor.id} style={{ background: "#fff", border: `1px solid ${ndaSigned ? "var(--green-b)" : "var(--amber-b)"}`, borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                    {/* Header */}
                    <div onClick={() => setExpandedAdvisor(isExpanded ? null : advisor.id)}
                      style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: isExpanded ? "var(--cream)" : "#fff", transition: "background .12s" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: ndaSigned ? "var(--green-bg)" : "var(--amber-bg)", border: `2px solid ${ndaSigned ? "var(--green-b)" : "var(--amber-b)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {ndaSigned ? "✓" : "⏳"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>
                          {advisor.firstName} {advisor.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink3)", display: "flex", gap: 12 }}>
                          <span>{advisor.email}</span>
                          <span>·</span>
                          <span>{assignedClients.length} client{assignedClients.length !== 1 ? "s" : ""} assigned</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: ndaSigned ? "var(--green-bg)" : "var(--amber-bg)", color: ndaSigned ? "var(--green)" : "var(--amber)", border: `1px solid ${ndaSigned ? "var(--green-b)" : "var(--amber-b)"}` }}>
                          {ndaSigned ? "✓ NDA Signed" : "⏳ NDA Pending"}
                        </span>
                        <span style={{ fontSize: 14, color: "var(--gold)" }}>{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px" }}>

                        {/* NDA details */}
                        {ndaSigned && (
                          <div style={{ padding: "12px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", marginBottom: 4 }}>✓ NDA Signed</div>
                            <div style={{ fontSize: 12, color: "var(--ink3)", display: "flex", gap: 16 }}>
                              <span>Name: <strong>{advisor.nda.fullName}</strong></span>
                              <span>Signed: <strong>{new Date(advisor.nda.signedAt).toLocaleDateString()}</strong></span>
                              <span>IP: <strong style={{ fontFamily: "'DM Mono', monospace" }}>{advisor.nda.ipAddress}</strong></span>
                              <span>Version: <strong>{advisor.nda.agreementVersion}</strong></span>
                            </div>
                          </div>
                        )}

                        {!ndaSigned && (
                          <div style={{ padding: "12px 16px", background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "var(--amber)" }}>
                            ⏳ This advisor has not yet signed the NDA. They cannot access any client data until they do.
                          </div>
                        )}

                        {/* Assigned clients */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
                            Assigned Clients ({assignedClients.length})
                          </div>
                          {assignedClients.length === 0 ? (
                            <div style={{ fontSize: 13, color: "var(--ink4)", fontStyle: "italic", padding: "8px 0" }}>No clients assigned yet</div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {assignedClients.map((a: any) => (
                                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                                  <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{a.client?.businessName}</span>
                                  <button onClick={() => removeAssignment(a.id)}
                                    style={{ padding: "4px 10px", background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", color: "var(--red)", fontSize: 11, cursor: "pointer" }}>
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assign client */}
                        {unassignedClients.length > 0 && (
                          <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
                              Assign a Client
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                              <select
                                value={selectedClient[advisor.id] || ""}
                                onChange={e => setSelectedClient(prev => ({ ...prev, [advisor.id]: e.target.value }))}
                                style={{ flex: 1, padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", background: "#fff" }}>
                                <option value="">Select a client...</option>
                                {unassignedClients.map(c => (
                                  <option key={c.id} value={c.id}>{c.businessName}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => assignClient(advisor.id)}
                                disabled={!selectedClient[advisor.id] || assigning === advisor.id}
                                style={{ padding: "9px 20px", background: selectedClient[advisor.id] ? "var(--navy)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: selectedClient[advisor.id] ? "var(--gold2)" : "var(--ink4)", fontSize: 13, fontWeight: 500, cursor: selectedClient[advisor.id] ? "pointer" : "not-allowed" }}>
                                {assigning === advisor.id ? "Assigning..." : "Assign →"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Delete advisor */}
                        <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => deleteAdvisor(advisor.id, `${advisor.firstName} ${advisor.lastName}`)}
                            disabled={deletingId === advisor.id}
                            style={{ padding: "8px 18px", background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", color: "var(--red)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                            {deletingId === advisor.id ? "Removing..." : "🗑 Remove Advisor from GovCert"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* ALL REGISTERED USERS */}
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>User Management</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>All Registered Users</h2>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20 }}>Manage all platform users and assign roles. Set a user to <strong>ADVISOR</strong> here, then assign them to specific clients in the Advisors section above. Advisors can review applications, provide feedback, and manage their assigned clients.</p>

            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 100px", padding: "10px 20px", borderBottom: "1px solid var(--border)", background: "var(--cream)", fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--ink4)" }}>
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Joined</div>
                <div>Actions</div>
              </div>
              {allUsers.map((u: any) => {
                const roleColors: Record<string, { color: string; bg: string }> = {
                  ADMIN: { color: "#7C3AED", bg: "rgba(124,58,237,.08)" },
                  ADVISOR: { color: "#2563EB", bg: "rgba(37,99,235,.08)" },
                  CUSTOMER: { color: "var(--green)", bg: "var(--green-bg)" },
                };
                const rc = roleColors[u.role] || roleColors.CUSTOMER;
                const isMe = u.id === user?.id;
                return (
                  <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 100px", padding: "12px 20px", borderBottom: "1px solid var(--border)", alignItems: "center", fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 500, color: "var(--navy)" }}>{u.firstName} {u.lastName} {isMe && <span style={{ fontSize: 10, color: "var(--ink4)" }}>(you)</span>}</div>
                      {!u.emailVerified && <span style={{ fontSize: 10, color: "var(--amber)" }}>Unverified</span>}
                    </div>
                    <div style={{ color: "var(--ink3)", fontSize: 12 }}>{u.email}</div>
                    <div>
                      {isMe ? (
                        <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: rc.color, background: rc.bg }}>{u.role}</span>
                      ) : (
                        <select value={u.role} disabled={changingRole === u.id}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            if (!confirm(`Change ${u.firstName} ${u.lastName} to ${newRole}?`)) return;
                            setChangingRole(u.id);
                            try {
                              await apiRequest(`/api/team/users/${u.id}/role`, {
                                method: "PUT",
                                body: JSON.stringify({ role: newRole }),
                              });
                              setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
                              // Refresh advisors list if role changed to/from ADVISOR
                              if (newRole === "ADVISOR" || u.role === "ADVISOR") {
                                const advisorData = await apiRequest("/api/team");
                                setAdvisors(advisorData);
                              }
                            } catch (err: any) { alert("Failed: " + err.message); }
                            finally { setChangingRole(null); }
                          }}
                          style={{ padding: "4px 8px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, color: rc.color, background: rc.bg, cursor: "pointer", fontWeight: 600 }}>
                          <option value="CUSTOMER">CUSTOMER</option>
                          <option value="ADVISOR">ADVISOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>{new Date(u.createdAt).toLocaleDateString()}</div>
                    <div>
                      {!isMe && (
                        <button onClick={async () => {
                          if (!confirm(`Delete ${u.firstName} ${u.lastName}'s account? This cannot be undone.`)) return;
                          try {
                            await apiRequest(`/api/team/users/${u.id}`, { method: "DELETE" });
                            setAllUsers(prev => prev.filter(x => x.id !== u.id));
                          } catch (err: any) { alert("Failed: " + err.message); }
                        }}
                          style={{ fontSize: 11, color: "var(--red)", background: "none", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "3px 8px", cursor: "pointer" }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}