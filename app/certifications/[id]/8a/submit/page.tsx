"use client";
import React, { useEffect, useState } from "react";
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

const SBA_FORM_1010_CHECKLIST = [
  { id: "socialNarrative", label: "Social Disadvantage Narrative", section: "social-disadvantage", field: "socialDisadvantageNarrative" },
  { id: "economicData", label: "SBA Form 413 (Personal Financial Statement)", section: "economic-disadvantage", field: "economicDisadvantageData" },
  { id: "businessPlan", label: "Comprehensive Business Plan", section: "business-plan", field: "businessPlanData" },
  { id: "corporateNarrative", label: "Corporate Experience Narrative", section: "corporate", field: "narrativeCorp8a" },
  { id: "pastPerformance", label: "Past Performance References", section: "past-performance", field: null },
  { id: "financials", label: "2 Years Business Financial Statements", section: "financials", field: "financialData8a" },
  { id: "personalFinancials", label: "Personal Financial Statements (each owner)", section: "financials", field: "financialData8a" },
  { id: "birthCert", label: "Birth Certificate or Naturalization Papers", section: null, field: null },
  { id: "taxReturns", label: "3 Years Personal Tax Returns", section: null, field: null },
  { id: "bizTaxReturns", label: "3 Years Business Tax Returns", section: null, field: null },
  { id: "articles", label: "Articles of Incorporation / Organization", section: null, field: null },
  { id: "bylaws", label: "Bylaws or Operating Agreement", section: null, field: null },
  { id: "stockCerts", label: "Stock Certificates / Membership Certificates", section: null, field: null },
  { id: "resume", label: "Resume of Disadvantaged Owner", section: null, field: null },
  { id: "bankStatements", label: "6 Months Business Bank Statements", section: null, field: null },
  { id: "leases", label: "Business Lease / Rental Agreement", section: null, field: null },
];

