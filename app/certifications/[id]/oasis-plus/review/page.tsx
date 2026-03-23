"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_SECTIONS, OASIS_SCORING_CATEGORIES } from "@/lib/oasis-domains";

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
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

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
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

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
          {reviewResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Overall Score */}
              {reviewResult.overallScore !== undefined && (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>GovCert Review Score</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 64, color: reviewResult.overallScore >= 80 ? "var(--green)" : reviewResult.overallScore >= 60 ? "var(--gold)" : "#e74c3c", fontWeight: 400, lineHeight: 1 }}>
                    {reviewResult.overallScore}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--ink3)", marginTop: 8 }}>{reviewResult.overallAssessment || "Review complete"}</div>
                </div>
              )}

              {/* Section Analysis */}
              {reviewResult.sections && Array.isArray(reviewResult.sections) && reviewResult.sections.map((section: any, idx: number) => (
                <div key={idx} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>{section.name}</div>
                    <span style={{
                      padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: section.status === "pass" ? "var(--green-bg)" : section.status === "warning" ? "rgba(243,156,18,.1)" : "rgba(231,76,60,.08)",
                      color: section.status === "pass" ? "var(--green)" : section.status === "warning" ? "#f39c12" : "#e74c3c",
                    }}>
                      {section.status === "pass" ? "Pass" : section.status === "warning" ? "Needs Attention" : "Issue Found"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 12 }}>{section.analysis}</div>
                  {section.recommendations && section.recommendations.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 6 }}>Recommendations:</div>
                      {section.recommendations.map((rec: string, rIdx: number) => (
                        <div key={rIdx} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                          <span style={{ color: "var(--gold)", fontSize: 11, marginTop: 2 }}>-</span>
                          <span style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.href && (
                    <a href={`/certifications/${certId}/oasis-plus/${section.href}`} style={{ display: "inline-block", marginTop: 10, fontSize: 12, color: "var(--gold)", fontWeight: 500, textDecoration: "none" }}>
                      Go to Section →
                    </a>
                  )}
                </div>
              ))}

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
          )}

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
    </div>
  );
}
