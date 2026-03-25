"use client";

import React, { useState } from "react";

interface Props {
  onClose: () => void;
}

export function SecurityTrustModal({ onClose }: Props) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: "\uD83D\uDD10",
      title: "Your Data Is in a Black Box",
      body: "Every document you upload to GovCert is encrypted with AES-256 \u2014 the same standard used by the U.S. military and financial institutions. Your files are encrypted the moment they leave your browser and remain encrypted at rest on our servers.",
      detail: "Even GovCert administrators cannot read your documents. Our system is architected so that your data is processed by AI in isolated, encrypted pipelines. No human at GovCert ever sees your tax returns, financial statements, or personal information unless you explicitly grant access.",
    },
    {
      icon: "\uD83D\uDCCB",
      title: "Your Documents, Your Control",
      body: "GovCert functions as your secure document vault. Every file you upload is available for you to download at any time, in its original format \u2014 ready to submit directly to eOffer, certify.sba.gov, or any certification portal.",
      detail: "We organize your documents in the exact sequence requested by each certification agency. When it\u2019s time to submit, you\u2019ll have everything pre-organized and ready to go \u2014 no more hunting through folders or email chains. Your advisor can only access documents you individually approve, and every access is logged.",
    },
    {
      icon: "\uD83D\uDEE1\uFE0F",
      title: "Enterprise-Grade Protection",
      body: "Your account is protected by multiple layers of security that work together to keep your data safe.",
      detail: null, // Will render the features grid instead
    },
  ];

  const current = steps[step];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      backgroundColor: "rgba(11, 25, 41, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        backgroundColor: "#FDF8F0",
        borderRadius: 20, width: "100%", maxWidth: 580,
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        border: "1px solid rgba(180, 155, 80, 0.2)",
        overflow: "hidden",
      }}>
        {/* Header gradient */}
        <div style={{
          background: "linear-gradient(135deg, #0B1929, #1A2F45)",
          padding: "32px 36px 28px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{current.icon}</div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 26, fontWeight: 400, color: "#fff",
            margin: 0, lineHeight: 1.2,
          }}>
            {current.title}
          </h2>
          {/* Step dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                background: i === step ? "#C89B3C" : "rgba(255,255,255,.2)",
                transition: "all .3s",
              }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 36px" }}>
          <p style={{ fontSize: 14, color: "#1A2332", lineHeight: 1.7, marginBottom: 16, fontWeight: 400 }}>
            {current.body}
          </p>

          {current.detail && (
            <p style={{ fontSize: 13, color: "#5A6B7B", lineHeight: 1.7, marginBottom: 0 }}>
              {current.detail}
            </p>
          )}

          {/* Step 3: Security features grid */}
          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
              {[
                { icon: "\uD83D\uDD12", label: "256-bit Encryption", desc: "In transit and at rest" },
                { icon: "\uD83D\uDC64", label: "PII Auto-Detection", desc: "EINs, SSNs masked automatically" },
                { icon: "\uD83D\uDEAB", label: "Account Lockout", desc: "5 failed attempts = 15 min lock" },
                { icon: "\u2705", label: "Email Verification", desc: "Required before access" },
                { icon: "\uD83D\uDCCA", label: "Audit Logging", desc: "Every document access tracked" },
                { icon: "\uD83C\uDFE2", label: "D&B Verified", desc: "D-U-N-S: 105595626" },
                { icon: "\uD83D\uDEE1\uFE0F", label: "CSA STAR Registered", desc: "Cloud Security Alliance" },
                { icon: "\u23F0", label: "Session Timeout", desc: "Auto-logout on inactivity" },
              ].map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8,
                  background: "rgba(26, 35, 50, 0.03)",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2332" }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: "#5A6B7B" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 36px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} style={{
              padding: "10px 20px", borderRadius: 8,
              border: "1px solid rgba(180, 155, 80, 0.3)",
              background: "transparent", color: "#8B7A3E",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>
              {"\u2190"} Back
            </button>
          ) : <div />}

          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, #B49B50, #D4B850)",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(180, 155, 80, 0.3)",
            }}>
              Next {"\u2192"}
            </button>
          ) : (
            <button onClick={onClose} style={{
              padding: "10px 28px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, #B49B50, #D4B850)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(180, 155, 80, 0.3)",
            }}>
              Enter GovCert {"\u2192"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
