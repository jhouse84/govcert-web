"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function PortalIntegrationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthStatus, setOauthStatus] = useState<any>(null);

  // SAM.gov lookup
  const [samQuery, setSamQuery] = useState("");
  const [samSearching, setSamSearching] = useState(false);
  const [samResult, setSamResult] = useState<any>(null);
  const [samError, setSamError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "ADMIN" || parsed.role === "ADVISOR") {
        router.push("/dashboard");
        return;
      }
      setUser(parsed);
    }
    fetchClientId();
  }, []);

  async function fetchClientId() {
    try {
      let cId: string | null = null;

      // Try certifications first
      try {
        const data = await apiRequest("/api/certifications");
        if (data && data.length > 0 && data[0].clientId) cId = data[0].clientId;
      } catch {}

      // Try clients
      if (!cId) {
        try {
          const clients = await apiRequest("/api/clients");
          if (clients && clients.length > 0) cId = clients[0].id;
        } catch {}
      }

      // Auto-create client if none exists
      if (!cId) {
        try {
          const userData = JSON.parse(localStorage.getItem("user") || "{}");
          const newClient = await apiRequest("/api/clients", {
            method: "POST",
            body: JSON.stringify({
              name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "My Business",
              email: userData.email || "",
            }),
          });
          cId = newClient.id;
        } catch (err) { console.error("Could not create client:", err); }
      }

      if (cId) {
        setClientId(cId);
        fetchOAuthStatus(cId);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchOAuthStatus(cId: string) {
    try {
      const data = await apiRequest(`/api/oauth/status/${cId}`);
      setOauthStatus(data);
    } catch {}
  }

  function connectOAuth(provider: string) {
    const token = localStorage.getItem("token");
    if (!clientId) {
      alert("Please wait — setting up your account. Try again in a moment.");
      return;
    }
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app"}/api/oauth/${provider}/start?clientId=${clientId}&token=${token}`;
  }

  const [samSaving, setSamSaving] = useState(false);
  const [samSaved, setSamSaved] = useState(false);

  async function lookupSam() {
    if (!samQuery.trim()) return;
    setSamSearching(true);
    setSamResult(null);
    setSamError("");
    setSamSaved(false);
    try {
      const q = samQuery.trim();
      // Detect CAGE code (5 alphanumeric) vs UEI (12 chars)
      const param = q.length === 5 ? `cage=${encodeURIComponent(q)}` : `uei=${encodeURIComponent(q)}`;
      const data = await apiRequest(`/api/sam/lookup?${param}`);
      // Backend returns { entities: [...] } — extract the first entity
      const entity = data?.entities?.[0] || data;
      if (!entity || (!entity.entityName && !entity.uei)) {
        setSamError("No entity found. Check your UEI or CAGE code and try again.");
      } else {
        setSamResult(entity);
      }
    } catch (err: any) {
      setSamError(err.message || "Entity not found. Check your UEI or CAGE code and try again.");
    } finally {
      setSamSearching(false);
    }
  }

  async function savesamToProfile() {
    if (!samResult || !clientId) return;
    setSamSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (samResult.entityName) updates.businessName = samResult.entityName;
      if (samResult.uei) updates.uei = samResult.uei;
      if (samResult.cageCode) updates.cageCode = samResult.cageCode;
      if (samResult.address?.line1) updates.address = samResult.address.line1;
      if (samResult.address?.city) updates.city = samResult.address.city;
      if (samResult.address?.state) updates.state = samResult.address.state;
      if (samResult.address?.zip) updates.zip = samResult.address.zip;

      await apiRequest(`/api/clients/${clientId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setSamSaved(true);
    } catch (err: any) {
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSamSaving(false);
    }
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

  const integrations = [
    {
      id: "quickbooks",
      name: "QuickBooks Online",
      icon: "\uD83D\uDCD7",
      accent: "#2CA01C",
      description: "Automatically import your Profit & Loss statement, Balance Sheet, and revenue history. This data is required for size standard verification in most certifications.",
      pulls: ["Revenue (3 years)", "Employee count", "Balance sheet data"],
      cta: "Connect QuickBooks \u2192",
      connected: oauthStatus?.quickbooks,
    },
    {
      id: "gusto",
      name: "Gusto Payroll",
      icon: "\uD83D\uDFE1",
      accent: "#F45D48",
      description: "Sync payroll totals and employee roster. Employee data is needed for HUBZone certification and size standard calculations.",
      pulls: ["Payroll totals", "Employee count", "Employee locations"],
      cta: "Connect Gusto \u2192",
      connected: oauthStatus?.gusto,
    },
    {
      id: "sam",
      name: "SAM.gov Lookup",
      icon: "\uD83C\uDFDB\uFE0F",
      accent: "#1A3F7A",
      description: "Look up your entity registration status, NAICS codes, and business details. SAM.gov registration is required for all federal contracting.",
      pulls: ["Registration status", "Expiration date", "NAICS codes", "UEI/CAGE"],
      cta: "Look Up My Business \u2192",
      connected: oauthStatus?.sam,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top right, rgba(200,155,60,.03) 0%, transparent 50%), var(--cream)", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "linear-gradient(180deg, #0B1929 0%, #0D1F35 100%)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
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
          <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>My Portal</div>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83C\uDFE0"}</span> Home
          </a>
          <a href="/portal/profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83C\uDFE2"}</span> Company Profile
          </a>
          <a href="/portal/applications" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83D\uDCCB"}</span> My Applications
          </a>
          <a href="/portal/eligibility" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\u2705"}</span> Eligibility
          </a>
          <a href="/portal/integrations" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", borderLeft: "3px solid var(--gold)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
            <span>{"\uD83D\uDD17"}</span> Integrations
          </a>
          <a href="/portal/documents" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83D\uDCC4"}</span> My Documents
          </a>
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Client Portal</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>

          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Integrations</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 4 }}>
              Connect Your Tools
            </h1>
            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", borderRadius: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 620 }}>
              Link your financial and business platforms so GovCert can pull data directly into your certification applications.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {integrations.map(integration => (
              <div key={integration.id} style={{
                background: "#fff",
                border: "1px solid rgba(200,155,60,.08)",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
                transition: "all .2s",
              }}>
                {/* Accent bar */}
                <div style={{ height: 3, background: integration.accent }} />

                <div style={{ padding: "28px 32px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14,
                      background: `${integration.accent}12`,
                      border: `1px solid ${integration.accent}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, flexShrink: 0,
                    }}>
                      {integration.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 500, margin: 0 }}>
                          {integration.name}
                        </h3>
                        {integration.connected && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "3px 10px", borderRadius: 100,
                            fontSize: 11, fontWeight: 600,
                            background: "var(--green-bg)", color: "var(--green)",
                            border: "1px solid var(--green-b)",
                          }}>
                            {"\u2713"} Connected
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 18, maxWidth: 520 }}>
                        {integration.description}
                      </p>

                      {/* What we pull */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--ink4)", marginBottom: 8 }}>
                          {integration.id === "sam" ? "What we check" : "What we pull"}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                          {integration.pulls.map(item => (
                            <span key={item} style={{
                              padding: "4px 12px", borderRadius: 100,
                              fontSize: 12, fontWeight: 500,
                              background: "var(--cream)", color: "var(--ink3)",
                              border: "1px solid var(--border)",
                            }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* SAM.gov inline search */}
                      {integration.id === "sam" && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <input
                              type="text"
                              placeholder="Enter your UEI or CAGE code"
                              value={samQuery}
                              onChange={e => setSamQuery(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && lookupSam()}
                              style={{
                                flex: 1, padding: "10px 14px",
                                background: "#fff", border: "1px solid var(--border)",
                                borderRadius: "var(--r)", fontSize: 14,
                                color: "var(--ink)", outline: "none",
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            />
                            <button
                              onClick={lookupSam}
                              disabled={samSearching || !samQuery.trim()}
                              style={{
                                padding: "10px 20px",
                                background: samSearching ? "var(--ink4)" : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                                border: "none", borderRadius: "var(--r)",
                                color: "#fff", fontSize: 13, fontWeight: 500,
                                cursor: samSearching ? "wait" : "pointer",
                                boxShadow: "0 4px 20px rgba(200,155,60,.35)",
                              }}
                            >
                              {samSearching ? "Searching..." : "Search"}
                            </button>
                          </div>

                          {samError && (
                            <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--r)", fontSize: 13, color: "#991B1B", marginBottom: 8 }}>
                              {samError}
                            </div>
                          )}

                          {samResult && (
                            <div style={{ padding: "16px 20px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: 10, marginBottom: 8 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--green)" }}>Entity Found</div>
                                {samSaved ? (
                                  <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>✓ Saved to your profile!</span>
                                ) : (
                                  <button onClick={savesamToProfile} disabled={samSaving}
                                    style={{ padding: "6px 16px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 2px 10px rgba(200,155,60,.3)" }}>
                                    {samSaving ? "Saving..." : "Save to Profile"}
                                  </button>
                                )}
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {samResult.entityName && (
                                  <div>
                                    <div style={{ fontSize: 10.5, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Business Name</div>
                                    <div style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500, marginTop: 2 }}>{samResult.entityName}</div>
                                  </div>
                                )}
                                {samResult.uei && (
                                  <div>
                                    <div style={{ fontSize: 10.5, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>UEI</div>
                                    <div style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500, marginTop: 2 }}>{samResult.uei}</div>
                                  </div>
                                )}
                                {samResult.cageCode && (
                                  <div>
                                    <div style={{ fontSize: 10.5, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>CAGE Code</div>
                                    <div style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500, marginTop: 2 }}>{samResult.cageCode}</div>
                                  </div>
                                )}
                                {samResult.registrationStatus && (
                                  <div>
                                    <div style={{ fontSize: 10.5, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Status</div>
                                    <div style={{ fontSize: 14, color: samResult.registrationStatus === "Active" ? "var(--green)" : "#B45309", fontWeight: 500, marginTop: 2 }}>{samResult.registrationStatus}</div>
                                  </div>
                                )}
                                {samResult.expirationDate && (
                                  <div>
                                    <div style={{ fontSize: 10.5, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Expiration Date</div>
                                    <div style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500, marginTop: 2 }}>{samResult.expirationDate}</div>
                                  </div>
                                )}
                                {samResult.naicsCodes && samResult.naicsCodes.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: 10.5, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Primary NAICS</div>
                                    <div style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500, marginTop: 2 }}>
                                      {samResult.naicsCodes.find((n: any) => n.primary)?.code || samResult.naicsCodes[0]?.code}
                                      {samResult.naicsCodes.find((n: any) => n.primary)?.description ? ` — ${samResult.naicsCodes.find((n: any) => n.primary)?.description}` : ""}
                                    </div>
                                  </div>
                                )}
                                {samResult.address && (
                                  <div style={{ gridColumn: "1 / -1" }}>
                                    <div style={{ fontSize: 10.5, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Address</div>
                                    <div style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500, marginTop: 2 }}>
                                      {[samResult.address.line1, samResult.address.city, samResult.address.state, samResult.address.zip].filter(Boolean).join(", ")}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action button */}
                      {integration.id !== "sam" && (
                        <button
                          onClick={() => connectOAuth(integration.id)}
                          disabled={integration.connected}
                          style={{
                            padding: "11px 24px",
                            background: integration.connected ? "var(--green-bg)" : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                            border: integration.connected ? "1px solid var(--green-b)" : "none",
                            borderRadius: 8,
                            color: integration.connected ? "var(--green)" : "#fff",
                            fontSize: 14, fontWeight: 500,
                            cursor: integration.connected ? "default" : "pointer",
                            boxShadow: integration.connected ? "none" : "0 4px 20px rgba(200,155,60,.35)",
                            transition: "all .2s",
                          }}
                        >
                          {integration.connected ? "\u2713 Connected" : integration.cta}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help note */}
          <div style={{ marginTop: 28, padding: "20px 24px", background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)", display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{"\uD83D\uDD12"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>Your data is secure</div>
              <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>
                All connections use OAuth 2.0 and bank-level encryption. We only read the data listed above and never modify your accounts.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
