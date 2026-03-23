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

const BP_SECTIONS = [
  { id: "description", label: "Business Description", hint: "Company overview, legal structure, history, and mission. What does your company do?", maxChars: 3000 },
  { id: "productsServices", label: "Products / Services", hint: "Detailed description of the products and services you offer, including NAICS codes and target SINs.", maxChars: 3000 },
  { id: "targetMarket", label: "Target Market", hint: "Who are your customers? Federal, state, local agencies? Commercial clients? Geographic focus?", maxChars: 2000 },
  { id: "marketingStrategy", label: "Marketing Strategy", hint: "How will you reach your target market? Teaming arrangements, GSA Advantage, agency outreach?", maxChars: 2000 },
  { id: "growthProjections", label: "Growth Projections", hint: "Revenue projections for the next 3-5 years. Employee growth. Capability expansion plans.", maxChars: 2500 },
];

export default function BusinessPlanPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [sections, setSections] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);

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
      if (data.application?.businessPlanData) {
        try {
          const parsed = JSON.parse(data.application.businessPlanData);
          setSections(parsed);
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
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  async function draftSection(sectionId: string) {
    setGenerating(sectionId);
    setError(null);
    const section = BP_SECTIONS.find(s => s.id === sectionId);
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: section?.label,
          certType: "8a",
          prompt: `Write the "${section?.label}" section of an 8(a) Business Development Program business plan. ${section?.hint} Max ${section?.maxChars} characters. Be specific, professional, and aligned with SBA requirements.`,
          context: {
            businessName: cert?.client?.businessName,
            entityType: cert?.client?.entityType,
            naicsCode: cert?.application?.naicsCode,
            otherSections: Object.entries(sections)
              .filter(([k]) => k !== sectionId)
              .map(([k, v]) => {
                const s = BP_SECTIONS.find(bp => bp.id === k);
                return `${s?.label || k}: ${v}`;
              })
              .join("\n\n"),
          },
        }),
      });
      setSections(prev => ({ ...prev, [sectionId]: data.text }));
    } catch {
      setError(`Failed to generate ${section?.label}.`);
    } finally {
      setGenerating(null);
    }
  }

  async function saveData() {
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
          businessPlanData: JSON.stringify(sections),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return true;
    } catch (err: any) {
      setError("Failed to save: " + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndNavigate(next: boolean) {
    const success = await saveData();
    if (next && success) setTimeout(() => router.push(`/certifications/${certId}/8a/corporate`), 500);
  }

  const filledCount = BP_SECTIONS.filter(s => sections[s.id]?.trim()).length;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const sidebarContent = (
    <div>
      <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>8(a) Sections</div>
      {EIGHT_A_SECTIONS.map((s, i) => {
        const isActive = s.id === "business-plan";
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

      {/* Sub-sections for Business Plan */}
      <div style={{ marginTop: 12, paddingLeft: 12 }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.2)", padding: "0 9px", marginBottom: 6, fontWeight: 600 }}>Plan Sections</div>
        {BP_SECTIONS.map(s => (
          <a key={s.id} href={`#bp-${s.id}`} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: "var(--r)",
            marginBottom: 2, textDecoration: "none",
            color: sections[s.id]?.trim() ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.3)",
            fontSize: 11,
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              background: sections[s.id]?.trim() ? "var(--green)" : "rgba(255,255,255,.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 7, color: "#fff", flexShrink: 0,
            }}>
              {sections[s.id]?.trim() ? "\u2713" : ""}
            </div>
            {s.label}
          </a>
        ))}
      </div>

      <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>
        &larr; Back to Dashboard
      </a>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="certifications" sidebarContent={sidebarContent} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            &larr; Back to Application Dashboard
          </a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 3 of 7</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Business Plan</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              A comprehensive business plan is required for the 8(a) program. Complete each section below or use AI to draft from your company data.
            </p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* Progress bar */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: "var(--ink3)" }}>{filledCount} of {BP_SECTIONS.length} sections drafted</span>
              {filledCount === BP_SECTIONS.length && <span style={{ fontSize: 13, fontWeight: 500, color: "var(--green)" }}>{"\u2713"} All sections complete</span>}
            </div>
            <div style={{ height: 6, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(filledCount / BP_SECTIONS.length) * 100}%`, background: filledCount === BP_SECTIONS.length ? "var(--green)" : "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
            </div>
          </div>

          {/* Sections */}
          {BP_SECTIONS.map((s, idx) => (
            <div key={s.id} id={`bp-${s.id}`} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Section {idx + 1}</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>{s.label}</h3>
                  <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>{s.hint}</p>
                </div>
                <button
                  onClick={() => draftSection(s.id)}
                  disabled={generating === s.id}
                  style={{
                    padding: "8px 16px",
                    background: "var(--gold)",
                    border: "none",
                    borderRadius: "var(--r)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: generating === s.id ? "not-allowed" : "pointer",
                    opacity: generating === s.id ? 0.7 : 1,
                    whiteSpace: "nowrap" as const,
                    flexShrink: 0,
                  }}
                >
                  {generating === s.id ? "Drafting..." : "\u2728 Draft"}
                </button>
              </div>

              <textarea
                value={sections[s.id] || ""}
                onChange={e => setSections(prev => ({ ...prev, [s.id]: e.target.value }))}
                placeholder={`Write your ${s.label.toLowerCase()} here...`}
                style={{
                  width: "100%",
                  minHeight: 180,
                  padding: 16,
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--r)",
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.8,
                  resize: "vertical",
                  color: "var(--navy)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span style={{ fontSize: 12, color: "var(--ink4)" }}>
                  {(sections[s.id]?.length || 0).toLocaleString()} / {s.maxChars.toLocaleString()} characters
                </span>
                {(sections[s.id]?.length || 0) > s.maxChars && (
                  <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 500 }}>
                    Over limit by {((sections[s.id]?.length || 0) - s.maxChars).toLocaleString()} characters
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Save / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <a href={`/certifications/${certId}/8a/economic-disadvantage`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
              &larr; Previous: Economic Disadvantage
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saved && <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>{"\u2713"} Saved</span>}
              <button onClick={() => saveAndNavigate(false)} disabled={saving}
                style={{ padding: "10px 24px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, color: "var(--ink3)", cursor: "pointer" }}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => saveAndNavigate(true)} disabled={saving}
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
