"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

const RATING_CATEGORIES: { key: string; label: string; optional?: boolean }[] = [
  { key: "qualityOfProductOrService", label: "Quality of Product or Service" },
  { key: "schedule", label: "Schedule" },
  { key: "costControl", label: "Cost Control", optional: true },
  { key: "management", label: "Management" },
  { key: "smallBusinessSubcontracting", label: "Utilization of Small Business Subcontracting", optional: true },
];

const RATING_OPTIONS = [
  { value: "E", label: "Exceptional", description: "Performance substantially exceeds contract requirements" },
  { value: "VG", label: "Very Good", description: "Performance exceeds contract requirements" },
  { value: "S", label: "Satisfactory", description: "Performance meets contract requirements" },
  { value: "M", label: "Marginal", description: "Performance does not meet some contract requirements" },
  { value: "U", label: "Unsatisfactory", description: "Performance does not meet contract requirements" },
] as const;

const NARRATIVE_QUESTIONS = [
  "Describe the contractor's technical approach and the quality of deliverables provided.",
  "Describe the contractor's ability to meet schedule and performance milestones.",
  "Describe the contractor's cost management and any cost issues that occurred.",
  "Describe the contractor's management approach, including communication and problem resolution.",
  "Would you use this contractor again? Would you recommend them for similar work? Please explain.",
  "Any additional comments about the contractor's performance.",
] as const;

