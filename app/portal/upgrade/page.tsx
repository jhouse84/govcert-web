"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function PortalUpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [pricing, setPricing] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

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
    fetchPricing();
    setLoading(false);
  }, []);

  async function fetchPricing() {
    try {
      const data = await apiRequest("/api/pricing");
      setPricing(data);
    } catch (err) {
      console.error("Failed to fetch pricing:", err);
      // Fallback to free/beta defaults
      setPricing({ betaMode: true, tiers: { CONSULTING: { name: "Managed Certification Service", monthlyPrice: 0, annualPrice: 0 } } });
    }
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      await apiRequest("/api/chat/upgrade", { method: "POST" });
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.subscriptionTier = "CONSULTING";
        localStorage.setItem("user", JSON.stringify(parsed));
        setUser(parsed);
      }
      setUpgraded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setUpgrading(false);
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

  const isConsulting = user?.subscriptionTier === "CONSULTING";
  const consultingTier = pricing?.tiers?.CONSULTING;
  const price = consultingTier?.monthlyPrice ?? 0;
  const isFree = price === 0 || pricing?.betaMode;

  const includes = [
    { icon: "\uD83D\uDC64", title: "Dedicated Advisor", desc: "A certified GovCert advisor assigned exclusively to your account" },
    { icon: "\uD83E\uDD16", title: "AI + Expert Review", desc: "AI drafts every section, then your advisor reviews and refines before you see it" },
    { icon: "\uD83D\uDCE6", title: "Full Submission", desc: "Complete eOffer package prepared and reviewed. We walk you through final submission." },
    { icon: "\uD83D\uDD14", title: "Compliance Monitoring", desc: "Ongoing alerts for renewals, expirations, and compliance deadlines" },
    { icon: "\uD83D\uDCC1", title: "Document Management", desc: "We organize, categorize, and extract data from your uploaded documents" },
    { icon: "\u26A1", title: "Priority Support", desc: "Direct access to your advisor via email and the platform chat" },
  ];

  const steps = [
    { n: 1, title: "Upload your documents", desc: "Financial statements, tax returns, contracts, capability statement" },
    { n: 2, title: "We draft everything", desc: "Your advisor uses AI tools to draft all narratives and sections" },
    { n: 3, title: "You review and approve", desc: "Read every section, request changes, approve when ready" },
    { n: 4, title: "We prepare submission", desc: "Complete eOffer package formatted for the agency portal" },
    { n: 5, title: "Submit with confidence", desc: "Your advisor walks you through final submission step by step" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "#F8F6F1",
    border: "1px solid rgba(200,155,60,.15)",
    borderRadius: 8,
    fontSize: 14,
    color: "#0B1929",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
  };

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
          <a href="/portal/eligibility" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\u2705"}</span> Eligibility
          </a>
          <a href="/portal/integrations" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
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
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Managed Service</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 4 }}>
              Managed Certification Service
            </h1>
            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", borderRadius: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Let our experts handle your entire certification process
            </p>
          </div>

          {/* Hero */}
          <div style={{
            background: "linear-gradient(135deg, #0B1929 0%, #1A3357 50%, #0B1929 100%)",
            borderRadius: 14, padding: "44px 40px", marginBottom: 32,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C89B3C, #E8B84B)" }} />
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, color: "#fff", fontWeight: 400, lineHeight: 1.15, marginBottom: 14 }}>
              Focus on your business.<br />We'll handle the certifications.
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", lineHeight: 1.7, maxWidth: 560 }}>
              Our dedicated advisors manage every step — from document collection to agency submission. You review drafts, approve, and we do the rest.
            </p>
          </div>

          {/* What's Included */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 14 }}>What's Included</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {includes.map(item => (
                <div key={item.title} style={{
                  background: "#fff", border: "1px solid rgba(200,155,60,.08)",
                  borderRadius: 12, padding: "24px 22px",
                  boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
                  transition: "all .2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)"; }}>
                  <div style={{ fontSize: 24, marginBottom: 12 }}>{item.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 14 }}>How It Works</div>
            <div style={{
              background: "#fff", border: "1px solid rgba(200,155,60,.08)",
              borderRadius: 14, padding: "28px 32px",
              boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
                {/* Connecting line */}
                <div style={{ position: "absolute", left: 19, top: 44, bottom: 20, width: 2, borderLeft: "2px dotted rgba(200,155,60,.25)", zIndex: 0 }} />
                {steps.map((step, i) => (
                  <div key={step.n} style={{
                    display: "flex", alignItems: "flex-start", gap: 18,
                    padding: "16px 0", position: "relative", zIndex: 1,
                    borderBottom: i < steps.length - 1 ? "1px solid rgba(200,155,60,.06)" : "none",
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 15, fontWeight: 600, flexShrink: 0,
                      boxShadow: "0 2px 8px rgba(200,155,60,.25)",
                    }}>
                      {step.n}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{step.title}</div>
                      <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & Payment Section */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 14 }}>Pricing</div>

            {/* Already upgraded state */}
            {(isConsulting || upgraded) ? (
              <div style={{
                background: "#fff", border: "1px solid rgba(34,197,94,.2)",
                borderRadius: 14, padding: "36px 40px",
                boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
                textAlign: "center" as const,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20, boxShadow: "0 4px 16px rgba(34,197,94,.3)",
                }}>
                  <span style={{ color: "#fff", fontSize: 28 }}>{"\u2713"}</span>
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
                  You're on the Managed Service Plan
                </h3>
                <p style={{ fontSize: 15, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 20, maxWidth: 480, margin: "0 auto 20px" }}>
                  Your dedicated advisor will reach out within 1 business day to begin your certification process.
                </p>
                <div style={{
                  background: "#F8F6F1", borderRadius: 10, padding: "20px 28px",
                  display: "inline-block", textAlign: "left" as const,
                  border: "1px solid rgba(200,155,60,.1)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 10 }}>Your Advisor Contact</div>
                  <div style={{ fontSize: 14, color: "var(--navy)", marginBottom: 4 }}>Email: support@govcert.ai</div>
                  <div style={{ fontSize: 14, color: "var(--navy)" }}>Response time: Within 1 business day</div>
                </div>
              </div>
            ) : (
              <>
                {/* Pricing Card */}
                <div style={{
                  background: "#fff", border: "1px solid rgba(200,155,60,.08)",
                  borderRadius: 14, overflow: "hidden",
                  boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.08)",
                  marginBottom: 20,
                }}>
                  {/* Pricing header */}
                  <div style={{
                    background: "linear-gradient(135deg, #0B1929 0%, #1A3357 50%, #0B1929 100%)",
                    padding: "32px 36px", position: "relative",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #C89B3C, #E8B84B)" }} />
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 10 }}>
                      {consultingTier?.name || "Managed Certification Service"}
                    </div>
                    {isFree ? (
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, color: "#fff", fontWeight: 400, lineHeight: 1 }}>$0</span>
                          <span style={{ fontSize: 16, color: "rgba(255,255,255,.4)" }}>/mo</span>
                        </div>
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.3)",
                          borderRadius: 6, padding: "6px 14px", fontSize: 13, color: "#E8B84B",
                          fontWeight: 500,
                        }}>
                          {"\u2728"} Free during beta
                        </div>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 10, lineHeight: 1.5 }}>
                          No payment required — upgrade instantly
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, color: "#fff", fontWeight: 400, lineHeight: 1 }}>${price}</span>
                          <span style={{ fontSize: 16, color: "rgba(255,255,255,.4)" }}>/mo</span>
                        </div>
                        {consultingTier?.annualPrice > 0 && (
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
                            or ${consultingTier.annualPrice}/year (save ${(price * 12 - consultingTier.annualPrice)})
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment section (only when price > 0) */}
                  {!isFree && (
                    <div style={{ padding: "28px 36px", borderBottom: "1px solid rgba(200,155,60,.08)" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 16 }}>Select Payment Method</div>

                      {/* Credit/Debit Card */}
                      <div
                        onClick={() => setPaymentMethod("card")}
                        style={{
                          border: paymentMethod === "card" ? "2px solid #C89B3C" : "1px solid rgba(200,155,60,.12)",
                          borderRadius: 10, padding: "16px 20px", marginBottom: 12, cursor: "pointer",
                          background: paymentMethod === "card" ? "rgba(200,155,60,.03)" : "#fff",
                          transition: "all .15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: paymentMethod === "card" ? 16 : 0 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%",
                            border: paymentMethod === "card" ? "5px solid #C89B3C" : "2px solid rgba(200,155,60,.25)",
                            background: "#fff",
                          }} />
                          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Credit / Debit Card</span>
                          <span style={{ fontSize: 12, color: "var(--ink4)", marginLeft: "auto" }}>Visa, Mastercard, Amex</span>
                        </div>
                        {paymentMethod === "card" && (
                          <div style={{ paddingLeft: 28 }}>
                            {/* In production, replace with Stripe Elements: loadStripe('pk_...') */}
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)", display: "block", marginBottom: 4 }}>Card Number</label>
                              <input
                                type="text" placeholder="1234 5678 9012 3456" maxLength={19}
                                style={{ ...inputStyle, letterSpacing: "1px" }}
                              />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)", display: "block", marginBottom: 4 }}>Expiry</label>
                                <input type="text" placeholder="MM / YY" maxLength={7} style={inputStyle} />
                              </div>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink3)", display: "block", marginBottom: 4 }}>CVC</label>
                                <input type="text" placeholder="123" maxLength={4} style={inputStyle} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* PayPal */}
                      <div
                        onClick={() => setPaymentMethod("paypal")}
                        style={{
                          border: paymentMethod === "paypal" ? "2px solid #C89B3C" : "1px solid rgba(200,155,60,.12)",
                          borderRadius: 10, padding: "16px 20px", marginBottom: 12, cursor: "pointer",
                          background: paymentMethod === "paypal" ? "rgba(200,155,60,.03)" : "#fff",
                          transition: "all .15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%",
                            border: paymentMethod === "paypal" ? "5px solid #C89B3C" : "2px solid rgba(200,155,60,.25)",
                            background: "#fff",
                          }} />
                          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>PayPal</span>
                        </div>
                        {paymentMethod === "paypal" && (
                          <div style={{ paddingLeft: 28, marginTop: 12 }}>
                            {/* In production, integrate PayPal SDK */}
                            <button style={{
                              width: "100%", padding: "12px 20px",
                              background: "#0070ba", border: "none", borderRadius: 8,
                              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                              letterSpacing: ".3px",
                            }}>
                              Pay with PayPal
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Apple Pay / Google Pay */}
                      <div
                        onClick={() => setPaymentMethod("wallet")}
                        style={{
                          border: paymentMethod === "wallet" ? "2px solid #C89B3C" : "1px solid rgba(200,155,60,.12)",
                          borderRadius: 10, padding: "16px 20px", cursor: "pointer",
                          background: paymentMethod === "wallet" ? "rgba(200,155,60,.03)" : "#fff",
                          transition: "all .15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%",
                            border: paymentMethod === "wallet" ? "5px solid #C89B3C" : "2px solid rgba(200,155,60,.25)",
                            background: "#fff",
                          }} />
                          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Apple Pay / Google Pay</span>
                        </div>
                        {paymentMethod === "wallet" && (
                          <div style={{ paddingLeft: 28, marginTop: 12, display: "flex", gap: 12 }}>
                            {/* In production, use Stripe Payment Request Button */}
                            <button style={{
                              flex: 1, padding: "12px 20px",
                              background: "#000", border: "none", borderRadius: 8,
                              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                            }}>
                              {"\uF8FF"} Apple Pay
                            </button>
                            <button style={{
                              flex: 1, padding: "12px 20px",
                              background: "#fff", border: "1px solid #dadce0", borderRadius: 8,
                              color: "#3c4043", fontSize: 14, fontWeight: 600, cursor: "pointer",
                            }}>
                              G Pay
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA area */}
                  <div style={{ padding: "24px 36px 28px", textAlign: "center" as const }}>
                    {/* Money-back guarantee badge */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.15)",
                      borderRadius: 8, padding: "8px 16px", marginBottom: 20,
                      fontSize: 13, color: "var(--gold)", fontWeight: 500,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C89B3C" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      30-Day Money-Back Guarantee
                    </div>

                    {isFree ? (
                      <div>
                        <button
                          onClick={handleUpgrade}
                          disabled={upgrading}
                          style={{
                            width: "100%", padding: "16px 36px",
                            background: upgrading ? "var(--ink4)" : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                            border: "none", borderRadius: 10,
                            color: "#fff", fontSize: 16, fontWeight: 600,
                            cursor: upgrading ? "wait" : "pointer",
                            boxShadow: "0 4px 20px rgba(200,155,60,.35)",
                            transition: "all .2s", letterSpacing: ".3px",
                          }}
                          onMouseEnter={e => { if (!upgrading) { e.currentTarget.style.boxShadow = "0 6px 28px rgba(200,155,60,.5)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(200,155,60,.35)"; e.currentTarget.style.transform = "none"; }}
                        >
                          {upgrading ? "Upgrading..." : "Upgrade Now \u2014 Free"}
                        </button>
                        <p style={{ fontSize: 12, color: "var(--ink4)", marginTop: 12, lineHeight: 1.5 }}>
                          No credit card required during the beta period.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <button
                          onClick={handleUpgrade}
                          disabled={upgrading || !paymentMethod}
                          style={{
                            width: "100%", padding: "16px 36px",
                            background: (upgrading || !paymentMethod) ? "var(--ink4)" : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                            border: "none", borderRadius: 10,
                            color: "#fff", fontSize: 16, fontWeight: 600,
                            cursor: (upgrading || !paymentMethod) ? "not-allowed" : "pointer",
                            boxShadow: (!paymentMethod) ? "none" : "0 4px 20px rgba(200,155,60,.35)",
                            transition: "all .2s", letterSpacing: ".3px",
                            opacity: !paymentMethod ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { if (!upgrading && paymentMethod) { e.currentTarget.style.boxShadow = "0 6px 28px rgba(200,155,60,.5)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = paymentMethod ? "0 4px 20px rgba(200,155,60,.35)" : "none"; e.currentTarget.style.transform = "none"; }}
                        >
                          {upgrading ? "Processing..." : `Subscribe \u2014 $${price}/mo`}
                        </button>
                        <p style={{ fontSize: 12, color: "var(--ink4)", marginTop: 12, lineHeight: 1.5 }}>
                          You can cancel anytime. Billing starts immediately.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
