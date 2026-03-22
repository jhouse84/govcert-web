"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function PricingManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState<{ tier: string; data: any } | null>(null);
  const [editForm, setEditForm] = useState({ monthlyPrice: 0, annualPrice: 0, betaMode: false });

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
    } catch (err) {
      console.error("Failed to fetch pricing:", err);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(tierKey: string) {
    const tier = pricing?.tiers?.[tierKey];
    if (!tier) return;
    setEditForm({
      monthlyPrice: tier.monthlyPrice || 0,
      annualPrice: tier.annualPrice || 0,
      betaMode: pricing?.betaMode ?? true,
    });
    setEditModal({ tier: tierKey, data: tier });
  }

  async function handleSave() {
    if (!editModal) return;
    setSaving(true);
    try {
      await apiRequest("/api/pricing", {
        method: "PUT",
        body: JSON.stringify({
          tier: editModal.tier,
          monthlyPrice: editForm.monthlyPrice,
          annualPrice: editForm.annualPrice,
          betaMode: editForm.betaMode,
        }),
      });
      await fetchPricing();
      setEditModal(null);
    } catch (err) {
      console.error("Failed to save pricing:", err);
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
    { label: "Team & Advisors", icon: "\uD83D\uDC64", href: "/settings/team" },
    { label: "Usage & Costs", icon: "\uD83D\uDCCA", href: "/usage" },
    { label: "Pricing", icon: "\uD83D\uDCB0", href: "/settings/pricing", active: true },
  ];

  const tiers = pricing?.tiers ? Object.entries(pricing.tiers) : [];

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
              Configure subscription pricing for your platform
            </p>
          </div>

          {/* Beta Mode Banner */}
          {pricing?.betaMode && (
            <div style={{
              background: "rgba(200,155,60,.08)", border: "1px solid rgba(200,155,60,.2)",
              borderRadius: 10, padding: "16px 24px", marginBottom: 28,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ fontSize: 20 }}>{"\u26A0\uFE0F"}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#92700C", marginBottom: 2 }}>Beta pricing is active</div>
                <div style={{ fontSize: 13, color: "#92700C", opacity: 0.8, lineHeight: 1.5 }}>
                  All tiers are free. Turn off beta mode to enable paid subscriptions.
                </div>
              </div>
            </div>
          )}

          {/* Current Pricing Table */}
          <div style={{
            background: "#fff", border: "1px solid rgba(200,155,60,.08)",
            borderRadius: 14, overflow: "hidden", marginBottom: 28,
            boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
          }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(200,155,60,.08)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Current Pricing</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Subscription Tiers</h2>
            </div>

            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 100px",
              padding: "12px 28px", background: "#FAFAF7",
              borderBottom: "1px solid rgba(200,155,60,.08)",
              fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const,
              letterSpacing: ".08em", color: "var(--ink4)",
            }}>
              <div>Tier</div>
              <div>Monthly Price</div>
              <div>Annual Price</div>
              <div style={{ textAlign: "right" as const }}>Actions</div>
            </div>

            {/* Rows */}
            {tiers.map(([key, tier]: [string, any]) => (
              <div key={key} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 100px",
                padding: "18px 28px", alignItems: "center",
                borderBottom: "1px solid rgba(200,155,60,.06)",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{tier.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 2 }}>{key}</div>
                </div>
                <div style={{ fontSize: 14, color: "var(--navy)" }}>
                  {pricing?.betaMode ? (
                    <span style={{ color: "var(--gold)", fontWeight: 500 }}>$0 / Free</span>
                  ) : (
                    <span>${tier.monthlyPrice}/mo</span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: "var(--navy)" }}>
                  {pricing?.betaMode ? (
                    <span style={{ color: "var(--gold)", fontWeight: 500 }}>$0 / Free</span>
                  ) : (
                    <span>${tier.annualPrice}/yr</span>
                  )}
                </div>
                <div style={{ textAlign: "right" as const }}>
                  <button
                    onClick={() => openEdit(key)}
                    style={{
                      padding: "6px 16px", background: "transparent",
                      border: "1px solid rgba(200,155,60,.2)", borderRadius: 6,
                      color: "var(--gold)", fontSize: 13, fontWeight: 500,
                      cursor: "pointer", transition: "all .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,155,60,.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
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

      {/* Edit Pricing Modal */}
      {editModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(11,25,41,.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, backdropFilter: "blur(4px)",
        }}
          onClick={() => setEditModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, width: 480,
              boxShadow: "0 8px 40px rgba(0,0,0,.2), 0 1px 3px rgba(0,0,0,.1)",
              overflow: "hidden",
            }}
          >
            <div style={{
              padding: "24px 28px", borderBottom: "1px solid rgba(200,155,60,.08)",
              background: "linear-gradient(135deg, #0B1929 0%, #1A3357 100%)",
              position: "relative",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C89B3C, #E8B84B)" }} />
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 400 }}>
                Edit Pricing
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
                {editModal.data.name}
              </p>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {/* Tier name (read-only) */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink3)", display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Tier</label>
                <div style={{
                  padding: "10px 14px", background: "#F8F6F1", borderRadius: 8,
                  border: "1px solid rgba(200,155,60,.1)", fontSize: 14, color: "var(--ink4)",
                }}>
                  {editModal.data.name} ({editModal.tier})
                </div>
              </div>

              {/* Monthly price */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink3)", display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Monthly Price (USD)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--ink4)" }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.monthlyPrice}
                    onChange={e => setEditForm({ ...editForm, monthlyPrice: Number(e.target.value) })}
                    style={{
                      width: "100%", padding: "10px 14px 10px 28px",
                      background: "#fff", border: "1px solid rgba(200,155,60,.2)",
                      borderRadius: 8, fontSize: 14, color: "var(--navy)",
                      outline: "none", fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
              </div>

              {/* Annual price */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink3)", display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Annual Price (USD)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--ink4)" }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.annualPrice}
                    onChange={e => setEditForm({ ...editForm, annualPrice: Number(e.target.value) })}
                    style={{
                      width: "100%", padding: "10px 14px 10px 28px",
                      background: "#fff", border: "1px solid rgba(200,155,60,.2)",
                      borderRadius: 8, fontSize: 14, color: "var(--navy)",
                      outline: "none", fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
              </div>

              {/* Beta mode toggle */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", background: "#F8F6F1", borderRadius: 8,
                border: "1px solid rgba(200,155,60,.1)", marginBottom: 24,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Beta Mode</div>
                  <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 2 }}>
                    When on, price displays as "$0 / Free during beta"
                  </div>
                </div>
                <div
                  onClick={() => setEditForm({ ...editForm, betaMode: !editForm.betaMode })}
                  style={{
                    width: 48, height: 26, borderRadius: 13, cursor: "pointer",
                    background: editForm.betaMode ? "linear-gradient(135deg, #C89B3C, #E8B84B)" : "rgba(0,0,0,.15)",
                    position: "relative", transition: "background .2s",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 2,
                    left: editForm.betaMode ? 24 : 2,
                    transition: "left .2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                  }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setEditModal(null)}
                  style={{
                    padding: "10px 24px", background: "transparent",
                    border: "1px solid rgba(200,155,60,.2)", borderRadius: 8,
                    color: "var(--ink3)", fontSize: 14, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "10px 28px",
                    background: saving ? "var(--ink4)" : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                    border: "none", borderRadius: 8,
                    color: "#fff", fontSize: 14, fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                    boxShadow: "0 2px 12px rgba(200,155,60,.3)",
                    transition: "all .2s",
                  }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = "0 4px 20px rgba(200,155,60,.45)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(200,155,60,.3)"; }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
