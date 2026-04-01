"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

const STATUS_STYLES: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  pass: { bg: "var(--green-bg)", border: "var(--green-b)", color: "var(--green)", icon: "✅" },
  fail: { bg: "var(--red-bg)", border: "var(--red-b)", color: "var(--red)", icon: "❌" },
  warning: { bg: "rgba(200,155,60,.06)", border: "rgba(200,155,60,.2)", color: "var(--gold)", icon: "⚠️" },
};

interface Props {
  clientId: string;
  certType: string;
}

export default function FinancialReadiness({ clientId, certType }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || !certType) return;
    apiRequest(`/api/applications/financial-validation/${clientId}/${certType}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId, certType]);

  if (loading) return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
      <div style={{ fontSize: 13, color: "var(--ink4)" }}>Validating financials...</div>
    </div>
  );

  if (!data || !data.checks) return null;

  const { checks, summary } = data;
  const scoreColor = summary.score >= 80 ? "var(--green)" : summary.score >= 50 ? "var(--gold)" : "var(--red)";

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, margin: 0 }}>
            Financial Readiness Check
          </h3>
          <p style={{ fontSize: 13, color: "var(--ink3)", margin: "4px 0 0" }}>
            Automated validation against {certType === "EIGHT_A" ? "SBA 8(a)" : certType === "GSA_MAS" ? "GSA MAS" : "OASIS+"} regulatory requirements.
          </p>
        </div>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{summary.score}%</div>
          <div style={{ fontSize: 10, color: "var(--ink4)", marginTop: 4 }}>
            {summary.pass} pass · {summary.fail} fail · {summary.warning} review
          </div>
        </div>
      </div>

      {summary.fail > 0 && (
        <div style={{ padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", marginBottom: 12, fontSize: 12, color: "var(--red)", lineHeight: 1.6 }}>
          <strong>{summary.fail} issue{summary.fail !== 1 ? "s" : ""} found</strong> that should be resolved before submitting. Expand each item below for specific guidance.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {checks.map((check: any) => {
          const style = STATUS_STYLES[check.status] || STATUS_STYLES.warning;
          const isExpanded = expanded === check.id;
          return (
            <div key={check.id} style={{
              border: `1px solid ${style.border}`,
              borderRadius: "var(--r)",
              background: isExpanded ? style.bg : "#fff",
              overflow: "hidden",
            }}>
              <div
                onClick={() => setExpanded(isExpanded ? null : check.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", cursor: "pointer",
                }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{style.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{check.label}</span>
                  {check.regulation && (
                    <span style={{ fontSize: 10, color: "var(--ink4)", marginLeft: 8 }}>{check.regulation}</span>
                  )}
                </div>
                <span style={{
                  padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                  background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                }}>
                  {check.status === "pass" ? "Pass" : check.status === "fail" ? "Action Needed" : "Review"}
                </span>
                <span style={{ fontSize: 10, color: "var(--ink4)" }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
              {isExpanded && (
                <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${style.border}` }}>
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink3)", lineHeight: 1.6 }}>
                    <strong>Requirement:</strong> {check.description}
                  </div>
                  <div style={{
                    marginTop: 8, padding: "10px 12px", borderRadius: 6,
                    background: style.bg, fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.65,
                  }}>
                    {check.message}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
