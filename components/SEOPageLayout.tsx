import React from "react";

interface SEOPageLayoutProps {
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function SEOPageLayout({ badge, title, subtitle, children }: SEOPageLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", background: "#FDF8F0" }}>
      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 48px", background: "#0B1929", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "#C89B3C", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
            Gov<em style={{ color: "#E8B84B", fontStyle: "normal" }}>Cert</em>
          </span>
        </a>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="tel:+14349815295" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, color: "rgba(255,255,255,.7)", textDecoration: "none" }}>
            {"📞"} (434) 981-5295
          </a>
          <a href="/login" style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.85)", border: "1px solid rgba(255,255,255,.12)", textDecoration: "none" }}>Sign In</a>
          <a href="/register" style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: "linear-gradient(135deg, #C89B3C, #E8B84B)", color: "#fff", textDecoration: "none" }}>Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(180deg, #0B1929 0%, #1A2F45 100%)", padding: "80px 48px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "4px 14px", background: "rgba(200,155,60,.2)", border: "1px solid rgba(200,155,60,.3)", borderRadius: 100, marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#E8B84B", textTransform: "uppercase", letterSpacing: ".1em" }}>{badge}</span>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 5vw, 52px)", color: "#fff", fontWeight: 400, lineHeight: 1.1, marginBottom: 16, maxWidth: 800, margin: "0 auto 16px" }}>{title}</h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,.55)", maxWidth: 640, margin: "0 auto", fontWeight: 300, lineHeight: 1.6 }}>{subtitle}</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        <article style={{ fontSize: 16, color: "#2A3548", lineHeight: 1.8 }}>
          {children}
        </article>

        {/* CTA */}
        <div style={{ background: "linear-gradient(135deg, #0B1929, #1A2F45)", borderRadius: 16, padding: "40px 32px", textAlign: "center", marginTop: 48 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", fontWeight: 400, marginBottom: 12 }}>Ready to start your certification?</h3>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.55)", marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
            Free eligibility check. AI-drafted application. Human help included.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/register" style={{ padding: "14px 32px", background: "linear-gradient(135deg, #C89B3C, #E8B84B)", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>Start Free {"→"}</a>
            <a href="tel:+14349815295" style={{ padding: "14px 32px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, color: "#fff", fontSize: 15, textDecoration: "none" }}>{"📞"} Call (434) 981-5295</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#0B1929", padding: "40px 48px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>{"©"} 2024-2026 House Strategies Group LLC. All rights reserved. | <a href="/" style={{ color: "rgba(255,255,255,.4)", textDecoration: "none" }}>govcert.ai</a></p>
      </div>
    </div>
  );
}