export default function Submit8aPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [pricingData, setPricingData] = useState<any>(null);
  const [unlocking, setUnlocking] = useState(false);

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
      if (userData.subscriptionTier === "CONSULTING") {
        setAccessGranted(true);
      }
    } catch {
      setAccessGranted(true);
    } finally {
      setCheckingAccess(false);
    }
  }

  async function handleUnlock() {
    setUnlocking(true);
    try {
      const price = pricingData?.tiers?.PLATFORM?.monthlyPrice || 0;
      if (price === 0) {
        setAccessGranted(true);
      } else {
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
      const completed: Record<string, boolean> = {};
      const app = data.application;
      if (app) {
        if (app.socialDisadvantageNarrative?.trim()) completed["social-disadvantage"] = true;
        if (app.economicDisadvantageData) completed["economic-disadvantage"] = true;
        if (app.businessPlanData) completed["business-plan"] = true;
        if (app.narrativeCorp8a) completed["corporate"] = true;
        if (app.pastPerformance8a?.length > 0 || app.pastPerformance?.length > 0) completed["past-performance"] = true;
        if (app.financialData8a) completed["financials"] = true;
      }
      setCompletedSections(completed);
    } catch (err) { console.error(err); setError("Failed to load."); }
    finally { setLoading(false); }
  }

  function isItemComplete(item: typeof SBA_FORM_1010_CHECKLIST[0]): boolean {
    if (manualChecks[item.id]) return true;
    if (!cert?.application) return false;

    if (item.field === "socialDisadvantageNarrative") return !!cert.application.socialDisadvantageNarrative?.trim();
    if (item.field === "economicDisadvantageData") return !!cert.application.economicDisadvantageData;
    if (item.field === "businessPlanData") return !!cert.application.businessPlanData;
    if (item.field === "narrativeCorp8a") return !!cert.application.narrativeCorp8a;
    if (item.field === "financialData8a") return !!cert.application.financialData8a;
    if (item.id === "pastPerformance") return (cert.application.pastPerformance8a?.length > 0 || cert.application.pastPerformance?.length > 0);

    return false;
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {
      setError("Failed to copy to clipboard.");
    }
  }

  function getNarrativeText(field: string): string {
    if (!cert?.application) return "";
    const val = cert.application[field];
    if (!val) return "";
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed.narratives) {
        return Object.entries(parsed.narratives).map(([k, v]) => `## ${k}\n${v}`).join("\n\n");
      }
      if (typeof parsed === "object") {
        return Object.entries(parsed).map(([k, v]) => `## ${k}\n${v}`).join("\n\n");
      }
      return String(val);
    } catch {
      return String(val);
    }
  }

  async function downloadPackage() {
    setDownloading(true);
    try {
      const data = await apiRequest(`/api/applications/${cert.application.id}/export`, { method: "POST" });
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    } catch {
      setError("Download not yet available. Please copy individual sections.");
    } finally {
      setDownloading(false);
    }
  }

  const completedCount = SBA_FORM_1010_CHECKLIST.filter(item => isItemComplete(item)).length;
  const totalCount = SBA_FORM_1010_CHECKLIST.length;
  const appSectionsDone = Object.values(completedSections).filter(Boolean).length;

  const narrativeSections = [
    { label: "Social Disadvantage Narrative", field: "socialDisadvantageNarrative" },
    { label: "Corporate Experience (8a)", field: "narrativeCorp8a" },
    { label: "Business Plan", field: "businessPlanData" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const sidebarContent = (
    <div>
      <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>8(a) Sections</div>
      {EIGHT_A_SECTIONS.map((s, i) => {
        const isActive = s.id === "submit";
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
      <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>&larr; Back to Dashboard</a>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="certifications" sidebarContent={sidebarContent} />

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
                Your 8(a) Application package is ready. Upgrade to access your complete, submission-ready documents with all AI-generated narratives, formatted for direct use in SBA Certify.
              </p>
              <div style={{ background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.2)", borderRadius: 8, padding: 16, marginBottom: 24, textAlign: "left" as const }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 8 }}>Your package includes:</div>
                {[
                  "Social Disadvantage Narrative",
                  "Economic Disadvantage Documentation",
                  "Business Plan",
                  "Corporate Experience Narrative",
                  "Past Performance References",
                  "Financial Statements",
                  "SBA Form 1010 Checklist",
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
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 7 of 7</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Submit 8(a) Application</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Review your submission checklist, copy narrative sections, and submit through the SBA Certify portal.
            </p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* Readiness Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>Application Sections</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: appSectionsDone === 6 ? "var(--green)" : "var(--navy)", fontWeight: 400 }}>
                {appSectionsDone}<span style={{ fontSize: 18, color: "var(--ink3)" }}> / 6 complete</span>
              </div>
              <div style={{ height: 6, background: "var(--cream2)", borderRadius: 100, overflow: "hidden", marginTop: 10 }}>
                <div style={{ height: "100%", width: `${(appSectionsDone / 6) * 100}%`, background: appSectionsDone === 6 ? "var(--green)" : "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 8 }}>SBA Checklist Items</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: completedCount === totalCount ? "var(--green)" : "var(--navy)", fontWeight: 400 }}>
                {completedCount}<span style={{ fontSize: 18, color: "var(--ink3)" }}> / {totalCount} ready</span>
              </div>
              <div style={{ height: 6, background: "var(--cream2)", borderRadius: 100, overflow: "hidden", marginTop: 10 }}>
                <div style={{ height: "100%", width: `${(completedCount / totalCount) * 100}%`, background: completedCount === totalCount ? "var(--green)" : "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
              </div>
            </div>
          </div>

          {/* Gap Analysis */}
          {appSectionsDone < 6 && (
            <div style={{ background: "#FFF8E1", border: "2px solid #FFB300", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#F57F17", marginBottom: 8 }}>Missing Sections</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {EIGHT_A_SECTIONS.filter(s => s.id !== "submit" && !completedSections[s.id]).map(s => (
                  <a key={s.id} href={`/certifications/${certId}/8a/${s.id}`}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#F57F17", textDecoration: "none" }}>
                    <span style={{ color: "#F57F17" }}>{"\u2717"}</span>
                    {s.label} — <span style={{ textDecoration: "underline" }}>Complete now</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* SBA Form 1010 Checklist */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>SBA Form 1010 Checklist</h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16 }}>Required documents for your 8(a) application. Check off items as you gather them.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SBA_FORM_1010_CHECKLIST.map(item => {
                const complete = isItemComplete(item);
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    background: complete ? "var(--green-bg)" : "transparent",
                    border: `1px solid ${complete ? "var(--green-b)" : "var(--border)"}`,
                    borderRadius: "var(--r)", cursor: item.field ? "default" : "pointer",
                  }}
                    onClick={() => {
                      if (!item.field) setManualChecks(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                    }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 4,
                      border: `2px solid ${complete ? "var(--green)" : "var(--border2)"}`,
                      background: complete ? "var(--green)" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0,
                    }}>
                      {complete ? "\u2713" : ""}
                    </div>
                    <span style={{ fontSize: 14, color: complete ? "var(--green)" : "var(--navy)", fontWeight: complete ? 500 : 400 }}>{item.label}</span>
                    {item.section && !complete && (
                      <a href={`/certifications/${certId}/8a/${item.section}`}
                        onClick={e => e.stopPropagation()}
                        style={{ marginLeft: "auto", fontSize: 12, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                        Complete &rarr;
                      </a>
                    )}
                    {complete && item.field && (
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--green)", fontWeight: 500 }}>Auto-detected</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Copy Narratives */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Copy Narratives for SBA Certify</h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16 }}>Click to copy each section for pasting into the SBA Certify portal.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {narrativeSections.map(ns => {
                const text = getNarrativeText(ns.field);
                const hasText = text.trim().length > 0;
                return (
                  <div key={ns.field} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px",
                    background: hasText ? "var(--cream)" : "var(--cream2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r)",
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: hasText ? "var(--navy)" : "var(--ink4)" }}>{ns.label}</div>
                      <div style={{ fontSize: 12, color: "var(--ink4)" }}>
                        {hasText ? `${text.length.toLocaleString()} characters` : "Not yet drafted"}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(text, ns.label)}
                      disabled={!hasText}
                      style={{
                        padding: "8px 16px",
                        background: hasText ? (copySuccess === ns.label ? "var(--green)" : "var(--gold)") : "var(--cream2)",
                        border: "none",
                        borderRadius: "var(--r)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: hasText ? "#fff" : "var(--ink4)",
                        cursor: hasText ? "pointer" : "not-allowed",
                      }}
                    >
                      {copySuccess === ns.label ? "\u2713 Copied!" : "\uD83D\uDCCB Copy to Clipboard"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Download & Submit */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "28px 32px", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#fff", fontWeight: 400, marginBottom: 6 }}>Ready to Submit?</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>
                  Download your full submission package, then submit through the SBA Certify portal.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={downloadPackage}
                  disabled={downloading}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(255,255,255,.1)",
                    border: "1px solid rgba(255,255,255,.2)",
                    borderRadius: "var(--r)",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {downloading ? "Preparing..." : "\u2B07 Download Package"}
                </button>
                <a
                  href={`/certifications/${certId}/8a/review`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    border: "none",
                    borderRadius: "var(--r)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    textDecoration: "none",
                    boxShadow: "0 4px 16px rgba(99,102,241,.3)",
                  }}
                >
                  🔍 Run GovCert Analysis
                </a>
                <a
                  href="https://certify.sba.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 28px",
                    background: "var(--gold)",
                    border: "none",
                    borderRadius: "var(--r)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  Go to SBA Certify &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* Back nav */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 20 }}>
            <a href={`/certifications/${certId}/8a/financials`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Previous: Financials</a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