export default function PPQRespondPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);

  const [ppq, setPpq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Section 1: Evaluator contact info
  const [evaluator, setEvaluator] = useState({
    name: "",
    title: "",
    organization: "",
    phone: "",
    email: "",
  });

  // Section 2: Ratings + comments
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [ratingComments, setRatingComments] = useState<Record<string, string>>({});

  // Section 3: Narrative answers
  const [narratives, setNarratives] = useState<Record<number, string>>({});

  // Section 4: Signature / Certification
  const [signature, setSignature] = useState({
    typedName: "",
    title: "",
    organization: "",
    certify: false,
    understand: false,
  });

  // Canvas signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  }, [getCanvasCoords]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, getCanvasCoords]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureDataUrl(canvasRef.current.toDataURL("image/png"));
    }
  }, [isDrawing]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl("");
  }, []);

  // Init canvas drawing style
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0B1929";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [ppq]);

  useEffect(() => {
    async function fetchPPQ() {
      try {
        const res = await fetch(`${API_URL}/api/ppq/respond/${token}`);
        const data = await res.json();
        if (res.ok) {
          if (data.completed) {
            setError("already_completed");
          } else {
            setPpq(data);
            // Pre-fill evaluator info if available from API
            if (data.referenceName) {
              setEvaluator((prev) => ({ ...prev, name: data.referenceName }));
            }
            if (data.referenceEmail) {
              setEvaluator((prev) => ({ ...prev, email: data.referenceEmail }));
            }
            if (data.referenceTitle) {
              setEvaluator((prev) => ({ ...prev, title: data.referenceTitle }));
            }
            if (data.referenceOrganization || data.agency) {
              setEvaluator((prev) => ({ ...prev, organization: data.referenceOrganization || data.agency || "" }));
            }
            if (data.referencePhone) {
              setEvaluator((prev) => ({ ...prev, phone: data.referencePhone }));
            }
          }
        } else {
          setError(data.error || "This questionnaire could not be found.");
        }
      } catch {
        setError("Something went wrong loading this questionnaire. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchPPQ();
  }, [token]);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleSubmit() {
    setSubmitError("");

    // Validate evaluator fields
    if (!evaluator.name.trim() || !evaluator.title.trim() || !evaluator.organization.trim() || !evaluator.phone.trim() || !evaluator.email.trim()) {
      setSubmitError("Please complete all evaluator contact information fields in Section 1.");
      return;
    }

    // Validate required ratings
    const requiredCategories = RATING_CATEGORIES.filter((c) => !c.optional);
    const missingRatings = requiredCategories.filter((c) => !ratings[c.key]);
    if (missingRatings.length > 0) {
      setSubmitError(`Please provide a rating for: ${missingRatings.map((c) => c.label).join(", ")}.`);
      return;
    }

    // Validate narrative questions (at least first 5 are required)
    for (let i = 0; i < 5; i++) {
      if (!narratives[i]?.trim()) {
        setSubmitError(`Please answer narrative question ${i + 1} in Section 3.`);
        return;
      }
    }

    // Validate signature
    if (!signature.certify) {
      setSubmitError("Please certify that the information provided is accurate and complete.");
      return;
    }
    if (!signature.understand) {
      setSubmitError("Please acknowledge that this information will be used in support of a GSA MAS application.");
      return;
    }
    if (!hasSignature || !signatureDataUrl) {
      setSubmitError("Please draw your signature in the signature pad.");
      return;
    }
    if (!signature.typedName.trim()) {
      setSubmitError("Please type your full name below your signature.");
      return;
    }
    if (!signature.title.trim() || !signature.organization.trim()) {
      setSubmitError("Please provide your title and organization in the signature section.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/ppq/respond/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluator,
          ratings,
          ratingComments,
          narratives,
          signature: {
            ...signature,
            signatureImage: signatureDataUrl,
            date: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitError(data.error || "Failed to submit. Please try again.");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared styles ──────────────────────────────────────────────────
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#F5F1E8",
    fontFamily: "'DM Sans', sans-serif",
    color: "#0B1929",
  };

  const headerStyle: React.CSSProperties = {
    background: "#0B1929",
    padding: "28px 24px",
    textAlign: "center",
  };

  const logoStyle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28,
    color: "#fff",
    fontWeight: 500,
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 780,
    margin: "0 auto",
    padding: "32px 20px 64px",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    padding: "32px 28px",
    marginBottom: 24,
    border: "1px solid rgba(11,25,41,0.08)",
    boxShadow: "0 2px 12px rgba(11,25,41,0.06)",
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 22,
    fontWeight: 500,
    color: "#0B1929",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: "2px solid #E8B84B",
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  };

  const sectionNumber: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#0B1929",
    color: "#E8B84B",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    flexShrink: 0,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#0B1929",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const readOnlyField: React.CSSProperties = {
    padding: "10px 14px",
    background: "#F5F1E8",
    borderRadius: 8,
    fontSize: 14,
    color: "#0B1929",
    lineHeight: 1.5,
    border: "1px solid rgba(11,25,41,0.06)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid rgba(11,25,41,0.15)",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "#0B1929",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid rgba(11,25,41,0.15)",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.7,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    minHeight: 100,
    color: "#0B1929",
  };

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "15px 36px",
    background: "linear-gradient(135deg, #C89B3C, #E8B84B)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: submitting ? "not-allowed" : "pointer",
    opacity: submitting ? 0.7 : 1,
    boxShadow: "0 4px 16px rgba(200,155,60,0.35)",
    width: "100%",
    transition: "opacity 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  };

  const requiredStar = <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>;

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span style={logoStyle}>
            Gov<em style={{ color: "#E8B84B", fontStyle: "normal" }}>Cert</em>
          </span>
        </div>
        <div style={{ ...containerStyle, textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 16, color: "#6b7280" }}>Loading questionnaire...</div>
        </div>
      </div>
    );
  }

  // ── Error / already completed states ───────────────────────────────
  if (error) {
    const isCompleted = error === "already_completed";
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span style={logoStyle}>
            Gov<em style={{ color: "#E8B84B", fontStyle: "normal" }}>Cert</em>
          </span>
        </div>
        <div style={containerStyle}>
          <div style={{ ...cardStyle, textAlign: "center", padding: "48px 32px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: isCompleted ? "#ecfdf5" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
              {isCompleted ? "\u2713" : "!"}
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: "#0B1929", marginBottom: 12 }}>
              {isCompleted ? "Already Completed" : "Questionnaire Unavailable"}
            </h1>
            <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
              {isCompleted
                ? "This questionnaire has already been submitted. Thank you for your response."
                : "This questionnaire link is invalid or has expired. Please contact the contractor if you believe this is an error."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Thank-you / submitted state ────────────────────────────────────
  if (submitted) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span style={logoStyle}>
            Gov<em style={{ color: "#E8B84B", fontStyle: "normal" }}>Cert</em>
          </span>
        </div>
        <div style={containerStyle}>
          <div style={{ ...cardStyle, textAlign: "center", padding: "56px 32px" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#0B1929", marginBottom: 12 }}>
              Thank You
            </h1>
            <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 8px" }}>
              Your Past Performance Questionnaire has been submitted successfully. Thank you for your time and contribution to the GSA Multiple Award Schedule evaluation process.
            </p>
            <a
              href={`${API_URL}/api/ppq/pdf/${token}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 28px", marginTop: 20,
                background: "#0B1929", color: "#E8B84B", borderRadius: 8,
                fontSize: 14, fontWeight: 600, textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Download PDF Copy
            </a>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 16 }}>
              No further action is needed. You may close this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={logoStyle}>
          Gov<em style={{ color: "#E8B84B", fontStyle: "normal" }}>Cert</em>
        </span>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4, letterSpacing: "0.3px" }}>
          Past Performance Questionnaire
        </div>
      </div>

      <div style={containerStyle}>
        {/* Intro */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#0B1929", marginBottom: 12 }}>
            GSA MAS Past Performance Questionnaire
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, maxWidth: 600, margin: "0 auto" }}>
            This questionnaire is being completed in accordance with GSA Multiple Award Schedule requirements. Your candid assessment of the contractor's past performance is essential to the evaluation process.
          </p>
        </div>

        {/* ================================================================ */}
        {/* SECTION 1: Contract Information                                  */}
        {/* ================================================================ */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>
            <span style={sectionNumber}>1</span>
            Contract Information
          </h2>

          {/* Pre-filled contract details (read-only) */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
              Contract Details (Pre-filled)
            </div>
            <div className="ppq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Contractor / Offeror Name</label>
                <div style={readOnlyField}>{ppq.contractorName || "\u2014"}</div>
              </div>
              <div>
                <label style={labelStyle}>Contract Number</label>
                <div style={readOnlyField}>{ppq.contractNumber || "N/A"}</div>
              </div>
              <div>
                <label style={labelStyle}>Contract Type</label>
                <div style={readOnlyField}>{ppq.contractType || "\u2014"}</div>
              </div>
              <div>
                <label style={labelStyle}>Contract Value</label>
                <div style={readOnlyField}>{ppq.contractValue || "\u2014"}</div>
              </div>
              <div>
                <label style={labelStyle}>Period of Performance</label>
                <div style={readOnlyField}>{ppq.periodOfPerformance || "\u2014"}</div>
              </div>
              <div>
                <label style={labelStyle}>Place of Performance</label>
                <div style={readOnlyField}>{ppq.placeOfPerformance || "\u2014"}</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Description of Work / Services Provided</label>
                <div style={readOnlyField}>{ppq.contractDescription || "\u2014"}</div>
              </div>
            </div>
          </div>

          {/* Evaluator contact info (editable) */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
              Evaluator Information (Please verify / complete)
            </div>
            <div className="ppq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Evaluator Name {requiredStar}</label>
                <input
                  type="text"
                  value={evaluator.name}
                  onChange={(e) => setEvaluator((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Title {requiredStar}</label>
                <input
                  type="text"
                  value={evaluator.title}
                  onChange={(e) => setEvaluator((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Job title"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Organization {requiredStar}</label>
                <input
                  type="text"
                  value={evaluator.organization}
                  onChange={(e) => setEvaluator((p) => ({ ...p, organization: e.target.value }))}
                  placeholder="Agency or organization"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone {requiredStar}</label>
                <input
                  type="tel"
                  value={evaluator.phone}
                  onChange={(e) => setEvaluator((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(555) 555-5555"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Email {requiredStar}</label>
                <input
                  type="email"
                  value={evaluator.email}
                  onChange={(e) => setEvaluator((p) => ({ ...p, email: e.target.value }))}
                  placeholder="evaluator@agency.gov"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 2: Performance Ratings                                   */}
        {/* ================================================================ */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>
            <span style={sectionNumber}>2</span>
            Performance Ratings
          </h2>

          {/* Rating scale legend */}
          <div style={{ background: "#F5F1E8", borderRadius: 8, padding: "16px 20px", marginBottom: 28, border: "1px solid rgba(11,25,41,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0B1929", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              Adjectival Rating Scale
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {RATING_OPTIONS.map((opt) => (
                <div key={opt.value} style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
                  <strong style={{ color: "#0B1929", minWidth: 24, display: "inline-block" }}>{opt.value}</strong>
                  <span style={{ color: "#6b7280", margin: "0 6px" }}>=</span>
                  <strong>{opt.label}</strong>
                  <span style={{ color: "#6b7280" }}> &mdash; {opt.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {RATING_CATEGORIES.map((cat) => (
              <div key={cat.key} style={{ paddingBottom: 24, borderBottom: "1px solid rgba(11,25,41,0.06)" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0B1929", marginBottom: 4 }}>
                  {cat.label}
                  {cat.optional && <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af", marginLeft: 8 }}>(if applicable)</span>}
                  {!cat.optional && requiredStar}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, marginTop: 10 }}>
                  {RATING_OPTIONS.map((opt) => {
                    const selected = ratings[cat.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRatings((prev) => ({ ...prev, [cat.key]: opt.value }))}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 6,
                          border: selected ? "2px solid #C89B3C" : "1px solid rgba(11,25,41,0.15)",
                          background: selected ? "rgba(200,155,60,0.1)" : "#fff",
                          color: selected ? "#0B1929" : "#6b7280",
                          fontWeight: selected ? 600 : 400,
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          fontFamily: "'DM Sans', sans-serif",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{opt.value}</span>
                        <span style={{ fontSize: 12 }}>{opt.label}</span>
                      </button>
                    );
                  })}
                  {cat.optional && ratings[cat.key] && (
                    <button
                      type="button"
                      onClick={() => {
                        setRatings((prev) => {
                          const next = { ...prev };
                          delete next[cat.key];
                          return next;
                        });
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid rgba(11,25,41,0.1)",
                        background: "transparent",
                        color: "#9ca3af",
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>Comment / Justification</label>
                  <textarea
                    value={ratingComments[cat.key] || ""}
                    onChange={(e) => setRatingComments((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                    rows={2}
                    placeholder={`Brief justification for ${cat.label.toLowerCase()} rating...`}
                    style={{ ...textareaStyle, minHeight: 64 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 3: Narrative Questions                                   */}
        {/* ================================================================ */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>
            <span style={sectionNumber}>3</span>
            Narrative Questions
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 24 }}>
            Please provide detailed responses to each question below. Specific examples and outcomes are highly valued by GSA evaluators.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {NARRATIVE_QUESTIONS.map((question, idx) => (
              <div key={idx}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0B1929", marginBottom: 8, lineHeight: 1.5 }}>
                  <span style={{ color: "#C89B3C", fontWeight: 700, marginRight: 8 }}>{idx + 1}.</span>
                  {question}
                  {idx < 5 && requiredStar}
                </div>
                <textarea
                  value={narratives[idx] || ""}
                  onChange={(e) => setNarratives((prev) => ({ ...prev, [idx]: e.target.value }))}
                  rows={4}
                  placeholder="Enter your response..."
                  style={textareaStyle}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 4: Signature / Certification                            */}
        {/* ================================================================ */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>
            <span style={sectionNumber}>4</span>
            Certification &amp; Signature
          </h2>

          {/* Certifications */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={signature.certify}
                onChange={(e) => setSignature((p) => ({ ...p, certify: e.target.checked }))}
                style={{ marginTop: 3, width: 18, height: 18, accentColor: "#C89B3C", cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "#0B1929" }}>
                I certify that the information provided above is accurate and complete to the best of my knowledge. {requiredStar}
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={signature.understand}
                onChange={(e) => setSignature((p) => ({ ...p, understand: e.target.checked }))}
                style={{ marginTop: 3, width: 18, height: 18, accentColor: "#C89B3C", cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ fontSize: 14, lineHeight: 1.6, color: "#0B1929" }}>
                I understand this information will be used in support of a GSA Multiple Award Schedule application. {requiredStar}
              </span>
            </label>
          </div>

          {/* Signature pad */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Signature {requiredStar}</label>
            <div style={{
              border: hasSignature ? "2px solid #C89B3C" : "2px dashed rgba(11,25,41,0.2)",
              borderRadius: 8, background: "#fff", position: "relative", overflow: "hidden",
            }}>
              <canvas
                ref={canvasRef}
                width={700}
                height={160}
                style={{ width: "100%", height: 160, cursor: "crosshair", display: "block", touchAction: "none" }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  pointerEvents: "none", color: "rgba(11,25,41,0.25)", fontSize: 15,
                }}>
                  Draw your signature here
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <button type="button" onClick={clearSignature} style={{
                background: "none", border: "none", color: "#9ca3af", fontSize: 12,
                cursor: "pointer", textDecoration: "underline",
              }}>
                Clear Signature
              </button>
            </div>
          </div>

          {/* Typed name + title/org/date */}
          <div className="ppq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Printed Name {requiredStar}</label>
              <input
                type="text"
                value={signature.typedName}
                onChange={(e) => setSignature((p) => ({ ...p, typedName: e.target.value }))}
                placeholder="Type your full name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Title {requiredStar}</label>
              <input
                type="text"
                value={signature.title}
                onChange={(e) => setSignature((p) => ({ ...p, title: e.target.value }))}
                placeholder="Your title"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Organization {requiredStar}</label>
              <input
                type="text"
                value={signature.organization}
                onChange={(e) => setSignature((p) => ({ ...p, organization: e.target.value }))}
                placeholder="Your organization"
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Date</label>
              <div style={readOnlyField}>{todayFormatted}</div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Submit                                                          */}
        {/* ================================================================ */}
        <div style={cardStyle}>
          {submitError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 14, color: "#dc2626" }}>
              {submitError}
            </div>
          )}

          <button type="button" onClick={handleSubmit} disabled={submitting} style={buttonStyle}>
            {submitting ? "Submitting..." : "Submit Questionnaire"}
          </button>

          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            Your responses will be used to support the contractor's GSA Multiple Award Schedule application.
            All information is handled in accordance with federal acquisition regulations.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .ppq-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
