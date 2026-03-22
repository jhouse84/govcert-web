"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import CertSidebar from "@/components/CertSidebar";

const EIGHT_A_SECTIONS = [
  { id: "social-disadvantage", label: "Social Disadvantage" },
  { id: "economic-disadvantage", label: "Economic Disadvantage" },
  { id: "business-plan", label: "Business Plan" },
  { id: "corporate", label: "Corporate Experience" },
  { id: "past-performance", label: "Past Performance" },
  { id: "financials", label: "Financials" },
  { id: "submit", label: "Submit" },
];

const YEARS = [
  { key: "year1", label: "Year 1 (Most Recent)" },
  { key: "year2", label: "Year 2" },
];

const PL_FIELDS = [
  { key: "revenue", label: "Total Revenue", hint: "Gross revenue before deductions" },
  { key: "cogs", label: "Cost of Goods Sold", hint: "Direct costs" },
  { key: "grossProfit", label: "Gross Profit", hint: "Revenue minus COGS" },
  { key: "operatingExpenses", label: "Operating Expenses", hint: "SG&A, payroll, rent" },
  { key: "operatingIncome", label: "Operating Income", hint: "Gross profit minus OpEx" },
  { key: "netIncome", label: "Net Income", hint: "Bottom line" },
];

const BS_FIELDS = [
  { key: "totalAssets", label: "Total Assets", hint: "Everything the company owns" },
  { key: "totalLiabilities", label: "Total Liabilities", hint: "Everything the company owes" },
  { key: "ownersEquity", label: "Owner's Equity", hint: "Assets minus liabilities" },
  { key: "cashAndEquivalents", label: "Cash & Equivalents", hint: "Liquid assets" },
  { key: "accountsReceivable", label: "Accounts Receivable", hint: "Money owed to company" },
  { key: "currentLiabilities", label: "Current Liabilities", hint: "Due within 12 months" },
];

type FinancialData = {
  year1: Record<string, string>;
  year2: Record<string, string>;
  year1Label: string;
  year2Label: string;
  source: "quickbooks" | "upload" | "manual" | null;
  uploadedFileNames?: string;
  notes?: string;
};

type PersonalFinancial = {
  ownerName: string;
  ownershipPct: string;
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  annualIncome: string;
};

const EMPTY_FINANCIAL: FinancialData = {
  year1: {}, year2: {},
  year1Label: String(new Date().getFullYear() - 1),
  year2Label: String(new Date().getFullYear() - 2),
  source: null, notes: "",
};

const EMPTY_PERSONAL: PersonalFinancial = {
  ownerName: "", ownershipPct: "", totalAssets: "", totalLiabilities: "", netWorth: "", annualIncome: "",
};

