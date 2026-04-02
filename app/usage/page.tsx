"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { ADMIN_NAV } from "@/lib/admin-nav";

interface UsageSummary {
  thisMonthCost: number;
  lastMonthCost: number;
  aiCallsThisMonth: number;
  activeIntegrations: number;
  serviceBreakdown: ServiceCost[];
  clientBreakdown: ClientCost[];
}

interface ServiceCost {
  service: string;
  cost: number;
  calls: number;
}

interface ClientCost {
  clientId: string;
  clientName: string;
  integrations: string[];
  aiCalls: number;
  estimatedCost: number;
}

interface MonthlyHistory {
  months: { month: string; cost: number }[];
}

interface ClientIntegration {
  clientId: string;
  clientName: string;
  integrations: {
    provider: string;
    connectedDate: string;
    lastRefreshed: string;
    status: "connected" | "expired";
  }[];
}

const SERVICE_COLORS: Record<string, string> = {
  "Anthropic AI": "#8B5CF6",
  QuickBooks: "#2CA01C",
  Gusto: "#F45D48",
  "SAM.gov": "#0071BC",
  SendGrid: "#1A82E2",
};

const INTEGRATION_BADGE_COLORS: Record<string, string> = {
  QB: "#2CA01C",
  Gusto: "#F45D48",
  SAM: "#0071BC",
  SendGrid: "#1A82E2",
  AI: "#8B5CF6",
};


