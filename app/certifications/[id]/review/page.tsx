"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import ExecutiveReview from "@/components/ExecutiveReview";
import GuidedFixPanel from "@/components/GuidedFixPanel";

/* ── v1 helpers ── */
const SECTION_LINKS: Record<string, string> = {
  "corporate-experience": "corporate",
  corporate: "corporate",
  experience: "corporate",
  "quality-control": "qcp",
  qcp: "qcp",
  "past-performance": "past-performance",
  "project-experience": "past-performance",
  pricing: "pricing",
  "company-info": "submit",
  financials: "financials",
};

const STATUS_CONFIG_V1: Record<string, { color: string; bg: string; border: string; label: string }> = {
  strong: { color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-b)", label: "Strong" },
  adequate: { color: "#2563EB", bg: "rgba(37,99,235,.06)", border: "rgba(37,99,235,.2)", label: "Adequate" },
  needs_improvement: { color: "var(--gold)", bg: "rgba(200,155,60,.06)", border: "rgba(200,155,60,.2)", label: "Needs Improvement" },
  critical: { color: "var(--red)", bg: "var(--red-bg)", border: "var(--red-b)", label: "Critical" },
  missing: { color: "#6B7280", bg: "var(--cream2)", border: "var(--border)", label: "Missing" },
};

/* ── v2 constants ── */
const ITEM_STATUS_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  filled: { color: "#059669", bg: "rgba(5,150,105,.06)", border: "rgba(5,150,105,.2)", label: "Filled" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,.06)", border: "rgba(217,119,6,.2)", label: "Partial" },
  empty: { color: "#DC2626", bg: "rgba(220,38,38,.06)", border: "rgba(220,38,38,.2)", label: "Empty" },
  exempt: { color: "#6B7280", bg: "rgba(107,114,128,.06)", border: "rgba(107,114,128,.2)", label: "Exempt" },
  ambiguous: { color: "#C89B3C", bg: "rgba(200,155,60,.06)", border: "rgba(200,155,60,.2)", label: "Ambiguous" },
  unverifiable: { color: "#2563EB", bg: "rgba(37,99,235,.06)", border: "rgba(37,99,235,.2)", label: "Unverifiable" },
};

const SEVERITY_COLORS: Record<string, { color: string; bg: string }> = {
  critical: { color: "#DC2626", bg: "rgba(220,38,38,.08)" },
  high: { color: "#D97706", bg: "rgba(217,119,6,.08)" },
  medium: { color: "#C89B3C", bg: "rgba(200,155,60,.08)" },
  low: { color: "#6B7280", bg: "rgba(107,114,128,.08)" },
  observation: { color: "#2563EB", bg: "rgba(37,99,235,.08)" },
};

const READINESS_BADGE: Record<string, { color: string; bg: string; label: string }> = {
  submission_ready: { color: "#fff", bg: "#059669", label: "Submission Ready" },
  minor_edits_needed: { color: "#fff", bg: "#C89B3C", label: "Minor Edits Needed" },
  substantive_edits_needed: { color: "#fff", bg: "#D97706", label: "Substantive Edits Needed" },
  not_ready: { color: "#fff", bg: "#DC2626", label: "Not Ready" },
};

const REMEDIATION_LABELS: Record<string, string> = {
  edit_submission: "Edit Submission",
  prepare_backup: "Prepare Backup",
  both: "Edit + Backup",
};

const CRB_SECTION_LABELS: Record<string, string> = {
  sinScopeDefense: "SIN Scope Defense",
  pricingRationaleDefense: "Pricing Rationale Defense",
  mfcBasisOfAwardDefense: "MFC / Basis of Award Defense",
  pastPerformanceSubstantiation: "Past Performance Substantiation",
  lcatSubstitutionRationale: "LCAT Substitution Rationale",
  financialResponsibility: "Financial Responsibility",
};

/* ── Helpers ── */
function isV2(sections: any): boolean {
  return sections && typeof sections === "object" && !Array.isArray(sections) && !!sections.submissionPackageEvaluation;
}

