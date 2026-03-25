"use client";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>

      {/* Shimmer keyframe for CTA button */}
      <style>{`
        @keyframes goldShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 48px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(11,25,41,.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,.07)" : "none",
        boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,.15)" : "none",
        transition: "all .3s cubic-bezier(.4,0,.2,1)"
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
            Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
          </span>
        </a>
        <div style={{ display: "flex", gap: 28 }}>
          {["Demo", "Features", "Certifications", "Pricing"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ color: "rgba(255,255,255,.6)", textDecoration: "none", fontSize: 13.5, transition: "color .25s cubic-bezier(.4,0,.2,1)", letterSpacing: ".01em" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.9)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.6)")}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/login" style={{ padding: "8px 20px", borderRadius: "var(--r)", fontSize: 13, fontWeight: 500, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.85)", border: "1px solid rgba(255,255,255,.12)", textDecoration: "none", backdropFilter: "blur(8px)", transition: "all .25s cubic-bezier(.4,0,.2,1)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; }}>Sign In</a>
          <a href="/register" style={{ padding: "8px 20px", borderRadius: "var(--r)", fontSize: 13, fontWeight: 500, background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)", color: "#fff", textDecoration: "none", transition: "all .25s cubic-bezier(.4,0,.2,1)", boxShadow: "0 2px 12px rgba(200,155,60,.3)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(200,155,60,.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(200,155,60,.3)"; e.currentTarget.style.transform = "none"; }}>Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: "relative", height: "100vh", minHeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(11,25,41,.75) 0%,rgba(11,25,41,.50) 40%,rgba(11,25,41,.80) 100%), url(https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=1800&q=80&auto=format&fit=crop) center/cover no-repeat" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 860, padding: "0 24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(200,155,60,.18)", border: "1px solid rgba(200,155,60,.3)", borderRadius: 100, padding: "5px 14px", marginBottom: 28, backdropFilter: "blur(8px)" }}>
            <div style={{ width: 6, height: 6, background: "var(--gold2)", borderRadius: "50%" }} />
            <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--gold-lt)", letterSpacing: ".08em", textTransform: "uppercase" }}>Government Certification Automation</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(52px,7vw,88px)", color: "#fff", lineHeight: 0.95, fontWeight: 300, letterSpacing: "-.03em", marginBottom: 22 }}>
            Certifications that<br /><strong style={{ fontWeight: 500, color: "var(--gold2)" }}>open doors</strong>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.60)", maxWidth: 580, margin: "0 auto 38px", fontWeight: 300, lineHeight: 1.65 }}>
            Automate your 8(a), GSA MAS, OASIS+, WOSB, HUBZone, and MBE certification applications — from document collection to submission.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/register" style={{
                padding: "14px 34px",
                background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 50%, #C89B3C 100%)",
                backgroundSize: "200% auto",
                animation: "goldShimmer 3s linear infinite",
                border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 500, textDecoration: "none",
                boxShadow: "0 4px 24px rgba(200,155,60,.4), 0 1px 3px rgba(0,0,0,.1)",
                transition: "all .25s cubic-bezier(.4,0,.2,1)"
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 32px rgba(200,155,60,.55), 0 1px 3px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(200,155,60,.4), 0 1px 3px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "none"; }}>
                Start Free Trial →
              </a>
              <a href="/register" style={{ padding: "14px 32px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.18)", borderRadius: "var(--r)", color: "#fff", fontSize: 15, textDecoration: "none", backdropFilter: "blur(8px)", transition: "all .25s cubic-bezier(.4,0,.2,1)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.28)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.18)"; }}>
                Start an Application →
              </a>
            </div>
            <a href="#demo" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.6)", fontSize: 14, textDecoration: "none", transition: "color .25s cubic-bezier(.4,0,.2,1)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.9)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.6)")}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "rgba(200,155,60,.25)", border: "1px solid rgba(200,155,60,.4)" }}>
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M1 1L9 6L1 11V1Z" fill="white" /></svg>
              </span>
              Watch the Demo
            </a>
          </div>
        </div>
        {/* Stats glass panel */}
        <div style={{ position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 48, zIndex: 2, background: "rgba(255,255,255,.06)", backdropFilter: "blur(16px)", borderRadius: 16, padding: "24px 48px", border: "1px solid rgba(255,255,255,.1)", boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
          {[["$700B+", "Federal Contracts Annually"], ["170K+", "Certified Small Businesses"], ["80%", "Faster with GovCert"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "#fff", fontWeight: 400, lineHeight: 1, letterSpacing: "-.03em" }}>{v}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DEMO VIDEO */}
      <div id="demo" style={{ background: "var(--cream)", padding: "88px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 12 }}>See It In Action</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,3.5vw,42px)", color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 10, letterSpacing: "-.03em" }}>Watch how GovCert works</h2>
          <p style={{ fontSize: 15, color: "var(--ink3)", maxWidth: 600, margin: "0 auto 28px", fontWeight: 300, lineHeight: 1.6 }}>
            Built by the founders of House Strategies Group — a government contracting firm that spent months assembling certification applications by hand. We knew there had to be an easier way.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.04)", border: "1px solid rgba(200,155,60,.12)", background: "var(--navy)" }}>
                <iframe src="https://www.youtube.com/embed/PhevgTFZiOg" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>GovCert Overview</div>
              <div style={{ fontSize: 12, color: "var(--ink3)" }}>What the platform does and how it saves you time</div>
            </div>
            <div>
              <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.04)", border: "1px solid rgba(200,155,60,.12)", background: "var(--navy)" }}>
                <iframe src="https://www.youtube.com/embed/SVfWc-31Xbw" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Full Platform Demo</div>
              <div style={{ fontSize: 12, color: "var(--ink3)" }}>Walk through every feature from upload to submission</div>
            </div>
          </div>
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 14 }}>
            <a href="/register" style={{
              padding: "14px 34px",
              background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 50%, #C89B3C 100%)",
              backgroundSize: "200% auto",
              animation: "goldShimmer 3s linear infinite",
              border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 500, textDecoration: "none",
              boxShadow: "0 4px 24px rgba(200,155,60,.4)",
              transition: "all .25s cubic-bezier(.4,0,.2,1)"
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
              Start Your Certification →
            </a>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink4)", marginTop: 14, fontWeight: 300 }}>
            Free to start. No credit card required.
          </p>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ background: "var(--navy)", padding: "88px 0" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ marginBottom: 56, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 12 }}>Features</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(34px,4vw,52px)", color: "#fff", fontWeight: 400, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-.03em" }}>Everything you need to certify</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.45)", maxWidth: 560, margin: "0 auto", fontWeight: 300 }}>From document collection to agency submission, GovCert handles the complexity.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "rgba(255,255,255,.05)", borderRadius: 14, overflow: "hidden" }}>
            {[
              { icon: "🤖", title: "AI-Powered Applications", body: "Our AI reviews your documents, flags issues, and auto-fills application forms with verified data." },
              { icon: "📊", title: "Financial Integration", body: "Connect QuickBooks or FreshBooks to automatically pull revenue data required for size certifications." },
              { icon: "📅", title: "Compliance Calendar", body: "Never miss a renewal. Automated reminders for SAM.gov, CAGE codes, and certification expirations." },
              { icon: "🔒", title: "Secure Document Vault", body: "Bank-level encryption for all sensitive documents. Share securely with agencies and attorneys." },
              { icon: "📈", title: "Status Tracking", body: "Real-time status updates across all your certifications. Know exactly where every application stands." },
              { icon: "⚡", title: "Instant SAM.gov Sync", body: "Direct integration with SAM.gov for registration verification and automatic data population." },
            ].map(f => (
              <div key={f.title} style={{ padding: "40px 36px", background: "rgba(255,255,255,.02)", backdropFilter: "blur(16px)", transition: "all .25s cubic-bezier(.4,0,.2,1)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ width: 44, height: 44, background: "var(--gold-bg)", border: "1px solid rgba(200,155,60,.25)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 20 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 8, letterSpacing: "-.01em" }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.45)", lineHeight: 1.65, fontWeight: 300 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CERTIFICATIONS */}
      <div id="certifications" style={{ padding: "88px 0" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 12 }}>Certifications</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(34px,4vw,52px)", color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-.03em" }}>Every certification, covered</h2>
            <p style={{ fontSize: 16, color: "var(--ink3)", maxWidth: 560, fontWeight: 300, lineHeight: 1.7 }}>GovCert supports all major federal and state certifications for small and disadvantaged businesses.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { badge: "SBA", badgeColor: "#1A3F7A", badgeBg: "#E8EEF8", title: "8(a) Business Development", body: "Nine-year program for socially and economically disadvantaged businesses. Access to sole-source contracts up to $4M." },
              { badge: "GSA", badgeColor: "#1A6644", badgeBg: "#E6F4EE", title: "GSA Multiple Award Schedule", body: "Pre-negotiated contracts with federal agencies. The fastest path to consistent government revenue." },
              { badge: "GSA", badgeColor: "#1A6644", badgeBg: "#E6F4EE", title: "GSA OASIS+", body: "Best-in-Class IDIQ for professional services across 13 domains. $60B+ vehicle with scorecard-based evaluation." },
              { badge: "SBA", badgeColor: "#8A5E10", badgeBg: "#FBF0DC", title: "WOSB / EDWOSB", body: "Women-Owned Small Business certification. Access to set-aside contracts in underrepresented industries." },
              { badge: "SBA", badgeColor: "#1A3F7A", badgeBg: "#E8EEF8", title: "HUBZone", body: "Historically Underutilized Business Zone program. 10% price evaluation preference on full and open competitions." },
              { badge: "State", badgeColor: "#5A1A6A", badgeBg: "#F0E8F8", title: "MBE / DBE", body: "Minority and Disadvantaged Business Enterprise certifications for state and local government contracts." },
              { badge: "SAM", badgeColor: "#1A6644", badgeBg: "#E6F4EE", title: "SAM.gov Registration", body: "Required for all federal contracting. We handle initial registration and annual renewals automatically." },
            ].map(c => (
              <div key={c.title} style={{ background: "rgba(255,255,255,.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(200,155,60,.12)", borderRadius: "var(--rl)", padding: 28, position: "relative", overflow: "hidden", transition: "all .25s cubic-bezier(.4,0,.2,1)", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.04)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.08), 0 20px 48px rgba(0,0,0,.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.04)"; }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--gold), var(--gold2))" }} />
                <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 100, marginBottom: 16, color: c.badgeColor, background: c.badgeBg }}>{c.badge}</span>
                <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 7, letterSpacing: "-.01em" }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.65 }}>{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING — Two-Part: Generation Fees + Maintenance */}
      <div id="pricing" style={{ background: "var(--navy)", padding: "88px 0" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ marginBottom: 48, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(34px,4vw,52px)", color: "#fff", fontWeight: 400, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-.03em" }}>A fraction of what consultants charge</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.45)", maxWidth: 600, margin: "0 auto", fontWeight: 300 }}>One-time fee to generate your application. Optional monthly subscription to maintain your certifications.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 100, padding: "6px 16px", marginTop: 16 }}>
              <div style={{ width: 8, height: 8, background: "#22C55E", borderRadius: "50%" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#22C55E" }}>FREE DURING BETA — All features unlocked</span>
            </div>
          </div>

          {/* Part 1: Get Certified — Comparison Table */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 16 }}>Get Certified — One-Time Application Fee</div>
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--rl)", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", padding: "14px 28px", borderBottom: "1px solid rgba(255,255,255,.08)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>
                <div style={{ color: "rgba(255,255,255,.4)" }}>Certification</div>
                <div style={{ color: "rgba(255,255,255,.4)" }}>Traditional Consultant</div>
                <div style={{ color: "var(--gold2)" }}>GovCert</div>
                <div style={{ color: "rgba(34,197,94,.7)" }}>You Save</div>
              </div>
              {/* Rows */}
              {[
                { cert: "GSA Multiple Award Schedule", consultant: "$6,000 – $50,000", price: "$1,999", save: "Up to 96%", popular: true },
                { cert: "8(a) Business Development", consultant: "$3,000 – $5,000", price: "$2,499", save: "Up to 50%", popular: true },
                { cert: "GSA OASIS+", consultant: "$10,000 – $35,000", price: "$2,999", save: "Up to 91%", popular: true },
                { cert: "Bundle: 8(a) + GSA MAS", consultant: "$10,000 – $30,000", price: "$3,499", save: "Up to 88%", popular: false },
              ].map(row => (
                <div key={row.cert} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,.05)", alignItems: "center" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{row.cert}</span>
                    {row.popular && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 100, background: "rgba(200,155,60,.2)", color: "var(--gold2)", fontWeight: 600 }}>POPULAR</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)", textDecoration: "line-through" }}>{row.consultant}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--gold2)", fontWeight: 400 }}>{row.price}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#22C55E" }}>{row.save}</div>
                </div>
              ))}
            </div>
            {/* Callouts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 20 }}>
              {[
                { icon: "⚡", text: "Days, not months" },
                { icon: "🤖", text: "AI-powered, 24/7" },
                { icon: "🔄", text: "Unlimited revisions" },
                { icon: "🔍", text: "GovCert Review included" },
              ].map(c => (
                <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(255,255,255,.03)", borderRadius: "var(--r)", border: "1px solid rgba(255,255,255,.06)" }}>
                  <span style={{ fontSize: 16 }}>{c.icon}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: 500 }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Part 2: Stay Certified — Maintenance Tiers */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 16 }}>Stay Certified — Monthly Maintenance</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                { name: "Essential", price: "$49", period: "/mo", annual: "$499/yr", features: ["SAM.gov registration monitoring", "Certification expiration alerts", "Secure document vault", "1 GovCert Review per month"], featured: false },
                { name: "Professional", price: "$99", period: "/mo", annual: "$999/yr", features: ["Everything in Essential", "Unlimited GovCert Reviews", "Data call response assistance", "Compliance calendar", "Advisor chat support"], featured: true },
                { name: "Enterprise", price: "$199", period: "/mo", annual: "$1,999/yr", features: ["Everything in Professional", "Priority support", "Multi-certification management", "Advisor dashboard access", "Custom compliance reporting"], featured: false },
              ].map(plan => (
                <div key={plan.name} style={{
                  background: plan.featured ? "rgba(200,155,60,.08)" : "rgba(255,255,255,.03)",
                  border: `1px solid ${plan.featured ? "rgba(200,155,60,.3)" : "rgba(255,255,255,.08)"}`,
                  borderRadius: "var(--rl)", padding: 28, transition: "all .25s cubic-bezier(.4,0,.2,1)",
                  transform: plan.featured ? "scale(1.02)" : "none",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = plan.featured ? "scale(1.04)" : "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = plan.featured ? "scale(1.02)" : "none"; }}>
                  {plan.featured && <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 8 }}>Recommended</div>}
                  <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.4)", fontWeight: 600, marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "#fff", fontWeight: 400, letterSpacing: "-.03em" }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,.4)" }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginBottom: 20 }}>or {plan.annual}</div>
                  <div style={{ marginBottom: 24 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                        <span style={{ color: "var(--gold2)", fontSize: 11 }}>✓</span>
                        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <a href="/register" style={{
                    display: "block", textAlign: "center", padding: "11px",
                    background: plan.featured ? "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)" : "rgba(255,255,255,.06)",
                    border: `1px solid ${plan.featured ? "transparent" : "rgba(255,255,255,.1)"}`,
                    borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none",
                    transition: "all .25s cubic-bezier(.4,0,.2,1)"
                  }}>
                    Start Free →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: "var(--navy2)", borderTop: "1px solid rgba(255,255,255,.07)", padding: "40px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#fff", fontWeight: 500 }}>
          Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>© 2026 GovCert. All rights reserved.</span>
          <a href="/privacy" style={{ fontSize: 12, color: "rgba(255,255,255,.35)", textDecoration: "none", transition: "color .25s cubic-bezier(.4,0,.2,1)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.6)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.35)")}>Privacy Policy</a>
          <a href="/terms" style={{ fontSize: 12, color: "rgba(255,255,255,.35)", textDecoration: "none", transition: "color .25s cubic-bezier(.4,0,.2,1)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.6)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.35)")}>Terms of Service</a>
        </div>
      </div>

    </div>
  );
}
