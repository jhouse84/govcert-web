"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || "provider";
  const error = searchParams.get("error") || "unknown_error";

  const errorMessages: Record<string, string> = {
    token_exchange_failed: "The authorization code could not be exchanged for tokens. This can happen if the code expired — please try again.",
    callback_failed: "Something went wrong processing the connection. Please try again.",
    missing_params: "The OAuth callback was missing required parameters. Please try again.",
    access_denied: "You declined the authorization request. No data was connected.",
    unknown_provider: "Unknown integration provider.",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
          Connection Failed
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 6, lineHeight: 1.6 }}>
          Could not connect <strong style={{ color: "var(--navy)" }}>{provider.charAt(0).toUpperCase() + provider.slice(1)}</strong>.
        </p>
        <p style={{ fontSize: 13, color: "var(--ink4)", marginBottom: 28, lineHeight: 1.6 }}>
          {errorMessages[error] || `Error: ${error}`}
        </p>
        <a href="/clients" style={{ display: "inline-block", padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
          ← Back to Clients
        </a>
      </div>
    </div>
  );
}

export default function OAuthErrorPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
        Loading...
      </div>
    }>
      <OAuthErrorContent />
    </Suspense>
  );
}