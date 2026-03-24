"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { ADMIN_NAV } from "@/lib/admin-nav";

const INTEGRATIONS = [
  {
    id: "quickbooks",
    name: "QuickBooks",
    icon: "📗",
    desc: "Pull P&L, Balance Sheet, and employee data directly into your application.",
    color: "#2CA01C",
  },
  {
    id: "gusto",
    name: "Gusto",
    icon: "🟡",
    desc: "Sync payroll totals and employee roster for certification applications.",
    color: "#F45D48",
  },
  {
    id: "sam",
    name: "SAM.gov",
    icon: "🏛️",
    desc: "Look up entity registration status, NAICS codes, and business details from SAM.gov.",
    color: "#1A3F7A",
  },
  {
    id: "fpds",
    name: "FPDS",
    icon: "📋",
    desc: "Import past federal contracts to auto-populate your Past Performance section.",
    color: "#2D4A6B",
  },
  {
    id: "sba",
    name: "SBA Certifications",
    icon: "🏅",
    desc: "Check existing SBA certification status (8(a), WOSB, HUBZone, SDVOSB).",
    color: "#8A5E10",
  },
];

const OAUTH_INTEGRATIONS = ["quickbooks", "gusto"];

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { id } = React.use(params);
  const clientId = String(id);

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [oauthStatus, setOauthStatus] = useState<Record<string, any>>({});
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // SAM.gov state
  const [samData, setSamData] = useState<any>(null);
  const [samLoading, setSamLoading] = useState(false);
  const [samError, setSamError] = useState<string | null>(null);

  // FPDS state
  const [fpdsData, setFpdsData] = useState<any>(null);
  const [fpdsLoading, setFpdsLoading] = useState(false);
  const [fpdsError, setFpdsError] = useState<string | null>(null);

  // SBA state
  const [sbaData, setSbaData] = useState<any>(null);
  const [sbaLoading, setSbaLoading] = useState(false);
  const [sbaError, setSbaError] = useState<string | null>(null);

  // Review history state
  const [clientReviews, setClientReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Document access consent state
  const [docGrants, setDocGrants] = useState<any[]>([]);
  const [docAccessLoading, setDocAccessLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [requestScope, setRequestScope] = useState("All Documents");
  const [requestExpiration, setRequestExpiration] = useState("30 days");
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // Eligibility assessment state
  const [eligibility, setEligibility] = useState<any>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [reassessing, setReassessing] = useState(false);
  const [expandedCerts, setExpandedCerts] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchClient();
    fetchOAuthStatus();
    fetchEligibility();
    fetchClientReviews();
    fetchDocGrants();

    // Show success banner if redirected back from OAuth
    const connected = searchParams.get("connected");
    if (connected) {
      setSuccessBanner(`✓ ${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully`);
      setTimeout(() => setSuccessBanner(null), 5000);
      // Clean URL
      window.history.replaceState({}, "", `/clients/${clientId}`);
    }
  }, []);

  async function fetchClient() {
    try {
      const data = await apiRequest(`/api/clients/${clientId}`);
      setClient(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOAuthStatus() {
    try {
      const status = await apiRequest(`/api/oauth/status/${clientId}`);
      setOauthStatus(status);
    } catch (err) {
      console.error(err);
    }
  }

  function connectOAuth(provider: string) {
    const token = localStorage.getItem("token");
    // Redirect browser to backend OAuth start — backend redirects to provider
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app"}/api/oauth/${provider}/start?clientId=${clientId}&token=${token}`;
  }

  async function disconnectOAuth(provider: string) {
    setDisconnecting(provider);
    try {
      await apiRequest(`/api/oauth/${provider}/${clientId}`, { method: "DELETE" });
      setOauthStatus(prev => {
        const updated = { ...prev };
        delete updated[provider];
        return updated;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDisconnecting(null);
    }
  }

  async function syncSam() {
    if (!client?.uei && !client?.cageCode) {
      setSamError("Client must have a UEI or CAGE code to look up SAM.gov data.");
      return;
    }
    setSamLoading(true);
    setSamError(null);
    try {
      const query = client.uei ? `uei=${client.uei}` : `cage=${client.cageCode}`;
      const data = await apiRequest(`/api/sam/lookup?${query}`);
      setSamData(data);
    } catch (err: any) {
      setSamError(err?.message || "Failed to fetch SAM.gov data.");
    } finally {
      setSamLoading(false);
    }
  }

  async function syncFpds() {
    if (!client?.cageCode) {
      setFpdsError("Client must have a CAGE code to import FPDS contracts.");
      return;
    }
    setFpdsLoading(true);
    setFpdsError(null);
    try {
      const data = await apiRequest(`/api/fpds/contracts?cage=${client.cageCode}`);
      setFpdsData(data);
    } catch (err: any) {
      setFpdsError(err?.message || "Failed to fetch FPDS contracts.");
    } finally {
      setFpdsLoading(false);
    }
  }

  async function syncSba() {
    if (!client?.uei) {
      setSbaError("Client must have a UEI to check SBA certifications.");
      return;
    }
    setSbaLoading(true);
    setSbaError(null);
    try {
      const data = await apiRequest(`/api/sba/certifications?uei=${client.uei}`);
      setSbaData(data);
    } catch (err: any) {
      setSbaError(err?.message || "Failed to fetch SBA certifications.");
    } finally {
      setSbaLoading(false);
    }
  }

  async function fetchEligibility() {
    setEligibilityLoading(true);
    setEligibilityError(null);
    try {
      const data = await apiRequest(`/api/eligibility/${clientId}`);
      setEligibility(data);
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes("not found")) {
        setEligibility(null);
      } else {
        setEligibilityError(err?.message || "Failed to load eligibility data.");
      }
    } finally {
      setEligibilityLoading(false);
    }
  }

  async function runAssessment() {
    setReassessing(true);
    setEligibilityError(null);
    try {
      await apiRequest(`/api/eligibility/${clientId}/assess`, { method: "POST" });
      await fetchEligibility();
    } catch (err: any) {
      setEligibilityError(err?.message || "Failed to run assessment.");
    } finally {
      setReassessing(false);
    }
  }

  async function fetchClientReviews() {
    setReviewsLoading(true);
    try {
      const data = await apiRequest(`/api/applications/ai/reviews?clientId=${clientId}`);
      const list = Array.isArray(data) ? data : data.reviews || [];
      setClientReviews(list);
    } catch (err) {
      console.error("Failed to fetch client reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  }

  async function fetchDocGrants() {
    setDocAccessLoading(true);
    try {
      const data = await apiRequest("/api/documents/my-grants");
      setDocGrants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch doc grants:", err);
    } finally {
      setDocAccessLoading(false);
    }
  }

  async function submitAccessRequest() {
    setRequestSubmitting(true);
    try {
      await apiRequest("/api/documents/request-access", {
        method: "POST",
        body: JSON.stringify({
          clientId,
          reason: requestReason,
          scope: requestScope,
          expiration: requestExpiration,
        }),
      });
      setShowRequestModal(false);
      setRequestReason("");
      fetchDocGrants();
    } catch (err) {
      console.error(err);
    } finally {
      setRequestSubmitting(false);
    }
  }

  function getReviewScoreColor(score: number) {
    if (score >= 80) return "#27ae60";
    if (score >= 60) return "#C89B3C";
    if (score >= 40) return "#e67e22";
    return "#e74c3c";
  }

  function getReviewVerdictColor(verdict: string) {
    if (verdict === "STRONG") return "#27ae60";
    if (verdict === "COMPETITIVE") return "#2980b9";
    if (verdict === "NEEDS_IMPROVEMENT" || verdict === "NEEDS_WORK") return "#C89B3C";
    if (verdict === "NOT_READY") return "#e74c3c";
    return "var(--ink3)";
  }

  function getStatusBadgeStyle(status: string) {
    const s = status?.toUpperCase();
    if (s === "ELIGIBLE" || s === "LIKELY_ELIGIBLE") {
      return { background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-b)" };
    } else if (s === "NEEDS_REVIEW") {
      return { background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-b)" };
    } else if (s === "NOT_ELIGIBLE") {
      return { background: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-b)" };
    }
    return { background: "var(--cream)", color: "var(--ink3)", border: "1px solid var(--border)" };
  }

  function getCriterionIcon(result: string) {
    const r = result?.toUpperCase();
    if (r === "PASS" || r === "MET" || r === "YES" || r === "TRUE") return "\u2713";
    if (r === "FAIL" || r === "NOT_MET" || r === "NO" || r === "FALSE") return "\u2717";
    return "?";
  }

  function getCriterionColor(result: string) {
    const r = result?.toUpperCase();
    if (r === "PASS" || r === "MET" || r === "YES" || r === "TRUE") return "var(--green)";
    if (r === "FAIL" || r === "NOT_MET" || r === "NO" || r === "FALSE") return "var(--red)";
    return "var(--amber)";
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }


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
          {ADMIN_NAV.map(item => {
            const active = pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard");
            return (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: active ? "rgba(200,155,60,.15)" : "transparent",
              border: active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: active ? 500 : 400, marginBottom: 2
            }}>
              <span>{item.icon}</span>{item.label}
            </a>
            );
          })}
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

          {/* Success banner */}
          {successBanner && (
            <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", padding: "12px 18px", marginBottom: 20, fontSize: 13, color: "var(--green)", fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{successBanner}</span>
              <button onClick={() => setSuccessBanner(null)} style={{ background: "none", border: "none", color: "var(--green)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* Document Access Consent Banner */}
          {!docAccessLoading && (() => {
            const clientGrant = docGrants.find((g: any) => g.clientId === clientId || g.client?.id === clientId);
            const pendingGrant = docGrants.find((g: any) => (g.clientId === clientId || g.client?.id === clientId) && g.status === "PENDING");
            const activeGrant = docGrants.find((g: any) => (g.clientId === clientId || g.client?.id === clientId) && (g.status === "GRANTED" || g.status === "ACTIVE"));

            if (activeGrant) {
              return (
                <div style={{
                  background: "var(--green-bg, rgba(39,174,96,.08))", border: "1px solid var(--green-b, rgba(39,174,96,.2))",
                  borderRadius: "var(--r, 8px)", padding: "14px 20px", marginBottom: 20,
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12,
                }}>
                  <span style={{ fontSize: 14, color: "var(--green, #27ae60)", fontWeight: 500 }}>
                    &#9989; Document access granted by {activeGrant.granterName || activeGrant.granter?.firstName || "customer"} on {new Date(activeGrant.grantedAt || activeGrant.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <a href={`/documents?clientId=${clientId}`} style={{
                    padding: "6px 16px", fontSize: 13, fontWeight: 600, color: "var(--green, #27ae60)",
                    border: "1px solid var(--green-b, rgba(39,174,96,.3))", borderRadius: 6,
                    textDecoration: "none", background: "transparent",
                  }}>
                    Documents
                  </a>
                </div>
              );
            }

            if (pendingGrant) {
              return (
                <div style={{
                  background: "var(--amber-bg, rgba(232,168,56,.08))", border: "1px solid var(--amber-b, rgba(232,168,56,.2))",
                  borderRadius: "var(--r, 8px)", padding: "14px 20px", marginBottom: 20,
                  fontSize: 14, color: "var(--amber, #E8A838)", fontWeight: 500,
                }}>
                  &#9203; Access request pending — waiting for customer approval
                </div>
              );
            }

            // No grant — show locked banner with request button
            return (
              <div style={{
                background: "rgba(11,25,41,.04)", border: "1px solid rgba(11,25,41,.1)",
                borderRadius: "var(--r, 8px)", padding: "14px 20px", marginBottom: 20,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12,
              }}>
                <span style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500 }}>
                  &#128274; Document access requires customer consent
                </span>
                <button onClick={() => setShowRequestModal(true)} style={{
                  padding: "8px 20px", fontSize: 13, fontWeight: 600,
                  background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                  border: "none", borderRadius: 8, color: "#fff", cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(200,155,60,.25)",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  Request Access
                </button>
              </div>
            );
          })()}

          {/* Request Access Modal */}
          {showRequestModal && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(11,25,41,.5)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                background: "#fff", borderRadius: 16, padding: "32px 28px",
                maxWidth: 460, width: "90%",
                boxShadow: "0 20px 60px rgba(11,25,41,.2)",
              }}>
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: 22,
                  color: "var(--navy)", fontWeight: 500, marginBottom: 20,
                }}>
                  Request Document Access
                </h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Reason</label>
                  <textarea
                    value={requestReason}
                    onChange={e => setRequestReason(e.target.value)}
                    placeholder="Explain why you need access to this client's documents..."
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 14px", fontSize: 14,
                      border: "1px solid rgba(11,25,41,.15)", borderRadius: 8,
                      resize: "vertical" as const, fontFamily: "'DM Sans', sans-serif",
                      boxSizing: "border-box" as const, outline: "none",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Scope</label>
                  <select
                    value={requestScope}
                    onChange={e => setRequestScope(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 14px", fontSize: 14,
                      border: "1px solid rgba(11,25,41,.15)", borderRadius: 8,
                      fontFamily: "'DM Sans', sans-serif", background: "#fff",
                      boxSizing: "border-box" as const, outline: "none",
                    }}
                  >
                    <option value="All Documents">All Documents</option>
                    <option value="Financial Only">Financial Only</option>
                    <option value="Single Document">Single Document</option>
                  </select>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>Expiration</label>
                  <select
                    value={requestExpiration}
                    onChange={e => setRequestExpiration(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 14px", fontSize: 14,
                      border: "1px solid rgba(11,25,41,.15)", borderRadius: 8,
                      fontFamily: "'DM Sans', sans-serif", background: "#fff",
                      boxSizing: "border-box" as const, outline: "none",
                    }}
                  >
                    <option value="7 days">7 days</option>
                    <option value="30 days">30 days</option>
                    <option value="90 days">90 days</option>
                    <option value="No expiration">No expiration</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowRequestModal(false)} style={{
                    flex: 1, padding: "11px", fontSize: 14, fontWeight: 500,
                    background: "transparent", border: "1px solid rgba(11,25,41,.15)",
                    borderRadius: 8, color: "rgba(11,25,41,.6)", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Cancel
                  </button>
                  <button
                    onClick={submitAccessRequest}
                    disabled={requestSubmitting || !requestReason.trim()}
                    style={{
                      flex: 1, padding: "11px", fontSize: 14, fontWeight: 600,
                      background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                      border: "none", borderRadius: 8, color: "#fff", cursor: "pointer",
                      boxShadow: "0 2px 12px rgba(200,155,60,.3)",
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: requestSubmitting || !requestReason.trim() ? 0.6 : 1,
                    }}>
                    {requestSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  {client?.entityType && <span style={{ fontSize: 13, color: "var(--ink3)" }}>{client.entityType}</span>}
                  {client?.ein && <span style={{ fontSize: 13, color: "var(--ink3)", fontFamily: "monospace" }}>EIN: {client.ein}</span>}
                  <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: "var(--green-bg)", color: "var(--green)" }}>Active</span>
                </div>
              </div>
              <a href={`/clients/${clientId}/edit`} style={{ padding: "10px 20px", background: "#fff", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                Edit Client
              </a>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
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

          {/* ── INTEGRATIONS ── */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Integrations</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400 }}>Connected Data Sources</h2>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 4, lineHeight: 1.5 }}>
                  Integration status for this client's connected data sources.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {INTEGRATIONS.map(integration => {
                const isOAuth = OAUTH_INTEGRATIONS.includes(integration.id);
                const isConnected = isOAuth ? !!oauthStatus[integration.id] : !!samData;
                const connectedAt = oauthStatus[integration.id]?.connectedAt;

                return (
                  <div key={integration.id} style={{ padding: "20px", border: `1px solid ${isConnected ? "rgba(39,174,96,.2)" : "var(--border)"}`, borderRadius: 12, background: isConnected ? "rgba(39,174,96,.04)" : "var(--cream)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 24 }}>{integration.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{integration.name}</div>
                        <div style={{ fontSize: 11, color: isConnected ? "var(--green, #27ae60)" : "var(--ink4)", marginTop: 2 }}>
                          {isConnected
                            ? connectedAt ? `Connected ${new Date(connectedAt).toLocaleDateString()}` : "Connected"
                            : "Not connected"}
                        </div>
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 600, background: isConnected ? "rgba(39,174,96,.1)" : "rgba(149,165,166,.1)", color: isConnected ? "#27ae60" : "#95a5a6", textTransform: "uppercase" as const, letterSpacing: ".04em" }}>
                        {isConnected ? "✓ Active" : "Inactive"}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>{integration.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── INVITE CLIENT ── */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Portal Access</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400 }}>Invite Client to Portal</h2>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 4, lineHeight: 1.5 }}>
                  Send an invitation email so your client can access their certification workspace, review AI drafts, and upload documents.
                </p>
              </div>
            </div>
            <InviteForm clientId={clientId} clientName={client?.businessName} />
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
  <div key={cert.id} style={{ display: "flex", padding: "12px 0", borderBottom: "1px solid var(--border)", justifyContent: "space-between", alignItems: "center" }}>
    <a href={`/certifications/${cert.id}`} style={{ flex: 1, textDecoration: "none" }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{cert.type.replace(/_/g, " ")}</div>
      <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 2 }}>{cert.status.replace(/_/g, " ")}</div>
    </a>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, background: "var(--amber-bg)", color: "var(--amber)", fontWeight: 500 }}>{cert.status.replace(/_/g, " ")}</span>
      <a href={`/certifications/${cert.id}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none" }}>→</a>
      <button
        onClick={async () => {
          if (!confirm(`Delete ${cert.type.replace(/_/g, " ")} certification? This cannot be undone.`)) return;
          try {
            await apiRequest(`/api/certifications/${cert.id}`, { method: "DELETE" });
            setClient((prev: any) => ({ ...prev, certifications: prev.certifications.filter((c: any) => c.id !== cert.id) }));
          } catch (err) {
            alert("Failed to delete certification.");
          }
        }}
        style={{ padding: "4px 10px", background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", color: "var(--red)", fontSize: 11, cursor: "pointer" }}>
        Delete
      </button>
    </div>
  </div>
))
            )}
          </div>

          {/* ── REVIEW HISTORY ── */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>AI Reviews</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400 }}>Review History</h2>
              </div>
            </div>

            {reviewsLoading ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink4)", fontSize: 13 }}>Loading reviews...</div>
            ) : clientReviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink4)" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📝</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink3)", marginBottom: 4 }}>No reviews yet</div>
                <div style={{ fontSize: 12, color: "var(--ink4)" }}>AI reviews will appear here once generated for this client</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Score Timeline Bar */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60, padding: "0 4px", marginBottom: 8 }}>
                  {clientReviews.slice().reverse().map((review: any, idx: number) => {
                    const score = review.overallScore || 0;
                    const barHeight = Math.max(8, (score / 100) * 56);
                    const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
                    return (
                      <div key={review.id || idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <div style={{ fontSize: 9, color: "var(--ink4)", fontWeight: 500 }}>{score}</div>
                        <div style={{ width: "100%", maxWidth: 32, height: barHeight, background: getReviewScoreColor(score), borderRadius: "4px 4px 0 0", opacity: 0.85 }} />
                        <div style={{ fontSize: 8, color: "var(--ink4)", whiteSpace: "nowrap" as const }}>{date}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Review Cards */}
                {clientReviews.map((review: any, idx: number) => {
                  const score = review.overallScore || 0;
                  const verdict = review.overallVerdict || "";
                  const verdictLabel = verdict.replace(/_/g, " ");
                  const certType = (review.certType || "").replace(/_/g, " ");
                  const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
                  let criticalIssuesCount = 0;
                  try {
                    const parsed = typeof review.criticalIssues === "string" ? JSON.parse(review.criticalIssues) : review.criticalIssues;
                    criticalIssuesCount = Array.isArray(parsed) ? parsed.length : 0;
                  } catch { /* ignore */ }
                  const reviewerId = review.reviewedBy ? `${review.reviewedBy.firstName || ""} ${review.reviewedBy.lastName || ""}`.trim() : "AI";

                  return (
                    <div key={review.id || idx} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                        {/* Score circle */}
                        <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${getReviewScoreColor(score)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: getReviewScoreColor(score) }}>{score}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: getReviewVerdictColor(verdict), background: `${getReviewVerdictColor(verdict)}15` }}>
                              {verdictLabel}
                            </span>
                            {certType && <span style={{ fontSize: 12, color: "var(--ink3)" }}>{certType}</span>}
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--ink4)" }}>
                            <span>{date}</span>
                            {criticalIssuesCount > 0 && (
                              <span style={{ color: "#e74c3c", fontWeight: 500 }}>{criticalIssuesCount} critical issue{criticalIssuesCount !== 1 ? "s" : ""}</span>
                            )}
                            {reviewerId && <span>by {reviewerId}</span>}
                          </div>
                        </div>
                      </div>
                      {review.id && (
                        <a href={`/reviews/${review.id}`} style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap" as const }}>
                          View Full Review →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── ELIGIBILITY ASSESSMENT ── */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Assessment</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400 }}>Eligibility Assessment</h2>
              </div>
              <a href={`/clients/${clientId}/eligibility`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                View Eligibility Wizard &rarr;
              </a>
            </div>

            {eligibilityLoading ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink4)", fontSize: 13 }}>Loading eligibility data...</div>
            ) : eligibilityError ? (
              <div style={{ padding: "12px 16px", background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", fontSize: 13, color: "var(--red)" }}>
                {eligibilityError}
              </div>
            ) : !eligibility || !eligibility.assessmentResults ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>&#128203;</div>
                <div style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 20 }}>No eligibility assessment has been completed for this client yet.</div>
                <a href={`/clients/${clientId}/eligibility`} style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px",
                  background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                  border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(200,155,60,.35)"
                }}>
                  Run Assessment &rarr;
                </a>
              </div>
            ) : (() => {
              const results = eligibility.assessmentResults;
              const assessments = results.assessments || [];
              const recommendedNext = results.recommendedNext;
              return (
                <div>
                  {/* Recommended Next */}
                  {recommendedNext && (
                    <div style={{ padding: "12px 16px", background: "linear-gradient(135deg, rgba(200,155,60,.08) 0%, rgba(232,184,75,.06) 100%)", border: "1px solid rgba(200,155,60,.2)", borderRadius: 8, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>&#11088;</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 2 }}>Recommended Next</div>
                        <div style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500 }}>{recommendedNext}</div>
                      </div>
                    </div>
                  )}

                  {/* Assessment cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {assessments.map((assessment: any, idx: number) => {
                      const criteria = assessment.criteria || [];
                      const previewCriteria = criteria.slice(0, 3);
                      const isExpanded = !!expandedCerts[idx];
                      const badgeStyle = getStatusBadgeStyle(assessment.status);
                      return (
                        <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                          {/* Cert header row */}
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", alignItems: "center", padding: "14px 18px", background: "var(--cream)", gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{(assessment.certType || assessment.type || "").replace(/_/g, " ")}</div>
                              {assessment.name && assessment.name !== assessment.certType && (
                                <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>{assessment.name}</div>
                              )}
                            </div>
                            <div>
                              <span style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600, ...badgeStyle }}>
                                {(assessment.status || "").replace(/_/g, " ")}
                              </span>
                            </div>
                            <div>
                              {assessment.score != null && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                                    <div style={{ width: `${Math.round(assessment.score * 100)}%`, height: "100%", background: assessment.score >= 0.7 ? "var(--green)" : assessment.score >= 0.4 ? "var(--amber)" : "var(--red)", borderRadius: 3, transition: "width .3s" }} />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)", minWidth: 36 }}>{Math.round(assessment.score * 100)}%</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setExpandedCerts(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "var(--gold)", cursor: "pointer", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                              {isExpanded ? "Hide Details" : "View Full Results"}
                            </button>
                          </div>

                          {/* Preview criteria (always shown) */}
                          {previewCriteria.length > 0 && !isExpanded && (
                            <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border)" }}>
                              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                {previewCriteria.map((c: any, ci: number) => (
                                  <div key={ci} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink3)" }}>
                                    <span style={{ color: getCriterionColor(c.result || c.status), fontWeight: 700, fontSize: 14 }}>{getCriterionIcon(c.result || c.status)}</span>
                                    {c.name || c.label || c.criterion}
                                  </div>
                                ))}
                                {criteria.length > 3 && (
                                  <span style={{ fontSize: 11, color: "var(--ink4)" }}>+{criteria.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Expanded full criteria */}
                          {isExpanded && criteria.length > 0 && (
                            <div style={{ borderTop: "1px solid var(--border)", padding: "16px 18px" }}>
                              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 12 }}>All Criteria</div>
                              {criteria.map((c: any, ci: number) => (
                                <div key={ci} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: ci < criteria.length - 1 ? "1px solid var(--border)" : "none" }}>
                                  <span style={{ color: getCriterionColor(c.result || c.status), fontWeight: 700, fontSize: 16, lineHeight: "20px", flexShrink: 0 }}>{getCriterionIcon(c.result || c.status)}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{c.name || c.label || c.criterion}</div>
                                    {c.details && <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 3, lineHeight: 1.5 }}>{c.details}</div>}
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 500, color: getCriterionColor(c.result || c.status), flexShrink: 0, textTransform: "uppercase" }}>
                                    {(c.result || c.status || "").replace(/_/g, " ")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* State certs */}
                  {results.stateCerts && results.stateCerts.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink4)", marginBottom: 8 }}>State Certifications</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {results.stateCerts.map((sc: any, i: number) => (
                          <span key={i} style={{ padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500, background: "var(--cream)", border: "1px solid var(--border)", color: "var(--ink2)" }}>
                            {typeof sc === "string" ? sc : sc.name || sc.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer: timestamp + actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>
                      {eligibility.assessedAt || eligibility.createdAt
                        ? `Assessed on: ${new Date(eligibility.assessedAt || eligibility.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                        : ""}
                    </div>
                    <button
                      onClick={runAssessment}
                      disabled={reassessing}
                      style={{
                        padding: "9px 20px",
                        background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                        border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500,
                        cursor: reassessing ? "not-allowed" : "pointer",
                        opacity: reassessing ? 0.7 : 1,
                        boxShadow: "0 4px 12px rgba(200,155,60,.3)",
                        fontFamily: "'DM Sans', sans-serif"
                      }}>
                      {reassessing ? "Assessing..." : "Re-run Assessment"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </div>
    </div>
  );
  function InviteForm({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendInvite() {
    if (!email) return setError("Email is required.");
    setSending(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app"}/api/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, clientId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setEmail("");
      } else {
        setError(data.error || "Failed to send invite.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (sent) return (
    <div style={{ padding: "12px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 13, color: "var(--green)", fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>✓ Invitation sent successfully</span>
      <button onClick={() => setSent(false)} style={{ background: "none", border: "none", color: "var(--green)", cursor: "pointer", fontSize: 12 }}>Send another</button>
    </div>
  );

  return (
    <div>
      {error && (
        <div style={{ padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", fontSize: 13, color: "var(--red)", marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendInvite()}
          placeholder={`e.g. tricia@${clientName?.split(" ")[0]?.toLowerCase() || "company"}.com`}
          style={{ flex: 1, padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
        />
        <button onClick={sendInvite} disabled={sending}
          style={{ padding: "10px 22px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1, whiteSpace: "nowrap" as const, boxShadow: "0 4px 12px rgba(200,155,60,.3)" }}>
          {sending ? "Sending..." : "Send Invite →"}
        </button>
      </div>
    </div>
  );
}
}
