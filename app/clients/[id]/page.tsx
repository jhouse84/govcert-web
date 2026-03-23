"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

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
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/${provider}/start?clientId=${clientId}&token=${token}`;
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
              background: (item as any).active ? "rgba(200,155,60,.15)" : "transparent",
              border: (item as any).active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: (item as any).active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: (item as any).active ? 500 : 400, marginBottom: 2
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

          {/* Success banner */}
          {successBanner && (
            <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", padding: "12px 18px", marginBottom: 20, fontSize: 13, color: "var(--green)", fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{successBanner}</span>
              <button onClick={() => setSuccessBanner(null)} style={{ background: "none", border: "none", color: "var(--green)", cursor: "pointer", fontSize: 16 }}>✕</button>
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invites`, {
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
