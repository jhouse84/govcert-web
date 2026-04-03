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

  // Diff-based review
  const [diffSections, setDiffSections] = useState<any[]>([]);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffReviewId, setDiffReviewId] = useState<string | null>(null);
  const [sectionDecisions, setSectionDecisions] = useState<Record<string, "accept" | "keep" | "edit">>({});
  const [sectionEdits, setSectionEdits] = useState<Record<string, string>>({});
  const [condensingSection, setCondensingSection] = useState<string | null>(null);
  const [applyingChanges, setApplyingChanges] = useState(false);

  async function loadDiff(reviewId: string) {
    setDiffLoading(true);
    setDiffReviewId(reviewId);
    setDiffSections([]);
    setSectionDecisions({});
    setSectionEdits({});
    try {
      const result = await apiRequest(`/api/applications/${app.id}/executive-review/diff`, {
        method: "POST",
        body: JSON.stringify({ reviewId }),
      });
      setDiffSections(result.sections || []);
    } catch (err: any) {
      setError("Failed to load diff: " + (err.message || ""));
    } finally {
      setDiffLoading(false);
    }
  }

  async function condenseSection(sectionId: string, text: string, charLimit: number) {
    setCondensingSection(sectionId);
    try {
      const data = await apiRequest("/api/applications/ai/condense-narrative", {
        method: "POST",
        body: JSON.stringify({ narrative: text, charLimit }),
      });
      if (data.narrative) {
        setSectionEdits(prev => ({ ...prev, [sectionId]: data.narrative }));
      }
    } catch (err: any) {
      setError("Failed to condense: " + (err.message || ""));
    } finally {
      setCondensingSection(null);
    }
  }

  async function applyAcceptedChanges() {
    setApplyingChanges(true);
    try {
      const changes: any[] = [];
      for (const section of diffSections) {
        const decision = sectionDecisions[section.id];
        if (decision === "accept") {
          const text = sectionEdits[section.id] || section.reviewerVersion;
          if (text) changes.push({ field: section.field, subKey: section.subKey, newText: text });
        } else if (decision === "edit") {
          const text = sectionEdits[section.id];
          if (text) changes.push({ field: section.field, subKey: section.subKey, newText: text });
        }
      }
      if (changes.length === 0) { setError("No sections selected to update."); setApplyingChanges(false); return; }
      await apiRequest(`/api/applications/${app.id}/executive-review/apply`, {
        method: "POST",
        body: JSON.stringify({ changes }),
      });
      setDiffSections([]);
      setDiffReviewId(null);
      await loadReviews();
      setIncorporateResult({ changeSummary: [`${changes.length} section${changes.length !== 1 ? "s" : ""} updated from reviewer feedback.`], rejectedSuggestions: [] });
    } catch (err: any) {
      setError("Failed to apply changes: " + (err.message || ""));
    } finally {
      setApplyingChanges(false);
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
              {(r.status === "FEEDBACK_RECEIVED" || r.status === "IN_REVIEW") && r.reviewers?.some((rv: any) => rv.status === "SUBMITTED") && (
                <button onClick={() => loadDiff(r.id)} disabled={diffLoading}
                  style={{ marginTop: 10, padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: diffLoading ? "wait" : "pointer", width: "100%" }}>
                  {diffLoading && diffReviewId === r.id ? "Loading section comparison..." : "Review Changes Section by Section"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section-by-section diff view */}
      {diffSections.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
              Review Changes ({diffSections.filter(s => s.hasChanges).length} sections with changes)
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setDiffSections([]); setDiffReviewId(null); }}
                style={{ padding: "6px 14px", background: "var(--cream2)", border: "none", borderRadius: "var(--r)", fontSize: 11, cursor: "pointer", color: "var(--ink3)" }}>
                Cancel
              </button>
              <button onClick={applyAcceptedChanges} disabled={applyingChanges || Object.keys(sectionDecisions).length === 0}
                style={{ padding: "6px 18px", background: Object.keys(sectionDecisions).length > 0 ? "var(--green)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 600, cursor: "pointer", color: Object.keys(sectionDecisions).length > 0 ? "#fff" : "var(--ink4)" }}>
                {applyingChanges ? "Applying..." : `Apply ${Object.values(sectionDecisions).filter(d => d !== "keep").length} Changes`}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {diffSections.map((section: any) => {
              const decision = sectionDecisions[section.id];
              const editText = sectionEdits[section.id];
              const displayText = decision === "accept" ? (editText || section.reviewerVersion) : decision === "edit" ? (editText || section.current) : section.current;
              const charCount = (displayText || "").length;
              const isOver = section.charLimit && charCount > section.charLimit;

              if (!section.hasChanges && !section.reviewerVersion) return null; // Skip sections not found

              return (
                <div key={section.id} style={{ border: `1px solid ${decision === "accept" ? "var(--green-b)" : section.hasChanges ? "var(--amber-b, rgba(200,155,60,.2))" : "var(--border)"}`, borderRadius: "var(--r)", overflow: "hidden", background: "#fff" }}>
                  {/* Section header */}
                  <div style={{ padding: "10px 14px", background: section.hasChanges ? "rgba(200,155,60,.06)" : "var(--cream)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{section.label}</div>
                      <div style={{ fontSize: 11, color: section.hasChanges ? "var(--gold)" : "var(--ink4)" }}>
                        {section.hasChanges ? section.changeSummary : "No changes detected"}
                      </div>
                    </div>
                    {section.hasChanges && section.reviewerVersion && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setSectionDecisions(prev => ({ ...prev, [section.id]: "accept" })); setSectionEdits(prev => ({ ...prev, [section.id]: section.reviewerVersion })); }}
                          style={{ padding: "4px 12px", background: decision === "accept" ? "var(--green)" : "transparent", border: `1px solid ${decision === "accept" ? "var(--green)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 10, fontWeight: 600, cursor: "pointer", color: decision === "accept" ? "#fff" : "var(--green)" }}>
                          Accept
                        </button>
                        <button onClick={() => setSectionDecisions(prev => ({ ...prev, [section.id]: "keep" }))}
                          style={{ padding: "4px 12px", background: decision === "keep" ? "var(--navy)" : "transparent", border: `1px solid ${decision === "keep" ? "var(--navy)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 10, fontWeight: 600, cursor: "pointer", color: decision === "keep" ? "#fff" : "var(--ink3)" }}>
                          Keep Mine
                        </button>
                        <button onClick={() => { setSectionDecisions(prev => ({ ...prev, [section.id]: "edit" })); setSectionEdits(prev => ({ ...prev, [section.id]: section.reviewerVersion || section.current })); }}
                          style={{ padding: "4px 12px", background: decision === "edit" ? "var(--gold)" : "transparent", border: `1px solid ${decision === "edit" ? "var(--gold)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 10, fontWeight: 600, cursor: "pointer", color: decision === "edit" ? "#fff" : "var(--gold)" }}>
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content comparison */}
                  {section.hasChanges && section.reviewerVersion && (
                    <div style={{ padding: "12px 14px" }}>
                      {decision === "edit" ? (
                        <div>
                          <textarea
                            value={editText || section.reviewerVersion || section.current}
                            onChange={e => setSectionEdits(prev => ({ ...prev, [section.id]: e.target.value }))}
                            style={{ width: "100%", minHeight: 150, padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                          />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                            {section.charLimit && (
                              <span style={{ fontSize: 11, fontFamily: "monospace", color: isOver ? "var(--red)" : "var(--ink4)" }}>
                                {charCount.toLocaleString()} / {section.charLimit.toLocaleString()} chars{isOver ? " — over limit!" : ""}
                              </span>
                            )}
                            {isOver && (
                              <button onClick={() => condenseSection(section.id, editText || section.reviewerVersion, section.charLimit)}
                                disabled={condensingSection === section.id}
                                style={{ padding: "4px 14px", background: "var(--red)", border: "none", borderRadius: "var(--r)", fontSize: 11, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                                {condensingSection === section.id ? "Shortening..." : "Shorten to fit"}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {/* Current version */}
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: decision === "accept" ? "var(--red)" : "var(--navy)", marginBottom: 6 }}>
                              {decision === "accept" ? "Current (will be replaced)" : "Current Version"}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--ink3)", lineHeight: 1.6, maxHeight: 200, overflowY: "auto", padding: "8px 10px", background: decision === "accept" ? "rgba(200,60,60,.03)" : "var(--cream)", borderRadius: "var(--r)", border: `1px solid ${decision === "accept" ? "rgba(200,60,60,.1)" : "var(--border)"}`, whiteSpace: "pre-wrap" }}>
                              {section.current?.substring(0, 800)}{(section.current?.length || 0) > 800 ? "..." : ""}
                            </div>
                          </div>
                          {/* Reviewer version */}
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: decision === "accept" ? "var(--green)" : "var(--gold)", marginBottom: 6 }}>
                              {decision === "accept" ? "Reviewer\u2019s (will be applied)" : "Reviewer\u2019s Version"}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--ink2)", lineHeight: 1.6, maxHeight: 200, overflowY: "auto", padding: "8px 10px", background: decision === "accept" ? "rgba(46,125,50,.04)" : "rgba(200,155,60,.04)", borderRadius: "var(--r)", border: `1px solid ${decision === "accept" ? "var(--green-b)" : "rgba(200,155,60,.15)"}`, whiteSpace: "pre-wrap" }}>
                              {section.reviewerVersion?.substring(0, 800)}{(section.reviewerVersion?.length || 0) > 800 ? "..." : ""}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Char limit warning after accept */}
                      {decision === "accept" && section.charLimit && (section.reviewerVersion || "").length > section.charLimit && (
                        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "var(--red-bg)", borderRadius: "var(--r)", border: "1px solid var(--red-b)" }}>
                          <span style={{ fontSize: 11, color: "var(--red)" }}>
                            {(editText || section.reviewerVersion || "").length.toLocaleString()} / {section.charLimit.toLocaleString()} chars — over limit
                          </span>
                          <button onClick={() => { setSectionDecisions(prev => ({ ...prev, [section.id]: "edit" })); setSectionEdits(prev => ({ ...prev, [section.id]: section.reviewerVersion })); }}
                            style={{ padding: "3px 12px", background: "var(--red)", border: "none", borderRadius: "var(--r)", fontSize: 10, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                            Edit to shorten
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