/* ──────────────────────────────────────────────── */
export default function GSAMASReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [rawSections, setRawSections] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewHistory, setReviewHistory] = useState<{ score: number; date: string }[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [resolvedIssues, setResolvedIssues] = useState<Record<string, any>>({});
  const [adjustedScore, setAdjustedScore] = useState<number | null>(null);
  const [resolvingKey, setResolvingKey] = useState<string | null>(null);
  const [guidedFix, setGuidedFix] = useState<{ isOpen: boolean; issueKey: string; issueText: string; sectionId: string; sectionLabel: string } | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [expandedCRB, setExpandedCRB] = useState(false);
  const [expandedCRBSections, setExpandedCRBSections] = useState<Set<string>>(new Set());
  const [cureUploading, setCureUploading] = useState(false);
  const [cureUploadResult, setCureUploadResult] = useState<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

  const toggleSet = useCallback((setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  /* ── Auth + Load ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCert();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function parseReviewRecord(latest: any) {
    const sectionsRaw = JSON.parse(latest.sectionsJson || "[]");
    setRawSections(sectionsRaw);
    if (isV2(sectionsRaw)) {
      setReview({
        version: "v2",
        ...sectionsRaw,
        overallScore: latest.overallScore,
        disclaimer: latest.disclaimer,
      });
    } else {
      setReview({
        version: "v1",
        overallScore: latest.overallScore,
        overallVerdict: latest.overallVerdict,
        readinessLevel: latest.readinessLevel,
        sections: sectionsRaw,
        criticalIssues: latest.criticalIssues ? JSON.parse(latest.criticalIssues) : [],
        strengths: latest.strengths ? JSON.parse(latest.strengths) : [],
        disclaimer: latest.disclaimer,
      });
    }
    setReviewId(latest.id);
    try {
      const ri = JSON.parse(latest.resolvedIssues || "{}");
      setResolvedIssues(ri);
      if (latest.adjustedScore != null) setAdjustedScore(latest.adjustedScore);
    } catch {}
  }

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      try {
        const savedReviews = await apiRequest(`/api/applications/ai/reviews/${certId}`);
        if (savedReviews && savedReviews.length > 0) {
          const latest = savedReviews[0];
          parseReviewRecord(latest);
          setReviewHistory(savedReviews.map((r: any) => ({ score: r.adjustedScore || r.overallScore, date: r.createdAt })));
        } else {
          const stored = localStorage.getItem(`govcert-review-${certId}`);
          if (stored) {
            try {
              const p = JSON.parse(stored);
              setReview({ version: "v1", ...p.review });
              setReviewHistory(p.history || []);
            } catch {}
          }
        }
      } catch {
        const stored = localStorage.getItem(`govcert-review-${certId}`);
        if (stored) {
          try {
            const p = JSON.parse(stored);
            setReview({ version: "v1", ...p.review });
            setReviewHistory(p.history || []);
          } catch {}
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  /* ── Resolve / Fix ── */
  async function resolveIssue(issueKey: string, resolved: boolean, dismissed?: boolean) {
    if (!reviewId) return;
    setResolvingKey(issueKey);
    try {
      const result = await apiRequest(`/api/applications/ai/reviews/${reviewId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ issueKey, resolved, note: dismissed ? "Dismissed — not applicable" : undefined }),
      });
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
      if (newContent) {
        await apiRequest(`/api/applications/${certId}/sections/${sectionId}`, {
          method: "PUT",
          body: JSON.stringify({
            content: newContent,
            findingSummary: guidedFix?.issueText?.substring(0, 200),
            findingId: guidedFix?.issueKey,
          }),
        });
      }
      await resolveIssue(issueKey, true);
      setGuidedFix(null);
    } catch (err) {
      console.error("Failed to save section content:", err);
      alert("Failed to save fix — please try again.");
    }
  }

  /* ── Run Review (v2 poll-based) ── */
  async function runReview() {
    setAnalyzing(true);
    setError(null);
    try {
      await apiRequest("/api/applications/ai/review", {
        method: "POST",
        body: JSON.stringify({ certificationId: certId, clientId: cert?.clientId, certType: "GSA_MAS" }),
      });
      // Start polling for completed review
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const savedReviews = await apiRequest(`/api/applications/ai/reviews/${certId}`);
          if (savedReviews && savedReviews.length > 0) {
            const latest = savedReviews[0];
            if (latest.status === "completed") {
              if (pollRef.current) clearInterval(pollRef.current);
              parseReviewRecord(latest);
              setReviewHistory(savedReviews.map((r: any) => ({ score: r.adjustedScore || r.overallScore, date: r.createdAt })));
              setAnalyzing(false);
            }
          }
        } catch {}
      }, 10000);
      // Safety timeout: stop polling after 10 minutes
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          setAnalyzing(false);
          setError("Review is taking longer than expected. Please check back shortly.");
        }
      }, 600000);
    } catch (err: any) {
      setError("Review failed: " + (err.message || "Please try again."));
      setAnalyzing(false);
    }
  }

  /* ── Document upload (cure) ── */
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
    if (name.includes("8(a)") || name.includes("8a") || name.includes("sba cert")) {
      return {
        portal: isGSA ? "eOffer — Solicitation Clauses — Small Business Representation" : "certifications.sba.gov — Document Upload",
        section: isGSA ? "Upload Documents — proves 8(a) certification status" : "Supporting certification documentation",
        instruction: isGSA ? "Upload as PDF in eOffer Upload Documents." : "Upload as supporting documentation.",
      };
    }
    const placements: Record<string, { portal: string; section: string; instruction: string }> = {
      FINANCIAL_STATEMENT: { portal: "eOffer — Upload Documents", section: "Financial Statements", instruction: "Upload as PDF. GSA requires 2 years of P&L + Balance Sheet." },
      TAX_RETURN: { portal: "eOffer — Upload Documents", section: "Tax Returns", instruction: "Upload complete returns with all schedules." },
      CPARS_REPORT: { portal: "eOffer — Upload Documents — Past Performance", section: "Past Performance References", instruction: "Each CPARS report counts as one reference." },
      PPQ_RESPONSE: { portal: "eOffer — Upload Documents — Past Performance", section: "Past Performance References", instruction: "Each completed PPQ counts as one reference." },
      CAPABILITY_STATEMENT: { portal: "eOffer — Upload Documents — Technical Proposal", section: "Corporate Experience", instruction: "Supports your corporate experience narrative." },
      CERTIFICATION_DOCUMENT: { portal: "eOffer — Upload Documents", section: "Certifications & Legal Documents", instruction: "Upload as supporting documentation." },
      INVOICE: { portal: "eOffer — Upload Documents — Price Proposal support", section: "Pricing Evidence", instruction: "Supports your commercial pricing claims." },
      RATE_CARD: { portal: "Supports CSP-1 pricing", section: "Pricing Support", instruction: "Your commercial rate card supports MFC pricing claims." },
      CONTRACT: { portal: "Supports Past Performance narratives", section: "Contract Evidence", instruction: "Used to verify past performance claims." },
    };
    return placements[category] || { portal: "eOffer — Upload Documents", section: "Supporting Documents", instruction: "Upload as a supporting document." };
  }

  /* ── Loading state ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  /* ── Derived ── */
  const v2 = review?.version === "v2";
  const spe = v2 ? review.submissionPackageEvaluation : null;
  const readiness = spe?.overallReadiness;
  const badge = readiness ? READINESS_BADGE[readiness.readinessLevel] || READINESS_BADGE.not_ready : null;
  const displayScore = adjustedScore ?? review?.overallScore;

  // v1 colors
  const scoreColor = !review ? "var(--ink4)" : (displayScore || 0) >= 80 ? "var(--green)" : (displayScore || 0) >= 60 ? "var(--gold)" : (displayScore || 0) >= 40 ? "#F59E0B" : "var(--red)";
  const verdictColors: Record<string, string> = { STRONG: "var(--green)", COMPETITIVE: "#2563EB", NEEDS_IMPROVEMENT: "var(--gold)", NEEDS_WORK: "var(--gold)", NOT_READY: "var(--red)", ERROR: "var(--red)" };

  /* ── Action buttons for a finding ── */
  function renderFindingActions(key: string, findingText: string, sectionId: string, sectionLabel: string) {
    const isResolved = resolvedIssues[key]?.resolved;
    return (
      <div style={{ display: "flex", gap: 4, flexShrink: 0, marginTop: 6 }}>
        {!isResolved && (
          <>
            <button
              onClick={() => setGuidedFix({ isOpen: true, issueKey: key, issueText: findingText, sectionId, sectionLabel })}
              style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, background: "var(--gold)", color: "#fff", border: "none" }}>
              Fix with AI
            </button>
            <button
              onClick={() => { /* manual fix = just go to section */ }}
              style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" as const, background: "transparent", color: "var(--ink3)", border: "1px solid var(--border)" }}>
              Fix manually
            </button>
            <button
              disabled={resolvingKey === key}
              onClick={() => resolveIssue(key, true, true)}
              style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" as const, background: "transparent", color: "#999", border: "1px solid #ddd" }}>
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
          {resolvingKey === key ? "..." : isResolved ? "Undo" : "Fixed"}
        </button>
      </div>
    );
  }

  /* ════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {/* ── Header ── */}
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
              {analyzing ? "Analyzing..." : review ? "Re-Run Analysis" : "Run GovCert Review"}
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

        {/* ── No review yet ── */}
        {!review && !analyzing && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "48px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 12 }}>Ready for your application review?</h2>
            <p style={{ fontSize: 14, color: "var(--ink3)", maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6 }}>
              GovCert will analyze every section of your GSA MAS application against GSA evaluation standards, identify gaps, score your readiness, and provide specific recommendations.
            </p>
            <button onClick={runReview}
              style={{ padding: "14px 40px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 16, fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 24px rgba(200,155,60,.4)" }}>
              Start Review
            </button>
          </div>
        )}

        {/* ── Analyzing / Polling spinner ── */}
        {analyzing && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "48px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
            <style>{`@keyframes gcSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes gcPulse { 0%,100% { opacity:.4 } 50% { opacity:1 } }`}</style>
            <div style={{ width: 56, height: 56, margin: "0 auto 20px", border: "4px solid var(--border)", borderTop: "4px solid var(--gold)", borderRadius: "50%", animation: "gcSpin 1s linear infinite" }} />
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Your review is being generated...</h2>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 4 }}>Our AI is performing a deep analysis of your entire submission package.</p>
            <p style={{ fontSize: 12, color: "var(--ink4)", animation: "gcPulse 2s ease-in-out infinite" }}>This typically takes 5-7 minutes. This page will update automatically.</p>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* ── V2 REVIEW RESULTS ── */}
        {/* ════════════════════════════════════════ */}
        {review && !analyzing && v2 && spe && readiness && (<>
          {/* Disclaimer */}
          <div style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.15)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 24, fontSize: 12, color: "var(--ink3)", lineHeight: 1.7 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>&#9888;&#65039;</span>
              <div>
                <strong style={{ color: "var(--navy)" }}>AI-Generated Review — Use Professional Judgment</strong>
                <div style={{ marginTop: 6 }}>This review is generated by AI and may contain inaccuracies. Use the "Not an issue" button to dismiss incorrect findings. This does not constitute legal advice and does not guarantee approval. GovCert is not affiliated with the SBA or GSA.</div>
              </div>
            </div>
          </div>

          {/* ── Readiness Badge + Stat Cards ── */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px 32px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
              {badge && (
                <div style={{ padding: "10px 28px", borderRadius: 8, fontSize: 20, fontWeight: 700, color: badge.color, background: badge.bg, letterSpacing: ".02em" }}>
                  {badge.label}
                </div>
              )}
              {displayScore != null && (
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: badge?.bg || "var(--ink4)", lineHeight: 1 }}>
                  {displayScore}<span style={{ fontSize: 18, color: "var(--ink4)" }}>/100</span>
                </div>
              )}
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Blocking Issues", value: readiness.blockingIssues, color: "#DC2626" },
                { label: "High Severity", value: readiness.highSeverityFindings, color: "#D97706" },
                { label: "Inevitable Clarifications", value: readiness.inevitableClarifications, color: "#C89B3C" },
                { label: "Contractual Flags", value: readiness.contractualCommitmentsFlagged, color: "#2563EB" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" as const, padding: "14px 8px", background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: 8 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: s.color, lineHeight: 1 }}>{s.value ?? 0}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: s.color, textTransform: "uppercase" as const, letterSpacing: ".06em", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {readiness.summary && (
              <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.7, padding: "12px 16px", background: "var(--cream)", borderRadius: 8, border: "1px solid var(--border)" }}>
                {readiness.summary}
              </div>
            )}
          </div>

          {/* ── Submission Package Items ── */}
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 14 }}>
            Submission Package Evaluation
          </div>

          {(spe.items || []).map((item: any) => {
            const sc = ITEM_STATUS_COLORS[item.status] || ITEM_STATUS_COLORS.empty;
            const isExpanded = expandedItems.has(item.stepId);
            const findingCount = item.findings?.length || 0;
            return (
              <div key={item.stepId} style={{ background: "#fff", border: `1px solid ${sc.border}`, borderLeft: `4px solid ${sc.color}`, borderRadius: "var(--rl)", marginBottom: 12, boxShadow: "var(--shadow)", overflow: "hidden" }}>
                {/* Card header */}
                <div
                  onClick={() => toggleSet(setExpandedItems, item.stepId)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", cursor: "pointer", userSelect: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{item.label}</span>
                    <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {sc.label}
                    </span>
                    {findingCount > 0 && (
                      <span style={{ fontSize: 11, color: "var(--ink4)" }}>
                        {findingCount} finding{findingCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 18, color: "var(--ink4)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>&#9660;</span>
                </div>

                {/* Expanded findings */}
                {isExpanded && item.findings?.length > 0 && (
                  <div style={{ padding: "0 22px 18px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
                    {item.findings.map((f: any) => {
                      const sev = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.medium;
                      const key = `${item.stepId}:${f.id}`;
                      const isResolved = resolvedIssues[key]?.resolved;
                      const isDetailOpen = expandedFindings.has(key);
                      return (
                        <div key={f.id} style={{ padding: "14px 16px", borderRadius: 8, background: isResolved ? "rgba(5,150,105,.04)" : sev.bg, border: `1px solid ${isResolved ? "rgba(5,150,105,.2)" : sev.color}20` }}>
                          {/* Severity + summary row */}
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#fff", background: sev.color, textTransform: "uppercase" as const, flexShrink: 0 }}>
                              {f.severity}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: isResolved ? "#065F46" : "var(--navy)", textDecoration: isResolved ? "line-through" : undefined }}>{f.summary}</div>
                            </div>
                            {f.remediationType && (
                              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, color: "var(--ink3)", background: "var(--cream2)", border: "1px solid var(--border)", flexShrink: 0 }}>
                                {REMEDIATION_LABELS[f.remediationType] || f.remediationType}
                              </span>
                            )}
                          </div>

                          {/* Detail toggle */}
                          <div
                            onClick={() => toggleSet(setExpandedFindings, key)}
                            style={{ fontSize: 11, color: "var(--gold)", cursor: "pointer", marginTop: 8, fontWeight: 500 }}>
                            {isDetailOpen ? "Hide details" : "Show details"}
                          </div>

                          {isDetailOpen && (
                            <div style={{ marginTop: 8 }}>
                              {f.detail && <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6, marginBottom: 10 }}>{f.detail}</div>}

                              {/* CO Likely Ask */}
                              {f.coLikelyAsk && (
                                <div style={{ padding: "12px 14px", borderRadius: 6, background: "#0B1929", marginBottom: 10 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 4 }}>
                                    Contracting Officer Will Likely Ask
                                  </div>
                                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.85)", lineHeight: 1.6, fontStyle: "italic" }}>
                                    &ldquo;{f.coLikelyAsk}&rdquo;
                                  </div>
                                </div>
                              )}

                              {/* Backup Artifacts checklist */}
                              {f.backupArtifacts?.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 4 }}>Backup Artifacts Needed</div>
                                  {f.backupArtifacts.map((artifact: string, ai: number) => (
                                    <div key={ai} style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink2)", lineHeight: 1.5, marginBottom: 2 }}>
                                      <span style={{ color: "var(--ink4)" }}>&#9744;</span> {artifact}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {f.sourceRef && (
                                <div style={{ fontSize: 11, color: "var(--ink4)", fontStyle: "italic" }}>Source: {f.sourceRef}</div>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          {renderFindingActions(key, f.summary, item.stepId, item.label)}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isExpanded && (!item.findings || item.findings.length === 0) && (
                  <div style={{ padding: "0 22px 18px", fontSize: 13, color: "var(--green)" }}>
                    No findings for this item.
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Clarification Readiness Brief ── */}
          {spe.clarificationReadinessBrief && (
            <div style={{ marginTop: 28, marginBottom: 24 }}>
              <div
                onClick={() => setExpandedCRB(!expandedCRB)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", background: "#0B1929", borderRadius: expandedCRB ? "var(--rl) var(--rl) 0 0" : "var(--rl)", cursor: "pointer", userSelect: "none" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", fontFamily: "'Cormorant Garamond', serif" }}>
                    Clarification Readiness Brief
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 2 }}>Your Defense Playbook</div>
                </div>
                <span style={{ fontSize: 18, color: "var(--gold)", transform: expandedCRB ? "rotate(180deg)" : "none", transition: "transform .2s" }}>&#9660;</span>
              </div>

              {expandedCRB && (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 var(--rl) var(--rl)", padding: "20px 24px" }}>
                  <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 16 }}>
                    This brief prepares you for the most common Contracting Officer clarification requests. Each section below covers a defense area with narrative context and per-item breakdowns.
                  </p>

                  {Object.entries(CRB_SECTION_LABELS).map(([key, label]) => {
                    const section = (spe.clarificationReadinessBrief as any)?.[key];
                    if (!section) return null;
                    const isOpen = expandedCRBSections.has(key);
                    return (
                      <div key={key} style={{ marginBottom: 10, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                        <div
                          onClick={() => toggleSet(setExpandedCRBSections, key)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "var(--cream)", cursor: "pointer", userSelect: "none" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{label}</span>
                          <span style={{ fontSize: 14, color: "var(--ink4)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>&#9660;</span>
                        </div>
                        {isOpen && (
                          <div style={{ padding: "16px 18px" }}>
                            {section.narrative && (
                              <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.7, marginBottom: 12, padding: "12px 14px", background: "rgba(200,155,60,.04)", border: "1px solid rgba(200,155,60,.12)", borderRadius: 6 }}>
                                {section.narrative}
                              </div>
                            )}
                            {section.items && section.items.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                                {section.items.map((item: any, idx: number) => (
                                  <div key={idx} style={{ padding: "10px 14px", background: "var(--cream)", borderRadius: 6, border: "1px solid var(--border)" }}>
                                    {item.label && <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>{item.label}</div>}
                                    {item.detail && <div style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.5 }}>{item.detail}</div>}
                                    {item.narrative && <div style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.5 }}>{item.narrative}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* If breakdowns are key-value pairs instead of items array */}
                            {!section.items && typeof section === "object" && Object.entries(section).filter(([k]) => k !== "narrative").map(([k, v]: [string, any]) => {
                              if (typeof v === "string") {
                                return (
                                  <div key={k} style={{ padding: "10px 14px", background: "var(--cream)", borderRadius: 6, border: "1px solid var(--border)", marginBottom: 6 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 2 }}>{k.replace(/([A-Z])/g, " $1").trim()}</div>
                                    <div style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.5 }}>{v}</div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Executive Review ── */}
          {cert && <ExecutiveReview cert={cert} certId={certId} />}

          {/* ── Upload Additional Documents ── */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", marginTop: 24, marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Upload Additional Documents</h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>Upload any document to strengthen your application. GovCert will classify it and tell you exactly where it goes.</p>
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
                  <div style={{ fontSize: 12, color: "var(--ink4)" }}>PDF, Word, Excel — any supporting document</div>
                </div>
              )}
            </div>
            {cureUploadResult && cureUploadResult.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column" as const, gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--green)" }}>
                  {cureUploadResult.length} document{cureUploadResult.length !== 1 ? "s" : ""} uploaded and classified
                </div>
                {cureUploadResult.map((r: any, i: number) => (
                  <div key={i} style={{ padding: "14px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)" }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>{r.fileName}</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 4 }}><strong>Classified as:</strong> {r.category.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 4 }}><strong>Where it goes:</strong> {r.placement.portal}</div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 4 }}><strong>Section:</strong> {r.placement.section}</div>
                    <div style={{ fontSize: 11, color: "var(--ink3)", fontStyle: "italic", lineHeight: 1.5 }}>{r.placement.instruction}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Bottom actions ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, padding: "20px 24px", background: "var(--navy)", borderRadius: "var(--rl)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Made improvements?</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Re-run the analysis to see your updated readiness.</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {reviewId && (
                <a href={`${API_URL}/api/applications/ai/reviews/${reviewId}/docx`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ padding: "10px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, textDecoration: "none" }}>
                  Download Full Review (DOCX)
                </a>
              )}
              <button onClick={runReview} disabled={analyzing}
                style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Re-Run Review
              </button>
              <a href={`/certifications/${certId}/submit`}
                style={{ padding: "10px 24px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                Proceed to Submit
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ marginTop: 20, padding: "12px 16px", background: "var(--cream2)", borderRadius: "var(--r)", fontSize: 11, color: "var(--ink4)", lineHeight: 1.6 }}>
            <strong>Disclaimer:</strong> This AI-generated review does not constitute legal advice, does not guarantee contract award, and cannot predict Contracting Officer decisions. GovCert is not affiliated with the GSA, SBA, or any federal agency. Always consult a government contracting professional before submission.
          </div>
        </>)}

        {/* ════════════════════════════════════════ */}
        {/* ── V1 REVIEW RESULTS (backward compat) ── */}
        {/* ════════════════════════════════════════ */}
        {review && !analyzing && !v2 && (<>
          {/* Disclaimer */}
          <div style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.15)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 24, fontSize: 12, color: "var(--ink3)", lineHeight: 1.7 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>&#9888;&#65039;</span>
              <div>
                <strong style={{ color: "var(--navy)" }}>AI-Generated Review — Use Professional Judgment</strong>
                <div style={{ marginTop: 6 }}>This review is generated by AI and may contain inaccuracies. Use the "Not an issue" button to dismiss incorrect findings. This does not constitute legal advice and does not guarantee approval. GovCert is not affiliated with the SBA or GSA.</div>
              </div>
            </div>
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
              {review.criticalIssues?.length > 0 && (
                <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--rl)", padding: "18px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red)", textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Critical Issues — Must Fix</div>
                    <div style={{ fontSize: 10, color: "var(--ink4)", fontStyle: "italic" }}>AI-identified — dismiss if inaccurate</div>
                  </div>
                  {review.criticalIssues.map((issue: string, i: number) => {
                    const key = `critical:${i}`;
                    const isResolved = resolvedIssues[key]?.resolved;
                    return (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, lineHeight: 1.5, padding: "8px 10px", borderRadius: 6, background: isResolved ? (resolvedIssues[key]?.dismissed ? "rgba(150,150,150,.06)" : "rgba(5,150,105,.06)") : undefined }}>
                        <span style={{ flexShrink: 0 }}>{isResolved ? (resolvedIssues[key]?.dismissed ? "➖" : "✅") : "🚨"}</span>
                        <div style={{ flex: 1, color: isResolved ? (resolvedIssues[key]?.dismissed ? "#888" : "#065F46") : "#991B1B", textDecoration: isResolved ? "line-through" : undefined }}>
                          {issue}
                          {resolvedIssues[key]?.dismissed && <span style={{ fontStyle: "italic", marginLeft: 6 }}>(dismissed)</span>}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {!isResolved && (
                            <>
                              <button onClick={() => setGuidedFix({ isOpen: true, issueKey: key, issueText: issue, sectionId: "critical", sectionLabel: "Critical Issue" })}
                                style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, background: "var(--gold)", color: "#fff", border: "none" }}>
                                Fix with AI
                              </button>
                              <button disabled={resolvingKey === key} onClick={() => resolveIssue(key, true, true)}
                                style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" as const, background: "transparent", color: "#999", border: "1px solid #ddd" }}>
                                Not an issue
                              </button>
                            </>
                          )}
                          <button disabled={resolvingKey === key} onClick={() => resolveIssue(key, !isResolved)}
                            style={{ padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, background: isResolved ? "rgba(200,155,60,.08)" : "var(--green)", color: isResolved ? "var(--gold)" : "#fff", border: isResolved ? "1px solid rgba(200,155,60,.2)" : "none" }}>
                            {resolvingKey === key ? "..." : isResolved ? "Undo" : "Fixed"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

          {/* Section-by-Section */}
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 14 }}>Section-by-Section Analysis</div>
          {(review.sections || []).map((section: any) => {
            const cfg = STATUS_CONFIG_V1[section.status] || STATUS_CONFIG_V1.missing;
            const sectionLink = SECTION_LINKS[section.id];
            return (
              <div key={section.id} style={{ background: "#fff", border: `1px solid ${cfg.border}`, borderLeft: `4px solid ${cfg.color}`, borderRadius: "var(--rl)", padding: "22px 26px", marginBottom: 14, boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--navy)" }}>{section.label}</span>
                      <span style={{ padding: "2px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                    </div>
                    {section.regulatoryBasis && <div style={{ fontSize: 11, color: "var(--ink4)", fontStyle: "italic", lineHeight: 1.5 }}>{section.regulatoryBasis}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: cfg.color, lineHeight: 1 }}>{section.score}</div>
                      <div style={{ fontSize: 10, color: "var(--ink4)" }}>/10</div>
                    </div>
                    {sectionLink && (
                      <a href={`/certifications/${certId}/${sectionLink}`} style={{ padding: "6px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 500, color: "var(--gold2)", textDecoration: "none", whiteSpace: "nowrap" as const }}>
                        Go to Section
                      </a>
                    )}
                  </div>
                </div>
                {section.findings?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)", marginBottom: 4 }}>Findings:</div>
                    {section.findings.map((f: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3, fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.5 }}>
                        <span style={{ color: cfg.color, flexShrink: 0 }}>&#8226;</span> {f}
                      </div>
                    ))}
                  </div>
                )}
                {section.improvements?.length > 0 && (
                  <div style={{ background: "rgba(200,155,60,.04)", border: "1px solid rgba(200,155,60,.12)", borderRadius: "var(--r)", padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)", marginBottom: 4 }}>How to Improve:</div>
                    {section.improvements.map((imp: string, i: number) => {
                      const key = `${section.id}:${i}`;
                      const isResolved = resolvedIssues[key]?.resolved;
                      return (
                        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 12.5, lineHeight: 1.5, padding: "6px 8px", borderRadius: 5, background: isResolved ? (resolvedIssues[key]?.dismissed ? "rgba(150,150,150,.06)" : "rgba(5,150,105,.06)") : undefined }}>
                          <span style={{ color: isResolved ? (resolvedIssues[key]?.dismissed ? "#888" : "var(--green)") : "var(--gold)", flexShrink: 0 }}>{isResolved ? (resolvedIssues[key]?.dismissed ? "➖" : "✓") : "→"}</span>
                          <div style={{ flex: 1, color: isResolved ? (resolvedIssues[key]?.dismissed ? "#888" : "#065F46") : "var(--ink2)", textDecoration: isResolved ? "line-through" : undefined }}>
                            {imp}
                            {resolvedIssues[key]?.dismissed && <span style={{ fontStyle: "italic", marginLeft: 6 }}>(dismissed)</span>}
                          </div>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            {!isResolved && (
                              <>
                                <button onClick={() => setGuidedFix({ isOpen: true, issueKey: key, issueText: imp, sectionId: section.id, sectionLabel: section.label })}
                                  style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer", color: "#fff", background: "var(--gold)", border: "none" }}>
                                  Fix with AI
                                </button>
                                <button disabled={resolvingKey === key} onClick={() => resolveIssue(key, true, true)}
                                  style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, cursor: "pointer", background: "transparent", color: "#999", border: "1px solid #ddd" }}>
                                  Not an issue
                                </button>
                              </>
                            )}
                            <button disabled={resolvingKey === key} onClick={() => resolveIssue(key, !isResolved)}
                              style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer", background: isResolved ? "rgba(200,155,60,.08)" : "var(--green)", color: isResolved ? "var(--gold)" : "#fff", border: isResolved ? "1px solid rgba(200,155,60,.2)" : "none" }}>
                              {resolvingKey === key ? "..." : isResolved ? "Undo" : "Done"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ height: 4, background: "var(--cream2)", borderRadius: 100, marginTop: 12, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${section.score * 10}%`, background: cfg.color, borderRadius: 100, transition: "width .5s" }} />
                </div>
              </div>
            );
          })}

          {cert && <ExecutiveReview cert={cert} certId={certId} />}

          {/* Upload docs */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", marginTop: 24, marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Upload Additional Documents</h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>Upload any document to strengthen your application.</p>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleCureUpload(e.dataTransfer.files); }}
              style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "24px", textAlign: "center" as const, cursor: "pointer", background: "var(--cream)" }}
              onClick={() => { const input = document.createElement("input"); input.type = "file"; input.multiple = true; input.accept = ".pdf,.docx,.xlsx,.csv,.txt"; input.onchange = (e: any) => { if (e.target.files?.length) handleCureUpload(e.target.files); }; input.click(); }}>
              {cureUploading ? (
                <div style={{ fontSize: 14, color: "var(--gold)", fontWeight: 500 }}>Uploading...</div>
              ) : (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{"\uD83D\uDCC4"}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Drop files here or click to upload</div>
                  <div style={{ fontSize: 12, color: "var(--ink4)" }}>PDF, Word, Excel</div>
                </div>
              )}
            </div>
            {cureUploadResult && cureUploadResult.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {cureUploadResult.map((r: any, i: number) => (
                  <div key={i} style={{ padding: "14px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)" }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>{r.fileName}</div>
                    <div style={{ fontSize: 12, color: "var(--ink2)" }}><strong>Where it goes:</strong> {r.placement.portal}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, padding: "20px 24px", background: "var(--navy)", borderRadius: "var(--rl)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Made improvements?</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Re-run the analysis to see your updated score.</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a href={`/certifications/${certId}`} style={{ padding: "10px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, textDecoration: "none" }}>Dashboard</a>
              <button onClick={runReview} disabled={analyzing} style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {analyzing ? "Analyzing..." : "Re-Run Analysis"}
              </button>
              <a href={`/certifications/${certId}/submit`} style={{ padding: "10px 24px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                Proceed to Submit
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
