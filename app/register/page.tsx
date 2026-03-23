"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "CONSULTING",
    name: "Managed Service",
    tagline: "We handle everything for you",
    price: "$0 / mo",
    priceNote: "during beta — pricing announced at launch",
    badge: "Most Popular",
    badgeColor: "var(--gold)",
    icon: "✦",
    description: "A dedicated GovCert advisor manages your entire certification application. You provide information, review drafts, and approve — we do the rest.",
    features: [
      "Dedicated GovCert advisor assigned to your account",
      "Advisor drafts all narratives using AI + your documents",
      "You review and approve every section before submission",
      "PPQ emails sent to your references automatically",
      "Full eOffer submission package prepared for you",
      "Ongoing compliance monitoring and renewal alerts",
    ],
    ideal: "Best for businesses that want a fully managed, hands-off experience",
  },
  {
    id: "PLATFORM",
    name: "Self-Service Platform",
    tagline: "AI tools, you drive",
    price: "$0 / mo",
    priceNote: "during beta — pricing announced at launch",
    badge: "Full Control",
    badgeColor: "var(--blue,#1A3F7A)",
    icon: "⚡",
    description: "Access GovCert's full AI toolkit and manage your certification application yourself. Generate narratives, upload documents, and build your submission at your own pace.",
    features: [
      "Full access to all AI narrative generation tools",
      "Upload documents and auto-extract content",
      "Voice input on every section",
      "Real-time character counters for eOffer limits",
      "PPQ email system for past performance references",
      "eOffer submission package with copy-paste fields",
    ],
    ideal: "Best for businesses that want full control and love using AI tools",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(2); // Skip plan selection — everyone starts free
  const [selectedPlan, setSelectedPlan] = useState<string | null>("PLATFORM");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", businessName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function selectPlan(planId: string) {
    setSelectedPlan(planId);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          subscriptionTier: selectedPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);

  return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", position: "relative", overflow: "hidden" }}>

      {/* Focus + shimmer styles */}
      <style>{`
        @keyframes goldShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        input:focus {
          border-color: #C89B3C !important;
          box-shadow: 0 0 0 3px rgba(200,155,60,.15) !important;
        }
      `}</style>

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0B1929 0%, #1A3357 50%, #0B1929 100%)", opacity: 0.95 }} />

      {/* Subtle decorative glow */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(200,155,60,.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, padding: "40px 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
            {[
              { n: 2, label: "Create Account" },
              { n: 3, label: "Verify Email" },
            ].map((s, i) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= s.n ? "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)" : "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: step >= s.n ? "#fff" : "rgba(255,255,255,.3)", fontWeight: 600, transition: "all .3s cubic-bezier(.4,0,.2,1)", boxShadow: step >= s.n ? "0 2px 8px rgba(200,155,60,.3)" : "none" }}>
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span style={{ fontSize: 12, color: step >= s.n ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.3)", transition: "all .3s" }}>{s.label}</span>
                </div>
                {i < 1 && <div style={{ width: 32, height: 1, background: step > s.n ? "var(--gold)" : "rgba(255,255,255,.15)", transition: "background .3s" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1 — Plan Selection */}
        {step === 1 && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, color: "#fff", fontWeight: 400, marginBottom: 8, letterSpacing: "-.03em" }}>
                Choose your experience
              </h1>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,.5)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
                Both plans are free during our beta. Select the experience that fits how you like to work.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
              {PLANS.map(plan => (
                <div key={plan.id}
                  onClick={() => selectPlan(plan.id)}
                  style={{ background: "rgba(255,255,255,.04)", backdropFilter: "blur(16px)", border: `2px solid ${selectedPlan === plan.id ? "var(--gold)" : "rgba(255,255,255,.08)"}`, borderRadius: 16, padding: "32px 28px", cursor: "pointer", transition: "all .25s cubic-bezier(.4,0,.2,1)", position: "relative", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.04)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.08), 0 20px 48px rgba(0,0,0,.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = selectedPlan === plan.id ? "var(--gold)" : "rgba(255,255,255,.08)"; e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.04)"; }}>

                  {/* Badge */}
                  <div style={{ position: "absolute", top: 20, right: 20, padding: "4px 10px", background: plan.badgeColor, borderRadius: 100, fontSize: 10, fontWeight: 600, color: "#fff", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>
                    {plan.badge}
                  </div>

                  {/* Icon + Name */}
                  <div style={{ fontSize: 32, marginBottom: 12, color: "var(--gold2)" }}>{plan.icon}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", fontWeight: 400, marginBottom: 4, letterSpacing: "-.03em" }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 20 }}>{plan.tagline}</div>

                  {/* Price */}
                  <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--gold2)", fontWeight: 400, lineHeight: 1, letterSpacing: "-.03em" }}>{plan.price}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4 }}>{plan.priceNote}</div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.55)", lineHeight: 1.7, marginBottom: 20 }}>{plan.description}</p>

                  {/* Features */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: "var(--gold2)", flexShrink: 0, marginTop: 2, fontSize: 12 }}>✓</span>
                        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Ideal for */}
                  <div style={{ padding: "10px 14px", background: "rgba(200,155,60,.08)", borderRadius: 8, border: "1px solid rgba(200,155,60,.15)" }}>
                    <div style={{ fontSize: 11.5, color: "rgba(200,155,60,.8)", lineHeight: 1.5 }}>{plan.ideal}</div>
                  </div>

                  {/* Select button */}
                  <button style={{
                    width: "100%", marginTop: 20, padding: "13px",
                    background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                    border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500,
                    cursor: "pointer", boxShadow: "0 4px 24px rgba(200,155,60,.3)", fontFamily: "'DM Sans', sans-serif",
                    transition: "all .25s cubic-bezier(.4,0,.2,1)"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 28px rgba(200,155,60,.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(200,155,60,.3)"; e.currentTarget.style.transform = "none"; }}>
                    Get Started — {plan.name} →
                  </button>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.3)" }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: "var(--gold2)", textDecoration: "none", fontWeight: 500, transition: "color .25s cubic-bezier(.4,0,.2,1)" }}>Sign in</a>
            </div>
          </div>
        )}

        {/* STEP 2 — Account Details */}
        {step === 2 && (
          <div style={{ maxWidth: 500, margin: "0 auto" }}>

            {/* Selected plan indicator */}
            <div style={{ background: "rgba(200,155,60,.08)", border: "1px solid rgba(200,155,60,.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(16px)" }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "rgba(200,155,60,.6)", marginBottom: 2 }}>Selected Plan</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--gold2)" }}>
                  {selectedPlanData?.icon} {selectedPlanData?.name}
                </div>
              </div>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer", textDecoration: "underline", transition: "color .25s cubic-bezier(.4,0,.2,1)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.7)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}>
                Change
              </button>
            </div>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#fff", fontWeight: 400, marginBottom: 6, letterSpacing: "-.03em" }}>
                Create your account
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.4)" }}>You'll verify your email after signing up</p>
            </div>

            <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: "36px 32px", backdropFilter: "blur(16px)", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.04)" }}>
              {error && (
                <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 20, color: "var(--red)", fontSize: 13 }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>First Name</label>
                    <input type="text" value={form.firstName} onChange={e => update("firstName", e.target.value)} required
                      placeholder="Jane"
                      style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "var(--r)", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif", transition: "all .25s cubic-bezier(.4,0,.2,1)" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Last Name</label>
                    <input type="text" value={form.lastName} onChange={e => update("lastName", e.target.value)} required
                      placeholder="Smith"
                      style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "var(--r)", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif", transition: "all .25s cubic-bezier(.4,0,.2,1)" }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Business Email</label>
                  <input type="email" value={form.email} onChange={e => update("email", e.target.value)} required
                    placeholder="you@company.com"
                    style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "var(--r)", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif", transition: "all .25s cubic-bezier(.4,0,.2,1)" }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Password</label>
                  <input type="password" value={form.password} onChange={e => update("password", e.target.value)} required
                    placeholder="Min. 8 characters"
                    style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "var(--r)", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif", transition: "all .25s cubic-bezier(.4,0,.2,1)" }} />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.5)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".08em" }}>Confirm Password</label>
                  <input type="password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} required
                    placeholder="........"
                    style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,.05)", border: `1px solid ${form.confirmPassword && form.password !== form.confirmPassword ? "var(--red)" : "rgba(255,255,255,.12)"}`, borderRadius: "var(--r)", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif", transition: "all .25s cubic-bezier(.4,0,.2,1)" }} />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>Passwords do not match</div>
                  )}
                </div>

                <div style={{ marginBottom: 20, padding: "12px 14px", background: "rgba(255,255,255,.03)", borderRadius: "var(--r)", fontSize: 12, color: "rgba(255,255,255,.35)", lineHeight: 1.6, border: "1px solid rgba(255,255,255,.06)" }}>
                  By creating an account you agree to GovCert's Terms of Service and Privacy Policy. Your account will be secured and your data encrypted.
                </div>

                <button type="submit" disabled={loading || (!!form.confirmPassword && form.password !== form.confirmPassword)}
                  style={{
                    width: "100%", padding: "13px",
                    background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 50%, #C89B3C 100%)",
                    backgroundSize: "200% auto",
                    animation: loading ? "none" : "goldShimmer 3s linear infinite",
                    border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 500,
                    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: "0 4px 24px rgba(200,155,60,.35), 0 1px 3px rgba(0,0,0,.1)",
                    transition: "all .25s cubic-bezier(.4,0,.2,1)"
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = "0 6px 32px rgba(200,155,60,.5), 0 1px 3px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(200,155,60,.35), 0 1px 3px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "none"; }}>
                  {loading ? "Creating account..." : "Create Account →"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,.35)" }}>
                Already have an account?{" "}
                <a href="/login" style={{ color: "var(--gold2)", textDecoration: "none", fontWeight: 500, transition: "color .25s cubic-bezier(.4,0,.2,1)" }}>Sign in</a>
              </p>
            </div>
          </div>
        )}

        {/* STEP 3 — Check Email */}
        {step === 3 && (
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "48px 40px", textAlign: "center", backdropFilter: "blur(16px)", boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.04)" }}>
              <div style={{ fontSize: 52, marginBottom: 20 }}>📬</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#fff", fontWeight: 400, marginBottom: 10, letterSpacing: "-.03em" }}>
                Check your email
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginBottom: 8, lineHeight: 1.7 }}>
                We sent a verification link to <strong style={{ color: "var(--gold2)" }}>{form.email}</strong>.
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginBottom: 32, lineHeight: 1.6 }}>
                Click the link in the email to verify your account and access your {selectedPlanData?.name} dashboard. The link expires in 24 hours.
              </p>

              {/* What to expect */}
              <div style={{ background: "rgba(200,155,60,.08)", border: "1px solid rgba(200,155,60,.15)", borderRadius: 10, padding: "18px 20px", marginBottom: 28, textAlign: "left" as const, backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--gold2)", marginBottom: 12 }}>What happens next</div>
                {selectedPlan === "CONSULTING" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      "Verify your email — click the link we just sent",
                      "A GovCert advisor will be assigned to your account within 1 business day",
                      "Your advisor will reach out to gather information and begin your application",
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(200,155,60,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--gold2)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      "Verify your email — click the link we just sent",
                      "Log in and land on your certification portal",
                      "Start your application — AI tools are ready to use immediately",
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(200,155,60,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--gold2)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <a href="/login" style={{
                display: "block", padding: "13px",
                background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none",
                boxShadow: "0 4px 24px rgba(200,155,60,.3)", marginBottom: 12,
                transition: "all .25s cubic-bezier(.4,0,.2,1)"
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 28px rgba(200,155,60,.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(200,155,60,.3)"; e.currentTarget.style.transform = "none"; }}>
                Go to Login →
              </a>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>
                Didn't receive the email? Check your spam folder or{" "}
                <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer", textDecoration: "underline", transition: "color .25s cubic-bezier(.4,0,.2,1)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}>
                  try again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
