"use client";
import React, { useState } from "react";
import { apiRequest } from "@/lib/api";

interface GuidedFixPanelProps {
  isOpen: boolean;
  onClose: () => void;
  issueKey: string;
  issueText: string;
  sectionId: string;
  sectionLabel: string;
  certificationId: string;
  certType: string;
  currentContent?: string;
  onFixed: (issueKey: string, newContent: string) => void;
}

interface GuidedQuestion {
  id: string;
  question: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
}

type Phase = "choose" | "loading" | "questions" | "generating" | "review";

export default function GuidedFixPanel({
  isOpen,
  onClose,
  issueKey,
  issueText,
  sectionId,
  sectionLabel,
  certificationId,
  certType,
  currentContent,
  onFixed,
}: GuidedFixPanelProps) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [questions, setQuestions] = useState<GuidedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState("");
  const [charLimit, setCharLimit] = useState<number>(5000);
  const [shortening, setShortening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirm before closing if user has work in progress
  const hasProgress = Object.keys(answers).some(k => answers[k]?.trim()) || generatedContent.trim();

  function handleClose() {
    if (hasProgress) {
      if (!window.confirm("You have unsaved progress. Are you sure you want to close? Your answers will be lost.")) {
        return;
      }
    }
    setPhase("choose");
    setQuestions([]);
    setAnswers({});
    setGeneratedContent("");
    setError(null);
    onClose();
  }

  // Don't auto-reset on close — the handleClose function handles cleanup
  // Only reset if the issueKey changes (user opened a different issue)
  const prevIssueKey = React.useRef(issueKey);
  React.useEffect(() => {
    if (issueKey !== prevIssueKey.current) {
      setPhase("choose");
      setQuestions([]);
      setAnswers({});
      setGeneratedContent("");
      setError(null);
      prevIssueKey.current = issueKey;
    }
  }, [issueKey]);

  function startAIFix() {
    fetchQuestions();
  }

  function closeClean() {
    // Close without confirmation — used after a deliberate action (apply, navigate, dismiss)
    setPhase("choose");
    setQuestions([]);
    setAnswers({});
    setGeneratedContent("");
    setError(null);
    onClose();
  }

  function fixManually() {
    // Navigate to the section — construct URL from sectionId
    // Keys match the REQUIRED SECTION IDs from the AI review prompt
    const SECTION_LINKS: Record<string, Record<string, string>> = {
      EIGHT_A: {
        "social-disadvantage": "8a/social-disadvantage",
        "economic-disadvantage": "8a/economic-disadvantage",
        "business-plan": "8a/business-plan",
        "corporate": "8a/corporate",
        "past-performance": "8a/past-performance",
        "financials": "8a/financials",
      },
      GSA_MAS: {
        "corporate-experience": "corporate",
        "corporate": "corporate",
        "quality-control": "qcp",
        "qcp": "qcp",
        "past-performance": "past-performance",
        "project-experience": "past-performance",
        "pricing": "pricing",
        "company-info": "submit",
        "experience": "corporate",
        "financials": "submit",
      },
      OASIS_PLUS: {
        "corporate-experience": "oasis-plus/submit",
        "corporate": "oasis-plus/submit",
        "qualifying-projects": "oasis-plus/submit",
        "past-performance": "oasis-plus/submit",
        "domains": "oasis-plus/submit",
        "contract-history": "oasis-plus/submit",
        "federal-experience": "oasis-plus/submit",
        "systems": "oasis-plus/submit",
        "systems-certs": "oasis-plus/submit",
      },
    };
    const links = SECTION_LINKS[certType] || {};
    const link = links[sectionId];
    if (link) {
      window.location.href = `/certifications/${certificationId}/${link}`;
    } else {
      // Fallback: go to the submit page for the current cert type
      const fallback = certType === "EIGHT_A" ? "8a/submit" : certType === "OASIS_PLUS" ? "oasis-plus/submit" : "submit";
      window.location.href = `/certifications/${certificationId}/${fallback}`;
    }
    closeClean();
  }

  function markAlreadyFixed() {
    onFixed(issueKey, "");
    closeClean();
  }

  async function fetchQuestions() {
    setPhase("loading");
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/guided-fix", {
        method: "POST",
        body: JSON.stringify({
          certificationId,
          certType,
          sectionId,
          issueKey,
          issueText,
          currentContent: currentContent || "",
        }),
      });
      setQuestions(data.questions || []);
      setCharLimit(data.charLimit || 5000);
      setPhase("questions");
    } catch (err: any) {
      setError("Failed to load guided questions: " + (err.message || "Please try again."));
      setPhase("questions");
    }
  }

  async function generateFix() {
    setPhase("generating");
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/guided-fix", {
        method: "POST",
        body: JSON.stringify({
          certificationId,
          certType,
          sectionId,
          issueKey,
          issueText,
          currentContent: currentContent || "",
          answers,
        }),
      });
      setGeneratedContent(data.content || "");
      if (data.charLimit) setCharLimit(data.charLimit);
      setPhase("review");
    } catch (err: any) {
      setError("Failed to generate fix: " + (err.message || "Please try again."));
      setPhase("questions");
    }
  }

  function handleApply() {
    onFixed(issueKey, generatedContent);
    closeClean();
  }

  async function handleShorten() {
    setShortening(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/condense-narrative", {
        method: "POST",
        body: JSON.stringify({ narrative: generatedContent, charLimit }),
      });
      if (data.narrative) {
        setGeneratedContent(data.narrative);
      }
    } catch (err: any) {
      setError("Failed to shorten: " + (err.message || "Please try again."));
    } finally {
      setShortening(false);
    }
  }

  if (!isOpen) return null;

  const charCount = generatedContent.length;
  const isOverLimit = charCount > charLimit;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(11,25,41,.45)",
          zIndex: 999,
          transition: "opacity .2s",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 500,
          background: "#fff",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(11,25,41,.18)",
          animation: "slideInRight .25s ease-out",
        }}
      >
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div
          style={{
            background: "var(--navy)",
            padding: "20px 24px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  color: "var(--gold2)",
                  marginBottom: 6,
                }}
              >
                Fix with AI — {sectionLabel}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#fff",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {issueText}
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: "rgba(255,255,255,.1)",
                border: "none",
                borderRadius: "var(--r)",
                color: "#fff",
                fontSize: 18,
                width: 32,
                height: 32,
                cursor: "pointer",
                flexShrink: 0,
                marginLeft: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              x
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {error && (
            <div
              style={{
                background: "var(--red-bg)",
                border: "1px solid var(--red-b)",
                borderRadius: "var(--r)",
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 12,
                color: "var(--red)",
              }}
            >
              {error}
            </div>
          )}

          {/* Phase: Choose fix method */}
          {phase === "choose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500, marginBottom: 8 }}>How would you like to fix this?</div>

              <button onClick={startAIFix} style={{
                display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px",
                border: "2px solid var(--gold)", borderRadius: "var(--rl)", background: "rgba(200,155,60,.04)",
                cursor: "pointer", textAlign: "left" as const,
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>✨</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Fix with AI</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>Answer a few targeted questions, then AI generates the fix — within the exact character limits required by the certification portal.</div>
                </div>
              </button>

              <button onClick={fixManually} style={{
                display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px",
                border: "1px solid var(--border)", borderRadius: "var(--rl)", background: "#fff",
                cursor: "pointer", textAlign: "left" as const,
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>✏️</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Fix manually</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>Go directly to the {sectionLabel} section and make edits yourself.</div>
                </div>
              </button>

              <button onClick={markAlreadyFixed} style={{
                display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px",
                border: "1px solid var(--border)", borderRadius: "var(--rl)", background: "#fff",
                cursor: "pointer", textAlign: "left" as const,
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>✅</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Already fixed</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>I already addressed this — just mark it as resolved.</div>
                </div>
              </button>
            </div>
          )}

          {/* Phase: Loading */}
          {phase === "loading" && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink4)" }}>
              <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 2s linear infinite" }}>&#9881;&#65039;</div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Preparing guided questions...</div>
              <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 4 }}>
                Analyzing the issue to ask the right questions.
              </div>
            </div>
          )}

          {/* Phase: Questions */}
          {phase === "questions" && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  color: "var(--gold)",
                  marginBottom: 16,
                }}
              >
                Step 1: Answer a few questions
              </div>

              {questions.length === 0 && !error && (
                <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>
                  No questions needed. Click "Generate Fix" to proceed.
                </div>
              )}

              {questions.map((q) => (
                <div key={q.id} style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--navy)",
                      marginBottom: 6,
                      lineHeight: 1.5,
                    }}
                  >
                    {q.question}
                  </label>
                  {q.type === "select" && q.options ? (
                    <select
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--border2)",
                        borderRadius: "var(--r)",
                        fontSize: 13,
                        color: "var(--ink2)",
                        background: "#fff",
                      }}
                    >
                      <option value="">Select...</option>
                      {q.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : q.type === "textarea" ? (
                    <textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      placeholder={q.placeholder || ""}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--border2)",
                        borderRadius: "var(--r)",
                        fontSize: 13,
                        color: "var(--ink2)",
                        resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      placeholder={q.placeholder || ""}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--border2)",
                        borderRadius: "var(--r)",
                        fontSize: 13,
                        color: "var(--ink2)",
                      }}
                    />
                  )}
                </div>
              ))}

              <button
                onClick={generateFix}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                  border: "none",
                  borderRadius: "var(--r)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(200,155,60,.3)",
                  marginTop: 8,
                }}
              >
                Generate Fix
              </button>
            </div>
          )}

          {/* Phase: Generating */}
          {phase === "generating" && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 2s linear infinite" }}>&#9881;&#65039;</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Generating your fix...</div>
              <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 4 }}>
                Crafting content that addresses the issue based on your answers.
              </div>
            </div>
          )}

          {/* Phase: Review & Apply */}
          {phase === "review" && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  color: "var(--gold)",
                  marginBottom: 12,
                }}
              >
                Step 2: Review & Apply
              </div>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 12, lineHeight: 1.5 }}>
                Review the generated content below. You can edit it before applying.
              </div>

              <textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 240,
                  padding: "14px",
                  border: `1px solid ${isOverLimit ? "var(--red)" : "var(--border2)"}`,
                  borderRadius: "var(--r)",
                  fontSize: 13,
                  color: "var(--ink2)",
                  lineHeight: 1.7,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />

              {/* Character counter */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 6,
                  marginBottom: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  color: isOverLimit ? "var(--red)" : "var(--green)",
                }}
              >
                {charCount.toLocaleString()} / {charLimit.toLocaleString()} characters
              </div>

              {isOverLimit && (
                <div style={{ background: "rgba(220,50,50,.06)", border: "1px solid rgba(220,50,50,.2)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 10, fontSize: 12, color: "#b91c1c", lineHeight: 1.5 }}>
                  ⚠️ Content exceeds the {charLimit.toLocaleString()}-character portal limit by {(charCount - charLimit).toLocaleString()} characters. Use <strong>Shorten to Fit</strong> to auto-condense while preserving all key details, or apply as-is and trim manually.
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    setPhase("questions");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "var(--cream2)",
                    border: "1px solid var(--border2)",
                    borderRadius: "var(--r)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink3)",
                    cursor: "pointer",
                  }}
                >
                  Regenerate
                </button>
                {isOverLimit && (
                  <button
                    onClick={handleShorten}
                    disabled={shortening}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: shortening ? "var(--ink4)" : "#b91c1c",
                      border: "none",
                      borderRadius: "var(--r)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: shortening ? "wait" : "pointer",
                    }}
                  >
                    {shortening ? "Shortening..." : "Shorten to Fit"}
                  </button>
                )}
                <button
                  onClick={handleApply}
                  style={{
                    flex: 2,
                    padding: "12px",
                    background: isOverLimit
                      ? "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)"
                      : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                    border: "none",
                    borderRadius: "var(--r)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(200,155,60,.3)",
                  }}
                >
                  Apply Fix{isOverLimit ? " (Over Limit)" : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
