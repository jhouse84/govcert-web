"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "\u2B1B", href: "/dashboard" },
  { label: "Eligibility", icon: "\u2705", href: "/clients" },
  { label: "Clients", icon: "\uD83D\uDC65", href: "/clients" },
  { label: "Certifications", icon: "\uD83D\uDCCB", href: "/certifications" },
  { label: "Documents", icon: "\uD83D\uDCC4", href: "/documents" },
  { label: "Calendar", icon: "\uD83D\uDCC5", href: "/calendar" },
  { label: "Integrations", icon: "\uD83D\uDD17", href: "/integrations", active: true },
  { label: "Team & Users", icon: "\uD83D\uDC64", href: "/settings/team" },
  { label: "Usage & Costs", icon: "\uD83D\uDCCA", href: "/usage" },
];

const INTEGRATION_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  QB: { bg: "#2CA01C", color: "#fff", label: "QuickBooks" },
  QuickBooks: { bg: "#2CA01C", color: "#fff", label: "QuickBooks" },
  quickbooks: { bg: "#2CA01C", color: "#fff", label: "QuickBooks" },
  Gusto: { bg: "#F45D48", color: "#fff", label: "Gusto" },
  gusto: { bg: "#F45D48", color: "#fff", label: "Gusto" },
  SAM: { bg: "#0071BC", color: "#fff", label: "SAM.gov" },
  "SAM.gov": { bg: "#0071BC", color: "#fff", label: "SAM.gov" },
  sam: { bg: "#0071BC", color: "#fff", label: "SAM.gov" },
};

