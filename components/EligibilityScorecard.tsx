"use client";
import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface CriteriaResult {
  criterion: string;
  met: boolean;
  notes?: string;
}

interface CertAssessment {
  certName: string;
  certType: string;
  status: "ELIGIBLE" | "LIKELY_ELIGIBLE" | "NEEDS_REVIEW" | "NOT_ELIGIBLE" | "INSUFFICIENT_DATA";
  score: number;
  criteriaResults: CriteriaResult[];
  category: "federal" | "state";
}

interface EligibilityScorecardProps {
  clientId: string;
  compact?: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  ELIGIBLE: { bg: "#E6F4EA", color: "#1B7A3D", label: "Eligible" },
  LIKELY_ELIGIBLE: { bg: "#EDF7ED", color: "#2E7D32", label: "Likely Eligible" },
  NEEDS_REVIEW: { bg: "#FFF8E1", color: "#F57F17", label: "Needs Review" },
  NOT_ELIGIBLE: { bg: "#FDECEA", color: "#C62828", label: "Not Eligible" },
  INSUFFICIENT_DATA: { bg: "#F5F5F5", color: "#757575", label: "Insufficient Data" },
};

export default function EligibilityScorecard({ clientId, compact = false }: EligibilityScorecardProps) {
  const [assessments, setAssessments] = useState<CertAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchEligibility();
  }, [clientId]);

  async function fetchEligibility() {
    try {
      const data = await apiRequest(`/api/eligibility/${clientId}`);
      if (data.assessmentResults) {
        const results = data.assessmentResults;
        // assessmentResults is an object with { assessments, stateCerts, recommendedNext }
        const allCerts = [...(results.assessments || []), ...(results.stateCerts || [])];
        if (allCerts.length > 0) {
          setAssessments(allCerts);
          setHasAssessment(true);
        } else {
          setHasAssessment(false);
        }
      } else {
        setHasAssessment(false);
      }
    } catch {
      setHasAssessment(false);
    } finally {
      setLoading(false);
    }
  }

  async function reassess() {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/eligibility/${clientId}/reassess`, { method: "POST" });
      if (data.assessmentResults) {
        setAssessments(data.assessmentResults);
        setHasAssessment(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: compact ? 16 : 32, textAlign: "center", color: "#6B7280", fontSize: 14 }}>
        Loading eligibility data...
      </div>
    );
  }

  const isCustomer = user?.role === "CUSTOMER";
  const assessmentLink = isCustomer ? "/portal/eligibility" : `/clients/${clientId}/eligibility`;

  // No assessment banner
  if (!hasAssessment && !dismissed) {
    return (
      <div style={{
        background: "#F5F1E8",
        border: "2px solid #C89B3C",
        borderRadius: 12,
        padding: compact ? "20px 24px" : "28px 32px",
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>&#x1F4CB;</div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: compact ? 20 : 24,
              color: "#0B1929",
              fontWeight: 500,
              marginBottom: 8,
              lineHeight: 1.2,
            }}>
              Eligibility Assessment Recommended
            </h3>
            <p style={{
              fontSize: 14,
              color: "#4A5568",
              lineHeight: 1.6,
              marginBottom: 20,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              We recommend completing our Eligibility Assessment first — it takes ~12 minutes and helps us determine which certifications you qualify for.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href={assessmentLink}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 24px",
                  background: "#C89B3C",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Start Assessment &rarr;
              </a>
              <button
                onClick={() => setDismissed(true)}
                style={{
                  padding: "10px 24px",
                  background: "transparent",
                  color: "#6B7280",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  border: "1px solid #D1D5DB",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAssessment && dismissed) return null;

  // Ultra-compact mode for portal home — just badges
  if (hasAssessment && compact) {
    const topCerts = assessments.slice(0, 6);
    return (
      <div style={{ background: "#fff", border: "1px solid rgba(200,155,60,.08)", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "#C89B3C", marginBottom: 4 }}>Eligibility Overview</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#0B1929", fontFamily: "'Cormorant Garamond', serif" }}>Your Certification Eligibility</div>
          </div>
          <a href={isCustomer ? "/portal/eligibility/results" : `/clients/${clientId}/eligibility`} style={{ fontSize: 12, color: "#C89B3C", textDecoration: "none", fontWeight: 500 }}>
            View Full Results →
          </a>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          {topCerts.map((cert: any, i: number) => {
            const statusColors: Record<string, { bg: string; color: string }> = {
              ELIGIBLE: { bg: "rgba(39,174,96,.1)", color: "#27ae60" },
              LIKELY_ELIGIBLE: { bg: "rgba(39,174,96,.08)", color: "#2ecc71" },
              NEEDS_REVIEW: { bg: "rgba(243,156,18,.1)", color: "#f39c12" },
              NOT_ELIGIBLE: { bg: "rgba(231,76,60,.08)", color: "#e74c3c" },
              INSUFFICIENT_DATA: { bg: "rgba(149,165,166,.1)", color: "#95a5a6" },
            };
            const sc = statusColors[cert.status] || statusColors.INSUFFICIENT_DATA;
            const statusLabel: Record<string, string> = { ELIGIBLE: "Eligible", LIKELY_ELIGIBLE: "Likely", NEEDS_REVIEW: "Review", NOT_ELIGIBLE: "Unlikely", INSUFFICIENT_DATA: "?" };
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: sc.bg, borderRadius: 8, border: `1px solid ${sc.color}22` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: sc.color }}>{cert.score}%</span>
                <span style={{ fontSize: 11, color: "#0B1929", fontWeight: 500 }}>{cert.certName || cert.label}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: sc.color, textTransform: "uppercase" as const, letterSpacing: ".04em" }}>{statusLabel[cert.status] || "?"}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <a href="/portal/eligibility" style={{ fontSize: 12, color: "rgba(11,25,41,.5)", textDecoration: "none" }}>Update Assessment →</a>
        </div>
      </div>
    );
  }

  const federalCerts = assessments.filter(a => a.category === "federal");
  const stateCerts = assessments.filter(a => a.category === "state");

  function renderScoreCircle(score: number, size: number) {
    const radius = (size - 6) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? "#1B7A3D" : score >= 60 ? "#F57F17" : "#C62828";
    return (
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: size * 0.32, fontWeight: 700, fill: color }}>
          {score}
        </text>
      </svg>
    );
  }

  function renderTable(certs: CertAssessment[], title: string) {
    if (certs.length === 0) return null;
    const circleSize = compact ? 36 : 44;

    return (
      <div style={{ marginBottom: 28 }}>
        <h3 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: compact ? 18 : 22,
          color: "#0B1929",
          fontWeight: 500,
          marginBottom: 12,
        }}>
          {title}
        </h3>
        <div style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,.06)",
        }}>
          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: compact ? "1fr 120px 60px 100px" : "1fr 140px 70px 200px 140px",
            padding: "12px 20px",
            background: "#F9FAFB",
            borderBottom: "1px solid #E5E7EB",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            color: "#6B7280",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span>Certification</span>
            <span>Status</span>
            <span>Score</span>
            {!compact && <span>Key Requirements</span>}
            <span>Action</span>
          </div>

          {/* Rows */}
          {certs.map((cert, i) => {
            const globalIdx = assessments.indexOf(cert);
            const isExpanded = expandedRow === globalIdx;
            const status = STATUS_STYLES[cert.status] || STATUS_STYLES.INSUFFICIENT_DATA;
            const topCriteria = cert.criteriaResults?.slice(0, 3) || [];

            return (
              <React.Fragment key={i}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: compact ? "1fr 120px 60px 100px" : "1fr 140px 70px 200px 140px",
                  padding: compact ? "12px 20px" : "16px 20px",
                  borderBottom: "1px solid #F3F4F6",
                  alignItems: "center",
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  color: "#1F2937",
                  transition: "background .15s",
                  cursor: cert.criteriaResults?.length > 0 ? "pointer" : "default",
                }}
                  onClick={() => cert.criteriaResults?.length > 0 && setExpandedRow(isExpanded ? null : globalIdx)}
                  onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Cert name */}
                  <span style={{ fontWeight: 500, fontSize: compact ? 13 : 14 }}>{cert.certName}</span>

                  {/* Status badge */}
                  <span>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: 100,
                      fontSize: 12,
                      fontWeight: 600,
                      background: status.bg,
                      color: status.color,
                    }}>
                      {status.label}
                    </span>
                  </span>

                  {/* Score */}
                  <span>{renderScoreCircle(cert.score, circleSize)}</span>

                  {/* Key requirements (full mode only) */}
                  {!compact && (
                    <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {topCriteria.map((cr, j) => (
                        <span key={j} style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          padding: "2px 8px",
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 500,
                          background: cr.met ? "#E6F4EA" : "#FDECEA",
                          color: cr.met ? "#1B7A3D" : "#C62828",
                        }}>
                          {cr.met ? "\u2713" : "\u2717"} {cr.criterion}
                        </span>
                      ))}
                    </span>
                  )}

                  {/* Action */}
                  <span>
                    {(cert.status === "ELIGIBLE" || cert.status === "LIKELY_ELIGIBLE") ? (
                      <a
                        href={`/certifications/new?clientId=${clientId}&certType=${cert.certType}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "6px 14px",
                          background: "#C89B3C",
                          color: "#fff",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Start Application &rarr;
                      </a>
                    ) : cert.status === "NEEDS_REVIEW" ? (
                      <button
                        onClick={e => { e.stopPropagation(); setExpandedRow(isExpanded ? null : globalIdx); }}
                        style={{
                          padding: "6px 14px",
                          background: "transparent",
                          border: "1px solid #D1D5DB",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#4B5563",
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        View Details
                      </button>
                    ) : (
                      <span style={{ color: "#9CA3AF", fontSize: 16 }}>&mdash;</span>
                    )}
                  </span>
                </div>

                {/* Expanded row */}
                {isExpanded && cert.criteriaResults?.length > 0 && (
                  <div style={{
                    padding: "16px 32px 20px",
                    background: "#F9FAFB",
                    borderBottom: "1px solid #E5E7EB",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#6B7280", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                      All Criteria
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {cert.criteriaResults.map((cr, j) => (
                        <div key={j} style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "10px 14px",
                          background: "#fff",
                          border: "1px solid #E5E7EB",
                          borderRadius: 8,
                        }}>
                          <span style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            background: cr.met ? "#1B7A3D" : "#C62828",
                            flexShrink: 0,
                            marginTop: 1,
                          }}>
                            {cr.met ? "\u2713" : "\u2717"}
                          </span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#1F2937", fontFamily: "'DM Sans', sans-serif" }}>{cr.criterion}</div>
                            {cr.notes && (
                              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{cr.notes}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderTable(federalCerts, "Federal Certifications")}
      {renderTable(stateCerts, "State & Local Certifications")}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          onClick={reassess}
          disabled={loading}
          style={{
            padding: "10px 24px",
            background: "transparent",
            border: "1px solid #C89B3C",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#C89B3C",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Re-assessing..." : "Re-assess Eligibility"}
        </button>
      </div>
    </div>
  );
}
