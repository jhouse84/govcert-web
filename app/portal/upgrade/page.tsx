"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  priceDisplay: string;
  currency: string;
  interval: string | null;
  features: string[];
  maxCerts: number | null;
}

export default function PortalUpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

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
    fetchData();

    // Check URL for payment result
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "canceled") {
      // Could show a message
    }
  }, []);

  async function fetchData() {
    try {
      const [plansData, statusData] = await Promise.all([
        apiRequest("/api/payments/plans"),
        apiRequest("/api/payments/status").catch(() => null),
      ]);
      setPlans(plansData);
      setPaymentStatus(statusData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStripeCheckout(planId: string) {
    setProcessing(planId);
    try {
      const { url } = await apiRequest("/api/payments/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ planId }),
      });
      if (url) window.location.href = url;
    } catch (err: any) {
      if (err.message?.includes("not configured")) {
        alert("Stripe is not yet configured. Please contact support.");
      } else {
        alert("Payment error: " + (err.message || "Unknown error"));
      }
    } finally {
      setProcessing(null);
    }
  }

  async function handlePayPalCheckout(planId: string) {
    setProcessing(planId);
    try {
      const { approveUrl } = await apiRequest("/api/payments/paypal/create-order", {
        method: "POST",
        body: JSON.stringify({ planId }),
      });
      if (approveUrl) window.location.href = approveUrl;
    } catch (err: any) {
      if (err.message?.includes("not configured")) {
        alert("PayPal is not yet configured. Please contact support.");
      } else {
        alert("Payment error: " + (err.message || "Unknown error"));
      }
    } finally {
      setProcessing(null);
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

  const hasAccess = paymentStatus?.hasAccess;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top right, rgba(200,155,60,.03) 0%, transparent 50%), var(--cream)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0B1929, #1A2F45)", padding: "48px 0 56px", textAlign: "center" as const }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          <a href="/portal" style={{ fontSize: 13, color: "rgba(255,255,255,.5)", textDecoration: "none" }}>{"\u2190"} Back to Portal</a>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "#fff", fontWeight: 400, marginTop: 16, marginBottom: 8 }}>
            Choose Your Plan
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.6)", fontWeight: 300, lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
            AI-powered government certification preparation. Upload your documents, and let GovCert do the heavy lifting.
          </p>
        </div>
      </div>

      {/* Active status banner */}
      {hasAccess && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div style={{
            marginTop: -20, padding: "16px 24px", borderRadius: 12,
            background: "linear-gradient(135deg, rgba(34,197,94,.1), rgba(34,197,94,.04))",
            border: "1px solid rgba(34,197,94,.2)", textAlign: "center" as const,
          }}>
            <span style={{ fontSize: 14, color: "#16a34a", fontWeight: 500 }}>
              {"\u2705"} You have an active plan
              {paymentStatus.activeSubscription && ` \u2014 ${paymentStatus.activeSubscription.planName}`}
            </span>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: plans.length >= 3 ? "1fr 1fr 1fr" : plans.length === 2 ? "1fr 1fr" : "1fr", gap: 20 }}>
          {plans.map((plan, i) => {
            const isPopular = i === 1 && plans.length >= 2;
            const isRecurring = !!plan.interval;
            return (
              <div key={plan.id} style={{
                background: "#fff", borderRadius: 16, padding: "32px 28px",
                border: isPopular ? "2px solid var(--gold)" : "1px solid var(--border)",
                boxShadow: isPopular ? "0 8px 32px rgba(200,155,60,.15)" : "var(--shadow)",
                position: "relative" as const,
                transform: isPopular ? "scale(1.03)" : undefined,
              }}>
                {isPopular && (
                  <div style={{
                    position: "absolute" as const, top: -12, left: "50%", transform: "translateX(-50%)",
                    padding: "4px 16px", borderRadius: 20,
                    background: "linear-gradient(135deg, #C89B3C, #E8B84B)",
                    color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: ".06em",
                    textTransform: "uppercase" as const,
                  }}>
                    Most Popular
                  </div>
                )}

                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
                  {plan.name}
                </h3>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 40, fontWeight: 300, color: "var(--navy)", fontFamily: "'Cormorant Garamond', serif" }}>
                    ${parseFloat(plan.priceDisplay).toLocaleString()}
                  </span>
                  {isRecurring && (
                    <span style={{ fontSize: 16, color: "var(--ink3)", fontWeight: 300 }}>/{plan.interval}</span>
                  )}
                </div>

                {plan.description && (
                  <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 20 }}>
                    {plan.description}
                  </p>
                )}

                {/* Features */}
                <div style={{ marginBottom: 24 }}>
                  {plan.features.map((feature, fi) => (
                    <div key={fi} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ color: "var(--gold)", fontSize: 14, flexShrink: 0, marginTop: 1 }}>{"\u2713"}</span>
                      <span style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.5 }}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Payment buttons */}
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  <button
                    onClick={() => handleStripeCheckout(plan.id)}
                    disabled={processing === plan.id}
                    style={{
                      width: "100%", padding: "12px 20px", borderRadius: 8, border: "none",
                      background: isPopular ? "linear-gradient(135deg, #C89B3C, #E8B84B)" : "var(--navy)",
                      color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer",
                      opacity: processing === plan.id ? .6 : 1,
                    }}
                  >
                    {processing === plan.id ? "Processing..." : `Pay with Card \u2192`}
                  </button>
                  {!isRecurring && (
                    <button
                      onClick={() => handlePayPalCheckout(plan.id)}
                      disabled={processing === plan.id}
                      style={{
                        width: "100%", padding: "12px 20px", borderRadius: 8,
                        border: "1px solid rgba(0,112,243,.2)",
                        background: "rgba(0,112,243,.04)", color: "#0070F3",
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        opacity: processing === plan.id ? .6 : 1,
                      }}
                    >
                      Pay with PayPal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 40, flexWrap: "wrap" as const }}>
          {[
            { icon: "\uD83D\uDD12", label: "256-bit SSL Encryption" },
            { icon: "\uD83C\uDFE2", label: "D&B Verified" },
            { icon: "\uD83D\uDEE1\uFE0F", label: "CSA STAR Registered" },
            { icon: "\uD83D\uDCB3", label: "Secure Checkout via Stripe" },
          ].map((badge, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink4)" }}>
              <span>{badge.icon}</span> {badge.label}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 600, margin: "48px auto 0", textAlign: "center" as const }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>
            Common Questions
          </h3>
          {[
            { q: "What's included in Single Cert Prep?", a: "Full AI-powered preparation for one government certification of your choice. Upload your documents, and our AI extracts data, pre-fills your application, and organizes everything for submission." },
            { q: "Can I upgrade from Single to Bundle later?", a: "Yes! If you start with a single certification and decide to pursue more, you can upgrade to the Bundle at any time. You'll only pay the difference." },
            { q: "What does Managed Service include?", a: "Everything in the Bundle plus dedicated 1-on-1 support. We'll liaise with certification agencies on your behalf, handle questions and follow-ups, and monitor your certification status for renewals." },
            { q: "Is my data secure?", a: "Absolutely. All documents are encrypted with AES-256 (military-grade encryption). We're D&B verified and CSA STAR registered. Even our own team cannot read your documents." },
          ].map((faq, i) => (
            <div key={i} style={{ textAlign: "left" as const, marginBottom: 16, padding: "16px 20px", background: "#fff", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>{faq.q}</div>
              <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