export default function Financials8aPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  const [financials, setFinancials] = useState<FinancialData>({ ...EMPTY_FINANCIAL });
  const [personalFinancials, setPersonalFinancials] = useState<PersonalFinancial[]>([{ ...EMPTY_PERSONAL }]);
  const [mode, setMode] = useState<"choose" | "review">("choose");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [qbConnected, setQbConnected] = useState(false);
  const [qbSyncing, setQbSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      const tokens = data.client?.oauthTokens || [];
      setQbConnected(tokens.some((t: any) => t.provider === "quickbooks"));
      if (data.application?.financialData8a) {
        try {
          const parsed = JSON.parse(data.application.financialData8a);
          setFinancials(parsed.business || parsed);
          if (parsed.personal) setPersonalFinancials(parsed.personal);
          setMode("review");
        } catch {}
      } else if (data.application?.financialData) {
        // Copy from GSA MAS financials if available
        try {
          const parsed = JSON.parse(data.application.financialData);
          setFinancials(parsed);
          setMode("review");
        } catch {}
      }
      const completed: Record<string, boolean> = {};
      const app = data.application;
      if (app) {
        if (app.socialDisadvantageNarrative?.trim()) completed["social-disadvantage"] = true;
        if (app.economicDisadvantageData) completed["economic-disadvantage"] = true;
        if (app.businessPlanData) completed["business-plan"] = true;
        if (app.narrativeCorp8a) completed["corporate"] = true;
        if (app.pastPerformance8a?.length > 0) completed["past-performance"] = true;
        if (app.financialData8a) completed["financials"] = true;
      }
      setCompletedSections(completed);
    } catch (err) { console.error(err); setError("Failed to load."); }
    finally { setLoading(false); }
  }

  async function handleFileUpload(files: File[]) {
    setUploading(true);
    setUploadedFiles(files);
    try {
      const allTexts: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/extract-text`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.text) allTexts.push(`--- ${file.name} ---\n${data.text}`);
      }
      if (allTexts.length > 0) await extractFinancialsFromText(allTexts.join("\n\n"), files.map(f => f.name).join(", "));
    } catch { setError("Failed to process files."); }
    finally { setUploading(false); }
  }

  async function extractFinancialsFromText(text: string, fileNames: string) {
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: "Financial Data Extraction",
          certType: "8a",
          prompt: `Extract financial figures from this document. Return ONLY valid JSON: { "year1Label": "YYYY", "year2Label": "YYYY", "year1": { "revenue": "", "cogs": "", "grossProfit": "", "operatingExpenses": "", "operatingIncome": "", "netIncome": "", "totalAssets": "", "totalLiabilities": "", "ownersEquity": "", "cashAndEquivalents": "", "accountsReceivable": "", "currentLiabilities": "" }, "year2": { same } }. Numbers without commas or $.`,
          context: { businessName: cert?.client?.businessName, otherSections: text.substring(0, 6000) },
        }),
      });
      try {
        const clean = data.text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        setFinancials({ ...parsed, source: "upload", uploadedFileNames: fileNames });
        setMode("review");
      } catch {
        setFinancials(prev => ({ ...prev, source: "upload", uploadedFileNames: fileNames }));
        setMode("review");
        setError("Could not auto-extract all figures. Fill manually.");
      }
    } catch {
      setFinancials(prev => ({ ...prev, source: "upload", uploadedFileNames: fileNames }));
      setMode("review");
    }
  }

  async function syncFromQuickBooks() {
    setQbSyncing(true);
    try {
      const data = await apiRequest(`/api/sync/financials`, {
        method: "POST",
        body: JSON.stringify({ clientId: cert?.clientId }),
      });
      if (data.year1) { setFinancials({ ...data, source: "quickbooks" }); setMode("review"); }
      else setError("QuickBooks sync returned no data.");
    } catch (err: any) { setError("QuickBooks sync failed: " + (err.message || "")); }
    finally { setQbSyncing(false); }
  }

  function updateField(year: "year1" | "year2", field: string, value: string) {
    setFinancials(prev => ({ ...prev, [year]: { ...prev[year], [field]: value } }));
  }

  function updatePersonal(index: number, field: keyof PersonalFinancial, value: string) {
    const updated = [...personalFinancials];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-calc net worth
    if (field === "totalAssets" || field === "totalLiabilities") {
      const a = parseFloat(updated[index].totalAssets.replace(/[^0-9.-]/g, "")) || 0;
      const l = parseFloat(updated[index].totalLiabilities.replace(/[^0-9.-]/g, "")) || 0;
      updated[index].netWorth = String(a - l);
    }
    setPersonalFinancials(updated);
  }

  async function saveFinancials() {
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert.clientId,
          certType: cert.type,
          currentStep: cert.application?.currentStep || 1,
          financialData8a: JSON.stringify({ business: financials, personal: personalFinancials }),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) { setError("Failed to save: " + err.message); }
    finally { setSaving(false); }
  }

  const hasYear1Data = Object.values(financials.year1).some(v => v && v.trim());
  const hasYear2Data = Object.values(financials.year2).some(v => v && v.trim());

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const sidebarContent = (
    <div>
      <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>8(a) Sections</div>
      {EIGHT_A_SECTIONS.map((s, i) => {
        const isActive = s.id === "financials";
        const isCompleted = completedSections[s.id];
        return (
          <a key={s.id} href={`/certifications/${certId}/8a/${s.id}`} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)",
            marginBottom: 2, textDecoration: "none",
            background: isActive ? "rgba(200,155,60,.15)" : "transparent",
            border: isActive ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
            color: isActive ? "var(--gold2)" : isCompleted ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)",
            fontSize: 12,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: isCompleted ? "var(--green)" : isActive ? "rgba(200,155,60,.3)" : "rgba(255,255,255,.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: "#fff", fontWeight: 700, flexShrink: 0,
            }}>
              {isCompleted ? "\u2713" : i + 1}
            </div>
            {s.label}
          </a>
        );
      })}
      <div style={{ margin: "12px 9px 0", padding: "10px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>Years</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: hasYear1Data && hasYear2Data ? "var(--green)" : "var(--gold2)" }}>
            {(hasYear1Data ? 1 : 0) + (hasYear2Data ? 1 : 0)}<span style={{ fontSize: 12 }}>/2</span>
          </span>
        </div>
        {financials.source && (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Source: {financials.source === "quickbooks" ? "QuickBooks" : financials.source === "upload" ? "Uploaded" : "Manual"}
          </div>
        )}
      </div>
      <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>&larr; Back to Dashboard</a>
    </div>
  );

  const inputStyle = { width: "100%", padding: "10px 12px 10px 24px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="certifications" sidebarContent={sidebarContent} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 6 of 7</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Financial Statements</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>2 years of business financials plus personal financial statements for each owner.</p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* Source selection */}
          {mode === "choose" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
              {[
                { icon: "\uD83D\uDCC2", title: "Upload Statements", desc: "Upload P&L and Balance Sheet PDFs or spreadsheets", action: () => fileInputRef.current?.click() },
                { icon: "\uD83D\uDCD7", title: "QuickBooks Sync", desc: qbConnected ? "Pull directly from your QuickBooks" : "Connect QuickBooks first", action: qbConnected ? syncFromQuickBooks : undefined, disabled: !qbConnected || qbSyncing },
                { icon: "\u270D\uFE0F", title: "Enter Manually", desc: "Type in financial figures directly", action: () => setMode("review") },
              ].map((opt, i) => (
                <div key={i} onClick={opt.disabled ? undefined : opt.action}
                  style={{
                    background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px 24px", textAlign: "center" as const,
                    cursor: opt.disabled ? "not-allowed" : "pointer", opacity: opt.disabled ? 0.5 : 1, boxShadow: "var(--shadow)",
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { if (!opt.disabled) e.currentTarget.style.borderColor = "var(--gold)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{opt.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>{opt.title}</div>
                  <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          )}

          <input ref={fileInputRef} type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.docx" style={{ display: "none" }}
            onChange={e => { if (e.target.files) handleFileUpload(Array.from(e.target.files)); }} />

          {/* Review mode - Business financials */}
          {mode === "review" && (
            <>
              {YEARS.map(y => (
                <div key={y.key} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>{y.label}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--ink4)" }}>Fiscal Year:</span>
                        <input
                          value={y.key === "year1" ? financials.year1Label : financials.year2Label}
                          onChange={e => setFinancials(prev => ({ ...prev, [`${y.key}Label`]: e.target.value }))}
                          style={{ width: 80, padding: "4px 8px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "var(--navy)", outline: "none" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 10 }}>Profit & Loss</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {PL_FIELDS.map(f => (
                      <div key={f.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <label style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{f.label}</label>
                          <span style={{ fontSize: 10, color: "var(--ink4)" }}>{f.hint}</span>
                        </div>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink4)" }}>$</span>
                          <input value={financials[y.key as "year1" | "year2"][f.key] || ""} onChange={e => updateField(y.key as "year1" | "year2", f.key, e.target.value)} placeholder="0" style={inputStyle} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 10 }}>Balance Sheet</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {BS_FIELDS.map(f => (
                      <div key={f.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <label style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{f.label}</label>
                          <span style={{ fontSize: 10, color: "var(--ink4)" }}>{f.hint}</span>
                        </div>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink4)" }}>$</span>
                          <input value={financials[y.key as "year1" | "year2"][f.key] || ""} onChange={e => updateField(y.key as "year1" | "year2", f.key, e.target.value)} placeholder="0" style={inputStyle} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Personal Financial Statements */}
              <div style={{ background: "#fff", border: "2px solid var(--gold)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>8(a) Requirement</div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Personal Financial Statements</h3>
                    <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 4 }}>Required for each owner with 20%+ ownership in the applicant firm.</p>
                  </div>
                  <button onClick={() => setPersonalFinancials(prev => [...prev, { ...EMPTY_PERSONAL }])}
                    style={{ padding: "8px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>
                    + Add Owner
                  </button>
                </div>

                {personalFinancials.map((pf, i) => (
                  <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 20, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>Owner {i + 1}</span>
                      {personalFinancials.length > 1 && (
                        <button onClick={() => setPersonalFinancials(prev => prev.filter((_, j) => j !== i))}
                          style={{ padding: "3px 10px", background: "transparent", border: "1px solid var(--red-b)", borderRadius: "var(--r)", fontSize: 11, color: "var(--red)", cursor: "pointer" }}>Remove</button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 3, display: "block" }}>Owner Name</label>
                        <input value={pf.ownerName} onChange={e => updatePersonal(i, "ownerName", e.target.value)} style={{ ...inputStyle, paddingLeft: 12 }} placeholder="Full legal name" />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 3, display: "block" }}>Ownership %</label>
                        <input value={pf.ownershipPct} onChange={e => updatePersonal(i, "ownershipPct", e.target.value)} style={{ ...inputStyle, paddingLeft: 12 }} placeholder="e.g. 51%" />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 3, display: "block" }}>Total Personal Assets</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink4)" }}>$</span>
                          <input value={pf.totalAssets} onChange={e => updatePersonal(i, "totalAssets", e.target.value)} style={inputStyle} placeholder="0" />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 3, display: "block" }}>Total Personal Liabilities</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink4)" }}>$</span>
                          <input value={pf.totalLiabilities} onChange={e => updatePersonal(i, "totalLiabilities", e.target.value)} style={inputStyle} placeholder="0" />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 3, display: "block" }}>Net Worth (auto-calculated)</label>
                        <div style={{ padding: "10px 12px", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 14, color: "var(--navy)", fontWeight: 500 }}>
                          ${(parseFloat(pf.netWorth) || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 500, marginBottom: 3, display: "block" }}>Annual Income</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink4)" }}>$</span>
                          <input value={pf.annualIncome} onChange={e => updatePersonal(i, "annualIncome", e.target.value)} style={inputStyle} placeholder="0" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Save / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <a href={`/certifications/${certId}/8a/past-performance`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Previous: Past Performance</a>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saved && <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>{"\u2713"} Saved</span>}
              <button onClick={saveFinancials} disabled={saving}
                style={{ padding: "10px 24px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, color: "var(--ink3)", cursor: "pointer" }}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={async () => { await saveFinancials(); router.push(`/certifications/${certId}/8a/submit`); }} disabled={saving}
                style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Save & Next &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
