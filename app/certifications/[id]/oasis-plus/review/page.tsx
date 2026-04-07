"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import GuidedFixPanel from "@/components/GuidedFixPanel";
import { OASIS_SECTIONS, OASIS_SCORING_CATEGORIES } from "@/lib/oasis-domains";

const SECTION_LINKS: Record<string, string> = {
  "domains": "oasis-plus/domains",
  "domain-selection": "oasis-plus/domains",
  "contract-history": "oasis-plus/scorecard",
  "scorecard": "oasis-plus/scorecard",
  "past-performance": "oasis-plus/past-performance",
  "federal-experience": "oasis-plus/federal-experience",
  "qualifying-projects": "oasis-plus/qualifying-projects",
  "systems-certs": "oasis-plus/systems-certs",
  "systems": "oasis-plus/systems-certs",
  "certifications": "oasis-plus/systems-certs",
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  strong: { color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-b)", label: "Strong" },
  adequate: { color: "#2563EB", bg: "rgba(37,99,235,.06)", border: "rgba(37,99,235,.2)", label: "Adequate" },
  needs_improvement: { color: "var(--gold)", bg: "rgba(200,155,60,.06)", border: "rgba(200,155,60,.2)", label: "Needs Improvement" },
  critical: { color: "var(--red)", bg: "var(--red-bg)", border: "var(--red-b)", label: "Critical" },
  missing: { color: "#6B7280", bg: "var(--cream2)", border: "var(--border)", label: "Missing" },
  pass: { color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-b)", label: "Pass" },
  warning: { color: "#f39c12", bg: "rgba(243,156,18,.06)", border: "rgba(243,156,18,.2)", label: "Needs Attention" },
  fail: { color: "var(--red)", bg: "var(--red-bg)", border: "var(--red-b)", label: "Issue Found" },
};

