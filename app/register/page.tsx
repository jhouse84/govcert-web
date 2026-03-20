"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await auth.register(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(11,25,41,.08)" }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: "#0B1929", fontWeight: 400, marginBottom: 6 }}>
            Gov<span style={{ color: "#C89B3C" }}>Cert</span>
          </div>
          <p style={{ color: "#5A7A96", fontSize: 14 }}>Create your account</p>
        </div>

        {error && (
          <div style={{ background: "#FAE8E8", border: "1px solid rgba(139,29,29,.2)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, color: "#8B1D1D", fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B1929", marginBottom: 6 }}>First Name</label>
              <input
                type="text" value={form.firstName} onChange={e => update("firstName", e.target.value)} required
                style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(11,25,41,.16)", borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                placeholder="Jelani"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B1929", marginBottom: 6 }}>Last Name</label>
              <input
                type="text" value={form.lastName} onChange={e => update("lastName", e.target.value)} required
                style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(11,25,41,.16)", borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                placeholder="House"
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B1929", marginBottom: 6 }}>Email</label>
            <input
              type="email" value={form.email} onChange={e => update("email", e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(11,25,41,.16)", borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="you@company.com"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B1929", marginBottom: 6 }}>Password</label>
            <input
              type="password" value={form.password} onChange={e => update("password", e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(11,25,41,.16)", borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ width: "100%", padding: "12px", background: "#C89B3C", border: "none", borderRadius: 6, color: "#fff", fontSize: 15, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account…" : "Create Account ?"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#5A7A96" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#C89B3C", textDecoration: "none", fontWeight: 500 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
