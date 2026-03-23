"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

// GSA eOffer field mapping — which section feeds which eOffer tab
const EOFFER_FIELDS = [
  {
    tab: "Tab 1 — Company Information",
    tabColor: "var(--blue)",
    tabBg: "var(--blue-bg)",
    fields: [
      { id: "businessName", label: "Legal Business Name", source: "client", key: "businessName", charLimit: 100, instructions: "Enter your company's legal name exactly as it appears on your SAM.gov registration." },
      { id: "ein", label: "EIN / Tax ID", source: "client", key: "ein", charLimit: 20, instructions: "9-digit Employer Identification Number from the IRS. Format: XX-XXXXXXX." },
      { id: "uei", label: "Unique Entity Identifier (UEI)", source: "client", key: "uei", charLimit: 12, instructions: "12-character UEI from your SAM.gov registration. Replaces DUNS as of April 2022." },
      { id: "cageCode", label: "CAGE Code", source: "client", key: "cageCode", charLimit: 5, instructions: "5-character Commercial and Government Entity code from SAM.gov." },
    ]
  },
  {
    tab: "Tab 2 — Corporate Experience",
    tabColor: "var(--purple)",
    tabBg: "var(--purple-bg)",
    fields: [
      { id: "corp_overview", label: "Company Overview", source: "narrativeCorp", narrativeKey: "overview", charLimit: 1500, instructions: "Paste into the 'Corporate Overview' field in eOffer Tab 2. Describe your company history, mission, and core business." },
      { id: "corp_capabilities", label: "Core Capabilities & Services", source: "narrativeCorp", narrativeKey: "capabilities", charLimit: 1500, instructions: "Paste into the 'Capabilities' field. List specific services you will offer under your GSA Schedule." },
      { id: "corp_employees", label: "Employee Experience & Qualifications", source: "narrativeCorp", narrativeKey: "employees", charLimit: 1500, instructions: "Paste into the 'Employee Experience' field. Describe your team's qualifications, certifications, and expertise." },
      { id: "corp_org", label: "Organizational & Accounting Controls", source: "narrativeCorp", narrativeKey: "org_controls", charLimit: 1000, instructions: "Paste into the 'Organizational Controls' field. Describe your management structure and accounting system." },
      { id: "corp_resources", label: "Resources & Capacity", source: "narrativeCorp", narrativeKey: "resources", charLimit: 800, instructions: "Paste into the 'Resources' field. Describe office locations, equipment, and ability to scale." },
      { id: "corp_past", label: "Summary of Past Projects", source: "narrativeCorp", narrativeKey: "past_projects", charLimit: 1500, instructions: "Paste into the 'Past Projects' field. Briefly describe 2-3 most relevant past projects." },
      { id: "corp_marketing", label: "Federal Marketing Plan", source: "narrativeCorp", narrativeKey: "marketing", charLimit: 800, instructions: "Paste into the 'Marketing Plan' field. Describe how you plan to market your GSA Schedule." },
      { id: "corp_subs", label: "Subcontractor Management", source: "narrativeCorp", narrativeKey: "subcontractors", charLimit: 400, instructions: "Paste into the 'Subcontractor Management' field. State your subcontracting approach." },
    ]
  },
  {
    tab: "Tab 3 — Quality Control Plan",
    tabColor: "var(--teal)",
    tabBg: "var(--teal-bg)",
    fields: [
      { id: "qcp_overview", label: "Quality Control Overview", source: "narrativeQCP", narrativeKey: "overview", charLimit: 2000, instructions: "Paste into the 'QCP Overview' field. Describe your overall quality management approach." },
      { id: "qcp_supervision", label: "Direct Supervision of Projects", source: "narrativeQCP", narrativeKey: "supervision", charLimit: 2000, instructions: "Paste into the 'Supervision' field. Describe project oversight, review cadence, and checkpoints." },
      { id: "qcp_personnel", label: "Quality Control Personnel", source: "narrativeQCP", narrativeKey: "personnel", charLimit: 1500, instructions: "Paste into the 'QC Personnel' field. Describe QC roles, qualifications, and responsibilities." },
      { id: "qcp_subs", label: "Subcontractor Quality Management", source: "narrativeQCP", narrativeKey: "subcontractors", charLimit: 1500, instructions: "Paste into the 'Subcontractor QC' field. Describe how you monitor subcontractor quality." },
      { id: "qcp_corrective", label: "Problem Areas & Corrective Action", source: "narrativeQCP", narrativeKey: "corrective", charLimit: 1500, instructions: "Paste into the 'Corrective Action' field. Describe issue identification, documentation, and resolution." },
      { id: "qcp_urgent", label: "Urgent Requirements & Simultaneous Projects", source: "narrativeQCP", narrativeKey: "urgent", charLimit: 1000, instructions: "Paste into the 'Urgent Requirements' field. Describe surge capacity and managing simultaneous projects." },
    ]
  },
  {
    tab: "Tab 4 — Past Performance",
    tabColor: "var(--amber)",
    tabBg: "var(--amber-bg)",
    fields: [
      { id: "pp_instructions", label: "Past Performance Upload Instructions", source: "static", staticValue: "GSA eOffer does not accept pasted text for Past Performance. Each reference must be uploaded as a separate document. See instructions below.", charLimit: null, instructions: "In eOffer Tab 4: Upload each CPARS report or completed PPQ as a separate PDF attachment. GovCert has sent PPQ emails to your references — download the completed forms from your email and upload them here." },
    ]
  },
  {
    tab: "Tab 5 — Pricing (CSP-1)",
    tabColor: "var(--green)",
    tabBg: "var(--green-bg)",
    fields: [
      { id: "pricing_instructions", label: "CSP-1 Upload Instructions", source: "static", staticValue: "Your CSP-1 pricing must be uploaded as an Excel file (.xlsx) in GSA's required format. Use the Export CSP-1 button on the Pricing page to download your formatted file, then upload it in eOffer Tab 5.", charLimit: null, instructions: "In eOffer Tab 5: Upload the CSP-1 Excel file you exported from GovCert. Do not paste pricing data manually — the formatted Excel file is required." },
    ]
  },
];

