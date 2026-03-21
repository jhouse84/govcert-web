"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const STEPS = [
  { id: 1, label: "Select Type", desc: "Choose certification" },
  { id: 2, label: "Select Client", desc: "Who is applying" },
  { id: 3, label: "Eligibility", desc: "Confirm requirements" },
  { id: 4, label: "Business Profile", desc: "Company details" },
  { id: 5, label: "Review", desc: "Confirm & submit" },
];

const CERT_TYPES = [
  { id: "GSA_MAS", label: "GSA Multiple Award Schedule", desc: "Pre-negotiated contracts with federal agencies. Requires 2 years in business and $25K+ revenue.", time: "4-6 months", icon: "🏛️" },
  { id: "EIGHT_A", label: "8(a) Business Development", desc: "SBA program for socially and economically disadvantaged businesses. 9-year program.", time: "3-6 months", icon: "⭐" },
  { id: "WOSB", label: "Women-Owned Small Business", desc: "Set-aside contracts for women-owned businesses in underrepresented industries.", time: "2-4 months", icon: "👩‍💼" },
  { id: "HUBZONE", label: "HUBZone", desc: "Historically Underutilized Business Zone program with 10% price preference.", time: "2-3 months", icon: "📍" },
  { id: "MBE", label: "Minority Business Enterprise", desc: "State and local government certification for minority-owned businesses.", time: "1-3 months", icon: "🤝" },
];

const GSA_SINS = [
  { code: "541511", label: "Custom Computer Programming Services" },
  { code: "541512", label: "Computer Systems Design Services" },
  { code: "541519", label: "Other Computer Related Services" },
  { code: "541611", label: "Management Consulting Services" },
  { code: "541613", label: "Marketing Consulting Services" },
  { code: "541618", label: "Other Management Consulting Services" },
  { code: "541690", label: "Other Scientific & Technical Consulting" },
  { code: "561110", label: "Office Administrative Services" },
  { code: "561210", label: "Facilities Support Services" },
  { code: "611430", label: "Professional & Management Training" },
];

