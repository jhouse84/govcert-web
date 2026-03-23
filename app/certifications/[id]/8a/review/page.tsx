"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const SECTION_LINKS: Record<string, string> = {
  "social-disadvantage": "8a/social-disadvantage",
  "economic-disadvantage": "8a/economic-disadvantage",
  "business-plan": "8a/business-plan",
  "corporate": "8a/corporate",
  "past-performance": "8a/past-performance",
  "financials": "8a/financials",
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  strong: { color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-b)", label: "Strong" },
  adequate: { color: "#2563EB", bg: "rgba(37,99,235,.06)", border: "rgba(37,99,235,.2)", label: "Adequate" },
  needs_improvement: { color: "var(--gold)", bg: "rgba(200,155,60,.06)", border: "rgba(200,155,60,.2)", label: "Needs Improvement" },
  critical: { color: "var(--red)", bg: "var(--red-bg)", border: "var(--red-b)", label: "Critical" },
  missing: { color: "#6B7280", bg: "var(--cream2)", border: "var(--border)", label: "Missing" },
};

export default function EightAReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewHistory, setReviewHistory] = useState<{ score: number; date: string }[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      // Load previous review from localStorage
      const stored = localStorage.getItem(`govcert-review-${certId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setReview(parsed.review);
          setReviewHistory(parsed.history || []);
        } catch {}
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function runReview() {
    setAnalyzing(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/review", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert?.clientId,
          certType: "EIGHT_A",
        }),
      });
      setReview(data);
      // Save to history
      const newHistory = [...reviewHistory, { score: data.overallScore, date: new Date().toISOString() }];
      setReviewHistory(newHistory);
      localStorage.setItem(`govcert-review-${certId}`, JSON.stringify({ review: data, history: newHistory }));
    } catch (err: any) {
      setError("Review failed: " + (err.message || "Please try again."));
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const scoreColor = !review ? "var(--ink4)" : review.overallScore >= 80 ? "var(--green)" : review.overallScore >= 60 ? "var(--gold)" : review.overallScore >= 40 ? "#F59E0B" : "var(--red)";
  const verdictColors: Record<string, string> = { STRONG: "var(--green)", COMPETITIVE: "#2563EB", NEEDS_IMPROVEMENT: "var(--gold)", NEEDS_WORK: "var(--gold)", NOT_READY: "var(--red)", ERROR: "var(--red)" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {/* Header */}
      <div style={{ background: "var(--navy)", padding: "32px 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            &larr; Back to Application Dashboard
          </a>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(200,155,60,.18)", border: "1px solid rgba(200,155,60,.3)", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, background: "var(--gold2)", borderRadius: "50%" }} />
                <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--gold-lt)", letterSpacing: ".1em", textTransform: "uppercase" as const }}>8(a) Business Development</span>
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#fff", fontWeight: 400, marginBottom: 6 }}>
                GovCert Application Review
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", maxWidth: 500 }}>
                AI-powered analysis of your application against SBA regulatory standards and current approval patterns.
              </p>
            </div>
            <button onClick={runReview} disabled={analyzing}
              style={{
                padding: "14px 32px",
                background: analyzing ? "var(--ink4)" : "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                border: "none", borderRadius: "var(--r)", fontSize: 15, fontWeight: 600, color: "#fff",
                cursor: analyzing ? "wait" : "pointer",
                boxShadow: analyzing ? "none" : "0 4px 24px rgba(200,155,60,.4)",
              }}>
              {analyzing ? "Analyzing your application..." : review ? "Re-Run Analysis" : "Run GovCert Review"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 48px" }}>
        {error && (
          <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--red)" }}>
            {error}
          </div>
        )}

        {/* No review yet */}
        {!review && !analyzing && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "48px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 12 }}>Ready for your application review?</h2>
            <p style={{ fontSize: 14, color: "var(--ink3)", maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6 }}>
              GovCert will analyze every section of your 8(a) application against SBA regulations, identify gaps, score your readiness, and provide specific recommendations to strengthen your application before submission.
            </p>
            <button onClick={runReview}
              style={{ padding: "14px 40px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 16, fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 24px rgba(200,155,60,.4)" }}>
              Start Review
            </button>
          </div>
        )}

        {/* Analyzing spinner */}
        {analyzing && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "48px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 2s linear infinite" }}>⚙️</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Analyzing your application...</h2>
            <p style={{ fontSize: 13, color: "var(--ink3)" }}>Our AI is reviewing every section against SBA 8(a) regulatory standards. This may take 15-30 seconds.</p>
          </div>
        )}

        {/* Review Results */}
        {review && !analyzing && (<>
          {/* Disclaimer */}
          <div style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.15)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 24, fontSize: 11.5, color: "var(--ink3)", lineHeight: 1.6 }}>
            <strong>Disclaimer:</strong> {review.disclaimer || "This AI-generated review is for guidance purposes only and does not constitute legal advice. It does not guarantee approval or predict agency decisions. Consult a government contracting attorney before submitting."}
          </div>

          {/* Overall Score + Verdict */}
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, marginBottom: 28 }}>
            <div style={{ background: "#fff", border: `3px solid ${scoreColor}`, borderRadius: "var(--rl)", padding: "28px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--ink4)", marginBottom: 8 }}>Overall Score</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 72, color: scoreColor, lineHeight: 1 }}>{review.overallScore}</div>
              <div style={{ fontSize: 14, color: scoreColor, fontWeight: 600, marginTop: 4 }}>/100</div>
              <div style={{ marginTop: 12, padding: "6px 16px", background: `${verdictColors[review.readinessLevel] || "var(--ink4)"}15`, border: `1px solid ${verdictColors[review.readinessLevel] || "var(--ink4)"}30`, borderRadius: 100, display: "inline-block", fontSize: 12, fontWeight: 600, color: verdictColors[review.readinessLevel] || "var(--ink4)" }}>
                {(review.readinessLevel || review.overallVerdict || "").replace(/_/g, " ")}
              </div>
              {/* History */}
              {reviewHistory.length > 1 && (
                <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <div style={{ fontSize: 10, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 6 }}>History</div>
                  {reviewHistory.slice(-5).map((h, i) => (
                    <div key={i} style={{ fontSize: 11, color: "var(--ink3)", display: "flex", justifyContent: "space-between" }}>
                      <span>{new Date(h.date).toLocaleDateString()}</span>
                      <span style={{ fontWeight: 600, color: h.score >= 70 ? "var(--green)" : "var(--gold)" }}>{h.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
              {/* Critical Issues */}
              {review.criticalIssues?.length > 0 && (
                <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--rl)", padding: "18px 22px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red)", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Critical Issues — Must Fix</div>
                  {review.criticalIssues.map((issue: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "#991B1B", lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>🚨</span> {issue}
                    </div>
                  ))}
                </div>
              )}
              {/* Strengths */}
              {review.strengths?.length > 0 && (
                <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--rl)", padding: "18px 22px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Application Strengths</div>
                  {review.strengths.map((s: string, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 13, color: "#065F46", lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>✅</span> {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section-by-Section Analysis */}
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 14 }}>Section-by-Section Analysis</div>

          {(review.sections || []).map((section: any) => {
            const cfg = STATUS_CONFIG[section.status] || STATUS_CONFIG.missing;
            const sectionLink = SECTION_LINKS[section.id];
            return (
              <div key={section.id} style={{ background: "#fff", border: `1px solid ${cfg.border}`, borderLeft: `4px solid ${cfg.color}`, borderRadius: "var(--rl)", padding: "22px 26px", marginBottom: 14, boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--navy)" }}>{section.label}</span>
                      <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                    </div>
                    {section.regulatoryBasis && (
                      <div style={{ fontSize: 11, color: "var(--ink4)", fontStyle: "italic", lineHeight: 1.5 }}>{section.regulatoryBasis}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: cfg.color, lineHeight: 1 }}>{section.score}</div>
                      <div style={{ fontSize: 10, color: "var(--ink4)" }}>/10</div>
                    </div>
                    {sectionLink && (
                      <a href={`/certifications/${certId}/${sectionLink}`}
                        style={{ padding: "6px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 500, color: "var(--gold2)", textDecoration: "none", whiteSpace: "nowrap" as const }}>
                        Go to Section →
                      </a>
                    )}
                  </div>
                </div>

                {/* Findings */}
                {section.findings?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)", marginBottom: 4 }}>Findings:</div>
                    {section.findings.map((f: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3, fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.5 }}>
                        <span style={{ color: cfg.color, flexShrink: 0 }}>•</span> {f}
                      </div>
                    ))}
                  </div>
                )}

                {/* Improvements */}
                {section.improvements?.length > 0 && (
                  <div style={{ background: "rgba(200,155,60,.04)", border: "1px solid rgba(200,155,60,.12)", borderRadius: "var(--r)", padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)", marginBottom: 4 }}>How to Improve:</div>
                    {section.improvements.map((imp: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3, fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.5 }}>
                        <span style={{ color: "var(--gold)", flexShrink: 0 }}>→</span> {imp}
                      </div>
                    ))}
                  </div>
                )}

                {/* Score bar */}
                <div style={{ height: 4, background: "var(--cream2)", borderRadius: 100, marginTop: 12, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${section.score * 10}%`, background: cfg.color, borderRadius: 100, transition: "width .5s" }} />
                </div>
              </div>
            );
          })}

          {/* Bottom actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, padding: "20px 24px", background: "var(--navy)", borderRadius: "var(--rl)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Made improvements?</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Re-run the analysis to see your updated score.</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a href={`/certifications/${certId}`}
                style={{ padding: "10px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, textDecoration: "none" }}>
                ← Dashboard
              </a>
              <button onClick={runReview} disabled={analyzing}
                style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {analyzing ? "Analyzing..." : "Re-Run Analysis"}
              </button>
              <a href={`/certifications/${certId}/8a/submit`}
                style={{ padding: "10px 24px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                Proceed to Submit →
              </a>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}
