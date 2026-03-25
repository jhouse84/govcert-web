"use client";

import React, { useEffect, useState } from "react";
import { SecurityBanner } from "./SecurityBadge";

interface CoachingDoc {
  category: string;
  importance: "CRITICAL" | "RECOMMENDED";
  what: string;
  why: string;
  where: string;
  tips: string;
  status: "UPLOADED" | "MISSING";
  documents?: { id: string; name: string; year: string }[];
}

interface CoachingData {
  certType: string;
  totalDocumentsUploaded: number;
  ready: CoachingDoc[];
  missing: CoachingDoc[];
  readinessScore: number;
  recommendations: string;
}

interface Props {
  clientId: string;
  certType: string;
  onClose: () => void;
  onUploadClick?: () => void;
}

const CERT_LABELS: Record<string, string> = {
  GSA_MAS: "GSA Multiple Award Schedule",
  OASIS_PLUS: "OASIS+",
  EIGHT_A: "SBA 8(a) Business Development",
  WOSB: "Women-Owned Small Business",
  SDVOSB: "Service-Disabled Veteran-Owned",
  HUBZONE: "HUBZone",
  VOSB: "Veteran-Owned Small Business",
  EDWOSB: "Economically Disadvantaged WOSB",
};

export function ApplicationCoachingModal({ clientId, certType, onClose, onUploadClick }: Props) {
  const [data, setData] = useState<CoachingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchCoaching();
  }, [clientId, certType]);

  async function fetchCoaching() {
    try {
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";
      const res = await fetch(`${API}/api/applications/coaching/${clientId}/${certType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Coaching fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>{"\uD83D\uDCCB"}</div>
          <div style={{ color: "#8B7A3E", fontSize: 16 }}>Analyzing your document readiness...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    onClose();
    return null;
  }

  const criticalReady = data.ready.filter(d => d.importance === "CRITICAL").length;
  const criticalTotal = data.ready.filter(d => d.importance === "CRITICAL").length + data.missing.filter(d => d.importance === "CRITICAL").length;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ padding: "28px 32px 0", borderBottom: "1px solid #E8DFC5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#B49B50", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                APPLICATION READINESS
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: "#1A2332", margin: 0 }}>
                {CERT_LABELS[certType] || certType}
              </h2>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: data.readinessScore >= 80 ? "linear-gradient(135deg, #2D6B2D, #4CAF50)" :
                data.readinessScore >= 50 ? "linear-gradient(135deg, #B49B50, #D4B850)" :
                "linear-gradient(135deg, #C46030, #E07040)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 16,
            }}>
              {data.readinessScore}%
            </div>
          </div>

          <p style={{ fontSize: 14, color: "#5A6B7B", margin: "12px 0 16px", lineHeight: 1.5 }}>
            {data.recommendations}
          </p>
        </div>

        {/* Body — scrollable */}
        <div style={{ padding: "20px 32px", maxHeight: "50vh", overflowY: "auto" }}>
          <SecurityBanner
            message="All uploaded documents are encrypted and access-controlled"
            badges={["encrypted-at-rest", "audit-logged"]}
          />

          {/* Missing documents (show first — most actionable) */}
          {data.missing.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1A2332", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#C46030" }}>{"\u26A0\uFE0F"}</span> Documents Needed
              </h3>
              {data.missing.map((doc, i) => (
                <div key={i} style={{
                  border: `1px solid ${doc.importance === "CRITICAL" ? "rgba(196, 96, 48, 0.3)" : "rgba(180, 155, 80, 0.2)"}`,
                  borderRadius: 10, marginBottom: 8, overflow: "hidden",
                  backgroundColor: doc.importance === "CRITICAL" ? "rgba(196, 96, 48, 0.03)" : "rgba(180, 155, 80, 0.03)",
                }}>
                  <div
                    style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{"\u274C"}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1A2332" }}>{doc.what}</div>
                        <div style={{ fontSize: 11, color: doc.importance === "CRITICAL" ? "#C46030" : "#8B7A3E", fontWeight: 500 }}>
                          {doc.importance}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "#8B7A3E" }}>{expandedIdx === i ? "\u25B2" : "\u25BC"}</span>
                  </div>
                  {expandedIdx === i && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6, color: "#3A4A5A" }}>
                        <div style={{ marginBottom: 8 }}><strong>Why:</strong> {doc.why}</div>
                        <div style={{ marginBottom: 8 }}><strong>Where to find it:</strong> {doc.where}</div>
                        <div style={{ padding: "8px 12px", background: "rgba(180, 155, 80, 0.06)", borderRadius: 6, fontSize: 11 }}>
                          <strong>Tip:</strong> {doc.tips}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ready documents */}
          {data.ready.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1A2332", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#2D6B2D" }}>{"\u2705"}</span> Documents Ready ({data.ready.length})
              </h3>
              {data.ready.map((doc, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", borderRadius: 8,
                  backgroundColor: "rgba(34, 139, 34, 0.04)",
                  border: "1px solid rgba(34, 139, 34, 0.15)",
                  marginBottom: 6,
                }}>
                  <span style={{ fontSize: 14 }}>{"\u2705"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: "#1A2332" }}>{doc.what}</div>
                    {doc.documents && doc.documents.length > 0 && (
                      <div style={{ fontSize: 10, color: "#5A6B7B", marginTop: 2 }}>
                        {doc.documents.map(d => d.name).join(", ")}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: "#2D6B2D", fontWeight: 500 }}>{doc.importance}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 32px 24px",
          borderTop: "1px solid #E8DFC5",
          display: "flex", gap: 12, justifyContent: "flex-end",
        }}>
          {data.missing.length > 0 && onUploadClick && (
            <button onClick={onUploadClick} style={secondaryBtnStyle}>
              Upload Documents
            </button>
          )}
          <button onClick={onClose} style={primaryBtnStyle}>
            Continue to Application {"\u2192"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 9999,
  backgroundColor: "rgba(26, 35, 50, 0.7)",
  backdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "#FDF8F0",
  borderRadius: 16, width: "100%", maxWidth: 640,
  maxHeight: "85vh", display: "flex", flexDirection: "column",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  border: "1px solid rgba(180, 155, 80, 0.2)",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 24px", borderRadius: 8, border: "none",
  background: "linear-gradient(135deg, #B49B50, #D4B850)",
  color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "10px 24px", borderRadius: 8,
  border: "1px solid rgba(180, 155, 80, 0.3)",
  background: "transparent", color: "#8B7A3E",
  fontWeight: 500, fontSize: 14, cursor: "pointer",
};