function getIntegrationStyle(provider: string) {
  return INTEGRATION_COLORS[provider] || { bg: "#94A3B8", color: "#fff", label: provider };
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

interface ClientIntegration {
  clientId: string;
  clientName: string;
  integrations: {
    provider: string;
    connectedDate: string;
    lastRefreshed?: string;
    status?: string;
  }[];
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [integrationData, setIntegrationData] = useState<ClientIntegration[]>([]);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "CUSTOMER") { router.push("/portal"); return; }
      setUser(parsed);
    }
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [integrationsRes, clientsRes] = await Promise.allSettled([
        apiRequest("/api/usage/integrations"),
        apiRequest("/api/clients"),
      ]);

      // Handle clients
      if (clientsRes.status === "fulfilled" && Array.isArray(clientsRes.value)) {
        setClients(clientsRes.value);
      }

      // Handle integrations - check response shape
      if (integrationsRes.status === "fulfilled") {
        const data = integrationsRes.value;
        if (Array.isArray(data)) {
          // Expected format: array of { clientId, clientName, integrations: [...] }
          const normalized: ClientIntegration[] = data.map((item: any) => ({
            clientId: item.clientId || item.id || "",
            clientName: item.clientName || item.name || "Unknown Client",
            integrations: Array.isArray(item.integrations) ? item.integrations : [],
          }));
          setIntegrationData(normalized);
        } else if (data && typeof data === "object" && !Array.isArray(data)) {
          // Maybe it's a single object or different shape
          if (data.clients && Array.isArray(data.clients)) {
            setIntegrationData(data.clients);
          } else {
            setIntegrationData([]);
          }
        } else {
          setIntegrationData([]);
        }
      } else {
        setFetchError(true);
        setIntegrationData([]);
      }
    } catch (err) {
      console.error("Failed to fetch integrations data:", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!user) return null;

  // Build a set of client IDs that have integrations
  const connectedClientIds = new Set<string>();
  integrationData.forEach(ci => {
    if (ci.integrations && ci.integrations.length > 0) {
      connectedClientIds.add(ci.clientId);
    }
  });

  // Connected clients (from integrations data)
  const connectedClients = integrationData.filter(ci => ci.integrations && ci.integrations.length > 0);

  // Clients without integrations
  const notConnectedClients = clients.filter(c => !connectedClientIds.has(c.id));

  // Total connection count
  const totalConnections = connectedClients.reduce((sum, ci) => sum + ci.integrations.length, 0);

  // Integration breakdown
  const integrationCounts: Record<string, number> = {};
  connectedClients.forEach(ci => {
    ci.integrations.forEach(intg => {
      const style = getIntegrationStyle(intg.provider);
      const key = style.label;
      integrationCounts[key] = (integrationCounts[key] || 0) + 1;
    });
  });
  const totalClients = clients.length || 1;

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
          {NAV_ITEMS.map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: item.active ? "rgba(200,155,60,.15)" : "transparent",
              border: item.active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: item.active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: item.active ? 500 : 400,
              marginBottom: 2, transition: "all .15s",
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
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Administration</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Integration Hub
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>
              See which clients have connected their tools {"\u2014"} and who still needs to
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "var(--ink4)" }}>
              <div style={{ textAlign: "center" as const }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                <div style={{ fontSize: 14, color: "var(--ink3)" }}>Loading integrations data...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {/* Summary Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "Total Connected", value: String(totalConnections), sub: "OAuth connections across all clients" },
                  { label: "Clients Connected", value: String(connectedClientIds.size), sub: `${connectedClientIds.size} of ${clients.length} clients have integrations` },
                  { label: "Clients Not Connected", value: String(notConnectedClients.length), sub: notConnectedClients.length === 0 ? "Everyone is connected" : "Need outreach" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#fff", borderRadius: "var(--rl)", padding: "24px 20px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--navy)", fontWeight: 400, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: "8px 0 4px" }}>{stat.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink4)" }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Connected Clients */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Connected</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Connected Clients</h2>

                {connectedClients.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", color: "var(--ink4)", textAlign: "center" as const }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{"\uD83D\uDD17"}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink3)", marginBottom: 4 }}>No clients have connected integrations yet</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink4)", maxWidth: 380, lineHeight: 1.6 }}>
                      {fetchError
                        ? "Could not load integration data. The integrations endpoint may not be available yet."
                        : "Connected integrations will appear here once clients link their QuickBooks, Gusto, or SAM.gov accounts."}
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" as const }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13.5 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                          <th style={{ textAlign: "left" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)" }}>Client</th>
                          <th style={{ textAlign: "left" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)" }}>Integrations</th>
                          <th style={{ textAlign: "left" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)" }}>Connected</th>
                          <th style={{ textAlign: "right" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {connectedClients.map(ci => (
                          <tr key={ci.clientId} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "14px 12px", fontWeight: 500, color: "var(--navy)" }}>{ci.clientName}</td>
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                                {ci.integrations.map((intg, idx) => {
                                  const style = getIntegrationStyle(intg.provider);
                                  return (
                                    <span key={idx} style={{
                                      display: "inline-block", padding: "3px 10px", borderRadius: 4,
                                      fontSize: 11, fontWeight: 600, color: style.color, background: style.bg,
                                    }}>
                                      {style.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {ci.integrations.map((intg, idx) => (
                                  <span key={idx} style={{ fontSize: 11.5, color: "var(--ink4)" }}>
                                    {getIntegrationStyle(intg.provider).label}: {formatDate(intg.connectedDate)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: "14px 12px", textAlign: "right" as const }}>
                              <a href={`/clients/${ci.clientId}`} style={{
                                fontSize: 13, fontWeight: 500, color: "var(--gold)", textDecoration: "none",
                              }}>
                                View Client {"\u2192"}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Needs Outreach */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Outreach</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Needs Outreach</h2>

                {notConnectedClients.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "var(--ink4)", textAlign: "center" as const }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{"\u2705"}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink3)", marginBottom: 4 }}>All clients have integrations connected</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink4)" }}>Great job! Everyone is set up.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" as const }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13.5 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                          <th style={{ textAlign: "left" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)" }}>Client</th>
                          <th style={{ textAlign: "left" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)" }}>Status</th>
                          <th style={{ textAlign: "right" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {notConnectedClients.map(client => (
                          <tr key={client.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "14px 12px", fontWeight: 500, color: "var(--navy)" }}>
                              {client.businessName || "Unknown Client"}
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <span style={{ fontSize: 12.5, color: "var(--ink4)", fontStyle: "italic" }}>
                                No integrations connected
                              </span>
                            </td>
                            <td style={{ padding: "14px 12px", textAlign: "right" as const }}>
                              <a href={`/clients/${client.id}`} style={{
                                display: "inline-block", padding: "7px 16px", background: "var(--navy)",
                                borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500,
                                textDecoration: "none", transition: "opacity .15s",
                              }}>
                                Invite to Connect {"\u2192"}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Integration Breakdown */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Breakdown</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Integration Adoption</h2>

                {Object.keys(integrationCounts).length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "var(--ink4)", textAlign: "center" as const }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>--</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink3)", marginBottom: 4 }}>No integration data available</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>Adoption metrics will appear once clients connect integrations</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { key: "QuickBooks", barColor: "#2CA01C" },
                      { key: "Gusto", barColor: "#F45D48" },
                      { key: "SAM.gov", barColor: "#0071BC" },
                    ].map(({ key, barColor }) => {
                      const count = integrationCounts[key] || 0;
                      const pct = Math.round((count / totalClients) * 100);
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{key}</span>
                            <span style={{ fontSize: 13, color: "var(--ink3)" }}>
                              {count} client{count !== 1 ? "s" : ""} connected ({pct}%)
                            </span>
                          </div>
                          <div style={{ height: 28, background: "var(--cream)", borderRadius: 6, overflow: "hidden", position: "relative" as const }}>
                            <div style={{
                              height: "100%",
                              width: `${Math.max(pct, 2)}%`,
                              background: barColor,
                              borderRadius: 6,
                              transition: "width .4s ease",
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: 10,
                            }}>
                              {pct > 10 && (
                                <span style={{ fontSize: 11.5, color: "#fff", fontWeight: 600, whiteSpace: "nowrap" as const }}>
                                  {pct}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Show any other integrations not in the standard 3 */}
                    {Object.entries(integrationCounts)
                      .filter(([key]) => !["QuickBooks", "Gusto", "SAM.gov"].includes(key))
                      .map(([key, count]) => {
                        const pct = Math.round((count / totalClients) * 100);
                        return (
                          <div key={key}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{key}</span>
                              <span style={{ fontSize: 13, color: "var(--ink3)" }}>
                                {count} client{count !== 1 ? "s" : ""} connected ({pct}%)
                              </span>
                            </div>
                            <div style={{ height: 28, background: "var(--cream)", borderRadius: 6, overflow: "hidden", position: "relative" as const }}>
                              <div style={{
                                height: "100%",
                                width: `${Math.max(pct, 2)}%`,
                                background: "#94A3B8",
                                borderRadius: 6,
                                transition: "width .4s ease",
                                display: "flex",
                                alignItems: "center",
                                paddingLeft: 10,
                              }}>
                                {pct > 10 && (
                                  <span style={{ fontSize: 11.5, color: "#fff", fontWeight: 600, whiteSpace: "nowrap" as const }}>
                                    {pct}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
