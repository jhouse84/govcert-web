"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const YEARS = [
  { key: "year1", label: "Year 1 (Most Recent)" },
  { key: "year2", label: "Year 2" },
];

const PL_FIELDS = [
  { key: "revenue", label: "Total Revenue", hint: "Gross revenue before any deductions" },
  { key: "cogs", label: "Cost of Goods Sold", hint: "Direct costs of delivering services" },
  { key: "grossProfit", label: "Gross Profit", hint: "Revenue minus COGS" },
  { key: "operatingExpenses", label: "Operating Expenses", hint: "SG&A, payroll, rent, overhead" },
  { key: "operatingIncome", label: "Operating Income", hint: "Gross profit minus operating expenses" },
  { key: "netIncome", label: "Net Income", hint: "Bottom line profit after all expenses and taxes" },
];

const BS_FIELDS = [
  { key: "totalAssets", label: "Total Assets", hint: "Everything the company owns" },
  { key: "totalLiabilities", label: "Total Liabilities", hint: "Everything the company owes" },
  { key: "ownersEquity", label: "Owner's Equity / Net Worth", hint: "Assets minus liabilities — critical for 8(a)" },
  { key: "cashAndEquivalents", label: "Cash & Equivalents", hint: "Liquid assets on hand" },
  { key: "accountsReceivable", label: "Accounts Receivable", hint: "Money owed to the company" },
  { key: "currentLiabilities", label: "Current Liabilities", hint: "Debts due within 12 months" },
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

const EMPTY_FINANCIAL: FinancialData = {
  year1: {},
  year2: {},
  year1Label: new Date().getFullYear() - 1 + "",
  year2Label: new Date().getFullYear() - 2 + "",
  source: null,
  notes: "",
};

export default function FinancialsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [financials, setFinancials] = useState<FinancialData>({ ...EMPTY_FINANCIAL });
  const [mode, setMode] = useState<"choose" | "review">("choose");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [qbConnected, setQbConnected] = useState(false);
  const [qbSyncing, setQbSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (data.application?.financialData) {
        try {
          const parsed = JSON.parse(data.application.financialData);
          setFinancials(parsed);
          setMode("review");
        } catch {}
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(files: File[]) {
    setUploading(true);
    setUploadedFiles(files);
    setError(null);
    try {
      const allTexts: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app"}/api/upload/extract-text`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.text) allTexts.push(`--- ${file.name} ---\n${data.text}`);
      }
      const combinedText = allTexts.join("\n\n");
      if (combinedText) {
        await extractFinancialsFromText(combinedText, files.map(f => f.name).join(", "));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process files. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function extractFinancialsFromText(text: string, fileNames: string) {
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: "Financial Data Extraction",
          prompt: `Extract the financial figures from this document and return ONLY a valid JSON object with this exact structure:
{
  "year1Label": "YYYY",
  "year2Label": "YYYY",
  "year1": {
    "revenue": "number as string",
    "cogs": "number as string",
    "grossProfit": "number as string",
    "operatingExpenses": "number as string",
    "operatingIncome": "number as string",
    "netIncome": "number as string",
    "totalAssets": "number as string",
    "totalLiabilities": "number as string",
    "ownersEquity": "number as string",
    "cashAndEquivalents": "number as string",
    "accountsReceivable": "number as string",
    "currentLiabilities": "number as string"
  },
  "year2": { same fields }
}
Use the most recent fiscal year as year1. Format numbers without commas or dollar signs (e.g. "450000"). If a value is not found use empty string "".`,
          context: {
            businessName: cert?.client?.businessName,
            otherSections: text.substring(0, 6000),
          },
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
        setError("Could not auto-extract all figures — please fill in any missing fields manually.");
      }
    } catch (err) {
      console.error(err);
      setFinancials(prev => ({ ...prev, source: "upload", uploadedFileNames: fileNames }));
      setMode("review");
    }
  }

  async function syncFromQuickBooks() {
    setQbSyncing(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/sync/financials`, {
        method: "POST",
        body: JSON.stringify({ clientId: cert?.clientId }),
      });
      if (data.year1) {
        setFinancials({ ...data, source: "quickbooks" });
        setMode("review");
      } else {
        setError("QuickBooks sync returned no data. Please upload statements instead.");
      }
    } catch (err: any) {
      setError("QuickBooks sync failed: " + (err.message || "Please upload statements instead."));
    } finally {
      setQbSyncing(false);
    }
  }

  function updateField(year: "year1" | "year2", field: string, value: string) {
    setFinancials(prev => ({
      ...prev,
      [year]: { ...prev[year], [field]: value },
    }));
  }

  async function saveFinancials(navigate = false) {
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
          financialData: JSON.stringify(financials),
        }),
      });
      setSaved(true);
      if (navigate) {
        setTimeout(() => router.push(`/certifications/${certId}/pricing`), 500);
      } else {
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      setError("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const hasYear1Data = Object.values(financials.year1).some(v => v && v.trim());
  const hasYear2Data = Object.values(financials.year2).some(v => v && v.trim());

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading...
    </div>
  );

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
        <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>Status</div>
          <div style={{ margin: "8px 9px 16px", padding: "12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>Years</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: hasYear1Data && hasYear2Data ? "var(--green)" : "var(--gold2)" }}>
                {(hasYear1Data ? 1 : 0) + (hasYear2Data ? 1 : 0)}<span style={{ fontSize: 13 }}>/2</span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {YEARS.map(y => {
                const hasData = y.key === "year1" ? hasYear1Data : hasYear2Data;
                const label = y.key === "year1" ? financials.year1Label : financials.year2Label;
                return (
                  <div key={y.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: hasData ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.3)" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: hasData ? "var(--green)" : "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff", flexShrink: 0 }}>
                      {hasData ? "✓" : ""}
                    </div>
                    FY {label}
                  </div>
                );
              })}
            </div>
            {financials.source && (
              <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Source: {financials.source === "quickbooks" ? "QuickBooks" : financials.source === "upload" ? "Uploaded" : "Manual"}
              </div>
            )}
          </div>
          <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 8 }}>
            ← Back to Dashboard
          </a>
        </div>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application Dashboard
          </a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 5 of 6</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Financial Statements</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>2 years of P&L and Balance Sheet data required for GSA MAS submission.</p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* GSA Requirements */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 12 }}>GSA Requirements</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                { icon: "📅", title: "2 fiscal years required", body: "GSA requires financial data for the 2 most recent complete fiscal years. Partial years are not accepted." },
                { icon: "📊", title: "P&L and Balance Sheet", body: "Both a Profit & Loss statement and a Balance Sheet are required for each year. One without the other is not sufficient." },
                { icon: "✅", title: "Must match tax returns", body: "Financial figures must be consistent with your filed tax returns. GSA may cross-reference with IRS records." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHOOSE MODE */}
          {mode === "choose" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* QuickBooks */}
              <div style={{ background: "#fff", border: `2px solid ${qbConnected ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>📗</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Sync from QuickBooks</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>
                  Pull your P&L and Balance Sheet directly from QuickBooks Online. GovCert retrieves 2 fiscal years automatically and maps the figures to the right fields.
                </p>
                {qbConnected ? (
                  <div>
                    <div style={{ padding: "10px 14px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 12, color: "var(--green)", fontWeight: 500, marginBottom: 14 }}>
                      ✓ QuickBooks is connected
                    </div>
                    <button onClick={syncFromQuickBooks} disabled={qbSyncing}
                      style={{ width: "100%", padding: "12px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: qbSyncing ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)", opacity: qbSyncing ? 0.7 : 1 }}>
                      {qbSyncing ? "Syncing from QuickBooks..." : "📗 Pull Financial Data →"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ padding: "10px 14px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, color: "var(--ink3)", marginBottom: 14 }}>
                      QuickBooks not connected
                    </div>
                    <button onClick={() => {
                      const token = localStorage.getItem("token");
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";
                      window.location.href = `${apiUrl}/api/oauth/quickbooks/start?clientId=${cert?.clientId}&token=${token}`;
                    }}
                      style={{ display: "block", width: "100%", padding: "12px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "center" as const, boxSizing: "border-box" as const }}>
                      Connect QuickBooks First →
                    </button>
                  </div>
                )}
              </div>

              {/* Upload — multiple files */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Upload Statements</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 8, lineHeight: 1.6 }}>
                  Upload your financial statements as PDF or Excel. You can select multiple files at once — for example, your P&L as one file and your Balance Sheet as another.
                </p>
                <p style={{ fontSize: 12, color: "var(--ink4)", marginBottom: 20, lineHeight: 1.5 }}>
                  GovCert extracts the key figures automatically using AI — review and correct anything after.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  multiple
                  style={{ display: "none" }}
                  onChange={e => { if (e.target.files && e.target.files.length > 0) handleFileUpload(Array.from(e.target.files)); }}
                />
                {uploadedFiles.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "28px 16px", textAlign: "center" as const, cursor: "pointer", transition: "border-color .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Click to upload</div>
                    <div style={{ fontSize: 11, color: "var(--ink4)" }}>PDF, Excel (.xlsx), or CSV · Select multiple files</div>
                  </div>
                ) : (
                  <div style={{ padding: "14px", background: uploading ? "var(--amber-bg)" : "var(--green-bg)", border: `1px solid ${uploading ? "var(--amber-b)" : "var(--green-b)"}`, borderRadius: "var(--r)" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: uploading ? "var(--amber)" : "var(--green)", marginBottom: 8 }}>
                      {uploading ? "⏳ Extracting figures..." : "✓ Processed — review below"}
                    </div>
                    {uploadedFiles.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink2)", marginBottom: 4 }}>
                        <span>📄</span>{f.name}
                      </div>
                    ))}
                    <button
                      onClick={() => { setUploadedFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      style={{ marginTop: 8, padding: "3px 10px", background: "transparent", border: `1px solid ${uploading ? "var(--amber-b)" : "var(--green-b)"}`, borderRadius: "var(--r)", color: uploading ? "var(--amber)" : "var(--green)", fontSize: 11, cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                )}
                <button onClick={() => setMode("review")}
                  style={{ width: "100%", marginTop: 14, padding: "10px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 13, cursor: "pointer" }}>
                  Enter figures manually instead
                </button>
              </div>
            </div>
          )}

          {/* REVIEW MODE */}
          {mode === "review" && (
            <div>
              {/* Source banner */}
              {financials.source && (
                <div style={{ background: financials.source === "quickbooks" ? "var(--green-bg)" : "var(--blue-bg)", border: `1px solid ${financials.source === "quickbooks" ? "var(--green-b)" : "var(--blue-b)"}`, borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: financials.source === "quickbooks" ? "var(--green)" : "var(--blue)" }}>
                    {financials.source === "quickbooks"
                      ? "✓ Data synced from QuickBooks"
                      : `✓ Data extracted from: ${financials.uploadedFileNames}`}
                  </span>
                  <button onClick={() => setMode("choose")}
                    style={{ fontSize: 12, color: "var(--ink3)", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", padding: "4px 10px", cursor: "pointer" }}>
                    Change source
                  </button>
                </div>
              )}

              {/* Year labels */}
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 12, marginBottom: 16, alignItems: "end" }}>
                <div />
                {YEARS.map(y => (
                  <div key={y.key}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--ink3)", marginBottom: 4, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>
                      {y.label} — Fiscal Year
                    </label>
                    <input
                      type="text"
                      value={y.key === "year1" ? financials.year1Label : financials.year2Label}
                      onChange={e => setFinancials(prev => ({ ...prev, [y.key === "year1" ? "year1Label" : "year2Label"]: e.target.value }))}
                      placeholder="e.g. 2023"
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                ))}
              </div>

              {/* P&L */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", marginBottom: 16, boxShadow: "var(--shadow)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", background: "var(--navy)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📈</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Profit & Loss Statement</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Income, expenses, and net profit for each fiscal year</div>
                  </div>
                </div>
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 12, marginBottom: 8 }}>
                    <div />
                    {YEARS.map(y => (
                      <div key={y.key} style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase" as const, letterSpacing: ".06em", textAlign: "right" as const }}>
                        FY {y.key === "year1" ? financials.year1Label : financials.year2Label}
                      </div>
                    ))}
                  </div>
                  {PL_FIELDS.map((field, i) => (
                    <div key={field.key} style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 12, marginBottom: 8, padding: "8px 0", borderTop: i === 0 ? "1px solid var(--border)" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{field.label}</div>
                        <div style={{ fontSize: 11, color: "var(--ink4)" }}>{field.hint}</div>
                      </div>
                      {YEARS.map(y => (
                        <div key={y.key} style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink3)" }}>$</span>
                          <input
                            type="text"
                            value={(y.key === "year1" ? financials.year1 : financials.year2)[field.key] || ""}
                            onChange={e => updateField(y.key as "year1" | "year2", field.key, e.target.value)}
                            placeholder="0"
                            style={{ width: "100%", padding: "8px 10px 8px 22px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Mono', monospace", textAlign: "right" as const }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Balance Sheet */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", marginBottom: 16, boxShadow: "var(--shadow)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", background: "var(--navy)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>⚖️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Balance Sheet</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Assets, liabilities, and owner's equity — critical for GSA financial review</div>
                  </div>
                </div>
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 12, marginBottom: 8 }}>
                    <div />
                    {YEARS.map(y => (
                      <div key={y.key} style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase" as const, letterSpacing: ".06em", textAlign: "right" as const }}>
                        FY {y.key === "year1" ? financials.year1Label : financials.year2Label}
                      </div>
                    ))}
                  </div>
                  {BS_FIELDS.map((field, i) => (
                    <div key={field.key} style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 12, marginBottom: 8, padding: "8px 0", borderTop: i === 0 ? "1px solid var(--border)" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{field.label}</div>
                        <div style={{ fontSize: 11, color: "var(--ink4)" }}>{field.hint}</div>
                      </div>
                      {YEARS.map(y => (
                        <div key={y.key} style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink3)" }}>$</span>
                          <input
                            type="text"
                            value={(y.key === "year1" ? financials.year1 : financials.year2)[field.key] || ""}
                            onChange={e => updateField(y.key as "year1" | "year2", field.key, e.target.value)}
                            placeholder="0"
                            style={{ width: "100%", padding: "8px 10px 8px 22px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Mono', monospace", textAlign: "right" as const }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Notes (optional)</label>
                <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 10, lineHeight: 1.5 }}>
                  Add any context — fiscal year end date, accounting method (cash vs accrual), or significant one-time items.
                </p>
                <textarea
                  value={financials.notes || ""}
                  onChange={e => setFinancials(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Fiscal year ends September 30. Cash basis accounting. Year 1 revenue includes a one-time contract award of $200,000."
                  style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>

              {/* Bottom nav */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
                <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>← Back to Dashboard</a>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                  <button onClick={() => saveFinancials(true)} disabled={saving}
                    style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                    {saving ? "Saving..." : "Save & Continue →"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}