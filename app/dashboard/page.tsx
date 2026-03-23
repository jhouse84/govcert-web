"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ clients: 0, certifications: 0, pending: 0, expiring: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, avgScore: 0, notReady: 0, competitive: 0, strong: 0, needsWork: 0 });
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteStats, setInviteStats] = useState({ total: 0, accepted: 0, registered: 0, pending: 0, expired: 0 });
  const [usageData, setUsageData] = useState<any>(null);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState("");

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
    fetchReviews();
    fetchInvites();
    fetchUsage();
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

  async function fetchReviews() {
    try {
      const data = await apiRequest("/api/applications/ai/reviews");
      const list = Array.isArray(data) ? data : data.reviews || [];
      setReviews(list);
      const total = list.length;
      const avgScore = total > 0 ? Math.round(list.reduce((sum: number, r: any) => sum + (r.overallScore || 0), 0) / total) : 0;
      const notReady = list.filter((r: any) => r.overallVerdict === "NOT_READY").length;
      const competitive = list.filter((r: any) => r.overallVerdict === "COMPETITIVE").length;
      const strong = list.filter((r: any) => r.overallVerdict === "STRONG").length;
      const needsWork = list.filter((r: any) => r.overallVerdict === "NEEDS_IMPROVEMENT" || r.overallVerdict === "NEEDS_WORK").length;
      setReviewStats({ total, avgScore, notReady, competitive, strong, needsWork });
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  }

  async function fetchInvites() {
    try {
      const data = await apiRequest("/api/invites");
      setInvites(data.invites || []);
      setInviteStats(data.stats || { total: 0, accepted: 0, registered: 0, pending: 0, expired: 0 });
    } catch (err) {
      console.error("Failed to fetch invites:", err);
    }
  }

  async function fetchUsage() {
    try {
      const data = await apiRequest("/api/usage/realtime");
      setUsageData(data);
    } catch (err) {
      console.error("Failed to fetch usage data:", err);
    }
  }

  function formatActionName(action: string) {
    return action.replace(/_/g, " ").replace(/^\w/, (c: string) => c.toUpperCase());
  }

  function timeAgo(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "#27ae60";
    if (score >= 60) return "#C89B3C";
    if (score >= 40) return "#e67e22";
    return "#e74c3c";
  }

  function getVerdictColor(verdict: string) {
    if (verdict === "STRONG") return "#27ae60";
    if (verdict === "COMPETITIVE") return "#2980b9";
    if (verdict === "NEEDS_IMPROVEMENT" || verdict === "NEEDS_WORK") return "#C89B3C";
    if (verdict === "NOT_READY") return "#e74c3c";
    return "var(--ink3)";
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
            { label: "Team & Users", icon: "👤", href: "/settings/team" },
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
          {/* Platform Economics */}
          {usageData && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Economics</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Platform Economics</h2>

              {/* Row 1 — Metric Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
                {(() => {
                  const todayCost = Number(usageData.today?.cost) || 0;
                  const yesterdayCost = Number(usageData.yesterday?.cost) || 0;
                  const todayDiff = todayCost - yesterdayCost;
                  const thisMonthCost = Number(usageData.thisMonth?.cost) || 0;
                  const momPctStr = String(usageData.monthOverMonth || "0%");
                  const momPctNum = parseFloat(momPctStr) || 0;
                  const revenueObj = usageData.revenue || {};
                  const revenueAmount = Number(revenueObj.thisMonth || revenueObj) || 0;
                  const profitMargin = String(usageData.profitMargin || "0%");
                  return [
                    {
                      label: "AI Spend Today",
                      value: `$${todayCost.toFixed(2)}`,
                      trend: todayDiff >= 0
                        ? { text: `+$${todayDiff.toFixed(2)} vs yesterday`, color: todayDiff > 0 ? "#e74c3c" : "var(--ink4)", arrow: todayDiff > 0 ? "\u25B2" : "" }
                        : { text: `-$${Math.abs(todayDiff).toFixed(2)} vs yesterday`, color: "#27ae60", arrow: "\u25BC" },
                    },
                    {
                      label: "AI Spend This Month",
                      value: `$${thisMonthCost.toFixed(2)}`,
                      trend: { text: `${momPctStr} MoM`, color: momPctNum > 0 ? "#e74c3c" : "#27ae60", arrow: momPctNum > 0 ? "\u25B2" : "\u25BC" },
                    },
                    {
                      label: "Revenue This Month",
                      value: `$${revenueAmount.toFixed(2)}`,
                      trend: { text: "From purchases", color: "var(--ink4)", arrow: "" },
                    },
                    {
                      label: "Profit Margin",
                      value: profitMargin,
                      trend: { text: "Current period", color: "var(--ink4)", arrow: "" },
                    },
                  ];
                })().map((card) => (
                  <div key={card.label} style={{ background: "#fff", borderRadius: 12, padding: "24px 20px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", border: "1px solid rgba(200,155,60,.08)", borderTop: "3px solid var(--gold)", transition: "all .2s", cursor: "default" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)"; }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--navy)", fontWeight: 400, lineHeight: 1 }}>{card.value}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: "8px 0 4px" }}>{card.label}</div>
                    <div style={{ fontSize: 11.5, color: card.trend.color }}>
                      {card.trend.arrow && <span style={{ marginRight: 3 }}>{card.trend.arrow}</span>}
                      {card.trend.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2 — Top Cost Actions + Recent Activity */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                {/* Top Cost Actions */}
                <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", border: "1px solid rgba(200,155,60,.08)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Costs</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Top Cost Actions</h3>
                  {usageData.topCostActions && usageData.topCostActions.length > 0 ? (() => {
                    const maxCost = Math.max(...usageData.topCostActions.map((a: any) => a.totalCost || 0), 1);
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {usageData.topCostActions.map((action: any, idx: number) => (
                          <div key={idx}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{formatActionName(action.action)}</span>
                              <span style={{ fontSize: 12, color: "var(--ink3)" }}>{action.count} calls &middot; ${(action.totalCost || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ height: 22, background: "var(--cream)", borderRadius: 6, overflow: "hidden" }}>
                              <div style={{
                                height: "100%",
                                width: `${Math.max(((action.totalCost || 0) / maxCost) * 100, 3)}%`,
                                background: "linear-gradient(90deg, #C89B3C, #E8B84B)",
                                borderRadius: 6,
                                transition: "width .4s ease",
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })() : (
                    <div style={{ textAlign: "center" as const, padding: "24px 0", color: "var(--ink4)", fontSize: 13 }}>No cost data yet</div>
                  )}
                </div>

                {/* Recent Activity */}
                <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", border: "1px solid rgba(200,155,60,.08)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Activity</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Recent Activity</h3>
                  {usageData.recentActivity && usageData.recentActivity.length > 0 ? (
                    <div style={{ maxHeight: 300, overflowY: "auto" as const }}>
                      {usageData.recentActivity.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: idx < usageData.recentActivity.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{item.userName || "Unknown"}</div>
                            <div style={{ fontSize: 11.5, color: "var(--ink4)" }}>{formatActionName(item.action || "")}</div>
                          </div>
                          <div style={{ textAlign: "right" as const }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>${(item.cost || 0).toFixed(2)}</div>
                            <div style={{ fontSize: 11, color: "var(--ink4)" }}>{item.createdAt ? timeAgo(item.createdAt) : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center" as const, padding: "24px 0", color: "var(--ink4)", fontSize: 13 }}>No recent activity</div>
                  )}
                </div>
              </div>

              {/* Row 3 — Link to full analytics */}
              <a href="/usage" style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px",
                background: "var(--navy)", color: "#fff", borderRadius: 8, textDecoration: "none",
                fontSize: 13.5, fontWeight: 500, transition: "all .2s",
                boxShadow: "0 2px 8px rgba(11,25,41,.2)",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#0D1F35"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(11,25,41,.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--navy)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(11,25,41,.2)"; }}>
                View Full Usage Analytics <span style={{ color: "var(--gold)" }}>&rarr;</span>
              </a>
            </div>
          )}

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

          {/* GovCert Reviews */}
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>AI Reviews</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>GovCert Reviews</h2>

            {/* Review Aggregate Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Reviews", value: String(reviewStats.total), color: "var(--navy)" },
                { label: "Avg Score", value: String(reviewStats.avgScore), color: getScoreColor(reviewStats.avgScore) },
                { label: "Strong", value: String(reviewStats.strong), color: "#27ae60" },
                { label: "Competitive", value: String(reviewStats.competitive), color: "#2980b9" },
                { label: "Not Ready", value: String(reviewStats.notReady), color: "#e74c3c" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "#fff", borderRadius: 10, padding: "18px 16px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", border: "1px solid rgba(200,155,60,.08)", textAlign: "center" as const }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: stat.color, fontWeight: 400, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: "var(--ink3)", marginTop: 6 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Reviews Table */}
            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", border: "1px solid rgba(200,155,60,.08)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Recent</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400 }}>Recent Reviews</h3>
              </div>

              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink4)" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>📝</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink3)", marginBottom: 4 }}>No reviews yet</div>
                  <div style={{ fontSize: 12, color: "var(--ink4)" }}>AI reviews will appear here once generated</div>
                </div>
              ) : (
                <div>
                  {/* Table Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 1fr 1fr 60px", gap: 12, padding: "10px 24px", background: "var(--cream)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink4)" }}>
                    <div>Client</div>
                    <div>Cert Type</div>
                    <div>Score</div>
                    <div>Verdict</div>
                    <div>Date</div>
                    <div></div>
                  </div>
                  {/* Table Rows */}
                  {reviews.slice(0, 15).map((review: any, idx: number) => {
                    const clientName = review.certification?.client?.businessName || "Unknown";
                    const clientId = review.certification?.client?.id || review.certification?.clientId;
                    const certType = (review.certType || "").replace(/_/g, " ");
                    const score = review.overallScore || 0;
                    const verdict = (review.overallVerdict || "").replace(/_/g, " ");
                    const verdictRaw = review.overallVerdict || "";
                    const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
                    return (
                      <div key={review.id || idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 1fr 1fr 60px", gap: 12, padding: "12px 24px", borderBottom: "1px solid var(--border)", alignItems: "center", fontSize: 13 }}>
                        <div style={{ fontWeight: 500, color: "var(--navy)" }}>{clientName}</div>
                        <div style={{ color: "var(--ink3)" }}>{certType}</div>
                        <div style={{ fontWeight: 600, color: getScoreColor(score) }}>{score}</div>
                        <div>
                          <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: getVerdictColor(verdictRaw), background: `${getVerdictColor(verdictRaw)}15` }}>
                            {verdict}
                          </span>
                        </div>
                        <div style={{ color: "var(--ink4)", fontSize: 12 }}>{date}</div>
                        <div>
                          {clientId && (
                            <a href={`/clients/${clientId}`} style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>View →</a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Invitation Tracking */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", boxShadow: "var(--shadow)", marginTop: 24 }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)" }}>Invitation Tracking</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>Monitor who has been invited and whether they have registered</div>
                </div>
              </div>
              {/* Invite new user */}
              <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
                <input type="email" value={newInviteEmail} onChange={e => setNewInviteEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newInviteEmail.includes("@")) {
                    setSendingInvite(true); setInviteSent("");
                    apiRequest("/api/invites", { method: "POST", body: JSON.stringify({ email: newInviteEmail }) })
                      .then(() => { setInviteSent(newInviteEmail); setNewInviteEmail(""); fetchInvites(); })
                      .catch((err: any) => setInviteSent("Error: " + (err.message || "Failed")))
                      .finally(() => setSendingInvite(false));
                  }}}
                  placeholder="Enter email address to invite..."
                  style={{ flex: 1, padding: "9px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                <button onClick={() => {
                  if (!newInviteEmail.includes("@")) return;
                  setSendingInvite(true); setInviteSent("");
                  apiRequest("/api/invites", { method: "POST", body: JSON.stringify({ email: newInviteEmail }) })
                    .then(() => { setInviteSent(newInviteEmail); setNewInviteEmail(""); fetchInvites(); })
                    .catch((err: any) => setInviteSent("Error: " + (err.message || "Failed")))
                    .finally(() => setSendingInvite(false));
                }} disabled={sendingInvite || !newInviteEmail.includes("@")}
                  style={{ padding: "9px 20px", background: newInviteEmail.includes("@") ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: newInviteEmail.includes("@") ? "#fff" : "var(--ink4)", cursor: newInviteEmail.includes("@") ? "pointer" : "not-allowed", boxShadow: newInviteEmail.includes("@") ? "0 2px 10px rgba(200,155,60,.3)" : "none", whiteSpace: "nowrap" as const }}>
                  {sendingInvite ? "Sending..." : "Send Invite"}
                </button>
                {inviteSent && !inviteSent.startsWith("Error") && (
                  <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 500 }}>✓ Sent to {inviteSent}</span>
                )}
                {inviteSent && inviteSent.startsWith("Error") && (
                  <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 500 }}>{inviteSent}</span>
                )}
              </div>
              {/* Stats */}
              <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                {[
                  { label: "Total Invited", val: inviteStats.total, color: "var(--navy)" },
                  { label: "Accepted", val: inviteStats.accepted, color: "#27ae60" },
                  { label: "Registered", val: inviteStats.registered, color: "#2563EB" },
                  { label: "Pending", val: inviteStats.pending, color: "#C89B3C" },
                  { label: "Expired", val: inviteStats.expired, color: "#e74c3c" },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, padding: "12px 16px", background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: "var(--r)", textAlign: "center" as const }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: s.color, fontWeight: 400 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Table */}
            {invites.length > 0 && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", gap: 12, padding: "10px 24px", borderBottom: "1px solid var(--border)", fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--ink4)" }}>
                  <div>Email</div>
                  <div>Status</div>
                  <div>Invited</div>
                  <div>Registered As</div>
                  <div>Action</div>
                </div>
                {invites.slice(0, 30).map((inv: any, idx: number) => {
                  const statusColors: Record<string, { color: string; bg: string }> = {
                    ACCEPTED: { color: "#27ae60", bg: "rgba(39,174,96,.08)" },
                    REGISTERED: { color: "#2563EB", bg: "rgba(37,99,235,.08)" },
                    PENDING: { color: "#C89B3C", bg: "rgba(200,155,60,.08)" },
                    EXPIRED: { color: "#e74c3c", bg: "rgba(231,76,60,.08)" },
                  };
                  const sc = statusColors[inv.status] || statusColors.PENDING;
                  return (
                    <div key={inv.id || idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", gap: 12, padding: "10px 24px", borderBottom: "1px solid var(--border)", alignItems: "center", fontSize: 13 }}>
                      <div style={{ fontWeight: 500, color: "var(--navy)" }}>{inv.email}</div>
                      <div>
                        <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg }}>
                          {inv.status}
                        </span>
                      </div>
                      <div style={{ color: "var(--ink4)", fontSize: 12 }}>{new Date(inv.invitedAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                        {inv.registeredUser ? `${inv.registeredUser.firstName || ""} ${inv.registeredUser.lastName || ""}`.trim() : "\u2014"}
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {(inv.status === "PENDING" || inv.status === "EXPIRED") && (
                            <button onClick={async () => {
                              try {
                                await apiRequest("/api/invites", { method: "POST", body: JSON.stringify({ email: inv.email }) });
                                fetchInvites();
                              } catch (err: any) { console.error(err); }
                            }}
                              style={{ padding: "4px 10px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 500, color: "#fff", cursor: "pointer" }}>
                              Resend
                            </button>
                          )}
                          <button onClick={async () => {
                            if (!confirm(`Delete invitation for ${inv.email}?`)) return;
                            try {
                              await apiRequest(`/api/invites/${inv.id}`, { method: "DELETE" });
                              setInvites(prev => prev.filter((i: any) => i.id !== inv.id));
                              setInviteStats(prev => ({ ...prev, total: prev.total - 1, [inv.status.toLowerCase()]: (prev as any)[inv.status.toLowerCase()] - 1 }));
                            } catch (err: any) { alert("Failed: " + err.message); }
                          }}
                            style={{ padding: "4px 8px", background: "none", border: "1px solid var(--red-b)", borderRadius: "var(--r)", fontSize: 10, color: "var(--red)", cursor: "pointer" }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}