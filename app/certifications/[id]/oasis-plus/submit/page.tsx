"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_SECTIONS, OASIS_DOMAINS, OASIS_SOLICITATION_TYPES } from "@/lib/oasis-domains";

export default function OASISSubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [solicitation, setSolicitation] = useState("unrestricted");
  const [qps, setQps] = useState<any[]>([]);
  const [ppData, setPPData] = useState<any[]>([]);
  const [feData, setFEData] = useState<any[]>([]);
  const [systemsData, setSystemsData] = useState<any>(null);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

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
      const app = data.application;
      if (app?.oasisDomains) try { setSelectedDomains(JSON.parse(app.oasisDomains)); } catch { }
      if (app?.oasisSolicitation) setSolicitation(app.oasisSolicitation);
      if (app?.oasisQPData) try { setQps(JSON.parse(app.oasisQPData)); } catch { }
      if (app?.oasisPPData) try { setPPData(JSON.parse(app.oasisPPData)); } catch { }
      if (app?.oasisFEPData) try { setFEData(JSON.parse(app.oasisFEPData)); } catch { }
      if (app?.oasisSystemsData) try { setSystemsData(JSON.parse(app.oasisSystemsData)); } catch { }

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

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const completedCount = Object.values(completedSections).filter(Boolean).length;
  const solType = OASIS_SOLICITATION_TYPES.find(s => s.id === solicitation);

  // Document checklist
  const docChecklist = [
    { label: "Domain Selection", done: completedSections["domains"], href: "domains" },
    { label: "Self-Scoring Worksheet", done: completedSections["scorecard"], href: "scorecard" },
    { label: "Qualifying Projects (narratives)", done: completedSections["qualifying-projects"], href: "qualifying-projects" },
    { label: "Past Performance References", done: completedSections["past-performance"], href: "past-performance" },
    { label: "Federal Experience List", done: completedSections["federal-experience"], href: "federal-experience" },
    { label: "Business Systems & Certifications", done: completedSections["systems-certs"], href: "systems-certs" },
    { label: "GovCert AI Review", done: false, href: "review" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
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
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: isComplete ? "var(--green)" : "rgba(255,255,255,.08)", border: isComplete ? "none" : "1px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: isComplete ? "#fff" : "rgba(255,255,255,.3)", fontWeight: 600, flexShrink: 0 }}>
                  {isComplete ? "✓" : ""}
                </span>
                {section.label}
              </a>
            );
          })}
        </div>
      } />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application
          </a>

          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              GSA OASIS+ — Step 8 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              OSP Submission Companion
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 680 }}>
              Review your complete application data organized by OASIS+ Symphony Portal (OSP) submission sections. Use the copy buttons to transfer content into the portal.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}

          {/* Document Checklist */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Submission Checklist</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 16 }}>
              {completedCount}/{docChecklist.length - 1} sections complete
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {docChecklist.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: item.done ? "var(--green)" : "var(--cream2)", border: item.done ? "none" : "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: item.done ? "#fff" : "var(--ink4)", fontWeight: 600, flexShrink: 0 }}>
                    {item.done ? "✓" : ""}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: item.done ? "var(--navy)" : "var(--ink3)", fontWeight: item.done ? 500 : 400 }}>{item.label}</span>
                  <a href={`/certifications/${certId}/oasis-plus/${item.href}`} style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                    {item.done ? "Edit" : "Go →"}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Domain & Solicitation Summary */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>OSP Section: Domains</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)" }}>Selected Domains & Solicitation Type</div>
              </div>
              <button onClick={() => copyToClipboard(
                `Solicitation Type: ${solType?.label || solicitation}\nDomains:\n${selectedDomains.map(d => `- ${OASIS_DOMAINS.find(dom => dom.id === d)?.name || d}`).join("\n")}`,
                "domains"
              )} style={{ padding: "6px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--navy)", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                {copied === "domains" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 8 }}>Pool: <strong>{solType?.label || solicitation}</strong></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {selectedDomains.map(d => {
                const dom = OASIS_DOMAINS.find(dom => dom.id === d);
                return (
                  <span key={d} style={{ padding: "6px 14px", borderRadius: 100, background: "var(--cream)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 500, color: "var(--navy)" }}>
                    {dom?.name || d}
                    {dom?.phase === "II" && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 6px", borderRadius: 100, background: "rgba(99,102,241,.1)", color: "#6366F1", fontWeight: 600 }}>NEW</span>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* QP Summary Table */}
          {qps.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>OSP Section: Qualifying Projects</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)", marginBottom: 16 }}>QP Summary Table</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--navy)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>#</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--navy)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Contract</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--navy)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Agency</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--navy)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Value</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--navy)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Period</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--navy)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>NAICS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qps.map((qp, idx) => (
                      <tr key={qp.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 12px", color: "var(--navy)", fontWeight: 500 }}>{qp.contractNumber || "-"}</td>
                        <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{qp.agencyName || "-"}</td>
                        <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{qp.totalValue ? `$${parseFloat(qp.totalValue.replace(/[^0-9.]/g, "")).toLocaleString()}` : "-"}</td>
                        <td style={{ padding: "10px 12px", color: "var(--ink3)" }}>{qp.startDate && qp.endDate ? `${qp.startDate} - ${qp.endDate}` : "-"}</td>
                        <td style={{ padding: "10px 12px", color: "var(--ink3)", fontFamily: "monospace", fontSize: 11 }}>{qp.naicsCodes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Copyable narratives */}
              {qps.map((qp, idx) => qp.scopeNarrative && (
                <div key={qp.id} style={{ marginTop: 16, padding: "16px", background: "var(--cream)", borderRadius: "var(--r)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>QP {idx + 1} Scope Narrative</div>
                    <button onClick={() => copyToClipboard(qp.scopeNarrative, `qp-${idx}`)} style={{ padding: "4px 12px", background: "#fff", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--navy)", fontSize: 11, cursor: "pointer" }}>
                      {copied === `qp-${idx}` ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.6, maxHeight: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {qp.scopeNarrative}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
            <a href={`/certifications/${certId}/oasis-plus/review`} style={{
              flex: 1, padding: "16px", background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)",
              borderRadius: "var(--rl)", textDecoration: "none", textAlign: "center",
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Run GovCert Analysis</div>
              <div style={{ fontSize: 12, color: "var(--ink3)" }}>AI-powered review of your application</div>
            </a>
            <a href="https://sam.gov" target="_blank" rel="noopener noreferrer" style={{
              flex: 1, padding: "16px", background: "rgba(26,102,68,.06)", border: "1px solid rgba(26,102,68,.15)",
              borderRadius: "var(--rl)", textDecoration: "none", textAlign: "center",
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🏛️</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Open OASIS+ Symphony Portal</div>
              <div style={{ fontSize: 12, color: "var(--ink3)" }}>Submit on SAM.gov</div>
            </a>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}/oasis-plus/review`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              ← Review
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
