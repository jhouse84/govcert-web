"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_SECTIONS, OASIS_DOMAINS, OASIS_SOLICITATION_TYPES, OASIS_SCORING_CATEGORIES } from "@/lib/oasis-domains";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtCurrency(v: string | number | undefined): string {
  if (!v) return "--";
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return "--";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function calcAAV(totalValue: string, startDate: string, endDate: string): string {
  const val = parseFloat(String(totalValue).replace(/[^0-9.]/g, ""));
  if (!val || !startDate || !endDate) return "--";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const years = (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years <= 0) return "--";
  return fmtCurrency(val / years);
}

const STANDARD_CERTS: Record<string, string> = {
  "iso-9001": "ISO 9001 — Quality Management",
  "iso-27001": "ISO 27001 — Information Security",
  "iso-20000": "ISO 20000 — IT Service Management",
  "cmmi-dev": "CMMI Dev — Development",
  "cmmi-svc": "CMMI SVC — Services",
  "as9100": "AS9100 — Aerospace Quality",
  "soc-2": "SOC 2 — Service Organization Controls",
};

/* ------------------------------------------------------------------ */
/*  Shared inline-style constants                                      */
/* ------------------------------------------------------------------ */

const cardStyle: React.CSSProperties = {
  background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)",
  padding: "28px 32px", marginBottom: 20, boxShadow: "var(--shadow)",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em",
  color: "var(--gold)", marginBottom: 4,
};
const sectionTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)",
  fontWeight: 400, marginBottom: 16,
};
const fieldRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "8px 0", borderBottom: "1px solid var(--border)",
};
const fieldLabel: React.CSSProperties = { fontSize: 12, color: "var(--ink4)", fontWeight: 500 };
const fieldValue: React.CSSProperties = { fontSize: 13, color: "var(--navy)", fontWeight: 500, textAlign: "right" as const };
const copyBtnBase: React.CSSProperties = {
  padding: "4px 14px", background: "var(--cream)", border: "1px solid var(--border2)",
  borderRadius: "var(--r)", color: "var(--navy)", fontSize: 11, fontWeight: 500, cursor: "pointer",
  whiteSpace: "nowrap" as const,
};
const narrativeBox: React.CSSProperties = {
  padding: "14px 16px", background: "var(--cream)", borderRadius: "var(--r)",
  fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const,
  maxHeight: 200, overflowY: "auto" as const,
};
const chipStyle: React.CSSProperties = {
  padding: "5px 14px", borderRadius: 100, background: "var(--cream)",
  border: "1px solid var(--border)", fontSize: 12, fontWeight: 500, color: "var(--navy)",
};
const checkMark: React.CSSProperties = {
  width: 22, height: 22, borderRadius: "50%", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0,
};
const accordionHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  cursor: "pointer", userSelect: "none" as const,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OASISSubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Application data slices
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [solicitation, setSolicitation] = useState("unrestricted");
  const [scorecardData, setScorecardData] = useState<Record<string, Record<string, number>>>({});
  const [qps, setQps] = useState<any[]>([]);
  const [ppData, setPPData] = useState<any[]>([]);
  const [feData, setFEData] = useState<any[]>([]);
  const [systemsData, setSystemsData] = useState<any>(null);
  const [contractHistory, setContractHistory] = useState<any[]>([]);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  // Accordion state — all expanded by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    company: true, domains: true, qps: true, pp: true,
    fep: true, systems: true, docs: true, review: true,
  });

  function toggle(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  /* ---- data fetch ---- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-submit");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      setClient(data.client || null);
      const app = data.application;
      if (app?.oasisDomains) try { setSelectedDomains(JSON.parse(app.oasisDomains)); } catch {}
      if (app?.oasisSolicitation) setSolicitation(app.oasisSolicitation);
      if (app?.oasisScorecardData) try { setScorecardData(JSON.parse(app.oasisScorecardData)); } catch {}
      if (app?.oasisQPData) try { setQps(JSON.parse(app.oasisQPData)); } catch {}
      if (app?.oasisPPData) try { setPPData(JSON.parse(app.oasisPPData)); } catch {}
      if (app?.oasisFEPData) try { setFEData(JSON.parse(app.oasisFEPData)); } catch {}
      if (app?.oasisSystemsData) try { setSystemsData(JSON.parse(app.oasisSystemsData)); } catch {}
      if (app?.oasisContractHistory) {
        try {
          const ch = JSON.parse(app.oasisContractHistory);
          setContractHistory(ch.contracts || []);
        } catch {}
      }

      const completed: Record<string, boolean> = {};
      if (app) {
        if (app.oasisDomains) completed["domains"] = true;
        if (app.oasisScorecardData) completed["scorecard"] = true;
        if (app.oasisQPData) completed["qualifying-projects"] = true;
        if (app.oasisPPData) completed["past-performance"] = true;
        if (app.oasisFEPData) completed["federal-experience"] = true;
        if (app.oasisSystemsData) completed["systems-certs"] = true;
      }
      setCompletedSections(completed);
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  /* ---- clipboard ---- */
  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function CopyBtn({ text, label }: { text: string; label: string }) {
    return (
      <button onClick={() => copyText(text, label)} style={copyBtnBase}>
        {copied === label ? "\u2713 Copied!" : "Copy"}
      </button>
    );
  }

  /* ---- derived ---- */
  const solType = OASIS_SOLICITATION_TYPES.find(s => s.id === solicitation);
  const solKey = solicitation === "unrestricted" ? "unrestricted" : "smallBusiness";

  // Completeness scoring
  const sectionStatuses = [
    { key: "company", label: "Company Information", done: !!(client?.businessName && client?.uei) },
    { key: "domains", label: "Domain Selection", done: completedSections["domains"] },
    { key: "scorecard", label: "Self-Scoring", done: completedSections["scorecard"] },
    { key: "qps", label: "Qualifying Projects", done: completedSections["qualifying-projects"] },
    { key: "pp", label: "Past Performance", done: completedSections["past-performance"] },
    { key: "fep", label: "Federal Experience", done: completedSections["federal-experience"] },
    { key: "systems", label: "Systems & Certifications", done: completedSections["systems-certs"] },
  ];
  const completedCount = sectionStatuses.filter(s => s.done).length;
  const completenessPercent = Math.round((completedCount / sectionStatuses.length) * 100);

  // Document checklist
  const docChecklist = [
    { label: "Attachment J.P-1 Self-Scoring Worksheet", done: completedSections["scorecard"], href: "scorecard" },
    { label: "Attachment J.P-2 FPDS Report", done: contractHistory.length > 0, href: "contract-history" },
    { label: "Attachment J.P-3 Project Verification Form (per QP)", done: qps.length > 0, href: "qualifying-projects" },
    { label: "Attachment J.P-6 Past Performance Rating Form", done: ppData.length > 0, href: "past-performance" },
    { label: "Attachment J.P-7 Joint Venture Template (if applicable)", done: false, href: null },
    { label: "Cybersecurity & Supply Chain Risk Management (J-3)", done: false, href: null },
    { label: "Subcontracting Plan", done: false, href: null },
    { label: "Pricing / Cost Spreadsheet", done: false, href: null },
  ];

  /* ---- loading / error ---- */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      {/* ---- Sidebar ---- */}
      <CertSidebar user={user} certId={certId} activePage="submit" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {OASIS_SECTIONS.map(section => {
            const isActive = section.id === "submit";
            const isComplete = completedSections[section.id];
            return (
              <a key={section.id} href={`/certifications/${certId}/oasis-plus/${section.id}`} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: "var(--r)",
                background: isActive ? "rgba(200,155,60,.15)" : "transparent",
                border: isActive ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
                color: isActive ? "var(--gold2)" : isComplete ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)",
                textDecoration: "none", fontSize: 12.5, fontWeight: isActive ? 500 : 400, marginBottom: 1,
              }}>
                <span style={{ ...checkMark, width: 18, height: 18, fontSize: 9, background: isComplete ? "var(--green)" : "rgba(255,255,255,.08)", border: isComplete ? "none" : "1px solid rgba(255,255,255,.15)", color: isComplete ? "#fff" : "rgba(255,255,255,.3)" }}>
                  {isComplete ? "\u2713" : ""}
                </span>
                {section.label}
              </a>
            );
          })}
        </div>
      } />

      {/* ---- Main Content ---- */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
          {/* Breadcrumb */}
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            &larr; Back to Application
          </a>

          {/* Page Header */}
          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              GSA OASIS+ &mdash; Step 8 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              OSP Submission Companion
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 720 }}>
              Your complete OASIS+ application data organized by Symphony Portal (OSP) submission tabs.
              Use the copy buttons to transfer each field directly into the portal at{" "}
              <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", fontWeight: 500 }}>idiq.gsa.gov</a>.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}

          {/* ============================================================ */}
          {/*  Overall Completeness Banner                                  */}
          {/* ============================================================ */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 28, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 4 }}>Application Readiness</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "#fff", fontWeight: 300, lineHeight: 1 }}>
                  {completenessPercent}<span style={{ fontSize: 24 }}>%</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4 }}>{completedCount} of {sectionStatuses.length} data sections populated</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={`/certifications/${certId}/oasis-plus/review`} style={{
                  padding: "12px 22px", background: "rgba(99,102,241,.85)", border: "none",
                  borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600,
                  textDecoration: "none", boxShadow: "0 4px 20px rgba(99,102,241,.3)",
                }}>
                  Run GovCert Analysis
                </a>
                <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{
                  padding: "12px 22px",
                  background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                  border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600,
                  textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.3)",
                }}>
                  Open OASIS+ Symphony Portal &rarr;
                </a>
              </div>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${completenessPercent}%`, background: "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
            </div>
          </div>

          {/* ============================================================ */}
          {/*  TAB 1 — Company Information                                  */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("company")}>
              <div>
                <div style={sectionLabel}>Tab 1 &mdash; Company Information</div>
                <div style={sectionTitle}>Entity Registration &amp; Point of Contact</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CopyBtn label="company-all" text={[
                  `Legal Business Name: ${client?.businessName || ""}`,
                  `UEI: ${client?.uei || ""}`,
                  `CAGE Code: ${client?.cageCode || ""}`,
                  `Address: ${[client?.address, client?.city, client?.state, client?.zip].filter(Boolean).join(", ")}`,
                  `Phone: ${client?.phone || ""}`,
                  `Email: ${client?.email || ""}`,
                  `Website: ${client?.website || ""}`,
                ].join("\n")} />
                <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.company ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
              </div>
            </div>
            {expanded.company && (
              <div style={{ marginTop: 16 }}>
                {[
                  { label: "Legal Business Name", value: client?.businessName },
                  { label: "UEI (Unique Entity Identifier)", value: client?.uei },
                  { label: "CAGE Code", value: client?.cageCode },
                  { label: "EIN / Tax ID", value: client?.ein },
                  { label: "Address", value: client?.address },
                  { label: "City", value: client?.city },
                  { label: "State", value: client?.state },
                  { label: "ZIP Code", value: client?.zip },
                  { label: "Phone", value: client?.phone },
                  { label: "Email", value: client?.email },
                  { label: "Website", value: client?.website },
                ].map((f, i) => (
                  <div key={i} style={fieldRow}>
                    <span style={fieldLabel}>{f.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={fieldValue}>{f.value || <span style={{ color: "var(--ink4)", fontStyle: "italic" }}>Not provided</span>}</span>
                      {f.value && <CopyBtn text={f.value} label={`company-${i}`} />}
                    </div>
                  </div>
                ))}
                {/* SAM.gov registration status */}
                <div style={{ ...fieldRow, borderBottom: "none" }}>
                  <span style={fieldLabel}>SAM.gov Registration</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: client?.uei ? "var(--green)" : "#e74c3c" }}>
                    {client?.uei ? "Active (UEI on file)" : "Unverified -- add UEI to confirm"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 2 — Domain Selection Summary                             */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("domains")}>
              <div>
                <div style={sectionLabel}>Tab 2 &mdash; Domain Selection Summary</div>
                <div style={sectionTitle}>Selected Domains &amp; Self-Score Thresholds</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.domains ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.domains && (
              <div style={{ marginTop: 16 }}>
                <div style={{ ...fieldRow, borderBottom: "none", marginBottom: 12 }}>
                  <span style={fieldLabel}>Solicitation Pool</span>
                  <span style={{ ...fieldValue, fontWeight: 600 }}>{solType?.label || solicitation}</span>
                </div>
                {selectedDomains.length === 0 && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No domains selected. <a href={`/certifications/${certId}/oasis-plus/domains`} style={{ color: "var(--gold)", fontWeight: 500 }}>Select domains &rarr;</a>
                  </div>
                )}
                {selectedDomains.map(dId => {
                  const dom = OASIS_DOMAINS.find(d => d.id === dId);
                  if (!dom) return null;
                  const threshold = dom.scoringThreshold[solKey as keyof typeof dom.scoringThreshold] || 42;
                  const domainScores = scorecardData[dId] || {};
                  const totalScore = Object.values(domainScores).reduce((a, b) => a + b, 0);
                  const meetsThreshold = totalScore >= threshold;
                  return (
                    <div key={dId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={chipStyle}>
                          {dom.name}
                          {dom.phase === "II" && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 6px", borderRadius: 100, background: "rgba(99,102,241,.1)", color: "#6366F1", fontWeight: 600 }}>Phase II</span>}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12, color: "var(--ink3)" }}>
                          Score: <strong style={{ color: meetsThreshold ? "var(--green)" : "#e74c3c" }}>{totalScore}</strong> / {dom.maxCredits}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: meetsThreshold ? "rgba(26,102,68,.08)" : "rgba(231,76,60,.08)", color: meetsThreshold ? "var(--green)" : "#e74c3c" }}>
                          {meetsThreshold ? `\u2713 Meets ${threshold}` : `Below ${threshold}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 3 — Qualifying Projects                                  */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("qps")}>
              <div>
                <div style={sectionLabel}>Tab 3 &mdash; Qualifying Projects</div>
                <div style={sectionTitle}>QP Detail Cards ({qps.length} project{qps.length !== 1 ? "s" : ""})</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.qps ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.qps && (
              <div style={{ marginTop: 16 }}>
                {qps.length === 0 && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No qualifying projects entered. <a href={`/certifications/${certId}/oasis-plus/qualifying-projects`} style={{ color: "var(--gold)", fontWeight: 500 }}>Add projects &rarr;</a>
                  </div>
                )}
                {qps.map((qp, idx) => {
                  const aav = calcAAV(qp.totalValue, qp.startDate, qp.endDate);
                  const qpAllText = [
                    `Contract Number: ${qp.contractNumber || "N/A"}`,
                    `Agency/Client: ${qp.agencyName || "N/A"}`,
                    `Contract Type: ${qp.contractType || "N/A"}`,
                    `Period of Performance: ${qp.startDate || "?"} - ${qp.endDate || "?"}`,
                    `Total Contract Value: ${fmtCurrency(qp.totalValue)}`,
                    `Average Annual Value: ${aav}`,
                    `NAICS Code(s): ${qp.naicsCodes || "N/A"}`,
                    `Personnel Count: ${qp.personnelCount || "N/A"}`,
                    `Clearance Level: ${qp.clearanceLevel || "None"}`,
                    ``,
                    `--- Scope / Performance Narrative ---`,
                    qp.scopeNarrative || "(not provided)",
                    ``,
                    `--- Management & Staffing Narrative ---`,
                    qp.managementNarrative || "(not provided)",
                  ].join("\n");

                  return (
                    <div key={qp.id || idx} style={{ padding: "20px", background: "var(--cream)", borderRadius: "var(--r)", marginBottom: 14, border: "1px solid var(--border)" }}>
                      {/* QP Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{qp.contractNumber || `QP ${idx + 1}`}</div>
                            <div style={{ fontSize: 12, color: "var(--ink3)" }}>{qp.agencyName || "Agency not specified"}</div>
                          </div>
                        </div>
                        <CopyBtn text={qpAllText} label={`qp-all-${idx}`} />
                      </div>

                      {/* QP Fields Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 20px", marginBottom: 16 }}>
                        {[
                          { l: "Contract Number", v: qp.contractNumber },
                          { l: "Agency / Client", v: qp.agencyName },
                          { l: "Contract Type", v: qp.contractType },
                          { l: "Start Date", v: qp.startDate },
                          { l: "End Date", v: qp.endDate },
                          { l: "Total Value", v: fmtCurrency(qp.totalValue) },
                          { l: "Avg. Annual Value", v: aav },
                          { l: "NAICS Code(s)", v: qp.naicsCodes },
                          { l: "Personnel Count", v: qp.personnelCount },
                          { l: "Clearance Level", v: qp.clearanceLevel || "None" },
                        ].map((f, fi) => (
                          <div key={fi}>
                            <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{f.l}</div>
                            <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{f.v || "--"}</div>
                          </div>
                        ))}
                      </div>

                      {/* Scope Narrative */}
                      {qp.scopeNarrative && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: ".06em" }}>Scope / Performance Narrative</div>
                            <CopyBtn text={qp.scopeNarrative} label={`qp-scope-${idx}`} />
                          </div>
                          <div style={narrativeBox}>{qp.scopeNarrative}</div>
                        </div>
                      )}

                      {/* Management Narrative */}
                      {qp.managementNarrative && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: ".06em" }}>Management &amp; Staffing Narrative</div>
                            <CopyBtn text={qp.managementNarrative} label={`qp-mgmt-${idx}`} />
                          </div>
                          <div style={narrativeBox}>{qp.managementNarrative}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 4 — Past Performance                                     */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("pp")}>
              <div>
                <div style={sectionLabel}>Tab 4 &mdash; Past Performance</div>
                <div style={sectionTitle}>CPARS Ratings &amp; References ({ppData.length})</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.pp ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.pp && (
              <div style={{ marginTop: 16 }}>
                {ppData.length === 0 && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No past performance data entered. <a href={`/certifications/${certId}/oasis-plus/past-performance`} style={{ color: "var(--gold)", fontWeight: 500 }}>Add past performance &rarr;</a>
                  </div>
                )}
                {ppData.map((pp, idx) => {
                  const ppText = [
                    `Contract: ${pp.contractNumber || "N/A"}`,
                    `CPARS Rating: ${pp.cparsRating || "N/A"}`,
                    `Narrative: ${pp.narrative || "(none)"}`,
                    `Reference: ${pp.refName || "N/A"}, ${pp.refTitle || ""}, ${pp.refEmail || ""}, ${pp.refPhone || ""}`,
                  ].join("\n");
                  const ratingColor = pp.cparsRating === "Exceptional" ? "var(--green)" : pp.cparsRating === "Very Good" ? "#2ecc71" : pp.cparsRating === "Satisfactory" ? "var(--gold)" : pp.cparsRating === "Marginal" ? "#f39c12" : pp.cparsRating === "Unsatisfactory" ? "#e74c3c" : "var(--ink3)";
                  return (
                    <div key={pp.qpId || idx} style={{ padding: "18px 20px", background: "var(--cream)", borderRadius: "var(--r)", marginBottom: 12, border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{pp.qpLabel || pp.contractNumber || `PP Reference ${idx + 1}`}</div>
                          <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>Contract: {pp.contractNumber || "--"}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: `${ratingColor}15`, color: ratingColor }}>
                            {pp.cparsRating || "No rating"}
                          </span>
                          <CopyBtn text={ppText} label={`pp-${idx}`} />
                        </div>
                      </div>

                      {/* Narrative */}
                      {pp.narrative && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: ".06em" }}>Past Performance Narrative</div>
                            <CopyBtn text={pp.narrative} label={`pp-narr-${idx}`} />
                          </div>
                          <div style={narrativeBox}>{pp.narrative}</div>
                        </div>
                      )}

                      {/* Reference Contact */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                        {[
                          { l: "Reference Name", v: pp.refName },
                          { l: "Title", v: pp.refTitle },
                          { l: "Email", v: pp.refEmail },
                          { l: "Phone", v: pp.refPhone },
                        ].map((f, fi) => (
                          <div key={fi}>
                            <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{f.l}</div>
                            <div style={{ fontSize: 12, color: "var(--navy)", fontWeight: 500 }}>{f.v || "--"}</div>
                          </div>
                        ))}
                      </div>

                      {/* PPQ Status placeholder */}
                      <div style={{ marginTop: 10, fontSize: 11, color: "var(--ink4)" }}>
                        PPQ Status: <span style={{ fontWeight: 600, color: pp.refEmail ? "var(--green)" : "var(--ink4)" }}>{pp.refEmail ? "Reference on file" : "Pending"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 5 — Federal Experience Projects                          */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("fep")}>
              <div>
                <div style={sectionLabel}>Tab 5 &mdash; Federal Experience Projects</div>
                <div style={sectionTitle}>Federal Prime Contract Experience ({feData.length})</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {feData.length > 0 && (
                  <CopyBtn label="fep-all" text={feData.map((fe, i) => [
                    `FEP ${i + 1}:`,
                    `  Agency: ${fe.agency || "N/A"}`,
                    `  Contract: ${fe.contractNumber || "N/A"}`,
                    `  Value: ${fmtCurrency(fe.value)}`,
                    `  Period: ${fe.popStart || "?"} - ${fe.popEnd || "?"}`,
                    `  Description: ${fe.description || "N/A"}`,
                  ].join("\n")).join("\n\n")} />
                )}
                <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.fep ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
              </div>
            </div>
            {expanded.fep && (
              <div style={{ marginTop: 16 }}>
                {feData.length === 0 && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No federal experience entries. <a href={`/certifications/${certId}/oasis-plus/federal-experience`} style={{ color: "var(--gold)", fontWeight: 500 }}>Add federal experience &rarr;</a>
                  </div>
                )}
                {feData.length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                          {["#", "Agency", "Contract Number", "Value", "Period", "Description"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--navy)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {feData.map((fe, idx) => (
                          <tr key={fe.id || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{idx + 1}</td>
                            <td style={{ padding: "10px 12px", color: "var(--navy)", fontWeight: 500 }}>{fe.agency || "--"}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)", fontFamily: "monospace", fontSize: 11 }}>{fe.contractNumber || "--"}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{fmtCurrency(fe.value)}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{fe.popStart && fe.popEnd ? `${fe.popStart} \u2013 ${fe.popEnd}` : "--"}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink3)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>{fe.description || "--"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 6 — Business Systems & Certifications                    */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("systems")}>
              <div>
                <div style={sectionLabel}>Tab 6 &mdash; Business Systems &amp; Certifications</div>
                <div style={sectionTitle}>Contractor Systems, Clearances &amp; Third-Party Certs</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.systems ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.systems && (
              <div style={{ marginTop: 16 }}>
                {!systemsData && (
                  <div style={{ padding: "14px 16px", background: "rgba(231,76,60,.05)", borderRadius: "var(--r)", fontSize: 13, color: "#e74c3c" }}>
                    No systems data entered. <a href={`/certifications/${certId}/oasis-plus/systems-certs`} style={{ color: "var(--gold)", fontWeight: 500 }}>Add systems &amp; certs &rarr;</a>
                  </div>
                )}

                {/* Business Systems */}
                {systemsData?.businessSystems && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>Contractor Business Systems</div>
                    {systemsData.businessSystems.map((bs: any, idx: number) => (
                      <div key={idx} style={fieldRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ ...checkMark, background: bs.approved ? "var(--green)" : "var(--cream2)", border: bs.approved ? "none" : "1px solid var(--border2)", color: bs.approved ? "#fff" : "var(--ink4)" }}>
                            {bs.approved ? "\u2713" : ""}
                          </span>
                          <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{bs.name}</span>
                        </div>
                        <span style={{ fontSize: 12, color: bs.approved ? "var(--green)" : "var(--ink4)" }}>
                          {bs.approved ? `Approved by ${bs.approvalAgency || "agency"}` : "Not approved"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Facility Clearance */}
                {systemsData?.facilityClearance && systemsData.facilityClearance.level !== "None" && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>Facility Clearance</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "12px 16px", background: "var(--cream)", borderRadius: "var(--r)" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Clearance Level</div>
                        <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600 }}>{systemsData.facilityClearance.level}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Facility</div>
                        <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{systemsData.facilityClearance.facilityName || "--"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Expiration</div>
                        <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 500 }}>{systemsData.facilityClearance.expirationDate || "--"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {systemsData?.certifications && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>Third-Party Certifications</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(systemsData.certifications.standard || []).map((certId: string) => (
                        <span key={certId} style={{ ...chipStyle, background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", color: "#6366F1" }}>
                          {STANDARD_CERTS[certId] || certId}
                        </span>
                      ))}
                      {(systemsData.certifications.custom || []).map((c: any, i: number) => (
                        <span key={c.id || i} style={{ ...chipStyle, background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.2)", color: "var(--gold)" }}>
                          {c.name}{c.issuingBody ? ` (${c.issuingBody})` : ""}
                        </span>
                      ))}
                      {(systemsData.certifications.standard || []).length === 0 && (systemsData.certifications.custom || []).length === 0 && (
                        <span style={{ fontSize: 12, color: "var(--ink4)", fontStyle: "italic" }}>No certifications on file</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 7 — Required Documents Checklist                         */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("docs")}>
              <div>
                <div style={sectionLabel}>Tab 7 &mdash; Required Documents</div>
                <div style={sectionTitle}>OSP Attachment Checklist</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.docs ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.docs && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {docChecklist.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: idx < docChecklist.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ ...checkMark, background: item.done ? "var(--green)" : "var(--cream2)", border: item.done ? "none" : "1px solid var(--border2)", color: item.done ? "#fff" : "var(--ink4)" }}>
                      {item.done ? "\u2713" : "\u2717"}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: item.done ? "var(--navy)" : "var(--ink3)", fontWeight: item.done ? 500 : 400 }}>
                      {item.label}
                    </span>
                    {item.href && (
                      <a href={`/certifications/${certId}/oasis-plus/${item.href}`} style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                        {item.done ? "View" : "Go \u2192"}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  TAB 8 — Review & Submit                                      */}
          {/* ============================================================ */}
          <div style={cardStyle}>
            <div style={accordionHeader} onClick={() => toggle("review")}>
              <div>
                <div style={sectionLabel}>Tab 8 &mdash; Review &amp; Submit</div>
                <div style={sectionTitle}>Final Review &amp; Portal Submission</div>
              </div>
              <span style={{ fontSize: 18, color: "var(--ink4)", transform: expanded.review ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>{"\u25BE"}</span>
            </div>
            {expanded.review && (
              <div style={{ marginTop: 16 }}>
                {/* Completeness Score */}
                <div style={{ textAlign: "center", padding: "24px 0 20px", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 6 }}>Overall Completeness</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, color: completenessPercent >= 80 ? "var(--green)" : completenessPercent >= 50 ? "var(--gold)" : "#e74c3c", fontWeight: 400, lineHeight: 1 }}>
                    {completenessPercent}%
                  </div>
                </div>

                {/* Per-section status */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>Section Status</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {sectionStatuses.map(s => (
                      <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: s.done ? "rgba(26,102,68,.04)" : "var(--cream)", borderRadius: "var(--r)", border: `1px solid ${s.done ? "rgba(26,102,68,.12)" : "var(--border)"}` }}>
                        <span style={{ ...checkMark, width: 18, height: 18, fontSize: 9, background: s.done ? "var(--green)" : "var(--cream2)", border: s.done ? "none" : "1px solid var(--border2)", color: s.done ? "#fff" : "var(--ink4)" }}>
                          {s.done ? "\u2713" : ""}
                        </span>
                        <span style={{ fontSize: 12, color: s.done ? "var(--navy)" : "var(--ink3)", fontWeight: s.done ? 500 : 400 }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                  <a href={`/certifications/${certId}/oasis-plus/review`} style={{
                    flex: 1, padding: "16px", background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)",
                    borderRadius: "var(--rl)", textDecoration: "none", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Run GovCert Analysis</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)" }}>AI-powered compliance review</div>
                  </a>
                  <a href="https://idiq.gsa.gov" target="_blank" rel="noopener noreferrer" style={{
                    flex: 1, padding: "16px", background: "rgba(26,102,68,.06)", border: "1px solid rgba(26,102,68,.15)",
                    borderRadius: "var(--rl)", textDecoration: "none", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Open OASIS+ Symphony Portal &rarr;</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)" }}>Submit at idiq.gsa.gov</div>
                  </a>
                </div>

                {/* Step-by-step instructions */}
                <div style={{ padding: "20px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>Submission Steps</div>
                  {[
                    "Navigate to idiq.gsa.gov and log in with your SAM.gov credentials.",
                    "Select the OASIS+ solicitation and choose your pool (Unrestricted or Small Business set-aside).",
                    "In Tab 1 (Company Information), verify your entity data matches SAM.gov. Use the Copy buttons above to transfer fields.",
                    "In Tab 2 (Domain Selection), select the same domains you chose in GovCert and confirm your self-score meets the threshold.",
                    "In Tab 3 (Qualifying Projects), enter each QP using the detail cards above. Copy narratives directly.",
                    "In Tab 4 (Past Performance), enter CPARS ratings and upload PPQ forms for each qualifying project.",
                    "In Tab 5 (Federal Experience), enter your federal prime contracts from the FEP table above.",
                    "Upload all required attachments listed in Tab 7 (J.P-1 through J.P-7, subcontracting plan, pricing spreadsheet).",
                    "Review all sections in the portal for completeness. Run the GovCert Analysis for a final compliance check.",
                    "Submit your proposal in the Symphony Portal before the solicitation deadline.",
                  ].map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/*  Bottom Navigation                                            */}
          {/* ============================================================ */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}/oasis-plus/review`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              &larr; Previous: GovCert Review
            </a>
            <a href={user?.role === "CUSTOMER" ? "/portal" : "/dashboard"} style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
              border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(200,155,60,.3)",
            }}>
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
