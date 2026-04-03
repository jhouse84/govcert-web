"use client";
import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { compileReviewDOCX } from "@/lib/generatePDF";

function extractNarrativeField(json: string | undefined, key: string): string {
  if (!json) return "";
  try { const p = JSON.parse(json); return (p.narratives || p.answers || p)[key] || ""; } catch { return ""; }
}

export default function ExecutiveReview({ cert, certId }: { cert: any; certId: string }) {
  const app = cert?.application;
  const client = cert?.client;
  const certType = cert?.type || "GSA_MAS";

  const [reviewers, setReviewers] = useState<{ name: string; email: string }[]>([{ name: "", email: "" }]);
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [incorporating, setIncorporating] = useState(false);
  const [incorporateResult, setIncorporateResult] = useState<any>(null);

  useEffect(() => {
    if (app?.id) loadReviews();
  }, [app?.id]);

  async function loadReviews() {
    try {
      const data = await apiRequest(`/api/applications/${app.id}/executive-review`);
      setReviews(Array.isArray(data) ? data : []);
    } catch {}
  }

  function buildSections(): { title: string; content: string }[] {
    const sections: { title: string; content: string }[] = [];

    if (certType === "GSA_MAS" || certType === "OASIS_PLUS") {
      // Corporate Experience
      const corpKeys = ["overview", "capabilities", "employees", "org_controls", "resources", "past_projects", "marketing", "subcontractors"];
      for (const key of corpKeys) {
        const val = extractNarrativeField(app?.narrativeCorp, key);
        if (val) sections.push({ title: `Corporate Experience: ${key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`, content: val });
      }
      // QCP
      const qcpKeys = ["overview", "supervision", "personnel", "subcontractors", "corrective", "urgent"];
      for (const key of qcpKeys) {
        const val = extractNarrativeField(app?.narrativeQCP, key);
        if (val) sections.push({ title: `Quality Control Plan: ${key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`, content: val });
      }
      // SIN Narratives
      try {
        const sins = JSON.parse(app?.sinNarratives || "{}");
        for (const [sin, text] of Object.entries(sins)) {
          if (text) sections.push({ title: `SIN ${sin} — Relevant Project Experience`, content: text as string });
        }
      } catch {}
      // Price Proposal
      if (app?.priceProposal) sections.push({ title: "Price Proposal / Commercial Sales Practices", content: app.priceProposal });
    }

    if (certType === "EIGHT_A") {
      if (app?.socialDisadvantageNarrative) sections.push({ title: "Social Disadvantage Narrative", content: app.socialDisadvantageNarrative });
      try {
        const bp = JSON.parse(app?.businessPlanData || "{}");
        for (const [key, val] of Object.entries(bp)) {
          if (val) sections.push({ title: `Business Plan: ${key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}`, content: val as string });
        }
      } catch {}
      const corpKeys = ["overview", "capabilities", "management", "operations", "experience"];
      for (const key of corpKeys) {
        const val = extractNarrativeField(app?.narrativeCorp, key);
        if (val) sections.push({ title: `Corporate Experience: ${key.replace(/\b\w/g, c => c.toUpperCase())}`, content: val });
      }
    }

    return sections;
  }

  async function compileAndSend() {
    const validReviewers = reviewers.filter(r => r.email.trim());
    if (validReviewers.length === 0) { setError("Add at least one reviewer email"); return; }
    if (!deadline) { setError("Set a review deadline"); return; }

    setSending(true);
    setError(null);
    try {
      const sections = buildSections();
      if (sections.length === 0) { setError("No narrative sections to review. Complete the wizard pages first."); setSending(false); return; }

      // Generate compiled DOCX
      const { base64 } = await compileReviewDOCX({
        companyName: client?.businessName || "Company",
        certType,
        sections,
        fileName: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Application_Review.docx`,
      });

      // Send via backend
      await apiRequest(`/api/applications/${app.id}/executive-review/send`, {
        method: "POST",
        body: JSON.stringify({
          reviewers: validReviewers,
          deadline,
          message: message.trim() || null,
          documentBase64: base64,
          documentFilename: `${(client?.businessName || "Company").replace(/\s+/g, "_")}_Application_Review.docx`,
        }),
      });

      setSent(true);
      await loadReviews();
    } catch (err: any) {
      setError("Failed to send: " + (err.message || ""));
    } finally {
      setSending(false);
    }
  }

  async function incorporateFeedback(reviewId: string) {
    setIncorporating(true);
    setIncorporateResult(null);
    try {
      const result = await apiRequest(`/api/applications/${app.id}/executive-review/incorporate`, {
        method: "POST",
        body: JSON.stringify({ reviewId }),
      });
      setIncorporateResult(result);
      await loadReviews();
    } catch (err: any) {
      setError("Failed to incorporate feedback: " + (err.message || ""));
    } finally {
      setIncorporating(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)",
    fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #1A2332, #2D3748)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{"\uD83D\uDCE7"}</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: "var(--navy)", fontFamily: "'Cormorant Garamond', serif" }}>Executive Review</div>
          <div style={{ fontSize: 12, color: "var(--ink4)" }}>Send your application to your team for review before submission</div>
        </div>
      </div>

      {error && (
        <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "var(--red)", display: "flex", justifyContent: "space-between" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>&times;</button>
        </div>
      )}

      {/* Previous reviews */}
      {reviews.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--ink3)", marginBottom: 8 }}>Review History</div>
          {reviews.map((r: any) => (
            <div key={r.id} style={{ padding: "12px 16px", border: `1px solid ${r.status === "FEEDBACK_RECEIVED" ? "var(--green-b)" : r.status === "INCORPORATED" ? "var(--blue-b, var(--border))" : "var(--border)"}`, borderRadius: "var(--r)", marginBottom: 8, background: r.status === "FEEDBACK_RECEIVED" ? "var(--green-bg)" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>Round {r.round} — {new Date(r.sentAt).toLocaleDateString()}</div>
                <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em",
                  background: r.status === "FEEDBACK_RECEIVED" ? "var(--green-bg)" : r.status === "INCORPORATED" ? "rgba(37,99,235,.06)" : "var(--cream2)",
                  color: r.status === "FEEDBACK_RECEIVED" ? "var(--green)" : r.status === "INCORPORATED" ? "#2563EB" : "var(--ink4)" }}>
                  {r.status.replace(/_/g, " ")}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(r.reviewers || []).map((rev: any, i: number) => (
                  <div key={i} style={{ padding: "4px 10px", borderRadius: 100, fontSize: 11, background: rev.status === "SUBMITTED" ? "var(--green-bg)" : "var(--cream2)", color: rev.status === "SUBMITTED" ? "var(--green)" : "var(--ink4)", border: `1px solid ${rev.status === "SUBMITTED" ? "var(--green-b)" : "var(--border)"}` }}>
                    {rev.status === "SUBMITTED" ? "\u2713 " : ""}{rev.name || rev.email}
                  </div>
                ))}
              </div>
              {r.status === "FEEDBACK_RECEIVED" && (
                <button onClick={() => incorporateFeedback(r.id)} disabled={incorporating}
                  style={{ marginTop: 10, padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: incorporating ? "wait" : "pointer", width: "100%" }}>
                  {incorporating ? "Incorporating feedback..." : "Incorporate Feedback & Update Narratives"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Incorporate result */}
      {incorporateResult && (
        <div style={{ padding: "14px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)", marginBottom: 8 }}>{"\u2713"} Feedback Incorporated</div>
          {incorporateResult.changeSummary?.map((c: string, i: number) => (
            <div key={i} style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 3 }}>{"\u2022"} {c}</div>
          ))}
          {incorporateResult.rejectedSuggestions?.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink4)" }}>
              <strong>Not incorporated:</strong> {incorporateResult.rejectedSuggestions.join("; ")}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)" }}>
            Re-run GovCert Analysis to see your updated scores.
          </div>
        </div>
      )}

      {/* Send form */}
      {!sent ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 10 }}>Reviewers</div>
          {reviewers.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={r.name} onChange={e => setReviewers(prev => prev.map((rv, j) => j === i ? { ...rv, name: e.target.value } : rv))} placeholder="Name" style={{ ...inputStyle, flex: 1 }} />
              <input value={r.email} onChange={e => setReviewers(prev => prev.map((rv, j) => j === i ? { ...rv, email: e.target.value } : rv))} placeholder="Email" style={{ ...inputStyle, flex: 1 }} type="email" />
              {reviewers.length > 1 && (
                <button onClick={() => setReviewers(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>&times;</button>
              )}
            </div>
          ))}
          <button onClick={() => setReviewers(prev => [...prev, { name: "", email: "" }])}
            style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 12, padding: "4px 0", marginBottom: 12 }}>
            + Add another reviewer
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Deadline *</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} min={new Date().toISOString().split("T")[0]} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Message to Reviewers (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Any context or focus areas for the reviewers..."
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />
          </div>

          <button onClick={compileAndSend} disabled={sending}
            style={{ width: "100%", padding: "14px 24px", background: sending ? "var(--ink4)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: "var(--gold2)", cursor: sending ? "wait" : "pointer" }}>
            {sending ? "Compiling document & sending..." : `Compile & Send for Review (${buildSections().length} sections)`}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ fontSize: 14, color: "var(--green)", fontWeight: 500 }}>{"\u2713"} Review sent to {reviewers.filter(r => r.email).length} reviewer{reviewers.filter(r => r.email).length !== 1 ? "s" : ""}</div>
          <button onClick={() => setSent(false)} style={{ marginTop: 8, background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 12 }}>Send to additional reviewers</button>
        </div>
      )}
    </div>
  );
}
