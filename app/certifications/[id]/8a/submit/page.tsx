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

      <div style={{ flex: 1, overflow: "auto" }}>
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
  );
}
