"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const CERT_TYPE_LABELS: Record<string, string> = {
  GSA_MAS: "GSA Multiple Award Schedule",
  EIGHT_A: "8(a) Business Development",
  WOSB: "Women-Owned Small Business",
  SDVOSB: "Service-Disabled Veteran-Owned",
  HUBZONE: "HUBZone",
  MBE: "Minority Business Enterprise",
  BUNDLE_8A_GSA: "8(a) + GSA Bundle",
};

const TIER_LABELS: Record<string, string> = {
  ESSENTIAL: "Essential",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

export default function PricingManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable state
  const [betaMode, setBetaMode] = useState(true);
  const [generationFees, setGenerationFees] = useState<Record<string, number>>({});
  const [maintenanceTiers, setMaintenanceTiers] = useState<Record<string, { name: string; monthlyPrice: number; annualPrice: number }>>({});

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
    fetchPricing();
  }, []);

  async function fetchPricing() {
    try {
      const data = await apiRequest("/api/pricing");
      setPricing(data);
      setBetaMode(data.betaMode ?? true);
      setGenerationFees(data.generationFees || {});
      setMaintenanceTiers(data.maintenanceTiers || {});
    } catch (err) {
      console.error("Failed to fetch pricing:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await apiRequest("/api/pricing", {
        method: "PUT",
        body: JSON.stringify({ betaMode, generationFees, maintenanceTiers }),
      });
      await fetchPricing();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save pricing:", err);
      alert("Failed to save pricing. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!user || loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading...
    </div>
  );

  const navItems = [
    { label: "Dashboard", icon: "\u2B1B", href: "/dashboard" },
    { label: "Eligibility", icon: "\u2705", href: "/clients" },
    { label: "Clients", icon: "\uD83D\uDC65", href: "/clients" },
    { label: "Certifications", icon: "\uD83D\uDCCB", href: "/certifications" },
    { label: "Documents", icon: "\uD83D\uDCC4", href: "/documents" },
    { label: "Calendar", icon: "\uD83D\uDCC5", href: "/calendar" },
    { label: "Integrations", icon: "\uD83D\uDD17", href: "/integrations" },
    { label: "Team & Users", icon: "\uD83D\uDC64", href: "/settings/team" },
    { label: "Usage & Costs", icon: "\uD83D\uDCCA", href: "/usage" },
    { label: "Pricing", icon: "\uD83D\uDCB0", href: "/settings/pricing", active: true },
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
          {navItems.map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
              background: item.active ? "rgba(200,155,60,.15)" : "transparent",
              border: item.active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              borderLeft: item.active ? "3px solid var(--gold)" : "3px solid transparent",
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
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 960 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Settings</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 4 }}>
              Pricing Management
            </h1>
            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", borderRadius: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Configure generation fees and maintenance tiers for your platform
            </p>
          </div>

          {/* Beta Mode Toggle — PROMINENT */}
          <div style={{
            background: betaMode ? "linear-gradient(135deg, rgba(200,155,60,.12) 0%, rgba(200,155,60,.04) 100%)" : "linear-gradient(135deg, rgba(34,197,94,.08) 0%, rgba(34,197,94,.02) 100%)",
            border: betaMode ? "2px solid rgba(200,155,60,.35)" : "2px solid rgba(34,197,94,.3)",
            borderRadius: 16, padding: "28px 32px", marginBottom: 32,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 28 }}>{betaMode ? "\u26A0\uFE0F" : "\u2705"}</span>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, margin: 0 }}>
                    Beta Mode
                  </h2>
                </div>
                <p style={{ fontSize: 15, color: betaMode ? "#92700C" : "var(--ink3)", lineHeight: 1.6, margin: 0, maxWidth: 500 }}>
                  {betaMode
                    ? "Everything is FREE. All generation fees and maintenance tiers are bypassed. Users can access all features without payment."
                    : "Paywalls are ACTIVE. Users must pay generation fees and subscribe to maintenance tiers to access features."
                  }
                </p>
                {betaMode && (
                  <div style={{
                    marginTop: 12, padding: "8px 14px", background: "rgba(200,155,60,.12)",
                    border: "1px solid rgba(200,155,60,.25)", borderRadius: 8,
                    fontSize: 13, color: "#92700C", fontWeight: 500,
                    display: "inline-block",
                  }}>
                    Turn OFF to start charging users
                  </div>
                )}
              </div>
              <div
                onClick={() => setBetaMode(!betaMode)}
                style={{
                  width: 72, height: 40, borderRadius: 20, cursor: "pointer",
                  background: betaMode ? "linear-gradient(135deg, #C89B3C, #E8B84B)" : "rgba(34,197,94,.8)",
                  position: "relative", transition: "background .3s",
                  boxShadow: betaMode ? "0 2px 12px rgba(200,155,60,.35)" : "0 2px 12px rgba(34,197,94,.3)",
                  flexShrink: 0, marginLeft: 24,
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 3,
                  left: betaMode ? 35 : 3,
                  transition: "left .3s",
                  boxShadow: "0 2px 6px rgba(0,0,0,.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>
                  {betaMode ? "ON" : "OFF"}
                </div>
              </div>
            </div>
          </div>

          {/* Generation Fees Table */}
          <div style={{
            background: "#fff", border: "1px solid rgba(200,155,60,.08)",
            borderRadius: 14, overflow: "hidden", marginBottom: 28,
            boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
          }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(200,155,60,.08)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>One-Time Fees</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Generation Fees</h2>
              <p style={{ fontSize: 13, color: "var(--ink4)", marginTop: 4 }}>Charged once per certification when a user generates their application package</p>
            </div>

            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
              padding: "12px 28px", background: "#FAFAF7",
              borderBottom: "1px solid rgba(200,155,60,.08)",
              fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const,
              letterSpacing: ".08em", color: "var(--ink4)",
            }}>
              <div>Certification Type</div>
              <div>Price (cents)</div>
              <div>Display Price</div>
            </div>

            {/* Rows */}
            {Object.entries(generationFees).map(([key, value]) => (
              <div key={key} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
                padding: "16px 28px", alignItems: "center",
                borderBottom: "1px solid rgba(200,155,60,.06)",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{CERT_TYPE_LABELS[key] || key}</div>
                  <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 2 }}>{key}</div>
                </div>
                <div>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={value}
                      onChange={e => setGenerationFees(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      style={{
                        width: 120, padding: "8px 12px",
                        background: betaMode ? "#F8F6F1" : "#fff",
                        border: "1px solid rgba(200,155,60,.2)",
                        borderRadius: 8, fontSize: 14, color: "var(--navy)",
                        outline: "none", fontFamily: "'DM Sans', sans-serif",
                        opacity: betaMode ? 0.6 : 1,
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 14, color: betaMode ? "var(--gold)" : "var(--navy)", fontWeight: betaMode ? 500 : 400 }}>
                  {betaMode ? "$0 / Free" : `$${(value / 100).toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>

          {/* Maintenance Tiers Table */}
          <div style={{
            background: "#fff", border: "1px solid rgba(200,155,60,.08)",
            borderRadius: 14, overflow: "hidden", marginBottom: 28,
            boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
          }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(200,155,60,.08)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Recurring</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Maintenance Tiers</h2>
              <p style={{ fontSize: 13, color: "var(--ink4)", marginTop: 4 }}>Ongoing subscription pricing for certification maintenance and compliance monitoring</p>
            </div>

            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
              padding: "12px 28px", background: "#FAFAF7",
              borderBottom: "1px solid rgba(200,155,60,.08)",
              fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const,
              letterSpacing: ".08em", color: "var(--ink4)",
            }}>
              <div>Tier</div>
              <div>Monthly Price</div>
              <div>Display (Monthly)</div>
              <div>Annual Price</div>
              <div>Display (Annual)</div>
            </div>

            {/* Rows */}
            {Object.entries(maintenanceTiers).map(([key, tier]) => (
              <div key={key} style={{
                display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
                padding: "16px 28px", alignItems: "center",
                borderBottom: "1px solid rgba(200,155,60,.06)",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{tier.name || TIER_LABELS[key] || key}</div>
                  <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 2 }}>{key}</div>
                </div>
                <div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink4)" }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={tier.monthlyPrice}
                      onChange={e => setMaintenanceTiers(prev => ({
                        ...prev,
                        [key]: { ...prev[key], monthlyPrice: Number(e.target.value) },
                      }))}
                      style={{
                        width: 100, padding: "8px 10px 8px 24px",
                        background: betaMode ? "#F8F6F1" : "#fff",
                        border: "1px solid rgba(200,155,60,.2)",
                        borderRadius: 8, fontSize: 14, color: "var(--navy)",
                        outline: "none", fontFamily: "'DM Sans', sans-serif",
                        opacity: betaMode ? 0.6 : 1,
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 14, color: betaMode ? "var(--gold)" : "var(--navy)", fontWeight: betaMode ? 500 : 400 }}>
                  {betaMode ? "$0 / Free" : `$${tier.monthlyPrice}/mo`}
                </div>
                <div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink4)" }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={tier.annualPrice}
                      onChange={e => setMaintenanceTiers(prev => ({
                        ...prev,
                        [key]: { ...prev[key], annualPrice: Number(e.target.value) },
                      }))}
                      style={{
                        width: 100, padding: "8px 10px 8px 24px",
                        background: betaMode ? "#F8F6F1" : "#fff",
                        border: "1px solid rgba(200,155,60,.2)",
                        borderRadius: 8, fontSize: 14, color: "var(--navy)",
                        outline: "none", fontFamily: "'DM Sans', sans-serif",
                        opacity: betaMode ? 0.6 : 1,
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 14, color: betaMode ? "var(--gold)" : "var(--navy)", fontWeight: betaMode ? 500 : 400 }}>
                  {betaMode ? "$0 / Free" : `$${tier.annualPrice}/yr`}
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "14px 40px",
                background: saving ? "var(--ink4)" : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                border: "none", borderRadius: 10,
                color: "#fff", fontSize: 16, fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
                boxShadow: "0 4px 20px rgba(200,155,60,.3)",
                transition: "all .2s",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = "0 6px 28px rgba(200,155,60,.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(200,155,60,.3)"; }}
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
            {saveSuccess && (
              <span style={{ fontSize: 14, color: "var(--green, #22C55E)", fontWeight: 500 }}>
                {"\u2713"} Saved successfully
              </span>
            )}
          </div>

          {/* Payment Provider Section */}
          <div style={{
            background: "#fff", border: "1px solid rgba(200,155,60,.08)",
            borderRadius: 14, overflow: "hidden",
            boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
          }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(200,155,60,.08)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Integrations</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Payment Providers</h2>
            </div>
            <div style={{ padding: "0 28px" }}>
              {/* Stripe */}
              <div style={{ padding: "20px 0", borderBottom: "1px solid rgba(200,155,60,.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: "#635BFF", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                  }}>S</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Stripe</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>Credit cards, Apple Pay, Google Pay</div>
                  </div>
                </div>
                <div style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: "rgba(239,68,68,.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,.15)",
                }}>
                  Not configured
                </div>
              </div>
              {/* PayPal */}
              <div style={{ padding: "20px 0", borderBottom: "1px solid rgba(200,155,60,.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: "#003087", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                  }}>P</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>PayPal</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>PayPal balance and linked accounts</div>
                  </div>
                </div>
                <div style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: "rgba(239,68,68,.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,.15)",
                }}>
                  Not configured
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 28px 20px", background: "#FAFAF7" }}>
              <p style={{ fontSize: 13, color: "var(--ink4)", lineHeight: 1.6 }}>
                Payment processing will be enabled when you connect Stripe. During beta, upgrades are instant and free.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