export default function UsagePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [history, setHistory] = useState<MonthlyHistory | null>(null);
  const [integrations, setIntegrations] = useState<ClientIntegration[]>([]);
  const [perUserData, setPerUserData] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "CUSTOMER") { router.push("/portal"); return; }
      if (parsed.role === "ADVISOR") { router.push("/dashboard"); return; }
      setUser(parsed);
    }
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [summaryRes, historyRes, integrationsRes, perUserRes] = await Promise.allSettled([
        apiRequest("/api/usage/summary"),
        apiRequest("/api/usage/history"),
        apiRequest("/api/usage/integrations"),
        apiRequest("/api/usage/per-user"),
      ]);
      if (summaryRes.status === "fulfilled") {
        const raw = summaryRes.value;
        // Map API response to expected interface shape
        const aiCalls = (raw.breakdownByService || []).find((s: any) => s.service === "anthropic");
        setSummary({
          thisMonthCost: raw.currentMonthTotal || 0,
          lastMonthCost: raw.previousMonthTotal || 0,
          aiCallsThisMonth: aiCalls?.count || 0,
          activeIntegrations: 0,
          serviceBreakdown: (raw.breakdownByService || []).map((s: any) => ({
            service: s.service, cost: s.totalCost || 0, calls: s.count || 0,
          })),
          clientBreakdown: (raw.breakdownByClient || []).map((c: any) => ({
            clientId: c.clientId, clientName: c.clientName || "Unknown",
            integrations: [], aiCalls: c.count || 0, estimatedCost: c.totalCost || 0,
          })),
        });
      }
      if (historyRes.status === "fulfilled") {
        const raw = historyRes.value;
        setHistory({ months: (Array.isArray(raw) ? raw : []).map((m: any) => ({ month: m.month, cost: m.totalCost || 0 })) });
      }
      if (integrationsRes.status === "fulfilled") {
        const raw = integrationsRes.value;
        setIntegrations(Array.isArray(raw) ? raw.map((c: any) => ({
          clientId: c.clientId, clientName: c.clientName,
          integrations: (c.integrations || []).map((i: any) => ({
            provider: i.provider, connectedDate: i.connectedAt, lastRefreshed: i.lastUpdated, status: "connected" as const,
          })),
        })) : []);
      }
      if (perUserRes.status === "fulfilled") setPerUserData(Array.isArray(perUserRes.value) ? perUserRes.value : []);
    } catch (err) {
      console.error("Failed to fetch usage data:", err);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  }

  function formatActionName(action: string) {
    return action.replace(/_/g, " ").replace(/^\w/, (c: string) => c.toUpperCase());
  }

  function exportCSV() {
    const rows: string[][] = [["Date", "Service", "Action", "User", "Cost", "Tokens"]];
    if (summary && summary.serviceBreakdown) {
      const now = new Date();
      const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      summary.serviceBreakdown.forEach((s) => {
        rows.push([monthLabel, s.service, "", "", s.cost.toFixed(2), String(s.calls)]);
      });
    }
    if (perUserData.length > 0) {
      const now = new Date();
      const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      perUserData.forEach((u: any) => {
        const name = `${u.user?.firstName || ""} ${u.user?.lastName || ""}`.trim();
        const topAction = u.topActions && u.topActions.length > 0 ? u.topActions[0].action : "";
        rows.push([monthLabel, "Anthropic AI", topAction, name, (u.totalCost || 0).toFixed(2), String(u.totalTokens || 0)]);
      });
    }
    const csvContent = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usage-${new Date().toISOString().slice(0, 7)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!user) return null;

  const maxServiceCost = summary
    ? Math.max(...summary.serviceBreakdown.map((s) => s.cost), 1)
    : 1;

  const maxHistoryCost = history
    ? Math.max(...history.months.map((m) => m.cost), 1)
    : 1;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
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
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href;
            return (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: active ? "rgba(200,155,60,.15)" : "transparent",
              border: active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: active ? 500 : 400,
              marginBottom: 2, transition: "all .15s",
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </a>
            );
          })}
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
          {/* Header */}
          <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Administration</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
                Usage &amp; Costs
              </h1>
              <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Monitor integration and AI usage across your organization</p>
            </div>
            <button onClick={exportCSV} style={{
              padding: "10px 24px", background: "var(--navy)", color: "#fff", border: "none",
              borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(11,25,41,.2)", transition: "all .2s", marginTop: 20,
              display: "flex", alignItems: "center", gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#0D1F35"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--navy)"; }}>
              Export to CSV
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "var(--ink4)" }}>
              <div style={{ textAlign: "center" as const }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                <div style={{ fontSize: 14, color: "var(--ink3)" }}>Loading usage data...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {/* Top Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "This Month's Cost", value: summary ? formatCurrency(summary.thisMonthCost) : "$0.00", sub: "Current billing period" },
                  { label: "Last Month's Cost", value: summary ? formatCurrency(summary.lastMonthCost) : "$0.00", sub: "Previous billing period" },
                  { label: "All-Time Spend", value: history ? formatCurrency(history.months.reduce((sum, m) => sum + m.cost, 0)) : "$0.00", sub: "Total since launch" },
                  { label: "AI Calls This Month", value: summary ? summary.aiCallsThisMonth.toLocaleString() : "0", sub: "Anthropic API requests" },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: "#fff", borderRadius: "var(--rl)", padding: "24px 20px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--navy)", fontWeight: 400, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: "8px 0 4px" }}>{stat.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink4)" }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Cost by Service */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Breakdown</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Cost by Service</h2>
                {summary && summary.serviceBreakdown.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {summary.serviceBreakdown.map((service) => (
                      <div key={service.service}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{service.service}</span>
                          <span style={{ fontSize: 13, color: "var(--ink3)" }}>
                            {formatCurrency(service.cost)} &middot; {service.calls.toLocaleString()} calls
                          </span>
                        </div>
                        <div style={{ height: 28, background: "var(--cream)", borderRadius: 6, overflow: "hidden", position: "relative" as const }}>
                          <div style={{
                            height: "100%",
                            width: `${Math.max((service.cost / maxServiceCost) * 100, 2)}%`,
                            background: SERVICE_COLORS[service.service] || "#94A3B8",
                            borderRadius: 6,
                            transition: "width .4s ease",
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: 10,
                          }}>
                            <span style={{ fontSize: 11.5, color: "#fff", fontWeight: 600, whiteSpace: "nowrap" as const }}>
                              {formatCurrency(service.cost)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No service usage data available" />
                )}
              </div>

              {/* Cost by Client */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Clients</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Cost by Client</h2>
                {summary && summary.clientBreakdown.length > 0 ? (
                  <div style={{ overflowX: "auto" as const }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13.5 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                          <th style={{ textAlign: "left" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)" }}>Client</th>
                          <th style={{ textAlign: "left" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)" }}>Integrations</th>
                          <th style={{ textAlign: "right" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)" }}>AI Calls</th>
                          <th style={{ textAlign: "right" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)" }}>Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...summary.clientBreakdown]
                          .sort((a, b) => b.estimatedCost - a.estimatedCost)
                          .map((client) => (
                            <tr key={client.clientId} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td style={{ padding: "12px", fontWeight: 500, color: "var(--navy)" }}>{client.clientName}</td>
                              <td style={{ padding: "12px" }}>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                                  {client.integrations.map((intg) => (
                                    <span key={intg} style={{
                                      display: "inline-block",
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: "#fff",
                                      background: INTEGRATION_BADGE_COLORS[intg] || "#94A3B8",
                                    }}>
                                      {intg}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td style={{ padding: "12px", textAlign: "right" as const, color: "var(--ink3)" }}>{client.aiCalls.toLocaleString()}</td>
                              <td style={{ padding: "12px", textAlign: "right" as const, fontWeight: 600, color: "var(--navy)" }}>{formatCurrency(client.estimatedCost)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState message="No client usage data available" />
                )}
              </div>

              {/* Monthly History */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Trends</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Monthly History</h2>
                {history && history.months.length > 0 ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "12px 16px", background: "var(--cream)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 13, color: "var(--ink3)" }}>Cumulative all-time AI spend</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400 }}>{formatCurrency(history.months.reduce((sum, m) => sum + m.cost, 0))}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 220, padding: "0 8px" }}>
                      {[...history.months].reverse().map((month, i, arr) => {
                        const barHeight = Math.max((month.cost / maxHistoryCost) * 160, 4);
                        const cumulative = arr.slice(0, i + 1).reduce((sum, m) => sum + m.cost, 0);
                        return (
                          <div key={month.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--navy)" }}>{formatCurrency(month.cost)}</span>
                            <div style={{
                              width: "100%",
                              maxWidth: 64,
                              height: barHeight,
                              background: "linear-gradient(180deg, #C89B3C 0%, #E8B84B 100%)",
                              borderRadius: "6px 6px 2px 2px",
                              transition: "height .4s ease",
                              cursor: "help",
                            }} title={`Cumulative: ${formatCurrency(cumulative)}`} />
                            <span style={{ fontSize: 10, color: "var(--ink4)" }}>{formatCurrency(cumulative)}</span>
                            <span style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 500 }}>{month.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>

                ) : (
                  <EmptyState message="No monthly history available" />
                )}
              </div>

              {/* Connected Integrations */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Connections</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Connected Integrations</h2>
                {integrations.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {integrations.map((client) => (
                      <div key={client.clientId} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--navy)", marginBottom: 12 }}>{client.clientName}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                          {client.integrations.map((intg, idx) => (
                            <div key={idx} style={{
                              padding: "12px 16px",
                              background: "var(--cream)",
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>{intg.provider}</div>
                                <div style={{ fontSize: 11, color: "var(--ink4)" }}>
                                  Connected {formatDate(intg.connectedDate)} &middot; Refreshed {formatDate(intg.lastRefreshed)}
                                </div>
                              </div>
                              <span style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                color: intg.status === "connected" ? "#15803D" : "#B91C1C",
                                background: intg.status === "connected" ? "#DCFCE7" : "#FEE2E2",
                              }}>
                                {intg.status === "connected" ? "Connected" : "Expired"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No connected integrations found" />
                )}
              </div>

              {/* Cost by User */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Users</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Cost by User</h2>
                {perUserData.length > 0 ? (
                  <div style={{ overflowX: "auto" as const }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13.5 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                          <th style={{ textAlign: "left" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)" }}>User</th>
                          <th style={{ textAlign: "right" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)" }}>Total Cost</th>
                          <th style={{ textAlign: "right" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)" }}>Tokens</th>
                          <th style={{ textAlign: "right" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)" }}>Calls</th>
                          <th style={{ textAlign: "left" as const, padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)" }}>Top Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...perUserData]
                          .sort((a: any, b: any) => (b.totalCost || 0) - (a.totalCost || 0))
                          .map((u: any) => {
                            const name = `${u.user?.firstName || ""} ${u.user?.lastName || ""}`.trim() || "Unknown";
                            const email = u.user?.email || "";
                            const topAction = u.topActions && u.topActions.length > 0 ? formatActionName(u.topActions[0].action) : "\u2014";
                            return (
                              <tr key={u.userId} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ padding: "12px" }}>
                                  <div style={{ fontWeight: 500, color: "var(--navy)" }}>{name}</div>
                                  <div style={{ fontSize: 11.5, color: "var(--ink4)" }}>{email}</div>
                                </td>
                                <td style={{ padding: "12px", textAlign: "right" as const, fontWeight: 600, color: "var(--navy)" }}>${(u.totalCost || 0).toFixed(2)}</td>
                                <td style={{ padding: "12px", textAlign: "right" as const, color: "var(--ink3)" }}>{(u.totalTokens || 0).toLocaleString()}</td>
                                <td style={{ padding: "12px", textAlign: "right" as const, color: "var(--ink3)" }}>{(u.callCount || 0).toLocaleString()}</td>
                                <td style={{ padding: "12px", color: "var(--ink3)" }}>{topAction}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState message="No per-user usage data available" />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "var(--ink4)", textAlign: "center" as const }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>--</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink3)", marginBottom: 4 }}>{message}</div>
      <div style={{ fontSize: 12, color: "var(--ink4)" }}>Data will appear here once usage is recorded</div>
    </div>
  );
}
