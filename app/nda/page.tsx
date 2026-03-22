"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function NDAPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ndaText, setNdaText] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== "ADVISOR") { router.push("/dashboard"); return; }
    }
    checkNDA();
    fetchNDAText();
  }, []);

  async function checkNDA() {
    try {
      const data = await apiRequest("/api/nda/status");
      if (data.signed) router.push("/dashboard");
    } catch {}
    finally { setLoading(false); }
  }

  async function fetchNDAText() {
    try {
      const data = await apiRequest("/api/nda/text");
      setNdaText(data.text);
    } catch {}
  }

  async function handleSign() {
    if (!fullName.trim()) { setError("Please enter your full legal name."); return; }
    if (!agreed) { setError("Please check the agreement box."); return; }
    setSigning(true);
    setError("");
    try {
      await apiRequest("/api/nda/sign", {
        method: "POST",
        body: JSON.stringify({ fullName }),
      });
      // Update user in localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData);
        localStorage.setItem("user", JSON.stringify({ ...parsed, ndaSigned: true }));
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign NDA. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.4)" }}>
      Loading...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 720 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#fff", fontWeight: 400, marginBottom: 8 }}>
            Non-Disclosure Agreement
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", lineHeight: 1.6 }}>
            Before accessing the GovCert platform as an advisor, you must read and sign the following agreement.
          </p>
        </div>

        {/* NDA document */}
        <div style={{ background: "#fff", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow-lg)", marginBottom: 24 }}>

          {/* Doc header */}
          <div style={{ padding: "20px 28px", background: "var(--cream)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>📄</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>GovCert Advisor Non-Disclosure Agreement</div>
              <div style={{ fontSize: 12, color: "var(--ink3)" }}>Version 1.0 · House Strategies Group LLC · Tampa, Florida</div>
            </div>
          </div>

          {/* NDA text */}
          <div style={{ padding: "28px", maxHeight: 360, overflowY: "auto", background: "#fff" }}>
            {ndaText.split("\n\n").map((para, i) => (
              <p key={i} style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.8, marginBottom: 16, whiteSpace: "pre-wrap" }}>{para}</p>
            ))}
          </div>

          {/* Signature section */}
          <div style={{ padding: "24px 28px", borderTop: "1px solid var(--border)", background: "var(--cream)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 16 }}>
              Electronic Signature
            </div>

            {error && (
              <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>
                Your Full Legal Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Jane Marie Smith"
                style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", boxSizing: "border-box" as const, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", letterSpacing: ".02em" }}
              />
              <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 4 }}>
                Type your name exactly as it appears on your government-issued ID
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20, padding: "14px 16px", background: "#fff", borderRadius: "var(--r)", border: "1px solid var(--border2)" }}>
              <input
                type="checkbox"
                id="agree-checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, cursor: "pointer", flexShrink: 0 }}
              />
              <label htmlFor="agree-checkbox" style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6, cursor: "pointer" }}>
                I have read and fully understand the GovCert Advisor Non-Disclosure Agreement. I agree to be legally bound by its terms. I understand this constitutes a legally binding electronic signature under the E-SIGN Act and UETA.
              </label>
            </div>

            {/* Signature preview */}
            {fullName.trim() && (
              <div style={{ padding: "16px 20px", background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 4 }}>Signature</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontStyle: "italic" }}>{fullName}</div>
                </div>
                <div style={{ textAlign: "right" as const }}>
                  <div style={{ fontSize: 11, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 4 }}>Date & Time</div>
                  <div style={{ fontSize: 13, color: "var(--ink)", fontFamily: "'DM Mono', monospace" }}>{new Date().toLocaleString()}</div>
                </div>
              </div>
            )}

            <button
              onClick={handleSign}
              disabled={signing || !fullName.trim() || !agreed}
              style={{ width: "100%", padding: "14px", background: !fullName.trim() || !agreed ? "var(--cream2)" : "var(--gold)", border: "none", borderRadius: "var(--r)", color: !fullName.trim() || !agreed ? "var(--ink4)" : "#fff", fontSize: 15, fontWeight: 500, cursor: !fullName.trim() || !agreed ? "not-allowed" : "pointer", boxShadow: fullName.trim() && agreed ? "0 4px 24px rgba(200,155,60,.4)" : "none", transition: "all .2s" }}>
              {signing ? "Signing..." : "I Agree — Sign & Access GovCert →"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.3)", lineHeight: 1.6 }}>
          This agreement is recorded with your name, timestamp, and IP address.<br />
          Questions? Contact your GovCert administrator before signing.
        </div>
      </div>
    </div>
  );
}