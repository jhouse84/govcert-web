"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const EDUCATION_LEVELS = [
  "High School Diploma / GED",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate (PhD)",
  "Professional Certification",
  "No Minimum Requirement",
];

const IFF_RATE = 0.0075;

type LCAT = {
  id: string;
  title: string;
  description: string;
  education: string;
  yearsExperience: string;
  baseRate: string;
  mfcRate: string;
  gsaRate: string;
  rateStatus?: "competitive" | "check" | "low" | null;
  rateNote?: string;
};

const EMPTY_LCAT: Omit<LCAT, "id"> = {
  title: "",
  description: "",
  education: "Bachelor's Degree",
  yearsExperience: "",
  baseRate: "",
  mfcRate: "",
  gsaRate: "",
  rateStatus: null,
  rateNote: "",
};

type GapAnalysis = {
  score: number;
  missingSINs: string[];
  suggestedLcats: string[];
  summary: string;
  isComplete: boolean;
};

export default function PricingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"start" | "invoices" | "library" | "csp1">("start");
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [lcats, setLcats] = useState<LCAT[]>([]);
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<LCAT, "id">>({ ...EMPTY_LCAT });
  const [addingNew, setAddingNew] = useState(false);
  const [newLcat, setNewLcat] = useState<Omit<LCAT, "id">>({ ...EMPTY_LCAT });

  // Invoice upload state
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [processingInvoices, setProcessingInvoices] = useState(false);
  const [invoiceGroups, setInvoiceGroups] = useState<any[]>([]);
  const [invoicesProcessed, setInvoicesProcessed] = useState(false);

  // Library state
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryResults, setLibraryResults] = useState<any[]>([]);
  const [searchingLibrary, setSearchingLibrary] = useState(false);
  const [librarySearched, setLibrarySearched] = useState(false);

  // QC state
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [runningGapAnalysis, setRunningGapAnalysis] = useState(false);
  const [benchmarkingId, setBenchmarkingId] = useState<string | null>(null);

  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const MIN_LCATS = 5;

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
      if (data.application?.pricingData) {
        try {
          const parsed = JSON.parse(data.application.pricingData);
          setLcats(parsed.lcats || []);
          setNotes(parsed.notes || "");
          if ((parsed.lcats || []).length > 0) setActiveTab("csp1");
        } catch {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function calcGsaRate(mfc: string): string {
    const num = parseFloat(mfc.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return "";
    return (num * (1 - IFF_RATE)).toFixed(2);
  }

  function handleMfcChange(val: string, isNew: boolean) {
    const gsa = calcGsaRate(val);
    if (isNew) {
      setNewLcat(prev => ({ ...prev, mfcRate: val, gsaRate: gsa }));
    } else {
      setEditForm(prev => ({ ...prev, mfcRate: val, gsaRate: gsa }));
    }
  }

  function addLcat(lcat: Omit<LCAT, "id">) {
    const newItem = { ...lcat, id: Date.now().toString() };
    setLcats(prev => [...prev, newItem]);
    return newItem;
  }

  function removeLcat(id: string) {
    setLcats(prev => prev.filter(l => l.id !== id));
    setGapAnalysis(null);
  }

  function startEdit(lcat: LCAT) {
    setEditingId(lcat.id);
    setEditForm({ title: lcat.title, description: lcat.description, education: lcat.education, yearsExperience: lcat.yearsExperience, baseRate: lcat.baseRate, mfcRate: lcat.mfcRate, gsaRate: lcat.gsaRate, rateStatus: lcat.rateStatus, rateNote: lcat.rateNote });
  }

  function saveEdit() {
    setLcats(prev => prev.map(l => l.id === editingId ? { ...l, ...editForm } : l));
    setEditingId(null);
    setGapAnalysis(null);
  }

  // ── GAP ANALYSIS ──
  async function runGapAnalysis() {
    if (lcats.length === 0) return;
    setRunningGapAnalysis(true);
    try {
      const selectedSINs = cert?.application?.selectedSINs || "";
      const lcatTitles = lcats.map(l => l.title).join(", ");
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: "LCAT Coverage Gap Analysis",
          prompt: `Analyze this company's Labor Category list for GSA MAS completeness.

Company: ${cert?.client?.businessName}
Selected SINs: ${selectedSINs}
Current LCATs: ${lcatTitles}
Corporate Experience: ${cert?.application?.narrativeCorp ? cert.application.narrativeCorp.substring(0, 1000) : "Not provided"}

Return ONLY a valid JSON object:
{
  "score": 0-100,
  "isComplete": true/false,
  "summary": "2-3 sentence plain English assessment of whether this LCAT list is comprehensive",
  "missingSINs": ["SIN code that has no matching LCAT"],
  "suggestedLcats": ["LCAT title that seems missing based on their SINs and experience"]
}

Be specific. If their Corporate Experience mentions services not covered by any LCAT, flag them. suggestedLcats should be max 5 items. Return ONLY valid JSON.`,
          context: { businessName: cert?.client?.businessName, otherSections: "" },
        }),
      });
      const clean = data.text.replace(/```json|```/g, "").trim();
      setGapAnalysis(JSON.parse(clean));
    } catch (err) {
      console.error(err);
    } finally {
      setRunningGapAnalysis(false);
    }
  }

  // ── RATE BENCHMARK ──
  async function benchmarkRate(lcat: LCAT) {
    setBenchmarkingId(lcat.id);
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: "GSA Rate Benchmark",
          prompt: `Benchmark this GSA labor category rate against market data.

LCAT: ${lcat.title}
MFC Rate: $${lcat.mfcRate}/hr
GSA Rate: $${lcat.gsaRate}/hr
Education: ${lcat.education}
Experience: ${lcat.yearsExperience} years
Company SINs: ${cert?.application?.selectedSINs || ""}

Based on your knowledge of GSA Schedule rates, government contracting markets, and BLS wage data for this type of role:

Return ONLY a valid JSON object:
{
  "status": "competitive" | "check" | "low",
  "typicalRange": "$X-$Y/hr",
  "note": "one sentence plain-English assessment e.g. Your rate of $150/hr is within the typical GSA range of $125-$185/hr for this role."
}

status guide: competitive = within or above typical range, check = slightly below or worth reviewing, low = significantly below market and may raise questions during GSA review.
Return ONLY valid JSON.`,
          context: { businessName: cert?.client?.businessName, otherSections: "" },
        }),
      });
      const clean = data.text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      setLcats(prev => prev.map(l => l.id === lcat.id ? { ...l, rateStatus: result.status, rateNote: result.note } : l));
    } catch (err) {
      console.error(err);
    } finally {
      setBenchmarkingId(null);
    }
  }

  async function benchmarkAllRates() {
    const lcatsWithRates = lcats.filter(l => l.mfcRate && !l.rateStatus);
    for (const lcat of lcatsWithRates) {
      await benchmarkRate(lcat);
    }
  }

  async function processInvoices(files: File[]) {
    setProcessingInvoices(true);
    setError(null);
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
      const combined = allTexts.join("\n\n");
      const selectedSINs = cert?.application?.selectedSINs || "";
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: "Invoice Analysis for GSA CSP-1 Pricing",
          prompt: `Analyze these invoices/documents and extract all billable service line items. Group similar services together. Return a JSON array:
[
  {
    "serviceType": "plain English name",
    "description": "what work was performed",
    "invoiceCount": number,
    "rateRange": "e.g. $125-$175/hr",
    "highestRate": "150.00",
    "suggestedLcatTitle": "GSA-compliant LCAT title",
    "suggestedEducation": "Bachelor's Degree",
    "suggestedYearsExp": "5",
    "rationale": "one sentence explaining why this maps to this LCAT"
  }
]
Selected SINs: ${selectedSINs}
Company: ${cert?.client?.businessName}
Return ONLY the JSON array.`,
          context: { businessName: cert?.client?.businessName, otherSections: combined.substring(0, 8000) },
        }),
      });
      const clean = data.text.replace(/```json|```/g, "").trim();
      setInvoiceGroups(JSON.parse(clean));
      setInvoicesProcessed(true);
    } catch (err) {
      setError("Failed to process invoices. Please try again.");
    } finally {
      setProcessingInvoices(false);
    }
  }

  function addGroupAsLcat(group: any) {
    addLcat({
      title: group.suggestedLcatTitle || group.serviceType,
      description: group.description,
      education: group.suggestedEducation || "Bachelor's Degree",
      yearsExperience: group.suggestedYearsExp || "",
      baseRate: group.highestRate || "",
      mfcRate: group.highestRate || "",
      gsaRate: calcGsaRate(group.highestRate || ""),
      rateStatus: null,
      rateNote: "",
    });
    setGapAnalysis(null);
  }

  async function searchLibrary() {
    if (!librarySearch.trim()) return;
    setSearchingLibrary(true);
    setLibrarySearched(false);
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: "GSA LCAT Library Search",
          prompt: `Generate 4 GSA MAS-compliant Labor Category definitions for: "${librarySearch}"
Company: ${cert?.client?.businessName}
Selected SINs: ${cert?.application?.selectedSINs || ""}
Return ONLY a JSON array with exactly 4 options at different seniority levels:
[{
  "title": "GSA-compliant LCAT title",
  "description": "2-3 sentence GSA-compliant description. Max 500 chars.",
  "education": "Bachelor's Degree",
  "yearsExperience": "2",
  "level": "Junior",
  "plainEnglish": "one sentence plain English explanation",
  "whyGSAValues": "one sentence on why GSA values this role"
}]
Levels: Junior, Mid-Level, Senior, Principal/Expert. Return ONLY the JSON array.`,
          context: { businessName: cert?.client?.businessName, otherSections: "" },
        }),
      });
      const clean = data.text.replace(/```json|```/g, "").trim();
      setLibraryResults(JSON.parse(clean));
      setLibrarySearched(true);
    } catch (err) {
      setError("Could not generate LCAT suggestions. Try a different search term.");
    } finally {
      setSearchingLibrary(false);
    }
  }

  async function savePricing(navigate = false) {
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
          pricingData: JSON.stringify({ lcats, notes }),
        }),
      });
      setSaved(true);
      if (navigate) {
        setTimeout(() => router.push(`/certifications/${certId}/submit`), 500);
      } else {
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      setError("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function exportCSP1() {
    const rows = [
      ["Labor Category Title", "Description", "Minimum Education", "Minimum Years Experience", "Most Favored Customer Rate ($/hr)", "GSA Rate w/ IFF ($/hr)"],
      ...lcats.map(l => [l.title, l.description, l.education, l.yearsExperience, l.mfcRate, l.gsaRate])
    ];
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${cert?.client?.businessName?.replace(/\s+/g, "_")}_CSP1_Pricing.csv`;
    a.click();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const DOCS_CHECKLIST = [
    { id: "invoices", icon: "🧾", label: "Past invoices", desc: "Any invoices you've sent clients — PDFs, Word docs, Excel. The more the better." },
    { id: "ratelist", icon: "📋", label: "Your current rate sheet", desc: "A price list or rate card if you have one. Even an informal one is fine." },
    { id: "proposals", icon: "📄", label: "Past proposals with pricing", desc: "Any quotes or proposals you've sent that include hourly rates or project costs." },
    { id: "jobtitles", icon: "👥", label: "Your job titles and roles", desc: "What do your staff or contractors actually do? A simple org chart or list works." },
    { id: "commercial", icon: "💼", label: "Commercial price list", desc: "What you charge non-government clients. This becomes your Most Favored Customer (MFC) rate." },
    { id: "prevgsa", icon: "🏛️", label: "Previous GSA price lists", desc: "If you've applied before or have a GSA contract, bring that price list." },
  ];

  const rateStatusConfig = {
    competitive: { color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-b)", label: "✓ Competitive" },
    check: { color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber-b)", label: "⚠ Review rate" },
    low: { color: "var(--red)", bg: "var(--red-bg)", border: "var(--red-b)", label: "↓ Below market" },
  };

  const lcatsWithRates = lcats.filter(l => l.mfcRate);
  const lcatsBelowMin = lcats.length < MIN_LCATS;
  const lcatsNotBenchmarked = lcats.filter(l => l.mfcRate && !l.rateStatus).length;

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
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>CSP-1 Progress</div>
          <div style={{ margin: "8px 9px 16px", padding: "12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>LCATs</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: lcats.length >= MIN_LCATS ? "var(--green)" : "var(--gold2)" }}>
                {lcats.length}
              </span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,.08)", borderRadius: 100, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${Math.min(100, lcats.length / MIN_LCATS * 100)}%`, background: lcats.length >= MIN_LCATS ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>
              {lcats.length < MIN_LCATS ? `${MIN_LCATS - lcats.length} more recommended` : "✓ Minimum met"}
            </div>
          </div>

          {[
            { id: "start", label: "📋 Getting Started" },
            { id: "invoices", label: "🧾 Upload Invoices" },
            { id: "library", label: "🔍 LCAT Library" },
            { id: "csp1", label: "💰 My CSP-1" },
          ].map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              style={{ display: "flex", alignItems: "center", padding: "8px 9px", borderRadius: "var(--r)", marginBottom: 2, cursor: "pointer", background: activeTab === tab.id ? "rgba(200,155,60,.15)" : "transparent", color: activeTab === tab.id ? "var(--gold2)" : "rgba(255,255,255,.45)", fontSize: 12.5, fontWeight: activeTab === tab.id ? 500 : 400 }}>
              {tab.label}
              {tab.id === "csp1" && lcats.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 10, background: lcats.length >= MIN_LCATS ? "rgba(26,102,68,.3)" : "rgba(200,155,60,.2)", color: lcats.length >= MIN_LCATS ? "var(--green)" : "var(--gold2)", padding: "1px 6px", borderRadius: 10 }}>{lcats.length}</span>
              )}
            </div>
          ))}
          <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>
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
        <div style={{ padding: "40px 48px", maxWidth: 960 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application Dashboard
          </a>
          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 6 of 6</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Pricing (CSP-1)</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Build your GSA Commercial Supplier Pricelist — labor categories, rates, and IFF-adjusted GSA prices.</p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* ── GETTING STARTED TAB ── */}
          {activeTab === "start" && (
            <div>
              <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "20px 28px", marginBottom: 24, display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ fontSize: 36 }}>⏱</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: "#fff", marginBottom: 4 }}>Estimated time: 20–45 minutes</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>
                    If you have invoices or a rate sheet ready, closer to 20 minutes. Building from scratch with the LCAT library takes 30–45 minutes.
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={() => setActiveTab("invoices")} style={{ padding: "10px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" as const }}>I have invoices →</button>
                  <button onClick={() => setActiveTab("library")} style={{ padding: "10px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" as const }}>Browse LCAT library →</button>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 12 }}>What is a CSP-1?</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {[
                    { icon: "📋", title: "Your price list for the government", body: "CSP-1 stands for Commercial Supplier Pricelist. It lists every service you offer on your GSA Schedule with the price the government will pay." },
                    { icon: "👤", title: "Organized by Labor Categories (LCATs)", body: "Each row is a Labor Category — a type of worker or role. For example: 'Senior Project Manager' or 'Junior Software Developer.'" },
                    { icon: "💰", title: "GSA gets a discount from your best price", body: "You must give the government a price equal to or better than your best commercial customer. This is your Most Favored Customer (MFC) rate." },
                    { icon: "📉", title: "The IFF is subtracted from your MFC rate", body: "GSA charges a 0.75% Industrial Funding Fee (IFF). GSA rate = MFC rate minus 0.75%. GovCert calculates this automatically." },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6 }}>{item.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>What to have ready</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>Check off what you have — GovCert will make the most of it.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {DOCS_CHECKLIST.map(item => {
                    const checked = checkedItems.includes(item.id);
                    return (
                      <div key={item.id} onClick={() => setCheckedItems(prev => checked ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                        style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", border: `1px solid ${checked ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--r)", cursor: "pointer", background: checked ? "var(--green-bg)" : "#fff", transition: "all .12s" }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checked ? "var(--green)" : "var(--border2)"}`, background: checked ? "var(--green)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          {checked && <span style={{ fontSize: 11, color: "#fff", fontWeight: 800 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{item.label}</div>
                          <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5 }}>{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {checkedItems.length > 0 && (
                  <div style={{ marginTop: 20, padding: "16px 20px", background: "var(--navy)", borderRadius: "var(--r)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>
                      You have <strong style={{ color: "var(--gold2)" }}>{checkedItems.length}</strong> item{checkedItems.length !== 1 ? "s" : ""} ready.
                      {checkedItems.includes("invoices") || checkedItems.includes("ratelist") || checkedItems.includes("proposals") ? " Start by uploading them." : " Browse the LCAT library to build your price list."}
                    </div>
                    <button onClick={() => setActiveTab(checkedItems.includes("invoices") || checkedItems.includes("ratelist") || checkedItems.includes("proposals") ? "invoices" : "library")}
                      style={{ padding: "9px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", flexShrink: 0, marginLeft: 16 }}>
                      Let's go →
                    </button>
                  </div>
                )}
              </div>

              <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--rl)", padding: "16px 20px", display: "flex", gap: 12 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--amber)" }}>Pro tip:</strong> Most small businesses should have 5–15 labor categories. GovCert will check your coverage and flag any gaps after you've added your initial LCATs.
                </div>
              </div>
            </div>
          )}

          {/* ── INVOICE UPLOAD TAB ── */}
          {activeTab === "invoices" && (
            <div>
              <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 8 }}>How this works</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                  {[
                    { step: "1", title: "Upload everything you have", body: "Invoices, rate sheets, proposals — any files with pricing." },
                    { step: "2", title: "GovCert finds your rates", body: "AI groups similar services and identifies your rate history." },
                    { step: "3", title: "Map to GSA LCATs", body: "Confirm which groups become Labor Categories on your CSP-1." },
                  ].map(item => (
                    <div key={item.step} style={{ display: "flex", gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(200,155,60,.25)", border: "1px solid rgba(200,155,60,.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: "var(--gold2)", fontWeight: 700 }}>{item.step}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", lineHeight: 1.5 }}>{item.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Upload Your Documents</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>Select as many files as you have — invoices, rate sheets, proposals. PDF, Word, Excel, and CSV all work.</p>
                <input ref={invoiceInputRef} type="file" multiple accept=".pdf,.docx,.xlsx,.xls,.csv,.txt" style={{ display: "none" }}
                  onChange={e => { if (e.target.files) setInvoiceFiles(Array.from(e.target.files)); }} />
                {invoiceFiles.length === 0 ? (
                  <div onClick={() => invoiceInputRef.current?.click()}
                    style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "48px 24px", textAlign: "center" as const, cursor: "pointer", transition: "border-color .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Click to upload your invoices and rate sheets</div>
                    <div style={{ fontSize: 13, color: "var(--ink4)" }}>PDF, Word, Excel, CSV — select multiple files at once</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                      {invoiceFiles.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 16 }}>📄</span>
                          <span style={{ fontSize: 13, color: "var(--navy)", flex: 1 }}>{f.name}</span>
                          <span style={{ fontSize: 11, color: "var(--ink4)" }}>{(f.size / 1024).toFixed(0)} KB</span>
                          <button onClick={() => setInvoiceFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--ink4)", cursor: "pointer", fontSize: 14 }}>✕</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => invoiceInputRef.current?.click()} style={{ padding: "9px 18px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>+ Add more</button>
                      <button onClick={() => processInvoices(invoiceFiles)} disabled={processingInvoices}
                        style={{ padding: "9px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: processingInvoices ? "not-allowed" : "pointer", opacity: processingInvoices ? 0.7 : 1 }}>
                        {processingInvoices ? "✦ Analyzing your pricing history..." : `✦ Analyze ${invoiceFiles.length} file${invoiceFiles.length !== 1 ? "s" : ""} →`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {invoicesProcessed && invoiceGroups.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 12 }}>
                    Found {invoiceGroups.length} service type{invoiceGroups.length !== 1 ? "s" : ""} in your documents
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                    {invoiceGroups.map((group, i) => {
                      const alreadyAdded = lcats.some(l => l.title === group.suggestedLcatTitle);
                      return (
                        <div key={i} style={{ background: "#fff", border: `1px solid ${alreadyAdded ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", padding: "20px 24px", boxShadow: "var(--shadow)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>{group.serviceType}</div>
                                <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 500, background: "var(--blue-bg)", color: "var(--blue)" }}>{group.invoiceCount || "?"} invoice{group.invoiceCount !== 1 ? "s" : ""}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 8, lineHeight: 1.5 }}>{group.description}</div>
                              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink3)" }}>
                                <span>Rate range: <strong style={{ color: "var(--navy)" }}>{group.rateRange}</strong></span>
                                <span>Highest rate: <strong style={{ color: "var(--navy)" }}>${group.highestRate}/hr</strong></span>
                              </div>
                              <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 4 }}>Suggested GSA LCAT</div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{group.suggestedLcatTitle}</div>
                                <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 4 }}>{group.rationale}</div>
                                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--ink3)" }}>
                                  <span>Education: {group.suggestedEducation}</span>
                                  <span>Experience: {group.suggestedYearsExp}+ years</span>
                                  <span style={{ color: "var(--green)", fontWeight: 500 }}>GSA rate: ${calcGsaRate(group.highestRate || "")}/hr</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ flexShrink: 0 }}>
                              {alreadyAdded ? (
                                <span style={{ padding: "8px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 12, color: "var(--green)", fontWeight: 500 }}>✓ Added</span>
                              ) : (
                                <button onClick={() => { addGroupAsLcat(group); }}
                                  style={{ padding: "9px 18px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                                  Add to CSP-1 →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {lcats.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <button onClick={() => setActiveTab("csp1")}
                        style={{ padding: "12px 32px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                        Review my CSP-1 ({lcats.length} LCATs) →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── LCAT LIBRARY TAB ── */}
          {activeTab === "library" && (
            <div>
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>LCAT Library</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>
                  Search for any role or service type. GovCert generates 4 GSA-compliant options at different seniority levels tailored to your SINs.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="text" value={librarySearch} onChange={e => setLibrarySearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchLibrary()}
                    placeholder="e.g. project manager, software developer, training instructor..."
                    style={{ flex: 1, padding: "12px 16px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                  <button onClick={searchLibrary} disabled={searchingLibrary || !librarySearch.trim()}
                    style={{ padding: "12px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: searchingLibrary || !librarySearch.trim() ? "not-allowed" : "pointer", opacity: searchingLibrary || !librarySearch.trim() ? 0.6 : 1, whiteSpace: "nowrap" as const }}>
                    {searchingLibrary ? "Generating..." : "✦ Generate LCATs →"}
                  </button>
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 12, color: "var(--ink4)" }}>Try:</span>
                  {["project manager", "software developer", "business analyst", "management consultant", "data analyst", "training specialist", "cybersecurity analyst", "program manager"].map(s => (
                    <button key={s} onClick={() => setLibrarySearch(s)}
                      style={{ padding: "4px 10px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: 100, fontSize: 12, color: "var(--ink3)", cursor: "pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {librarySearched && libraryResults.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 12 }}>
                    4 LCAT options for "{librarySearch}"
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                    {libraryResults.map((lcat, i) => {
                      const alreadyAdded = lcats.some(l => l.title === lcat.title);
                      return (
                        <div key={i} style={{ background: "#fff", border: `1px solid ${alreadyAdded ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", padding: "20px", boxShadow: "var(--shadow)" }}>
                          <div style={{ marginBottom: 10 }}>
                            <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 600, background: "var(--amber-bg)", color: "var(--amber)", textTransform: "uppercase", letterSpacing: ".06em" }}>{lcat.level}</span>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginTop: 6 }}>{lcat.title}</div>
                          </div>
                          <div style={{ fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 10 }}>{lcat.description}</div>
                          <div style={{ padding: "10px 12px", background: "var(--cream)", borderRadius: "var(--r)", marginBottom: 12 }}>
                            <div style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 4 }}><strong>In plain English:</strong> {lcat.plainEnglish}</div>
                            <div style={{ fontSize: 12, color: "var(--ink3)" }}><strong>Why GSA values this:</strong> {lcat.whyGSAValues}</div>
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--ink3)", marginBottom: 14 }}>
                            <span>📚 {lcat.education}</span>
                            <span>⏱ {lcat.yearsExperience}+ years</span>
                          </div>
                          {alreadyAdded ? (
                            <div style={{ padding: "8px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 12, color: "var(--green)", textAlign: "center" as const }}>✓ Added to CSP-1</div>
                          ) : (
                            <button onClick={() => { addLcat({ title: lcat.title, description: lcat.description, education: lcat.education, yearsExperience: lcat.yearsExperience, baseRate: "", mfcRate: "", gsaRate: "", rateStatus: null, rateNote: "" }); setGapAnalysis(null); }}
                              style={{ width: "100%", padding: "9px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                              Add to CSP-1 →
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {lcats.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <button onClick={() => setActiveTab("csp1")}
                        style={{ padding: "12px 32px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                        Review my CSP-1 ({lcats.length} LCATs) →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CSP-1 TABLE TAB ── */}
          {activeTab === "csp1" && (
            <div>
              {/* ── QC: MINIMUM LCAT WARNING ── */}
              {lcatsBelowMin && (
                <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--amber)", marginBottom: 4 }}>
                      You have {lcats.length} labor categor{lcats.length !== 1 ? "ies" : "y"} — most GSA Schedule holders have {MIN_LCATS}–15
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6, marginBottom: 10 }}>
                      A thin LCAT list may not cover the full range of work you plan to perform under your Schedule. GSA reviewers expect your CSP-1 to comprehensively reflect your service offerings. You need at least {MIN_LCATS - lcats.length} more labor categor{MIN_LCATS - lcats.length !== 1 ? "ies" : "y"} to reach the recommended minimum.
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setActiveTab("invoices")}
                        style={{ padding: "7px 14px", background: "var(--amber)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                        Upload more invoices
                      </button>
                      <button onClick={() => setActiveTab("library")}
                        style={{ padding: "7px 14px", background: "transparent", border: "1px solid var(--amber-b)", borderRadius: "var(--r)", color: "var(--amber)", fontSize: 12.5, cursor: "pointer" }}>
                        Browse LCAT library
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── QC: GAP ANALYSIS ── */}
              {lcats.length > 0 && (
                <div style={{ background: "#fff", border: `1px solid ${gapAnalysis ? (gapAnalysis.isComplete ? "var(--green-b)" : "var(--amber-b)") : "var(--border)"}`, borderRadius: "var(--rl)", padding: "18px 22px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🔍</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Coverage Gap Analysis</div>
                        <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                          {gapAnalysis ? `Coverage score: ${gapAnalysis.score}/100` : "Check if your LCATs cover all your selected SINs and services"}
                        </div>
                      </div>
                    </div>
                    <button onClick={runGapAnalysis} disabled={runningGapAnalysis}
                      style={{ padding: "8px 18px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: runningGapAnalysis ? "not-allowed" : "pointer", opacity: runningGapAnalysis ? 0.7 : 1, flexShrink: 0 }}>
                      {runningGapAnalysis ? "Analyzing..." : gapAnalysis ? "Re-analyze" : "✦ Run Gap Analysis"}
                    </button>
                  </div>

                  {gapAnalysis && (
                    <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ flex: 1, height: 8, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${gapAnalysis.score}%`, background: gapAnalysis.score >= 80 ? "var(--green)" : gapAnalysis.score >= 60 ? "var(--gold)" : "var(--red)", borderRadius: 100, transition: "width .5s" }} />
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 600, color: gapAnalysis.score >= 80 ? "var(--green)" : gapAnalysis.score >= 60 ? "var(--amber)" : "var(--red)", fontFamily: "'Cormorant Garamond', serif", flexShrink: 0 }}>
                          {gapAnalysis.score}/100
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6, marginBottom: gapAnalysis.suggestedLcats.length > 0 ? 14 : 0 }}>
                        {gapAnalysis.summary}
                      </div>

                      {gapAnalysis.suggestedLcats.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--amber)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                            Suggested additions:
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                            {gapAnalysis.suggestedLcats.map((lcat, i) => (
                              <button key={i}
                                onClick={() => { setLibrarySearch(lcat); setActiveTab("library"); }}
                                style={{ padding: "5px 12px", background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: 100, fontSize: 12, color: "var(--amber)", cursor: "pointer", fontWeight: 500 }}>
                                + {lcat}
                              </button>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 6 }}>Click any suggestion to search the LCAT library for it</div>
                        </div>
                      )}

                      {gapAnalysis.isComplete && (
                        <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 13, color: "var(--green)", fontWeight: 500 }}>
                          ✓ Your LCAT list appears comprehensive for your selected SINs and services.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── QC: RATE BENCHMARKING ── */}
              {lcatsWithRates.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "18px 22px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>📊</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Rate Competitiveness Check</div>
                        <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                          {lcatsNotBenchmarked > 0
                            ? `${lcatsNotBenchmarked} LCAT${lcatsNotBenchmarked !== 1 ? "s" : ""} not yet benchmarked`
                            : "All rates benchmarked against GSA market data"}
                        </div>
                      </div>
                    </div>
                    {lcatsNotBenchmarked > 0 && (
                      <button onClick={benchmarkAllRates} disabled={!!benchmarkingId}
                        style={{ padding: "8px 18px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: benchmarkingId ? "not-allowed" : "pointer", opacity: benchmarkingId ? 0.7 : 1, flexShrink: 0 }}>
                        {benchmarkingId ? "Benchmarking..." : "✦ Benchmark All Rates"}
                      </button>
                    )}
                  </div>

                  {lcats.some(l => l.rateStatus) && (
                    <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", gap: 16 }}>
                      {(["competitive", "check", "low"] as const).map(status => {
                        const count = lcats.filter(l => l.rateStatus === status).length;
                        if (count === 0) return null;
                        const cfg = rateStatusConfig[status];
                        return (
                          <div key={status} style={{ padding: "8px 14px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "var(--r)", fontSize: 12, color: cfg.color, fontWeight: 500 }}>
                            {cfg.label}: {count}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* IFF reminder */}
              <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--amber)" }}>IFF reminder:</strong> Your GSA rate is your MFC rate minus 0.75%. Your GSA rate must never be higher than the price you charge any commercial client for the same work.
                </div>
              </div>

              {/* Action bar */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "14px 20px", marginBottom: 20, boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "var(--ink3)" }}>
                  <strong style={{ color: "var(--navy)" }}>{lcats.length}</strong> labor categor{lcats.length !== 1 ? "ies" : "y"}
                  {lcatsBelowMin && <span style={{ color: "var(--amber)", marginLeft: 8 }}>· {MIN_LCATS - lcats.length} more recommended</span>}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                  <button onClick={() => setActiveTab("invoices")} style={{ padding: "8px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12.5, cursor: "pointer", color: "var(--ink3)" }}>+ From invoices</button>
                  <button onClick={() => setActiveTab("library")} style={{ padding: "8px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12.5, cursor: "pointer", color: "var(--ink3)" }}>+ From library</button>
                  <button onClick={() => setAddingNew(true)} style={{ padding: "8px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12.5, cursor: "pointer", color: "var(--ink3)" }}>+ Add manually</button>
                  <button onClick={exportCSP1} disabled={lcats.length === 0}
                    style={{ padding: "8px 16px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12.5, fontWeight: 500, cursor: lcats.length === 0 ? "not-allowed" : "pointer", opacity: lcats.length === 0 ? 0.5 : 1 }}>
                    ⬇ Export CSP-1
                  </button>
                  <button onClick={() => savePricing(false)} disabled={saving}
                    style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {/* Add manually form */}
              {addingNew && (
                <div style={{ background: "#fff", border: "2px solid var(--gold)", borderRadius: "var(--rl)", padding: "24px", marginBottom: 20, boxShadow: "var(--shadow-lg)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400 }}>Add Labor Category</h3>
                    <button onClick={() => setAddingNew(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--ink3)" }}>✕</button>
                  </div>
                  <LcatForm lcat={newLcat} onChange={setNewLcat} onMfcChange={val => handleMfcChange(val, true)} calcGsaRate={calcGsaRate} />
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                    <button onClick={() => setAddingNew(false)} style={{ padding: "9px 18px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => { addLcat(newLcat); setNewLcat({ ...EMPTY_LCAT }); setAddingNew(false); setGapAnalysis(null); }}
                      disabled={!newLcat.title.trim()}
                      style={{ padding: "9px 24px", background: newLcat.title.trim() ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: newLcat.title.trim() ? "#fff" : "var(--ink4)", fontSize: 13, fontWeight: 500, cursor: newLcat.title.trim() ? "pointer" : "not-allowed" }}>
                      Add LCAT →
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {lcats.length === 0 && !addingNew && (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "60px 40px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>💰</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>No labor categories yet</h3>
                  <p style={{ fontSize: 13.5, color: "var(--ink3)", maxWidth: 400, margin: "0 auto 24px", lineHeight: 1.6 }}>Upload invoices to auto-extract rates, browse the LCAT library, or add manually.</p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button onClick={() => setActiveTab("invoices")} style={{ padding: "11px 22px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Upload Invoices</button>
                    <button onClick={() => setActiveTab("library")} style={{ padding: "11px 22px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Browse Library</button>
                  </div>
                </div>
              )}

              {/* LCAT table */}
              {lcats.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {lcats.map((lcat, i) => (
                    <div key={lcat.id} style={{ background: "#fff", border: `1px solid ${lcat.rateStatus === "low" ? "var(--red-b)" : lcat.rateStatus === "competitive" ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                      {editingId === lcat.id ? (
                        <div style={{ padding: "24px" }}>
                          <LcatForm lcat={editForm} onChange={setEditForm} onMfcChange={val => handleMfcChange(val, false)} calcGsaRate={calcGsaRate} />
                          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                            <button onClick={() => setEditingId(null)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>Cancel</button>
                            <button onClick={saveEdit} style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Save Changes</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: "18px 24px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: lcat.mfcRate ? "var(--green)" : "var(--amber-bg)", border: `2px solid ${lcat.mfcRate ? "var(--green)" : "var(--amber-b)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: lcat.mfcRate ? "#fff" : "var(--amber)", fontWeight: 600 }}>
                              {lcat.mfcRate ? "✓" : i + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>{lcat.title}</div>
                              {lcat.description && <div style={{ fontSize: 12.5, color: "var(--ink3)", marginBottom: 8, lineHeight: 1.5, maxWidth: 600 }}>{lcat.description}</div>}
                              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink3)", flexWrap: "wrap" as const, alignItems: "center" }}>
                                {lcat.education && <span>📚 {lcat.education}</span>}
                                {lcat.yearsExperience && <span>⏱ {lcat.yearsExperience}+ years</span>}
                                {lcat.mfcRate ? (
                                  <>
                                    <span>MFC: <strong style={{ color: "var(--navy)" }}>${lcat.mfcRate}/hr</strong></span>
                                    <span style={{ color: "var(--green)", fontWeight: 500 }}>GSA: ${lcat.gsaRate}/hr</span>
                                  </>
                                ) : (
                                  <span style={{ color: "var(--amber)", fontWeight: 500 }}>⚠ Rate not set — click Edit to add</span>
                                )}
                                {/* Rate benchmark badge */}
                                {lcat.rateStatus && (
                                  <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: rateStatusConfig[lcat.rateStatus].bg, color: rateStatusConfig[lcat.rateStatus].color, border: `1px solid ${rateStatusConfig[lcat.rateStatus].border}` }}>
                                    {rateStatusConfig[lcat.rateStatus].label}
                                  </span>
                                )}
                              </div>
                              {/* Rate note */}
                              {lcat.rateNote && (
                                <div style={{ marginTop: 6, fontSize: 12, color: lcat.rateStatus === "competitive" ? "var(--green)" : lcat.rateStatus === "low" ? "var(--red)" : "var(--amber)", fontStyle: "italic" }}>
                                  {lcat.rateNote}
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                              {lcat.mfcRate && !lcat.rateStatus && (
                                <button onClick={() => benchmarkRate(lcat)} disabled={benchmarkingId === lcat.id}
                                  style={{ padding: "6px 10px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 11, cursor: "pointer", color: "var(--ink3)" }}>
                                  {benchmarkingId === lcat.id ? "..." : "📊 Benchmark"}
                                </button>
                              )}
                              <button onClick={() => startEdit(lcat)} style={{ padding: "6px 12px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}>Edit</button>
                              <button onClick={() => removeLcat(lcat.id)} style={{ padding: "6px 12px", background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--red)" }}>Remove</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {lcats.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Notes (optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Any additional pricing context — seasonal rates, volume discounts, special terms, etc."
                    style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
                </div>
              )}

              {/* Bottom nav */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
                <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>← Back to Dashboard</a>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {lcats.length > 0 && (
                    <button onClick={exportCSP1} style={{ padding: "12px 20px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                      ⬇ Export CSP-1 CSV
                    </button>
                  )}
                  {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                  <button onClick={() => savePricing(true)} disabled={saving}
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

function LcatForm({ lcat, onChange, onMfcChange, calcGsaRate }: {
  lcat: Omit<LCAT, "id">;
  onChange: (l: Omit<LCAT, "id">) => void;
  onMfcChange: (val: string) => void;
  calcGsaRate: (val: string) => string;
}) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 11.5, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>LCAT Title *</label>
          <input type="text" value={lcat.title} onChange={e => onChange({ ...lcat, title: e.target.value })}
            placeholder="e.g. Senior Project Manager"
            style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 11.5, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>
            Description <span style={{ color: "var(--ink4)", fontWeight: 400 }}>({lcat.description.length}/500 chars)</span>
          </label>
          <textarea value={lcat.description} onChange={e => onChange({ ...lcat, description: e.target.value })}
            placeholder="Describe the duties, responsibilities, and deliverables for this role..."
            style={{ width: "100%", minHeight: 80, padding: "9px 12px", border: `1px solid ${lcat.description.length > 500 ? "var(--red)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11.5, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>Minimum Education</label>
          <select value={lcat.education} onChange={e => onChange({ ...lcat, education: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", background: "#fff" }}>
            {EDUCATION_LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11.5, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>Minimum Years Experience</label>
          <input type="text" value={lcat.yearsExperience} onChange={e => onChange({ ...lcat, yearsExperience: e.target.value })}
            placeholder="e.g. 5"
            style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11.5, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>
            Most Favored Customer Rate ($/hr)
            <span style={{ display: "block", fontSize: 10.5, color: "var(--ink4)", fontWeight: 400, marginTop: 1 }}>Your best commercial rate for this role</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink3)" }}>$</span>
            <input type="text" value={lcat.mfcRate} onChange={e => onMfcChange(e.target.value)}
              placeholder="0.00"
              style={{ width: "100%", padding: "9px 10px 9px 22px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Mono', monospace" }} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11.5, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>
            GSA Rate w/ IFF ($/hr)
            <span style={{ display: "block", fontSize: 10.5, color: "var(--ink4)", fontWeight: 400, marginTop: 1 }}>Auto-calculated: MFC × 0.9925</span>
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink3)" }}>$</span>
            <input type="text" value={lcat.gsaRate} readOnly
              style={{ width: "100%", padding: "9px 10px 9px 22px", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Mono', monospace", background: "var(--green-bg)", color: "var(--green)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}