function extractNarrativeField(narrativeJson: string | undefined, key: string): string {
  if (!narrativeJson) return "";
  try {
    const parsed = JSON.parse(narrativeJson);
    // Handle both old format (direct keys) and new format (narratives + guidedAnswers)
    if (parsed.narratives) return parsed.narratives[key] || "";
    if (parsed.answers) return parsed.answers[key] || "";
    return parsed[key] || "";
  } catch {
    return "";
  }
}

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<string | null>("Tab 1 — Company Information");
  const [showInstructions, setShowInstructions] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [pricingData, setPricingData] = useState<any>(null);
  const [unlocking, setUnlocking] = useState(false);

  // Editable company info
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyEdits, setCompanyEdits] = useState<Record<string, string>>({});
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  // Inline editing for ALL fields
  const [inlineEdits, setInlineEdits] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);

  // CSP-1 / pricing LCATs
  const [lcats, setLcats] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCert();
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const pricing = await apiRequest("/api/pricing");
      setPricingData(pricing);
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      // Only auto-grant if user already has CONSULTING tier (already paid/upgraded)
      if (userData.subscriptionTier === "CONSULTING") {
        setAccessGranted(true);
      }
      // Otherwise show paywall — even during beta (price will be $0)
    } catch {
      setAccessGranted(true); // Fail open
    } finally {
      setCheckingAccess(false);
    }
  }

  async function handleUnlock() {
    setUnlocking(true);
    try {
      const price = pricingData?.tiers?.PLATFORM?.monthlyPrice || 0;
      if (price === 0) {
        // Free / beta — instant unlock
        setAccessGranted(true);
      } else {
        // Paid — redirect to upgrade page
        router.push("/portal/upgrade");
      }
    } finally {
      setUnlocking(false);
    }
  }

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      // Parse LCATs from pricingData
      if (data.application?.pricingData) {
        try {
          const pd = JSON.parse(data.application.pricingData);
          if (Array.isArray(pd)) setLcats(pd);
          else if (pd.lcats && Array.isArray(pd.lcats)) setLcats(pd.lcats);
        } catch {}
      }
      // Init company edits
      if (data.client) {
        setCompanyEdits({
          businessName: data.client.businessName || "",
          ein: data.client.ein || "",
          uei: data.client.uei || "",
          cageCode: data.client.cageCode || "",
          address: data.client.address || "",
          city: data.client.city || "",
          state: data.client.state || "",
          zip: data.client.zip || "",
          phone: data.client.phone || "",
          email: data.client.email || "",
          website: data.client.website || "",
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function saveCompanyEdits() {
    if (!cert?.client?.id) return;
    setSavingCompany(true);
    try {
      await apiRequest(`/api/clients/${cert.client.id}`, {
        method: "PUT",
        body: JSON.stringify(companyEdits),
      });
      // Update local cert state
      setCert((prev: any) => ({ ...prev, client: { ...prev.client, ...companyEdits } }));
      setCompanySaved(true);
      setEditingCompany(false);
      setTimeout(() => setCompanySaved(false), 3000);
    } catch (err: any) {
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSavingCompany(false);
    }
  }

  function downloadCSP1() {
    if (lcats.length === 0) return;
    const headers = ["Labor Category Title", "Description", "Education", "Min Years Experience", "MFC Rate", "GSA Rate"];
    const rows = lcats.map((l: any) => [
      l.title || "", (l.description || "").replace(/"/g, '""'), l.education || "", l.experience || "",
      l.mfcRate || l.baseRate || "", l.gsaRate || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map((v: any) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CSP-1_${cert?.client?.businessName?.replace(/\s+/g, "_") || "pricing"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveInlineField(field: any) {
    const val = inlineEdits[field.id];
    if (val === undefined) return;
    setSavingField(field.id);
    try {
      if (field.source === "client") {
        // Save to client record
        await apiRequest(`/api/clients/${cert.client.id}`, {
          method: "PUT",
          body: JSON.stringify({ [field.key]: val }),
        });
        setCert((prev: any) => ({ ...prev, client: { ...prev.client, [field.key]: val } }));
      } else if (field.source === "narrativeCorp" || field.source === "narrativeQCP") {
        // Save to certification narrative JSON
        const narrativeField = field.source === "narrativeCorp" ? "narrativeCorp" : "narrativeQCP";
        let existing: any = {};
        try { existing = JSON.parse(cert?.application?.[narrativeField] || "{}"); } catch {}
        // Support nested narratives format
        if (existing.narratives) {
          existing.narratives[field.narrativeKey] = val;
        } else {
          existing[field.narrativeKey] = val;
        }
        await apiRequest(`/api/certifications/${certId}`, {
          method: "PUT",
          body: JSON.stringify({ [narrativeField]: JSON.stringify(existing) }),
        });
        setCert((prev: any) => ({
          ...prev,
          application: { ...prev.application, [narrativeField]: JSON.stringify(existing) }
        }));
      }
      setEditingField(null);
      setSavedField(field.id);
      setTimeout(() => setSavedField(null), 2000);
    } catch (err: any) {
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSavingField(null);
    }
  }

  function startEditing(field: any, currentValue: string) {
    setEditingField(field.id);
    setInlineEdits(prev => ({ ...prev, [field.id]: currentValue }));
  }

  function getFieldValue(field: any): string {
    if (field.source === "static") return field.staticValue || "";
    if (field.source === "client") return cert?.client?.[field.key] || "";
    if (field.source === "narrativeCorp") return extractNarrativeField(cert?.application?.narrativeCorp, field.narrativeKey);
    if (field.source === "narrativeQCP") return extractNarrativeField(cert?.application?.narrativeQCP, field.narrativeKey);
    return "";
  }

  function isFieldComplete(field: any): boolean {
    if (field.source === "static") return true;
    return !!getFieldValue(field).trim();
  }

  async function copyToClipboard(fieldId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(fieldId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedId(fieldId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function getCompletenessScore() {
    let total = 0, complete = 0;
    EOFFER_FIELDS.forEach(tab => {
      tab.fields.forEach(field => {
        if (field.source !== "static") {
          total++;
          if (isFieldComplete(field)) complete++;
        }
      });
    });
    return { total, complete, pct: total ? Math.round(complete / total * 100) : 0 };
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const score = getCompletenessScore();

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
          {/* Completeness score */}
          <div style={{ margin: "0 0 16px", padding: "12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>Complete</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: score.pct === 100 ? "var(--green)" : "var(--gold2)" }}>{score.pct}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 100, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${score.pct}%`, background: score.pct === 100 ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>{score.complete}/{score.total} fields ready</div>
          </div>

          {/* Tab nav */}
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 6, fontWeight: 600 }}>eOffer Tabs</div>
          {EOFFER_FIELDS.map(tab => {
            const tabComplete = tab.fields.filter(f => f.source !== "static").every(f => isFieldComplete(f));
            const tabTotal = tab.fields.filter(f => f.source !== "static").length;
            const tabDone = tab.fields.filter(f => f.source !== "static" && isFieldComplete(f)).length;
            return (
              <div key={tab.tab} onClick={() => setExpandedTab(expandedTab === tab.tab ? null : tab.tab)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, cursor: "pointer", background: expandedTab === tab.tab ? "rgba(200,155,60,.15)" : "transparent", color: expandedTab === tab.tab ? "var(--gold2)" : "rgba(255,255,255,.45)", fontSize: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: tabComplete ? "var(--green)" : tabTotal === 0 ? "rgba(255,255,255,.15)" : "rgba(200,155,60,.3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff" }}>
                  {tabComplete ? "✓" : ""}
                </div>
                <span style={{ flex: 1, fontSize: 11 }}>{tab.tab.split(" — ")[1]}</span>
                {tabTotal > 0 && <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)" }}>{tabDone}/{tabTotal}</span>}
              </div>
            );
          })}

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
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {checkingAccess && (
          <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)", fontSize: 14 }}>
            Checking access...
          </div>
        )}
        {!checkingAccess && !accessGranted && (
          <div style={{ position: "fixed", top: 0, left: 240, right: 0, bottom: 0, background: "rgba(11,25,41,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#fff", borderRadius: 16, maxWidth: 520, width: "100%", padding: "40px 32px", textAlign: "center" as const, boxShadow: "0 12px 40px rgba(0,0,0,.25)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#0B1929", fontWeight: 400, marginBottom: 8 }}>
                Unlock Your Submission Package
              </h2>
              <p style={{ fontSize: 15, color: "var(--ink3)", lineHeight: 1.7, marginBottom: 24 }}>
                Your GSA MAS eOffer package is ready. Upgrade to access your complete, submission-ready documents with all AI-generated narratives, formatted for direct use in eOffer.
              </p>
              <div style={{ background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.2)", borderRadius: 8, padding: 16, marginBottom: 24, textAlign: "left" as const }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 8 }}>Your package includes:</div>
                {[
                  "Corporate Experience Narrative (copy-paste ready)",
                  "Quality Control Plan",
                  "Past Performance formatted for eOffer",
                  "Financial capability summary",
                  "CSP-1 Pricing worksheet",
                  "Complete submission checklist",
                ].map((item) => (
                  <div key={item} style={{ fontSize: 13, color: "var(--ink2)", padding: "3px 0" }}>✓ {item}</div>
                ))}
              </div>
              {/* Pricing display */}
              <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--cream, #F5F1E8)", borderRadius: 8 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--navy)", fontWeight: 400, lineHeight: 1 }}>
                  {pricingData?.tiers?.PLATFORM?.monthlyPrice === 0 ? "Free" : `$${pricingData?.tiers?.PLATFORM?.monthlyPrice || 0}/mo`}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 4 }}>
                  {pricingData?.betaMode ? "Beta pricing — no payment required" : "Subscription required"}
                </div>
              </div>

              {/* Payment methods (visual — for when pricing is > $0) */}
              {pricingData?.tiers?.PLATFORM?.monthlyPrice > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ padding: "4px 12px", background: "#fff", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, color: "var(--ink3)" }}>💳 Credit Card</span>
                  <span style={{ padding: "4px 12px", background: "#fff", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, color: "var(--ink3)" }}>PayPal</span>
                  <span style={{ padding: "4px 12px", background: "#fff", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, color: "var(--ink3)" }}>Apple Pay</span>
                </div>
              )}

              <button onClick={handleUnlock} disabled={unlocking} style={{ display: "block", width: "100%", padding: 14, background: "linear-gradient(135deg, #C89B3C, #E8B84B)", border: "none", borderRadius: 8, color: "#fff", fontSize: 16, fontWeight: 600, cursor: unlocking ? "not-allowed" : "pointer", marginBottom: 12, boxShadow: "0 4px 20px rgba(200,155,60,.35)", fontFamily: "'DM Sans', sans-serif" }}>
                {unlocking ? "Unlocking..." : pricingData?.tiers?.PLATFORM?.monthlyPrice === 0 ? "Unlock Now — Free →" : `Subscribe — $${pricingData?.tiers?.PLATFORM?.monthlyPrice}/mo →`}
              </button>
              <p style={{ fontSize: 12, color: "var(--ink4)" }}>
                {pricingData?.betaMode ? "Currently free during beta — unlock instantly" : "30-day money-back guarantee"}
              </p>
            </div>
          </div>
        )}
        <div style={!checkingAccess && !accessGranted ? { filter: "blur(8px)", pointerEvents: "none" as const, userSelect: "none" as const } : {}}>
        <div style={{ padding: "40px 48px", maxWidth: 920 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application Dashboard
          </a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Final Step</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              eOffer Submission Package
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Your application is ready to submit to GSA. Click <strong style={{ color: "var(--navy)" }}>Copy</strong> next to each field, then paste it into the corresponding tab in GSA eOffer at <a href="https://eoffer.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>eoffer.gsa.gov</a>.
            </p>
          </div>

          {/* Completeness banner */}
          <div style={{ background: score.pct === 100 ? "var(--green-bg)" : "var(--navy)", border: `1px solid ${score.pct === 100 ? "var(--green-b)" : "rgba(255,255,255,.08)"}`, borderRadius: "var(--rl)", padding: "20px 26px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: score.pct === 100 ? "var(--green)" : "var(--gold2)", marginBottom: 6 }}>
                {score.pct === 100 ? "✓ All fields complete — ready to submit" : `${score.complete} of ${score.total} fields complete`}
              </div>
              {score.pct < 100 && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>
                  {score.total - score.complete} field{score.total - score.complete !== 1 ? "s" : ""} still need content. Go back to the relevant sections to complete them, then return here.
                </div>
              )}
              {score.pct === 100 && (
                <div style={{ fontSize: 13, color: "var(--green)", lineHeight: 1.5 }}>
                  Every field is populated. Copy each section below and paste it into GSA eOffer.
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: score.pct === 100 ? "var(--green)" : "var(--gold2)", lineHeight: 1 }}>{score.pct}%</div>
              <div style={{ height: 6, width: 120, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden", marginTop: 6 }}>
                <div style={{ height: "100%", width: `${score.pct}%`, background: score.pct === 100 ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
              </div>
            </div>
          </div>

          {/* GSA eOffer instructions */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏛️</span> How to Submit in GSA eOffer
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { n: "1", title: "Log into eOffer", desc: "Go to eoffer.gsa.gov and sign in with your SAM.gov credentials." },
                { n: "2", title: "Find your solicitation", desc: "Search for the GSA MAS solicitation number for your SIN category." },
                { n: "3", title: "Copy & paste each field", desc: "Use the Copy buttons below. Paste each field into the corresponding tab in eOffer." },
                { n: "4", title: "Upload documents", desc: "Upload your CPARS/PPQ files in Tab 4 and your CSP-1 Excel file in Tab 5." },
              ].map(step => (
                <div key={step.n} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: "var(--gold2)", fontWeight: 700 }}>{step.n}</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{step.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink3)", lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* eOffer tabs */}
          {EOFFER_FIELDS.map(tab => {
            const isExpanded = expandedTab === tab.tab;
            const tabComplete = tab.fields.filter(f => f.source !== "static").every(f => isFieldComplete(f));
            const tabTotal = tab.fields.filter(f => f.source !== "static").length;
            const tabDone = tab.fields.filter(f => f.source !== "static" && isFieldComplete(f)).length;
            return (
              <div key={tab.tab} style={{ background: "#fff", border: `1px solid ${tabComplete && tabTotal > 0 ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", marginBottom: 12, boxShadow: "var(--shadow)", overflow: "hidden" }}>
                <div onClick={() => setExpandedTab(isExpanded ? null : tab.tab)}
                  style={{ padding: "16px 22px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: isExpanded ? "var(--cream)" : "#fff", transition: "background .12s" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: tab.tabBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {tabComplete && tabTotal > 0 ? "✓" : tabTotal === 0 ? "📤" : "○"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{tab.tab}</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                      {tabTotal === 0 ? "Upload required — see instructions" : `${tabDone}/${tabTotal} fields complete`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                    {tabTotal > 0 && (
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: tabComplete ? "var(--green-bg)" : "var(--amber-bg)", color: tabComplete ? "var(--green)" : "var(--amber)" }}>
                        {tabComplete ? "✓ Complete" : `${tabDone}/${tabTotal}`}
                      </span>
                    )}
                    <span style={{ fontSize: 16, color: "var(--gold)" }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "20px 22px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {tab.fields.map(field => {
                        const value = getFieldValue(field);
                        const isComplete = isFieldComplete(field);
                        const isCopied = copiedId === field.id;
                        const isOver = field.charLimit && value.length > field.charLimit;
                        const isStatic = field.source === "static";

                        return (
                          <div key={field.id} style={{ border: `1px solid ${isOver ? "var(--red-b)" : isComplete && !isStatic ? "var(--green-b)" : isStatic ? "var(--blue-b)" : "var(--border)"}`, borderRadius: "var(--r)", overflow: "hidden" }}>
                            {/* Field header */}
                            <div style={{ padding: "12px 16px", background: isOver ? "var(--red-bg)" : isComplete && !isStatic ? "var(--green-bg)" : isStatic ? "var(--blue-bg)" : "var(--cream)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: isOver ? "var(--red)" : isStatic ? "var(--blue)" : "var(--navy)", marginBottom: 2 }}>
                                  {isComplete && !isStatic && !isOver && <span style={{ color: "var(--green)", marginRight: 6 }}>✓</span>}
                                  {!isComplete && !isStatic && <span style={{ color: "var(--amber)", marginRight: 6 }}>⚠</span>}
                                  {isOver && <span style={{ color: "var(--red)", marginRight: 6 }}>✕</span>}
                                  {field.label}
                                </div>
                                {field.charLimit && (
                                  <div style={{ fontSize: 11, color: isOver ? "var(--red)" : "var(--ink4)", fontFamily: "'DM Mono', monospace" }}>
                                    {value.length.toLocaleString()} / {field.charLimit.toLocaleString()} chars
                                    {isOver && " ⚠ Over limit — trim before pasting"}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                                <button
                                  onClick={() => setShowInstructions(showInstructions === field.id ? null : field.id)}
                                  style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}>
                                  {showInstructions === field.id ? "Hide" : "ℹ Instructions"}
                                </button>
                                {!isStatic && value && editingField !== field.id && (
                                  <button
                                    onClick={() => copyToClipboard(field.id, inlineEdits[field.id] ?? value)}
                                    style={{ padding: "6px 16px", background: isCopied ? "var(--green)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, cursor: "pointer", color: isCopied ? "#fff" : "var(--gold2)", transition: "all .15s", minWidth: 80 }}>
                                    {isCopied ? "✓ Copied!" : "Copy →"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Instructions */}
                            {showInstructions === field.id && (
                              <div style={{ padding: "10px 16px", background: "var(--amber-bg)", borderTop: "1px solid var(--amber-b)", fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6, display: "flex", gap: 8 }}>
                                <span style={{ fontSize: 14, flexShrink: 0 }}>📋</span>
                                <span>{field.instructions}</span>
                              </div>
                            )}

                            {/* Field content — inline editable */}
                            <div style={{ padding: "14px 16px" }}>
                              {isStatic ? (
                                <div style={{ fontSize: 13, color: "var(--blue)", lineHeight: 1.6, fontStyle: "italic" }}>{value}</div>
                              ) : editingField === field.id ? (
                                <div>
                                  <textarea
                                    value={inlineEdits[field.id] ?? value}
                                    onChange={e => setInlineEdits(prev => ({ ...prev, [field.id]: e.target.value }))}
                                    rows={field.source === "client" ? 1 : 8}
                                    style={{
                                      width: "100%", padding: "10px 14px", border: "2px solid var(--gold)",
                                      borderRadius: "var(--r)", fontSize: 13, lineHeight: 1.7, resize: "vertical",
                                      outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const,
                                      minHeight: field.source === "client" ? 40 : 150,
                                      background: "rgba(200,155,60,.03)",
                                    }}
                                    autoFocus
                                  />
                                  {field.charLimit && (
                                    <div style={{ fontSize: 11, color: (inlineEdits[field.id] || "").length > field.charLimit ? "var(--red)" : "var(--ink4)", marginTop: 4, textAlign: "right" as const }}>
                                      {(inlineEdits[field.id] || "").length.toLocaleString()} / {field.charLimit.toLocaleString()} chars
                                    </div>
                                  )}
                                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                                    <button onClick={() => setEditingField(null)}
                                      style={{ padding: "6px 16px", background: "var(--cream2)", border: "none", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}>
                                      Cancel
                                    </button>
                                    <button onClick={() => saveInlineField(field)} disabled={savingField === field.id}
                                      style={{ padding: "6px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#fff" }}>
                                      {savingField === field.id ? "Saving..." : "Save"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ cursor: "pointer", position: "relative" }}
                                  onClick={() => startEditing(field, value)}>
                                  {value ? (
                                    <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto", fontFamily: "'DM Sans', sans-serif" }}>
                                      {value}
                                      <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 8, fontWeight: 500 }}>Click to edit</div>
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                                      <span style={{ fontSize: 16 }}>✏️</span>
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--gold)", marginBottom: 2 }}>Click to add content</div>
                                        <div style={{ fontSize: 12, color: "var(--ink3)" }}>Type directly here, or go to the <a href={`/certifications/${certId}`} onClick={e => e.stopPropagation()} style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>Application Dashboard</a> for guided input.</div>
                                      </div>
                                    </div>
                                  )}
                                  {savedField === field.id && (
                                    <div style={{ position: "absolute", top: 0, right: 0, padding: "4px 12px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 11, color: "var(--green)", fontWeight: 500 }}>✓ Saved</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Edit Company Info */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 12, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editingCompany ? 16 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>&#x270F;&#xFE0F;</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Company Information</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>Update your business details before submitting to eOffer</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {companySaved && <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 500 }}>Saved</span>}
                <button onClick={() => setEditingCompany(!editingCompany)}
                  style={{ padding: "7px 16px", background: editingCompany ? "var(--cream2)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, color: editingCompany ? "var(--ink3)" : "var(--gold2)", cursor: "pointer" }}>
                  {editingCompany ? "Cancel" : "Edit Fields"}
                </button>
              </div>
            </div>
            {editingCompany && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { key: "businessName", label: "Legal Business Name" },
                    { key: "ein", label: "EIN / Tax ID" },
                    { key: "uei", label: "UEI" },
                    { key: "cageCode", label: "CAGE Code" },
                    { key: "address", label: "Address" },
                    { key: "city", label: "City" },
                    { key: "state", label: "State" },
                    { key: "zip", label: "ZIP" },
                    { key: "phone", label: "Phone" },
                    { key: "email", label: "Email" },
                    { key: "website", label: "Website" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink3)", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 4, display: "block" }}>{f.label}</label>
                      <input value={companyEdits[f.key] || ""} onChange={e => setCompanyEdits(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={saveCompanyEdits} disabled={savingCompany}
                    style={{ padding: "8px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                    {savingCompany ? "Saving..." : "Save Company Info"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CSP-1 Download */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: lcats.length > 0 ? 16 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>&#x1F4CA;</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>CSP-1 Commercial Supplier Pricelist</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                    {lcats.length > 0 ? `${lcats.length} labor categor${lcats.length === 1 ? "y" : "ies"} configured` : "No labor categories configured yet"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`/certifications/${certId}/pricing`}
                  style={{ padding: "7px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, color: "var(--ink3)", textDecoration: "none", cursor: "pointer" }}>
                  {lcats.length > 0 ? "Edit LCATs" : "Set Up Pricing"}
                </a>
                {lcats.length > 0 && (
                  <button onClick={downloadCSP1}
                    style={{ padding: "7px 16px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, color: "var(--gold2)", cursor: "pointer" }}>
                    Download CSP-1 (CSV)
                  </button>
                )}
              </div>
            </div>
            {lcats.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)" }}>
                      {["Labor Category", "Education", "Exp.", "MFC Rate", "GSA Rate"].map(h => (
                        <th key={h} style={{ textAlign: "left" as const, padding: "8px 10px", fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase" as const, letterSpacing: ".06em", fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lcats.map((l: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 500, color: "var(--navy)" }}>{l.title || "Untitled"}</td>
                        <td style={{ padding: "8px 10px", color: "var(--ink3)" }}>{l.education || "-"}</td>
                        <td style={{ padding: "8px 10px", color: "var(--ink3)" }}>{l.experience || "-"}</td>
                        <td style={{ padding: "8px 10px", color: "var(--ink3)" }}>${l.mfcRate || l.baseRate || "0"}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--green)" }}>${l.gsaRate || "0"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "28px 32px", marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#fff", marginBottom: 4 }}>Ready to submit to GSA?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>
                Open GSA eOffer in a new tab, then come back here to copy each field.
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <a href={`/certifications/${certId}`}
                style={{ padding: "12px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, textDecoration: "none" }}>
                ← Back to Dashboard
              </a>
              <a href={`/certifications/${certId}/review`}
                style={{ padding: "12px 24px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(99,102,241,.3)" }}>
                🔍 Run GovCert Analysis
              </a>
              <a href="https://eoffer.gsa.gov" target="_blank" rel="noopener noreferrer"
                style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 24px rgba(200,155,60,.4)" }}>
                Open GSA eOffer →
              </a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}