export default function NewCertificationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    certType: "",
    clientId: "",
    yearsInBusiness: "",
    annualRevenue: "",
    selectedSINs: [] as string[],
    ownerName: "",
    ownerTitle: "",
    employeeCount: "",
    naicsCode: "",
    pastPerformance: "",
    qualityControl: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    apiRequest("/api/clients").then(setClients).catch(console.error);
  }, []);

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleSIN = (code: string) => {
    setForm(f => ({
      ...f,
      selectedSINs: f.selectedSINs.includes(code)
        ? f.selectedSINs.filter(s => s !== code)
        : [...f.selectedSINs, code]
    }));
  };

  async function handleSubmit() {
    setLoading(true);
    try {
      await apiRequest("/api/certifications", {
        method: "POST",
        body: JSON.stringify({
          clientId: form.clientId,
          type: form.certType,
          status: "IN_PROGRESS",
        })
      });
      router.push("/certifications");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "⬛" },
    { label: "Clients", href: "/clients", icon: "👥" },
    { label: "Certifications", href: "/certifications", icon: "📋", active: true },
    { label: "Documents", href: "/documents", icon: "📄" },
    { label: "Plan", href: "/plan", icon: "📊" },
  ];

  const inputStyle = { width: "100%", padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const, background: "#fff", fontFamily: "'DM Sans', sans-serif" };
  const labelStyle = { display: "block" as const, fontSize: 12, fontWeight: 500 as const, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".07em" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {navItems.map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: (item as any).active ? "rgba(200,155,60,.15)" : "transparent",
              border: (item as any).active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: (item as any).active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: (item as any).active ? 500 : 400, marginBottom: 2
            }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 860 }}>
          <div style={{ marginBottom: 36 }}>
            <a href="/certifications" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>← Back to Certifications</a>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8, marginTop: 20 }}>New Application</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Start Certification</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Complete each step to build your certification application.</p>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", gap: 0, marginBottom: 36, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
            {STEPS.map((s, i) => (
              <div key={s.id} onClick={() => s.id <= step && setStep(s.id)}
                style={{ flex: 1, padding: "14px 16px", borderRight: i < STEPS.length - 1 ? "1px solid var(--border)" : "none", background: step === s.id ? "var(--navy)" : step > s.id ? "var(--green-bg)" : "#fff", cursor: s.id <= step ? "pointer" : "default", transition: "all .15s" }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: step === s.id ? "var(--gold2)" : step > s.id ? "var(--green)" : "var(--ink4)", marginBottom: 3 }}>
                  {step > s.id ? "✓ " : `${s.id}. `}{s.label}
                </div>
                <div style={{ fontSize: 11, color: step === s.id ? "rgba(255,255,255,.5)" : "var(--ink4)" }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Step 1: Select Type */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Step 1</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Which certification are you applying for?</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {CERT_TYPES.map(ct => (
                  <div key={ct.id} onClick={() => { update("certType", ct.id); setStep(2); }}
                    style={{ background: form.certType === ct.id ? "rgba(200,155,60,.08)" : "#fff", border: `1px solid ${form.certType === ct.id ? "var(--gold)" : "var(--border)"}`, borderRadius: "var(--rl)", padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all .15s", boxShadow: "var(--shadow)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = form.certType === ct.id ? "var(--gold)" : "var(--border)")}>
                    <div style={{ fontSize: 32, flexShrink: 0 }}>{ct.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>{ct.label}</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5 }}>{ct.desc}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "var(--ink4)", marginBottom: 4 }}>Typical timeline</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{ct.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Client */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Step 2</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Which client is applying?</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {clients.map(client => (
                  <div key={client.id} onClick={() => { update("clientId", client.id); setStep(3); }}
                    style={{ background: form.clientId === client.id ? "rgba(200,155,60,.08)" : "#fff", border: `1px solid ${form.clientId === client.id ? "var(--gold)" : "var(--border)"}`, borderRadius: "var(--rl)", padding: "18px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, boxShadow: "var(--shadow)", transition: "all .15s" }}>
                    <div style={{ width: 40, height: 40, background: "var(--navy)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold2)", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 500, flexShrink: 0 }}>
                      {client.businessName?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{client.businessName}</div>
                      <div style={{ fontSize: 12, color: "var(--ink3)" }}>{client.entityType || "Business"} · {client.ein || "No EIN"}</div>
                    </div>
                  </div>
                ))}
                {clients.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--ink4)" }}>
                    No clients yet. <a href="/clients/new" style={{ color: "var(--gold)" }}>Add a client first →</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Eligibility */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Step 3</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Eligibility Check</h2>
              <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 24 }}>Confirm your client meets the basic requirements for {form.certType === "GSA_MAS" ? "GSA MAS" : form.certType}.</p>

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
                {form.certType === "GSA_MAS" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      "Business has been operating for at least 2 years",
                      "Annual revenue of at least $25,000 in each of the last 2 years",
                      "Business is registered in SAM.gov",
                      "Business is a US-based entity",
                      "No outstanding federal tax delinquencies",
                    ].map((req, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--green-bg)", border: "1px solid var(--green-b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 800 }}>✓</span>
                        </div>
                        <span style={{ fontSize: 14, color: "var(--ink)" }}>{req}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                <div>
                  <label style={labelStyle}>Years in Business</label>
                  <input style={inputStyle} value={form.yearsInBusiness} onChange={e => update("yearsInBusiness", e.target.value)} placeholder="e.g. 5" />
                </div>
                <div>
                  <label style={labelStyle}>Annual Revenue (most recent year)</label>
                  <input style={inputStyle} value={form.annualRevenue} onChange={e => update("annualRevenue", e.target.value)} placeholder="e.g. $850,000" />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(4)} style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                  Continue →
                </button>
                <button onClick={() => setStep(2)} style={{ padding: "12px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, cursor: "pointer" }}>
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Business Profile */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Step 4</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Application Details</h2>

              {form.certType === "GSA_MAS" && (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>SIN Selection</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Select Your Special Item Numbers</h3>
                  <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16 }}>SINs define what services you can sell under your GSA schedule. Select all that apply.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {GSA_SINS.map(sin => (
                      <div key={sin.code} onClick={() => toggleSIN(sin.code)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: `1px solid ${form.selectedSINs.includes(sin.code) ? "var(--gold)" : "var(--border)"}`, borderRadius: "var(--r)", cursor: "pointer", background: form.selectedSINs.includes(sin.code) ? "rgba(200,155,60,.06)" : "#fff", transition: "all .12s" }}>
                        <div style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${form.selectedSINs.includes(sin.code) ? "var(--gold)" : "var(--border2)"}`, background: form.selectedSINs.includes(sin.code) ? "var(--gold)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {form.selectedSINs.includes(sin.code) && <span style={{ fontSize: 8, color: "#fff", fontWeight: 800 }}>✓</span>}
                        </div>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--ink3)", flexShrink: 0 }}>{sin.code}</span>
                        <span style={{ fontSize: 13, color: "var(--ink)" }}>{sin.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Key Personnel</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Primary Contact</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Owner / Primary Contact Name</label>
                    <input style={inputStyle} value={form.ownerName} onChange={e => update("ownerName", e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input style={inputStyle} value={form.ownerTitle} onChange={e => update("ownerTitle", e.target.value)} placeholder="e.g. CEO, President" />
                  </div>
                  <div>
                    <label style={labelStyle}>Number of Employees</label>
                    <input style={inputStyle} value={form.employeeCount} onChange={e => update("employeeCount", e.target.value)} placeholder="e.g. 12" />
                  </div>
                  <div>
                    <label style={labelStyle}>Primary NAICS Code</label>
                    <input style={inputStyle} value={form.naicsCode} onChange={e => update("naicsCode", e.target.value)} placeholder="e.g. 541511" />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(5)} style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                  Review Application →
                </button>
                <button onClick={() => setStep(3)} style={{ padding: "12px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, cursor: "pointer" }}>
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Step 5</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Review & Start Application</h2>

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
                {[
                  { label: "Certification Type", value: form.certType === "GSA_MAS" ? "GSA Multiple Award Schedule" : form.certType },
                  { label: "Client", value: clients.find(c => c.id === form.clientId)?.businessName },
                  { label: "Years in Business", value: form.yearsInBusiness },
                  { label: "Annual Revenue", value: form.annualRevenue },
                  { label: "Primary Contact", value: form.ownerName },
                  { label: "Employee Count", value: form.employeeCount },
                  { label: "NAICS Code", value: form.naicsCode },
                  { label: "Selected SINs", value: form.selectedSINs.length > 0 ? form.selectedSINs.join(", ") : "None selected" },
                ].map(row => row.value ? (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12, color: "var(--ink4)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 500 }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{row.value}</span>
                  </div>
                ) : null)}
              </div>

              <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--r)", padding: "14px 18px", marginBottom: 24, fontSize: 13, color: "var(--amber)" }}>
                ⚡ After submitting, GovCert will use AI to draft your Quality Control Plan, Relevant Experience, and Corporate Overview narratives based on this information.
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={handleSubmit} disabled={loading}
                  style={{ padding: "13px 32px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 15, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                  {loading ? "Starting..." : "🚀 Start Application →"}
                </button>
                <button onClick={() => setStep(4)} style={{ padding: "13px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, cursor: "pointer" }}>
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}