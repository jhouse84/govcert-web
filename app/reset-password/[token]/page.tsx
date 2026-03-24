"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = React.use(params);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app"}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setError(data.error || "Reset failed.");
      }
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

        {success ? (
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Password reset.</h1>
            <p style={{ fontSize: 14, color: "var(--ink3)" }}>Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Set new password</h1>
            <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 24 }}>Choose a strong password for your account.</p>

            {error && (
              <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--ink3)", marginBottom: 5, fontWeight: 500 }}>New Password</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--ink3)", marginBottom: 5, fontWeight: 500 }}>Confirm Password</label>
                <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat password"
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  style={{ width: "100%", padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
              </div>
              <button onClick={handleSubmit} disabled={loading}
                style={{ padding: "13px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                {loading ? "Resetting..." : "Reset Password →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}