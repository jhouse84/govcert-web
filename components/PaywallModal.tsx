"use client";
import React, { useState } from "react";
import { apiRequest } from "@/lib/api";

interface PaywallModalProps {
  certType: string;
  certLabel?: string;
  price: number;
  betaMode: boolean;
  onUnlock: () => void;
  onClose: () => void;
}

const CERT_LABELS: Record<string, string> = {
  GSA_MAS: "GSA Multiple Award Schedule",
  EIGHT_A: "8(a) Business Development",
  WOSB: "Women-Owned Small Business",
  SDVOSB: "Service-Disabled Veteran-Owned",
  HUBZONE: "HUBZone",
  MBE: "Minority Business Enterprise",
};

export default function PaywallModal({ certType, certLabel, price, betaMode, onUnlock, onClose }: PaywallModalProps) {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");

  const label = certLabel || CERT_LABELS[certType] || certType;
  const isFree = betaMode || price === 0;

  async function handlePurchase(method: "stripe" | "paypal" = "stripe") {
    setPurchasing(true);
    setError("");
    try {
      if (method === "paypal") {
        // PayPal flow: create order → redirect to PayPal approval → capture on return
        const data = await apiRequest("/api/pricing/paypal/create", {
          method: "POST",
          body: JSON.stringify({ certType }),
        });
        if (data.approveUrl) {
          // Store purchaseId for capture on return
          sessionStorage.setItem("govcert_paypal_purchaseId", data.purchaseId);
          sessionStorage.setItem("govcert_paypal_orderId", data.orderId);
          window.location.href = data.approveUrl;
        } else {
          setError("PayPal checkout failed. Try Stripe instead.");
        }
        return;
      }

      // Stripe flow
      const data = await apiRequest("/api/pricing/purchase", {
        method: "POST",
        body: JSON.stringify({ certType, purchaseType: "GENERATION" }),
      });
      if (data.success || data.paymentRequired === false) {
        onUnlock();
      } else if (data.paymentRequired && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.paymentRequired) {
        setError("Payment processing is not configured. Contact support for activation.");
      }
    } catch (err: any) {
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,25,41,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "40px 44px", maxWidth: 520, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,.3)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, color: "var(--ink4)", cursor: "pointer" }}>&times;</button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
            {isFree ? "Unlock Your Application" : "Generate Your Application"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.6 }}>
            {isFree
              ? `Click below to unlock AI-generated outputs for your ${label} application. Free during beta.`
              : `One-time fee to generate your complete ${label} application with AI-powered narratives, GovCert Review, and submission package.`
            }
          </p>
        </div>

        {/* What's included */}
        <div style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--gold)", marginBottom: 10 }}>What you get</div>
          {[
            "AI-generated narratives for every section",
            "Document scanning & auto-population",
            "GovCert Application Review with readiness score",
            "eOffer / SBA Certify submission companion",
            "Unlimited revisions and regenerations",
          ].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "var(--green)", fontSize: 12 }}>✓</span>
              <span style={{ fontSize: 13, color: "var(--ink2)" }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {isFree ? (
            <div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--green)", fontWeight: 400 }}>Free</span>
              <div style={{ fontSize: 12, color: "var(--ink4)" }}>During beta — no credit card required</div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "var(--navy)", fontWeight: 400 }}>${price.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink4)" }}>One-time fee — no recurring charges for this certification</div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--red)" }}>
            {error}
          </div>
        )}

        {isFree ? (
          <button onClick={() => handlePurchase("stripe")} disabled={purchasing}
            style={{
              width: "100%", padding: "14px", background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
              border: "none", borderRadius: "var(--r)", fontSize: 16, fontWeight: 600, color: "#fff",
              cursor: purchasing ? "wait" : "pointer", boxShadow: "0 4px 24px rgba(200,155,60,.35)",
            }}>
            {purchasing ? "Processing..." : "Unlock Now — Free"}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => handlePurchase("stripe")} disabled={purchasing}
              style={{
                width: "100%", padding: "14px", background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                border: "none", borderRadius: "var(--r)", fontSize: 16, fontWeight: 600, color: "#fff",
                cursor: purchasing ? "wait" : "pointer", boxShadow: "0 4px 24px rgba(200,155,60,.35)",
              }}>
              {purchasing ? "Processing..." : `Pay $${price.toLocaleString()} with Card`}
            </button>
            {/* PayPal disabled until credentials are configured
            <button onClick={() => handlePurchase("paypal")} disabled={purchasing}
              style={{
                width: "100%", padding: "12px", background: "#FFC439",
                border: "none", borderRadius: "var(--r)", fontSize: 15, fontWeight: 600, color: "#003087",
                cursor: purchasing ? "wait" : "pointer", boxShadow: "0 2px 12px rgba(0,48,135,.15)",
              }}>
              {purchasing ? "Processing..." : "Pay with PayPal"}
            </button>
            */}
          </div>
        )}

        {!isFree && (
          <p style={{ fontSize: 11, color: "var(--ink4)", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
            Secure payment via Stripe or PayPal. Your application data is saved — you only pay once per certification type.
          </p>
        )}
      </div>
    </div>
  );
}