export default function OASISReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewHistory, setReviewHistory] = useState<{ score: number; date: string }[]>([]);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [resolvedIssues, setResolvedIssues] = useState<Record<string, any>>({});
  const [adjustedScore, setAdjustedScore] = useState<number | null>(null);
  const [resolvingKey, setResolvingKey] = useState<string | null>(null);
  const [guidedFix, setGuidedFix] = useState<{ isOpen: boolean; issueKey: string; issueText: string; sectionId: string; sectionLabel: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-review");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      const app = data.application;
      const completed: Record<string, boolean> = {};
      if (app) {
        if (app.oasisDomains) completed["domains"] = true;
        if (app.oasisScorecardData) completed["scorecard"] = true;
        if (app.oasisQPData) completed["qualifying-projects"] = true;
        if (app.oasisPPData) completed["past-performance"] = true;
        if (app.oasisFEPData) completed["federal-experience"] = true;
        if (app.oasisSystemsData) completed["systems-certs"] = true;
      }
      setCompletedSections(completed);

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
          setReviewResult(parsed);
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
              setReviewResult(p.review);
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
            setReviewResult(p.review);
            setReviewHistory(p.history || []);
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  async function resolveIssue(issueKey: string, resolved: boolean, dismissed?: boolean) {
    if (!reviewId) return;
    setResolvingKey(issueKey);
    try {
      const result = await apiRequest(`/api/applications/ai/reviews/${reviewId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ issueKey, resolved, note: dismissed ? "Dismissed — not applicable" : undefined }),
      });
      // Track dismissed state locally
      if (dismissed) {
        result.resolvedIssues[issueKey] = { ...result.resolvedIssues[issueKey], dismissed: true };
      }
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
      await resolveIssue(issueKey, true);
      setGuidedFix(null);
    } catch (err) {
      console.error("Failed to save section content:", err);
      alert("Failed to save fix — please try again.");
    }
  }

  const displayScore = adjustedScore ?? reviewResult?.overallScore;

  async function runReview() {
    setReviewing(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/review", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert?.clientId,
          certType: "OASIS_PLUS",
        }),
      });
      setReviewResult(data);
    } catch (err: any) {
      setError("Review failed: " + (err.message || "Please try again."));
    } finally {
      setReviewing(false);
    }
  }

  const completedCount = Object.values(completedSections).filter(Boolean).length;
  const totalSections = 6; // domains through systems-certs

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="review" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {OASIS_SECTIONS.map(section => {
            const isActive = section.id === "review";
            const isComplete = completedSections[section.id];
            return (
              <a key={section.id} href={`/certifications/${certId}/oasis-plus/${section.id}`} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: "var(--r)",
                background: isActive ? "rgba(200,155,60,.15)" : "transparent",
                border: isActive ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
                color: isActive ? "var(--gold2)" : isComplete ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)",
                textDecoration: "none", fontSize: 12.5, fontWeight: isActive ? 500 : 400, marginBottom: 1,
              }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: isComplete ? "var(--green)" : "rgba(255,255,255,.08)", border: isComplete ? "none" : "1px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: isComplete ? "#fff" : "rgba(255,255,255,.3)", fontWeight: 600, flexShrink: 0 }}>
                  {isComplete ? "✓" : ""}
                </span>
                {section.label}
              </a>
            );
          })}
        </div>
      } />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application
          </a>

          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              GSA OASIS+ — Step 7 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              GovCert Review
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 680 }}>
              Run the GovCert AI Review to analyze your OASIS+ application for completeness, scoring optimization, and compliance with the RFP requirements.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}

          {/* Completion Summary */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 28, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 4 }}>Application Completeness</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "#fff", fontWeight: 300, lineHeight: 1 }}>
                  {Math.round((completedCount / totalSections) * 100)}<span style={{ fontSize: 24 }}>%</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>{completedCount} of {totalSections} sections complete</div>
              </div>
              <button onClick={runReview} disabled={reviewing} style={{
                padding: "14px 28px",
                background: reviewing ? "rgba(255,255,255,.08)" : "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
                border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: reviewing ? "wait" : "pointer",
                boxShadow: reviewing ? "none" : "0 4px 20px rgba(99,102,241,.4)",
              }}>
                {reviewing ? "Running Review..." : reviewResult ? "Re-Run GovCert Review" : "Run GovCert Review"}
              </button>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(completedCount / totalSections) * 100}%`, background: "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
            </div>
          </div>

          {/* Section Status Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
            {[
              { id: "domains", label: "Domain Selection", href: "domains" },
              { id: "scorecard", label: "Self-Scoring", href: "scorecard" },
              { id: "qualifying-projects", label: "Qualifying Projects", href: "qualifying-projects" },
              { id: "past-performance", label: "Past Performance", href: "past-performance" },
              { id: "federal-experience", label: "Federal Experience", href: "federal-experience" },
              { id: "systems-certs", label: "Systems & Certs", href: "systems-certs" },
            ].map(section => {
              const isComplete = completedSections[section.id];
              return (
                <a key={section.id} href={`/certifications/${certId}/oasis-plus/${section.href}`} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                  background: isComplete ? "var(--green-bg)" : "#fff",
                  border: `1px solid ${isComplete ? "var(--green-b)" : "var(--border)"}`,
                  borderRadius: "var(--r)", textDecoration: "none",
                }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: isComplete ? "var(--green)" : "var(--cream2)", border: isComplete ? "none" : "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: isComplete ? "#fff" : "var(--ink4)", fontWeight: 600 }}>
                    {isComplete ? "✓" : ""}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{section.label}</div>
                    <div style={{ fontSize: 11, color: isComplete ? "var(--green)" : "var(--ink4)" }}>{isComplete ? "Complete" : "Not started"}</div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Review Results */}
          {reviewResult && (() => {
            const scoreColor = (displayScore || 0) >= 80 ? "var(--green)" : (displayScore || 0) >= 60 ? "var(--gold)" : (displayScore || 0) >= 40 ? "#F59E0B" : "var(--red)";
            const verdictColors: Record<string, string> = { STRONG: "var(--green)", COMPETITIVE: "#2563EB", NEEDS_IMPROVEMENT: "var(--gold)", NEEDS_WORK: "var(--gold)", NOT_READY: "var(--red)", ERROR: "var(--red)" };
            return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Disclaimer */}
              <div style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.15)", borderRadius: "var(--rl)", padding: "16px 20px", fontSize: 12, color: "var(--ink3)", lineHeight: 1.7 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                  <div>
                    <strong style={{ color: "var(--navy)" }}>AI-Generated Review — Use Professional Judgment</strong>
                    <div style={{ marginTop: 6 }}>This review is generated by AI and may contain inaccuracies. Some findings may not reflect your actual application status — <strong>use the "Not an issue" button to dismiss any findings that are incorrect.</strong> This review does not constitute legal advice, does not guarantee approval, and cannot predict agency decisions. GovCert is not affiliated with the SBA or GSA. Always consult a government contracting attorney or certified consultant before submitting your application.</div>
                  </div>
                </div>
              </div>

              {/* Overall Score + Verdict */}
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
                <div style={{ background: "#fff", border: `3px solid ${scoreColor}`, borderRadius: "var(--rl)", padding: "28px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--ink4)", marginBottom: 8 }}>Overall Score</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 72, color: scoreColor, lineHeight: 1 }}>{displayScore}</div>
                  {adjustedScore != null && adjustedScore !== reviewResult.overallScore && (
                    <div style={{ fontSize: 11, color: "var(--green)", marginTop: 4 }}>+{adjustedScore - reviewResult.overallScore} from fixes (was {reviewResult.overallScore})</div>
                  )}
                  <div style={{ fontSize: 14, color: scoreColor, fontWeight: 600, marginTop: 4 }}>/100</div>
                  <div style={{ marginTop: 12, padding: "6px 16px", background: `${verdictColors[reviewResult.readinessLevel] || "var(--ink4)"}15`, border: `1px solid ${verdictColors[reviewResult.readinessLevel] || "var(--ink4)"}30`, borderRadius: 100, display: "inline-block", fontSize: 12, fontWeight: 600, color: verdictColors[reviewResult.readinessLevel] || "var(--ink4)" }}>
                    {(reviewResult.readinessLevel || reviewResult.overallVerdict || "").replace(/_/g, " ")}
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
                  {reviewResult.criticalIssues?.length > 0 && (
                    <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--rl)", padding: "18px 22px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red)", textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Critical Issues — Must Fix</div>
                        <div style={{ fontSize: 10, color: "var(--ink4)", fontStyle: "italic" }}>AI-identified — dismiss if inaccurate</div>
                      </div>
                      {reviewResult.criticalIssues.map((issue: string, i: number) => {
                        const key = `critical:${i}`;
                        const isResolved = resolvedIssues[key]?.resolved;
                        return (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, lineHeight: 1.5, padding: "8px 10px", borderRadius: 6, background: isResolved ? (resolvedIssues[key]?.dismissed ? "rgba(150,150,150,.06)" : "rgba(5,150,105,.06)") : undefined }}>
                            <span style={{ flexShrink: 0 }}>{isResolved ? (resolvedIssues[key]?.dismissed ? "➖" : "✅") : "🚨"}</span>
                            <div style={{ flex: 1, color: isResolved ? (resolvedIssues[key]?.dismissed ? "#888" : "#065F46") : "#991B1B", textDecoration: isResolved ? "line-through" : undefined }}>
                              {issue}
                              {resolvedIssues[key]?.dismissed && <span style={{ fontStyle: "italic", marginLeft: 6 }}>(dismissed — not applicable)</span>}
                            </div>
                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                              {!isResolved && (
                                <>
                                  <button
                                    onClick={() => setGuidedFix({ isOpen: true, issueKey: key, issueText: issue, sectionId: "critical", sectionLabel: "Critical Issue" })}
                                    style={{
                                      padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const,
                                      background: "var(--gold)", color: "#fff", border: "none",
                                    }}>
                                    Fix with AI →
                                  </button>
                                  <button
                                    disabled={resolvingKey === key}
                                    onClick={() => resolveIssue(key, true, true)}
                                    style={{
                                      padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" as const,
                                      background: "transparent", color: "#999", border: "1px solid #ddd",
                                    }}>
                                    Not an issue
                                  </button>
                                </>
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
                  {reviewResult.strengths?.length > 0 && (
                    <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--rl)", padding: "18px 22px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Application Strengths</div>
                      {reviewResult.strengths.map((s: string, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 13, color: "#065F46", lineHeight: 1.5 }}>
                          <span style={{ flexShrink: 0 }}>✅</span> {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section-by-Section Analysis */}
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: -6 }}>Section-by-Section Analysis</div>

              {(reviewResult.sections || []).map((section: any) => {
                const sectionId = section.id || section.href || "";
                const cfg = STATUS_CONFIG[section.status] || STATUS_CONFIG.missing;
                const sectionLink = SECTION_LINKS[sectionId] || (section.href ? `oasis-plus/${section.href}` : undefined);
                return (
                  <div key={sectionId || section.name} style={{ background: "#fff", border: `1px solid ${cfg.border}`, borderLeft: `4px solid ${cfg.color}`, borderRadius: "var(--rl)", padding: "22px 26px", boxShadow: "var(--shadow)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--navy)" }}>{section.label || section.name}</span>
                          <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {cfg.label}
                          </span>
                        </div>
                        {section.regulatoryBasis && (
                          <div style={{ fontSize: 11, color: "var(--ink4)", fontStyle: "italic", lineHeight: 1.5 }}>{section.regulatoryBasis}</div>
                        )}
                        {section.analysis && (
                          <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6, marginTop: 4 }}>{section.analysis}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {section.score !== undefined && (
                          <div style={{ textAlign: "center" as const }}>
                            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: cfg.color, lineHeight: 1 }}>{section.score}</div>
                            <div style={{ fontSize: 10, color: "var(--ink4)" }}>/10</div>
                          </div>
                        )}
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

                    {/* Improvements / Recommendations */}
                    {((section.improvements && section.improvements.length > 0) || (section.recommendations && section.recommendations.length > 0)) && (
                      <div style={{ background: "rgba(200,155,60,.04)", border: "1px solid rgba(200,155,60,.12)", borderRadius: "var(--r)", padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)", marginBottom: 4 }}>How to Improve:</div>
                        {(section.improvements || section.recommendations || []).map((imp: string, i: number) => {
                          const key = `${sectionId}:${i}`;
                          const isResolved = resolvedIssues[key]?.resolved;
                          return (
                            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 12.5, lineHeight: 1.5, padding: "6px 8px", borderRadius: 5, background: isResolved ? (resolvedIssues[key]?.dismissed ? "rgba(150,150,150,.06)" : "rgba(5,150,105,.06)") : undefined }}>
                              <span style={{ color: isResolved ? (resolvedIssues[key]?.dismissed ? "#888" : "var(--green)") : "var(--gold)", flexShrink: 0 }}>{isResolved ? (resolvedIssues[key]?.dismissed ? "➖" : "✓") : "→"}</span>
                              <div style={{ flex: 1, color: isResolved ? (resolvedIssues[key]?.dismissed ? "#888" : "#065F46") : "var(--ink2)", textDecoration: isResolved ? "line-through" : undefined }}>
                                {imp}
                                {resolvedIssues[key]?.dismissed && <span style={{ fontStyle: "italic", marginLeft: 6 }}>(dismissed — not applicable)</span>}
                              </div>
                              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                {!isResolved && (
                                  <>
                                    <button
                                      onClick={() => setGuidedFix({ isOpen: true, issueKey: key, issueText: imp, sectionId: sectionId, sectionLabel: section.label || section.name })}
                                      style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer", color: "#fff", background: "var(--gold)", border: "none" }}>
                                      Fix with AI →
                                    </button>
                                    <button
                                      disabled={resolvingKey === key}
                                      onClick={() => resolveIssue(key, true, true)}
                                      style={{
                                        padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, cursor: "pointer",
                                        background: "transparent", color: "#999", border: "1px solid #ddd",
                                      }}>
                                      Not an issue
                                    </button>
                                  </>
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
                    {section.score !== undefined && (
                      <div style={{ height: 4, background: "var(--cream2)", borderRadius: 100, marginTop: 12, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${section.score * 10}%`, background: cfg.color, borderRadius: 100, transition: "width .5s" }} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Scoring Gap Analysis */}
              {reviewResult.scoringGaps && Array.isArray(reviewResult.scoringGaps) && reviewResult.scoringGaps.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", boxShadow: "var(--shadow)" }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 12 }}>Scoring Gap Analysis</div>
                  {reviewResult.scoringGaps.map((gap: any, idx: number) => (
                    <div key={idx} style={{ padding: "12px 0", borderBottom: idx < reviewResult.scoringGaps.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{gap.category}</span>
                        <span style={{ fontSize: 12, color: gap.gap > 0 ? "#e74c3c" : "var(--green)", fontWeight: 600 }}>
                          {gap.gap > 0 ? `${gap.gap} credits short` : "On target"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink3)" }}>{gap.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Raw text review fallback */}
              {reviewResult.review && !reviewResult.sections && (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", boxShadow: "var(--shadow)" }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 12 }}>Review Analysis</div>
                  <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{reviewResult.review}</div>
                </div>
              )}
            </div>
            );
          })()}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}/oasis-plus/systems-certs`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              ← Systems & Certs
            </a>
            <a href={`/certifications/${certId}/oasis-plus/submit`} style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
              border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(200,155,60,.3)",
            }}>
              Proceed to Submit →
            </a>
          </div>
        </div>
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
        certType="OASIS_PLUS"
        onFixed={handleGuidedFixed}
      />
    </div>
  );
}
