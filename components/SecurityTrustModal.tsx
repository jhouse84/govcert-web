"use client";

import React, { useState } from "react";

interface Props {
  onClose: () => void;
}

export function SecurityTrustModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

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

          {/* Step 3: Security features grid — clickable with explanations */}
          {step === 2 && (() => {
            const features = [
              { icon: "\uD83D\uDD12", label: "256-bit Encryption", desc: "In transit and at rest", detail: "Every file you upload is encrypted using AES-256 before it\u2019s stored. Data moving between your browser and our servers uses TLS 1.3. This is the same encryption standard required by the Department of Defense and major banks. Even if someone intercepted your data, they couldn\u2019t read it." },
              { icon: "\uD83D\uDC64", label: "PII Auto-Detection", desc: "EINs, SSNs masked automatically", detail: "Our AI automatically identifies personally identifiable information like EINs, Social Security numbers, and bank account numbers in your documents. These are masked in any screen display and never exposed in logs or error reports. Your sensitive identifiers stay protected even from our own support team." },
              { icon: "\uD83D\uDEAB", label: "Account Lockout", desc: "5 failed attempts = 15 min lock", detail: "If someone tries to guess your password, the account locks after 5 failed attempts for 15 minutes. This stops brute-force attacks in their tracks. You\u2019ll receive an email notification if a lockout occurs so you\u2019re always aware of suspicious activity." },
              { icon: "\u2705", label: "Email Verification", desc: "Required before access", detail: "Every account must verify their email address before accessing any data. This ensures no one can create a fake account using your email and prevents unauthorized access to your certification documents and business information." },
              { icon: "\uD83D\uDCCA", label: "Audit Logging", desc: "Every document access tracked", detail: "Every time a document is viewed, downloaded, or shared, it\u2019s recorded with a timestamp and the user who accessed it. If you work with an advisor, you can see exactly which documents they\u2019ve viewed and when. This creates a complete chain of custody for your sensitive files." },
              { icon: "\uD83C\uDFE2", label: "D&B Verified", desc: "D-U-N-S: 105595626", detail: "GovCert is a verified business registered with Dun & Bradstreet. Our D-U-N-S number (105595626) confirms we are a legitimate, established company. As a government contractor yourself, you know what D&B verification means \u2014 it\u2019s the same credentialing standard required for federal contracts." },
              { icon: "\uD83D\uDEE1\uFE0F", label: "CSA STAR Registered", desc: "Cloud Security Alliance", detail: "We\u2019re registered with the Cloud Security Alliance\u2019s STAR program, which evaluates cloud providers against industry security benchmarks. This means our infrastructure, data handling, and security practices have been self-assessed against the CSA Cloud Controls Matrix \u2014 the gold standard for cloud security transparency." },
              { icon: "\u23F0", label: "Session Timeout", desc: "Auto-logout on inactivity", detail: "If you step away from your computer, GovCert automatically logs you out after a period of inactivity. This prevents someone from accessing your account if you leave your browser open. Your session is secured from start to finish." },
            ];
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                {features.map((f, i) => (
                  <div key={i}
                    onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}
                    style={{
                      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      background: expandedFeature === i ? "rgba(200, 155, 60, 0.06)" : "rgba(26, 35, 50, 0.03)",
                      border: expandedFeature === i ? "1px solid rgba(200, 155, 60, 0.2)" : "1px solid rgba(0,0,0,0.04)",
                      gridColumn: expandedFeature === i ? "1 / -1" : undefined,
                      transition: "all .2s ease",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2332" }}>{f.label}</div>
                        <div style={{ fontSize: 10, color: "#5A6B7B" }}>{f.desc}</div>
                      </div>
                      <span style={{ fontSize: 10, color: "#C89B3C", fontWeight: 600, flexShrink: 0 }}>
                        {expandedFeature === i ? "\u25B2" : "Learn more \u25BE"}
                      </span>
                    </div>
                    {expandedFeature === i && (
                      <div style={{
                        marginTop: 10, padding: "10px 12px", borderRadius: 6,
                        background: "rgba(255,255,255,0.7)", fontSize: 12,
                        color: "#3A4A5A", lineHeight: 1.65,
                      }}>
                        {f.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
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
