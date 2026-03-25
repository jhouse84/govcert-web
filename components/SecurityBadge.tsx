"use client";

import React from "react";

type SecurityLevel = "encryption" | "encrypted-at-rest" | "secure-server" | "bank-grade" | "pii-protected" | "audit-logged";

interface SecurityBadgeProps {
  level: SecurityLevel;
  compact?: boolean;
  style?: React.CSSProperties;
}

const BADGES: Record<SecurityLevel, { icon: string; label: string; detail: string }> = {
  "encryption": {
    icon: "\uD83D\uDD12",
    label: "256-bit Encrypted",
    detail: "Your data is encrypted in transit using TLS 1.3",
  },
  "encrypted-at-rest": {
    icon: "\uD83D\uDD12",
    label: "Encrypted at Rest",
    detail: "Files are encrypted with AES-256-GCM before storage",
  },
  "secure-server": {
    icon: "\uD83D\uDEE1\uFE0F",
    label: "Secure Server",
    detail: "Your data never leaves GovCert's secure infrastructure",
  },
  "bank-grade": {
    icon: "\uD83C\uDFE6",
    label: "Bank-Grade Security",
    detail: "Financial data protected with enterprise-grade encryption and access controls",
  },
  "pii-protected": {
    icon: "\uD83D\uDC64",
    label: "PII Protected",
    detail: "Personally identifiable information is masked and access-controlled",
  },
  "audit-logged": {
    icon: "\uD83D\uDCCB",
    label: "Audit Logged",
    detail: "Every access to this data is logged for your security",
  },
};

export function SecurityBadge({ level, compact = false, style }: SecurityBadgeProps) {
  const badge = BADGES[level];
  if (!badge) return null;

  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: compact ? "2px 6px" : "4px 10px",
        borderRadius: 6,
        backgroundColor: "rgba(180, 155, 80, 0.08)",
        border: "1px solid rgba(180, 155, 80, 0.2)",
        fontSize: compact ? 10 : 11,
        color: "#8B7A3E",
        fontWeight: 500,
        position: "relative",
        cursor: "help",
        ...style,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span style={{ fontSize: compact ? 10 : 12 }}>{badge.icon}</span>
      <span>{badge.label}</span>

      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1A2332",
            color: "#E8DFC5",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 11,
            whiteSpace: "nowrap",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            border: "1px solid rgba(180, 155, 80, 0.3)",
          }}
        >
          {badge.detail}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #1A2332",
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Security banner for sensitive sections (financial data, PII, document upload)
 */
interface SecurityBannerProps {
  message?: string;
  badges?: SecurityLevel[];
  style?: React.CSSProperties;
}

export function SecurityBanner({
  message = "Your data is protected with enterprise-grade security",
  badges = ["encryption", "secure-server"],
  style,
}: SecurityBannerProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderRadius: 8,
        background: "linear-gradient(135deg, rgba(26, 35, 50, 0.04), rgba(180, 155, 80, 0.06))",
        border: "1px solid rgba(180, 155, 80, 0.15)",
        marginBottom: 16,
        ...style,
      }}
    >
      <span style={{ fontSize: 16 }}>{"\uD83D\uDD10"}</span>
      <span style={{ fontSize: 12, color: "#5A6B7B", flex: 1 }}>{message}</span>
      <div style={{ display: "flex", gap: 6 }}>
        {badges.map((b) => (
          <SecurityBadge key={b} level={b} compact />
        ))}
      </div>
    </div>
  );
}

/**
 * Provenance indicator for auto-populated fields
 */
interface ProvenanceBadgeProps {
  source: string;
  documentName?: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
}

export function ProvenanceBadge({ source, documentName, confidence }: ProvenanceBadgeProps) {
  const colors = {
    HIGH: { bg: "rgba(34, 139, 34, 0.08)", border: "rgba(34, 139, 34, 0.2)", text: "#2D6B2D" },
    MEDIUM: { bg: "rgba(180, 155, 80, 0.08)", border: "rgba(180, 155, 80, 0.2)", text: "#8B7A3E" },
    LOW: { bg: "rgba(200, 100, 50, 0.08)", border: "rgba(200, 100, 50, 0.2)", text: "#8B5A2D" },
  };
  const c = colors[confidence || "MEDIUM"];

  const sourceLabel = source === "extractedProfile"
    ? `Auto-filled from ${documentName || "uploaded document"}`
    : source === "eligibility"
    ? "Auto-filled from eligibility data"
    : source === "client"
    ? "Auto-filled from company profile"
    : `Auto-filled (${source})`;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 6px",
        borderRadius: 4,
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        fontSize: 9,
        color: c.text,
        fontWeight: 500,
      }}
      title={sourceLabel}
    >
      <span style={{ fontSize: 8 }}>{"\u2728"}</span>
      {sourceLabel}
    </span>
  );
}
