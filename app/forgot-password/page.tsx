"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email) return setError("Email is required.");
    setLoading(true);
    setError("");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "48px 40px", maxWidth: 440, width: "100%", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 500 }}>
            Gov<em style={{ color: "var(--gold)", fontStyle: "normal" }}>Cert</em>
          </span>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 10 }}>Check your inbox</h1>
            <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 24 }}>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your spam folder if you don't see it.
            </p>
            <a href="/login" style={{ fontSize: 13, color: "var(--gold)", fontWeight: 500 }}>← Back to login</a>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Forgot password?</h1>
            <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 24, lineHeight: 1.6 }}>Enter your email and we'll send you a reset link.</p>

            {error && (
              <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--ink3)", marginBottom: 5, fontWeight: 500 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="you@company.com"
                style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", padding: "13px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(200,155,60,.35)", marginBottom: 16 }}>
              {loading ? "Sending..." : "Send Reset Link →"}
            </button>

            <div style={{ textAlign: "center" as const }}>
              <a href="/login" style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>← Back to login</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}