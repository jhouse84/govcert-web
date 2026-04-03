"use client";
import React, { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

export default function ReviewerPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);

  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get reviewer email from URL params
  const email = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("email") || "" : "";

  useEffect(() => {
    fetchReview();
  }, []);

  async function fetchReview() {
    try {
      const resp = await fetch(`${API_URL}/api/applications/executive-review/portal/${token}`);
      if (!resp.ok) throw new Error("Review not found");
      const data = await resp.json();
      setReview(data);
      // Check if already submitted
      const reviewer = data.reviewers?.find((r: any) => r.email.toLowerCase() === email.toLowerCase());
      if (reviewer?.status === "SUBMITTED") setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Could not load review");
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    setSubmitting(true);
    setError(null);
    try {
      let documentBase64 = null;
      let documentFilename = null;
      if (uploadedFile) {
        const buffer = await uploadedFile.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        documentBase64 = btoa(binary);
        documentFilename = uploadedFile.name;
      }

      const resp = await fetch(`${API_URL}/api/applications/executive-review/portal/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, comments: comments.trim() || null, documentBase64, documentFilename }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F5F1EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>Loading...</div>
  );

  if (error && !review) return (
    <div style={{ minHeight: "100vh", background: "#F5F1EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{"\\u26A0\\uFE0F"}</div>
        <div style={{ fontSize: 18, color: "#1A2332", fontWeight: 500, marginBottom: 8 }}>Review Not Found</div>
        <div style={{ fontSize: 14, color: "#888" }}>This review link may have expired or been used already.</div>
      </div>
    </div>
  );

  const deadlineStr = review?.deadline ? new Date(review.deadline).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "";
  const certLabels: Record<string, string> = { GSA_MAS: "GSA Multiple Award Schedule", EIGHT_A: "8(a) Business Development", OASIS_PLUS: "OASIS+" };
  const certLabel = certLabels[review?.certType || ""] || review?.certType;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F1EB" }}>
      {/* Header */}
      <div style={{ background: "#1A2332", padding: "24px 0" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#fff" }}>
            Gov<span style={{ color: "#C89B3C" }}>Cert</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Executive Review Portal</div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
        {/* Review info */}
        <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 12, padding: "28px 32px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#1A2332", marginBottom: 8, fontFamily: "Georgia, serif" }}>
            {review?.companyName} — {certLabel}
          </div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
            Review Round {review?.round || 1}
          </div>

          {/* Deadline */}
          <div style={{ background: "#FFF8E8", border: "1px solid #E8D5A0", borderRadius: 8, padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B8860B", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Review Deadline</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1A2332" }}>{deadlineStr}</div>
          </div>

          {/* Message */}
          {review?.message && (
            <div style={{ background: "#f8f8f8", borderLeft: "3px solid #C89B3C", borderRadius: 6, padding: "12px 16px", fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 16 }}>
              {review.message}
            </div>
          )}

          <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7 }}>
            <strong>Instructions:</strong>
            <ol style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>The application document was attached to the email you received</li>
              <li>Open it in Microsoft Word and use <strong>Track Changes</strong> to mark your edits</li>
              <li>Add comments on any sections that need attention</li>
              <li>Upload your reviewed document below and add any overall comments</li>
            </ol>
          </div>
        </div>

        {/* Already submitted */}
        {submitted && (
          <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 12, padding: "28px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{"\u2713"}</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: "#2E7D32", marginBottom: 8 }}>Review Submitted</div>
            <div style={{ fontSize: 14, color: "#555" }}>
              Thank you for your feedback. The applicant will be notified and can incorporate your suggestions.
            </div>
          </div>
        )}

        {/* Submit form */}
        {!submitted && (
          <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 12, padding: "28px 32px", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#1A2332", marginBottom: 16, fontFamily: "Georgia, serif" }}>Submit Your Review</div>

            {error && (
              <div style={{ background: "#FDE8E8", border: "1px solid #F5C6CB", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#C62828" }}>
                {error}
              </div>
            )}

            {/* File upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#333", marginBottom: 8 }}>Upload your reviewed document (with Track Changes)</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) setUploadedFile(e.dataTransfer.files[0]); }}
                onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".docx,.pdf"; input.onchange = (e: any) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]); }; input.click(); }}
                style={{ border: "2px dashed #CCC", borderRadius: 8, padding: "20px", textAlign: "center", cursor: "pointer", background: uploadedFile ? "#E8F5E9" : "#FAFAFA" }}>
                {uploadedFile ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#2E7D32" }}>{"\u2713"} {uploadedFile.name}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{(uploadedFile.size / 1024).toFixed(0)} KB — click to change</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 14, color: "#555" }}>Drop your reviewed file here or click to browse</div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>DOCX or PDF</div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#333", marginBottom: 8 }}>Overall Comments (optional)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any overall feedback, concerns, or suggestions for the application..."
                style={{ width: "100%", minHeight: 100, padding: "12px 14px", border: "1px solid #DDD", borderRadius: 8, fontSize: 13, fontFamily: "inherit", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <button onClick={submitReview} disabled={submitting || (!uploadedFile && !comments.trim())}
              style={{ width: "100%", padding: "14px 24px", background: submitting ? "#999" : "#C89B3C", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, color: "#fff", cursor: submitting ? "wait" : "pointer" }}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>

            {!uploadedFile && !comments.trim() && (
              <div style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 8 }}>
                Upload a reviewed document and/or add comments to submit
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "24px", fontSize: 12, color: "#999" }}>
        Powered by <a href="https://govcert.ai" style={{ color: "#C89B3C" }}>GovCert.ai</a>
      </div>
    </div>
  );
}
