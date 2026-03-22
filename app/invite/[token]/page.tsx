"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = React.use(params);

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", password: "", confirm: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invites/${token}`);
        const data = await res.json();
        if (res.ok) setInvite(data);
        else setError(data.error || "Invalid invitation.");
      } catch {
        setError("Something went wrong loading this invitation.");
      } finally {
        setLoading(false);
      }
    }
    fetchInvite();
  }, [token]);

  async function handleSubmit() {
    setFormError("");
    if (!form.firstName || !form.lastName) return setFormError("First and last name are required.");
    if (form.password.length < 8) return setFormError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setFormError("Passwords do not match.");

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // ADVISOR must sign NDA before accessing dashboard
      if (data.user.role === "ADVISOR") {
        router.push("/nda");
      } else {
        router.push("/portal");
      }
      } else {
        setFormError(data.error || "Failed to create account.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading invitation...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "48px 40px", maxWidth: 480, width: "100%", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ marginBottom: 28, textAlign: "center" as const }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 500 }}>
            Gov<em style={{ color: "var(--gold)", fontStyle: "normal" }}>Cert</em>
          </span>
        </div>

        {error ? (
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Invitation unavailable</h1>
            <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 24 }}>{error}</p>
            <a href="/login" style={{ fontSize: 13, color: "var(--gold)" }}>Go to login →</a>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
                You've been invited
              </h1>
              <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.6 }}>
                Set up your GovCert account to access your certification workspace.
              </p>
              <div style={{ marginTop: 10, padding: "8px 16px", background: "var(--cream)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", display: "inline-block" }}>
                {invite?.email}
              </div>
            </div>

            {formError && (
              <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--red)" }}>
                {formError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--ink3)", marginBottom: 5, fontWeight: 500 }}>First Name</label>
                  <input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="Tricia"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--ink3)", marginBottom: 5, fontWeight: 500 }}>Last Name</label>
                  <input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Kelly"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--ink3)", marginBottom: 5, fontWeight: 500 }}>Password</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--ink3)", marginBottom: 5, fontWeight: 500 }}>Confirm Password</label>
                <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat password"
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
              </div>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: "13px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, boxShadow: "0 4px 16px rgba(200,155,60,.35)", marginTop: 4 }}>
                {submitting ? "Creating account..." : "Create Account & Sign In →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}