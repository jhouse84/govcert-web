"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = React.use(params);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email/${token}`);
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          // Clear onboarded flag so portal redirects to eligibility welcome
          const onboardKey = `govcert_onboarded_${data.user.id || data.user.email}`;
          localStorage.removeItem(onboardKey);
          localStorage.removeItem("govcert_onboarded"); // legacy
          setStatus("success");
          const dest = "/portal";
          setTimeout(() => router.push(dest), 2500);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }
    verify();
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 500 }}>
            Gov<em style={{ color: "var(--gold)", fontStyle: "normal" }}>Cert</em>
          </span>
        </div>

        {status === "loading" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Verifying your email...</h1>
            <p style={{ fontSize: 14, color: "var(--ink3)" }}>Just a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Email verified.</h1>
            <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 4 }}>You're now logged in. Redirecting to your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Verification failed</h1>
            <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
            <a href="/login" style={{ display: "inline-block", padding: "11px 28px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
              Back to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}