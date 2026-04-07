"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import ExecutiveReview from "@/components/ExecutiveReview";
import GuidedFixPanel from "@/components/GuidedFixPanel";

// Map section IDs from the review to the correct wizard page paths
const SECTION_LINKS: Record<string, string> = {
  "corporate-experience": "corporate",
  "corporate": "corporate",
  "experience": "corporate",
  "quality-control": "qcp",
  "qcp": "qcp",
  "past-performance": "past-performance",
  "project-experience": "past-performance",
  "pricing": "pricing",
  "company-info": "submit",
  "financials": "financials",
  "social-disadvantage": "8a/social-disadvantage",
  "economic-disadvantage": "8a/economic-disadvantage",
  "business-plan": "8a/business-plan",
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  strong: { color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-b)", label: "Strong" },
  adequate: { color: "#2563EB", bg: "rgba(37,99,235,.06)", border: "rgba(37,99,235,.2)", label: "Adequate" },
  needs_improvement: { color: "var(--gold)", bg: "rgba(200,155,60,.06)", border: "rgba(200,155,60,.2)", label: "Needs Improvement" },
  critical: { color: "var(--red)", bg: "var(--red-bg)", border: "var(--red-b)", label: "Critical" },
  missing: { color: "#6B7280", bg: "var(--cream2)", border: "var(--border)", label: "Missing" },
};

