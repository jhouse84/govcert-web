"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await auth.login({ email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Route based on role
      if (data.user.role === "CUSTOMER") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0B1929 0%, #1A3357 50%, #0B1929 100%)", opacity: 0.95 }} />
      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 440, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", fontWeight: 500, letterSpacing: ".02em" }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, fontWeight: 300 }}>Sign in to your account</p>
        </div>

        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 12, padding: "40px 36px", backdropFilter: "blur(12px)" }}>
          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 20, color: "var(--red)", fontSize: 13 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", marginBottom: 7, textTransform: "uppercase", letterSpacing: ".08em" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "11px 14px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "var(--r)", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" as const }}
                placeholder="you@company.com" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", marginBottom: 7, textTransform: "uppercase", letterSpacing: ".08em" }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: "100%", padding: "11px 14px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "var(--r)", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" as const }}
                placeholder="........" />
            </div>
            <div style={{ textAlign: "right", marginBottom: 24 }}>
              <a href="/forgot-password" style={{ fontSize: 12.5, color: "rgba(255,255,255,.4)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--gold2)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}>
                Forgot password?
              </a>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 24px rgba(200,155,60,.4)", transition: "all .2s" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "rgba(255,255,255,.35)" }}>
            No account?{" "}
            <a href="/register" style={{ color: "var(--gold2)", textDecoration: "none", fontWeight: 500 }}>Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
}