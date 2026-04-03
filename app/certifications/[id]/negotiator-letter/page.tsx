"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function NegotiatorLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [letter, setLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [homeLink, setHomeLink] = useState("/portal");

  // Editable negotiator fields
  const [negName, setNegName] = useState("");
  const [negTitle, setNegTitle] = useState("");
  const [negEmail, setNegEmail] = useState("");
  const [negPhone, setNegPhone] = useState("");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role === "ADMIN" || payload.role === "ADVISOR") setHomeLink("/dashboard");
      }
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);

      // Load saved eofferData
      let eofferData: any = {};
      try { eofferData = JSON.parse(data.application?.eofferData || "{}"); } catch {}

      setNegName(eofferData.negotiatorName || "");
      setNegTitle(eofferData.negotiatorTitle || "");
      setNegEmail(eofferData.negotiatorEmail || data.client?.email || "");
      setNegPhone(eofferData.negotiatorPhone || data.client?.phone || "");

      // Load saved letter
      if (eofferData.negotiatorLetter) {
        setLetter(eofferData.negotiatorLetter);
        setSaved(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function generateLetter() {
    if (!negName.trim()) { setError("Please enter the negotiator's name."); return; }
    setGenerating(true);
    setError(null);
    try {
      // Save negotiator info first
      const clientId = cert?.clientId || cert?.client?.id;
      let eofferData: any = {};
      try { eofferData = JSON.parse(cert?.application?.eofferData || "{}"); } catch {}
      eofferData.negotiatorName = negName;
      eofferData.negotiatorTitle = negTitle;
      eofferData.negotiatorEmail = negEmail;
      eofferData.negotiatorPhone = negPhone;
      eofferData.negotiatorSignature = "Yes";

      // Generate letter
      const data = await apiRequest("/api/applications/generate-negotiator-letter", {
        method: "POST",
        body: JSON.stringify({ clientId, certType: cert?.type }),
      });

      setLetter(data.letter || "");

      // Auto-save letter + negotiator info
      eofferData.negotiatorLetter = data.letter;
      await apiRequest(`/api/certifications/${certId}`, {
        method: "PUT",
        body: JSON.stringify({ eofferData: JSON.stringify(eofferData) }),
      });
      setSaved(true);
    } catch (err: any) {
      setError(err.message || "Failed to generate letter");
    } finally {
      setGenerating(false);
    }
  }

  async function saveLetter() {
    try {
      let eofferData: any = {};
      try { eofferData = JSON.parse(cert?.application?.eofferData || "{}"); } catch {}
      eofferData.negotiatorLetter = letter;
      eofferData.negotiatorName = negName;
      eofferData.negotiatorTitle = negTitle;
      eofferData.negotiatorEmail = negEmail;
      eofferData.negotiatorPhone = negPhone;
      await apiRequest(`/api/certifications/${certId}`, {
        method: "PUT",
        body: JSON.stringify({ eofferData: JSON.stringify(eofferData) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError("Failed to save: " + err.message);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid var(--border2)",
    borderRadius: "var(--r)", fontSize: 13.5, outline: "none",
    boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px" }}>
        <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
          ← Back to Application Dashboard
        </a>

        <div style={{ marginTop: 20, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
            eOffer Upload Document
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
            Authorized Negotiator Letter
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
            This letter designates who can negotiate and sign the GSA contract on behalf of your company. It must be on company letterhead and uploaded to eOffer.
          </p>
        </div>

        {error && (
          <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>&times;</button>
          </div>
        )}

        {/* Negotiator Info */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 16 }}>
            Authorized Negotiator
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Full Name *</label>
              <input value={negName} onChange={e => setNegName(e.target.value)} placeholder="e.g., Jelani House" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Title</label>
              <input value={negTitle} onChange={e => setNegTitle(e.target.value)} placeholder="e.g., Managing Director" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Email</label>
              <input value={negEmail} onChange={e => setNegEmail(e.target.value)} placeholder="negotiator@company.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Phone</label>
              <input value={negPhone} onChange={e => setNegPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
            </div>
          </div>

          <button onClick={generateLetter} disabled={generating || !negName.trim()}
            style={{ marginTop: 20, padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: generating ? "not-allowed" : "pointer", width: "100%" }}>
            {generating ? "Generating Letter..." : letter ? "Regenerate Letter" : "Generate Authorized Negotiator Letter"}
          </button>
        </div>

        {/* Generated Letter */}
        {letter && (
          <div style={{ background: "#fff", border: "1px solid var(--green-b)", borderRadius: "var(--rl)", padding: "24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, margin: 0 }}>
                Generated Letter
              </h3>
              {saved && <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500 }}>{"\u2713"} Saved</span>}
            </div>

            <div style={{ padding: "16px 20px", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: "var(--r)", marginBottom: 12, fontSize: 11, color: "var(--ink3)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--amber)" }}>Note:</strong> Print this letter on your company letterhead, sign it where indicated, scan as PDF, and upload to eOffer. The signature line below is where you sign.
            </div>

            <textarea
              value={letter}
              onChange={e => { setLetter(e.target.value); setSaved(false); }}
              style={{ width: "100%", minHeight: 400, padding: "20px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Mono', 'Courier New', monospace", lineHeight: 1.8, resize: "vertical", outline: "none", boxSizing: "border-box", whiteSpace: "pre-wrap" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
              <button onClick={() => navigator.clipboard.writeText(letter)}
                style={{ padding: "8px 18px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}>
                Copy to Clipboard
              </button>
              <button onClick={saveLetter}
                style={{ padding: "8px 18px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, color: "var(--gold2)", cursor: "pointer", fontWeight: 500 }}>
                Save
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>← Back to Dashboard</a>
          <a href={`/certifications/${certId}/submit`}
            style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
            Continue to Submission →
          </a>
        </div>
      </div>
    </div>
  );
}