export default function GSAMASReviewPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [resolvedIssues, setResolvedIssues] = useState<Record<string, any>>({});
  const [adjustedScore, setAdjustedScore] = useState<number | null>(null);
  const [resolvingKey, setResolvingKey] = useState<string | null>(null);
  const [guidedFix, setGuidedFix] = useState<{ isOpen: boolean; issueKey: string; issueText: string; sectionId: string; sectionLabel: string } | null>(null);
  const [cureUploading, setCureUploading] = useState(false);
  const [cureUploadResult, setCureUploadResult] = useState<any>(null);
  const [curedSections, setCuredSections] = useState<Set<string>>(new Set());
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

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
      // Load previous reviews from database first, then fallback to localStorage
      try {
        const savedReviews = await apiRequest(`/api/applications/ai/reviews/${certId}`);
        if (savedReviews && savedReviews.length > 0) {
          const latest = savedReviews[0];
          const parsed = {
            overallScore: latest.overallScore,
            overallVerdict: latest.overallVerdict,
            readinessLevel: latest.readinessLevel,
            sections: JSON.parse(latest.sectionsJson || "[]"),
            criticalIssues: latest.criticalIssues ? JSON.parse(latest.criticalIssues) : [],
            strengths: latest.strengths ? JSON.parse(latest.strengths) : [],
            disclaimer: latest.disclaimer,
          };
          setReview(parsed);
          setReviewId(latest.id);
          try {
            const ri = JSON.parse(latest.resolvedIssues || '{}');
            setResolvedIssues(ri);
            if (latest.adjustedScore != null) setAdjustedScore(latest.adjustedScore);
          } catch {}
          setReviewHistory(savedReviews.map((r: any) => ({ score: r.adjustedScore || r.overallScore, date: r.createdAt })));
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem(`govcert-review-${certId}`);
          if (stored) {
            try {
              const p = JSON.parse(stored);
              setReview(p.review);
              setReviewHistory(p.history || []);
            } catch {}
          }
        }
      } catch {
        // Fallback to localStorage if API fails
        const stored = localStorage.getItem(`govcert-review-${certId}`);
        if (stored) {
          try {
            const p = JSON.parse(stored);
            setReview(p.review);
            setReviewHistory(p.history || []);
          } catch {}
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function resolveIssue(issueKey: string, resolved: boolean) {
    if (!reviewId) return;
    setResolvingKey(issueKey);
    try {
      const result = await apiRequest(`/api/applications/ai/reviews/${reviewId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ issueKey, resolved }),
      });
      setResolvedIssues(result.resolvedIssues);
      setAdjustedScore(result.adjustedScore);
    } catch (err) { console.error(err); }
    finally { setResolvingKey(null); }
  }

  async function handleGuidedFixed(issueKey: string, newContent: string) {
    const sectionId = guidedFix?.sectionId || issueKey.split(":")[0];
    try {
      await apiRequest(`/api/applications/${certId}/sections/${sectionId}`, {
        method: "PUT",
        body: JSON.stringify({ content: newContent }),
      });
    } catch (err) {
      console.error("Failed to save section content:", err);
    }
    await resolveIssue(issueKey, true);
    setGuidedFix(null);
  }

  const displayScore = adjustedScore ?? review?.overallScore;

  async function runReview() {
    setAnalyzing(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/review", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert?.clientId,
          certType: "GSA_MAS",
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

  async function handleCureUpload(files: FileList) {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    setCureUploading(true);
    setCureUploadResult(null);
    try {
      const token = localStorage.getItem("token");
      const clientId = cert?.clientId || cert?.client?.id;
      const results = [];

      for (const file of fileArr) {
        // 1. Upload the file
        const formData = new FormData();
        formData.append("file", file);
        if (clientId) formData.append("clientId", clientId);
        const uploadResp = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadResp.json();
        const doc = uploadData.document || uploadData;

        // 2. Determine where this goes in the submission portal
        const category = doc.category || "OTHER";
        const placement = getDocumentPlacement(category, file.name, cert?.type);
        results.push({ fileName: file.name, category, placement, docId: doc.id });
      }

      setCureUploadResult(results);
    } catch (err: any) {
      setError("Upload failed: " + (err.message || ""));
    } finally {
      setCureUploading(false);
    }
  }

  function getDocumentPlacement(category: string, fileName: string, certType: string): { portal: string; section: string; instruction: string } {
    const name = fileName.toLowerCase();
    const isGSA = certType === "GSA_MAS";

    // Smart detection from filename
    if (name.includes("8(a)") || name.includes("8a") || name.includes("sba cert")) {
      return {
        portal: isGSA ? "eOffer → Solicitation Clauses → Small Business Representation" : "certifications.sba.gov → Document Upload",
        section: isGSA ? "Upload Documents — proves 8(a) certification status for small business set-aside eligibility" : "Supporting certification documentation",
        instruction: isGSA ? "Upload as PDF in eOffer Upload Documents. Also reference in your Small Business Representation clause." : "Upload as supporting documentation for your 8(a) renewal or new application."
      };
    }

    const placements: Record<string, { portal: string; section: string; instruction: string }> = {
      FINANCIAL_STATEMENT: { portal: isGSA ? "eOffer → Upload Documents" : "certifications.sba.gov → Document Upload", section: "Financial Statements", instruction: "Upload as PDF. GSA requires 2 years of P&L + Balance Sheet." },
      TAX_RETURN: { portal: isGSA ? "eOffer → Upload Documents" : "certifications.sba.gov → Document Upload", section: "Tax Returns", instruction: "Upload complete returns with all schedules." },
      CPARS_REPORT: { portal: isGSA ? "eOffer → Upload Documents → Past Performance" : "Symphony Portal → Past Performance", section: "Past Performance References", instruction: "Each CPARS report counts as one reference. Minimum 3 for GSA MAS, 5 for OASIS+." },
      PPQ_RESPONSE: { portal: isGSA ? "eOffer → Upload Documents → Past Performance" : "certifications.sba.gov → Past Performance", section: "Past Performance References", instruction: "Each completed PPQ counts as one reference." },
      CAPABILITY_STATEMENT: { portal: isGSA ? "eOffer → Upload Documents → Technical Proposal" : "certifications.sba.gov → Entity Information", section: "Corporate Experience", instruction: "Supports your corporate experience narrative." },
      RESUME: { portal: isGSA ? "Not required for GSA MAS" : "certifications.sba.gov → Document Upload", section: "Key Personnel Resumes", instruction: "Upload for each owner and key management personnel." },
      CERTIFICATION_DOCUMENT: { portal: isGSA ? "eOffer → Upload Documents" : "certifications.sba.gov → Document Upload", section: "Certifications & Legal Documents", instruction: "Upload as supporting documentation." },
      INVOICE: { portal: isGSA ? "eOffer → Upload Documents → Price Proposal support" : "Not typically required", section: "Pricing Evidence", instruction: "Supports your commercial pricing claims in the Price Proposal." },
      BANK_STATEMENT: { portal: "certifications.sba.gov → Document Upload", section: "Bank Statements (8(a) only)", instruction: "6 months of consecutive business bank statements." },
      BUSINESS_LICENSE: { portal: isGSA ? "eOffer → Upload Documents" : "certifications.sba.gov → Document Upload", section: "Business Formation Documents", instruction: "Articles of incorporation, business licenses, permits." },
      CONTRACT: { portal: isGSA ? "Supports Past Performance narratives" : "certifications.sba.gov → Past Performance", section: "Contract Evidence", instruction: "Used to verify past performance claims and support SIN narratives." },
      RATE_CARD: { portal: isGSA ? "Supports CSP-1 pricing" : "Not typically required", section: "Pricing Support", instruction: "Your commercial rate card supports MFC pricing claims in the CSP-1." },
    };

    return placements[category] || {
      portal: isGSA ? "eOffer → Upload Documents" : "certifications.sba.gov → Document Upload",
      section: "Supporting Documents",
      instruction: "Upload as a supporting document. The AI classifier will determine the best category."
    };
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const scoreColor = !review ? "var(--ink4)" : (displayScore || 0) >= 80 ? "var(--green)" : (displayScore || 0) >= 60 ? "var(--gold)" : (displayScore || 0) >= 40 ? "#F59E0B" : "var(--red)";
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
                <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--gold-lt)", letterSpacing: ".1em", textTransform: "uppercase" as const }}>GSA Multiple Award Schedule</span>
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#fff", fontWeight: 400, marginBottom: 6 }}>
                GovCert Application Review
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", maxWidth: 500 }}>
                AI-powered analysis of your application against GSA MAS solicitation evaluation criteria and current approval patterns.
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
              GovCert will analyze every section of your GSA MAS application against GSA evaluation standards, identify gaps, score your readiness, and provide specific recommendations to strengthen your application before submission.
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
            <p style={{ fontSize: 13, color: "var(--ink3)" }}>Our AI is reviewing every section against SBA GSA MAS regulatory standards. This may take 15-30 seconds.</p>
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
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 72, color: scoreColor, lineHeight: 1 }}>{displayScore}</div>
              {adjustedScore != null && adjustedScore !== review.overallScore && (
                <div style={{ fontSize: 11, color: "var(--green)", marginTop: 4 }}>+{adjustedScore - review.overallScore} from fixes (was {review.overallScore})</div>
              )}
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
                  {review.criticalIssues.map((issue: string, i: number) => {
                    const key = `critical:${i}`;
                    const isResolved = resolvedIssues[key]?.resolved;
                    return (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, lineHeight: 1.5, padding: "8px 10px", borderRadius: 6, background: isResolved ? "rgba(5,150,105,.06)" : undefined }}>
                        <span style={{ flexShrink: 0 }}>{isResolved ? "✅" : "🚨"}</span>
                        <div style={{ flex: 1, color: isResolved ? "#065F46" : "#991B1B", textDecoration: isResolved ? "line-through" : undefined }}>
                          {issue}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {!isResolved && (
                            <button
                              onClick={() => setGuidedFix({ isOpen: true, issueKey: key, issueText: issue, sectionId: "critical", sectionLabel: "Critical Issue" })}
                              style={{
                                padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const,
                                background: "var(--gold)", color: "#fff", border: "none",
                              }}>
                              Fix with AI →
                            </button>
                          )}
                          <button
                            disabled={resolvingKey === key}
                            onClick={() => resolveIssue(key, !isResolved)}
                            style={{
                              padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const,
                              background: isResolved ? "rgba(200,155,60,.08)" : "var(--green)", color: isResolved ? "var(--gold)" : "#fff",
                              border: isResolved ? "1px solid rgba(200,155,60,.2)" : "none",
                            }}>
                            {resolvingKey === key ? "..." : isResolved ? "Undo" : "Fixed ✓"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                    {section.improvements.map((imp: string, i: number) => {
                      const key = `${section.id}:${i}`;
                      const isResolved = resolvedIssues[key]?.resolved;
                      const impSectionLink = SECTION_LINKS[section.id];
                      return (
                        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 12.5, lineHeight: 1.5, padding: "6px 8px", borderRadius: 5, background: isResolved ? "rgba(5,150,105,.06)" : undefined }}>
                          <span style={{ color: isResolved ? "var(--green)" : "var(--gold)", flexShrink: 0 }}>{isResolved ? "✓" : "→"}</span>
                          <div style={{ flex: 1, color: isResolved ? "#065F46" : "var(--ink2)", textDecoration: isResolved ? "line-through" : undefined }}>{imp}</div>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            {!isResolved && (
                              <button
                                onClick={() => setGuidedFix({ isOpen: true, issueKey: key, issueText: imp, sectionId: section.id, sectionLabel: section.label })}
                                style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer", color: "#fff", background: "var(--gold)", border: "none" }}>
                                Fix with AI →
                              </button>
                            )}
                            <button
                              disabled={resolvingKey === key}
                              onClick={() => resolveIssue(key, !isResolved)}
                              style={{
                                padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer",
                                background: isResolved ? "rgba(200,155,60,.08)" : "var(--green)", color: isResolved ? "var(--gold)" : "#fff",
                                border: isResolved ? "1px solid rgba(200,155,60,.2)" : "none",
                              }}>
                              {resolvingKey === key ? "..." : isResolved ? "Undo" : "Done ✓"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Score bar */}
                <div style={{ height: 4, background: "var(--cream2)", borderRadius: 100, marginTop: 12, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${section.score * 10}%`, background: cfg.color, borderRadius: 100, transition: "width .5s" }} />
                </div>
              </div>
            );
          })}

          {/* ═══ Executive Review ═══ */}
          {cert && <ExecutiveReview cert={cert} certId={certId} />}

          {/* ═══ Cure: Upload Additional Documents ═══ */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", marginTop: 24, marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>
              Upload Additional Documents
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>
              Upload any document to strengthen your application. GovCert will classify it and tell you exactly where it goes in the government portal.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleCureUpload(e.dataTransfer.files); }}
              style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "24px", textAlign: "center" as const, cursor: "pointer", background: "var(--cream)" }}
              onClick={() => { const input = document.createElement("input"); input.type = "file"; input.multiple = true; input.accept = ".pdf,.docx,.xlsx,.csv,.txt"; input.onchange = (e: any) => { if (e.target.files?.length) handleCureUpload(e.target.files); }; input.click(); }}>
              {cureUploading ? (
                <div style={{ fontSize: 14, color: "var(--gold)", fontWeight: 500 }}>Uploading and classifying...</div>
              ) : (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{"\uD83D\uDCC4"}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Drop files here or click to upload</div>
                  <div style={{ fontSize: 12, color: "var(--ink4)" }}>PDF, Word, Excel — any document that supports your application</div>
                </div>
              )}
            </div>

            {/* Upload results — shows where each doc goes */}
            {cureUploadResult && cureUploadResult.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column" as const, gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--green)" }}>
                  {"\u2713"} {cureUploadResult.length} document{cureUploadResult.length !== 1 ? "s" : ""} uploaded and classified
                </div>
                {cureUploadResult.map((r: any, i: number) => (
                  <div key={i} style={{ padding: "14px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)" }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>{r.fileName}</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 4 }}>
                      <strong>Classified as:</strong> {r.category.replace(/_/g, " ")}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 4 }}>
                      <strong>Where it goes:</strong> {r.placement.portal}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 4 }}>
                      <strong>Section:</strong> {r.placement.section}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink3)", fontStyle: "italic", lineHeight: 1.5 }}>
                      {r.placement.instruction}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "var(--ink3)", padding: "8px 0" }}>
                  These documents are now saved in your GovCert file library and will appear in the correct section of your submission page. Re-run the analysis to see how they affect your scores.
                </div>
              </div>
            )}
          </div>

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
              <a href={`/certifications/${certId}/submit`}
                style={{ padding: "10px 24px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                Proceed to Submit →
              </a>
            </div>
          </div>
        </>)}
      </div>

      {/* Guided Fix Panel */}
      <GuidedFixPanel
        isOpen={!!guidedFix?.isOpen}
        onClose={() => setGuidedFix(null)}
        issueKey={guidedFix?.issueKey || ""}
        issueText={guidedFix?.issueText || ""}
        sectionId={guidedFix?.sectionId || ""}
        sectionLabel={guidedFix?.sectionLabel || ""}
        certificationId={certId}
        certType="GSA_MAS"
        onFixed={handleGuidedFixed}
      />
    </div>
  );
}
