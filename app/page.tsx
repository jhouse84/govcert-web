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
          {["Features", "Certifications", "Pricing"].map(l => (
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
            Automate your 8(a), GSA MAS, WOSB, HUBZone, and MBE certification applications — from document collection to submission.
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
            <a href="#features" style={{ color: "rgba(255,255,255,.5)", fontSize: 14, textDecoration: "none", transition: "color .25s cubic-bezier(.4,0,.2,1)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.8)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.5)")}>
              See How It Works
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

      {/* VIDEO — HOW IT WORKS */}
      <div style={{ background: "var(--cream)", padding: "72px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 48px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 12 }}>See How It Works</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px,3.5vw,42px)", color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-.03em" }}>Your path to certification, simplified</h2>
          <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.04)", border: "1px solid rgba(200,155,60,.12)", background: "var(--navy)" }}>
            <iframe src="https://www.youtube.com/embed/DHH112pNJJM" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          <p style={{ fontSize: 14, color: "var(--ink3)", marginTop: 20, fontWeight: 300, lineHeight: 1.6 }}>
            Learn how GovCert's AI-powered platform helps small businesses identify which certifications they qualify for and automates the application process.
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

      {/* PRICING */}
      <div id="pricing" style={{ background: "var(--navy)", padding: "88px 0" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ marginBottom: 56, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(34px,4vw,52px)", color: "#fff", fontWeight: 400, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-.03em" }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.45)", maxWidth: 560, margin: "0 auto", fontWeight: 300 }}>No hidden fees. Cancel anytime.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { name: "Starter", price: "$149", period: "/mo", desc: "Perfect for consultants managing 1-3 clients", features: ["Up to 3 clients", "2 active certifications", "Document vault (5GB)", "Email support"], featured: false },
              { name: "Professional", price: "$349", period: "/mo", desc: "For growing firms managing multiple certifications", features: ["Up to 15 clients", "Unlimited certifications", "Document vault (50GB)", "QuickBooks integration", "Priority support", "Compliance calendar"], featured: true },
              { name: "Enterprise", price: "Custom", period: "", desc: "For large firms and government contractors", features: ["Unlimited clients", "White-label portal", "API access", "Dedicated account manager", "SLA guarantee", "Custom integrations"], featured: false },
            ].map(plan => (
              <div key={plan.name} style={{
                background: plan.featured ? "rgba(200,155,60,.08)" : "rgba(255,255,255,.04)",
                backdropFilter: "blur(16px)",
                border: `1px solid ${plan.featured ? "rgba(200,155,60,.35)" : "rgba(255,255,255,.09)"}`,
                borderRadius: "var(--rl)", padding: 32, transition: "all .25s cubic-bezier(.4,0,.2,1)",
                boxShadow: plan.featured ? "0 4px 24px rgba(200,155,60,.1)" : "none",
                transform: plan.featured ? "scale(1.03)" : "none"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = plan.featured ? "scale(1.05)" : "translateY(-4px)"; e.currentTarget.style.boxShadow = plan.featured ? "0 8px 40px rgba(200,155,60,.2)" : "0 4px 24px rgba(0,0,0,.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = plan.featured ? "scale(1.03)" : "none"; e.currentTarget.style.boxShadow = plan.featured ? "0 4px 24px rgba(200,155,60,.1)" : "none"; }}>
                {plan.featured && <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold2)", marginBottom: 8 }}>Most Popular</div>}
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.4)", fontWeight: 600, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, color: "#fff", fontWeight: 400, letterSpacing: "-.03em" }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,.4)" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</p>
                <div style={{ marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ color: "var(--gold2)", fontSize: 12 }}>✓</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="/register" style={{
                  display: "block", textAlign: "center", padding: "12px",
                  background: plan.featured ? "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)" : "rgba(255,255,255,.06)",
                  border: `1px solid ${plan.featured ? "transparent" : "rgba(255,255,255,.12)"}`,
                  borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none",
                  boxShadow: plan.featured ? "0 4px 20px rgba(200,155,60,.35)" : "none",
                  transition: "all .25s cubic-bezier(.4,0,.2,1)"
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = plan.featured ? "0 6px 28px rgba(200,155,60,.45)" : "0 2px 12px rgba(255,255,255,.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = plan.featured ? "0 4px 20px rgba(200,155,60,.35)" : "none"; }}>
                  Get Started →
                </a>
              </div>
            ))}
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
