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
  { id: "executiveSummary", label: "Executive Summary", hint: "Company mission, core offerings, target market, and growth objectives.", maxChars: 1500 },
  { id: "companyDescription", label: "Company Description", hint: "Legal structure, history, ownership, location, and unique value proposition.", maxChars: 2000 },
  { id: "servicesProducts", label: "Services / Products", hint: "Detailed description of services/products, competitive advantages, delivery methodology.", maxChars: 2000 },
  { id: "marketAnalysis", label: "Market Analysis", hint: "Target market size, federal contracting landscape, competitive analysis, market trends.", maxChars: 2500 },
  { id: "organizationManagement", label: "Organization & Management", hint: "Management team, organizational structure, key personnel qualifications.", maxChars: 2000 },
  { id: "marketingStrategy", label: "Marketing Strategy", hint: "How you market to federal agencies, teaming arrangements, GSA Advantage, agency outreach.", maxChars: 2000 },
  { id: "financialProjections", label: "Financial Projections", hint: "3-year revenue projections, profit targets, capital requirements, funding sources.", maxChars: 2000 },
  { id: "growthTargets", label: "Growth Targets", hint: "Specific measurable goals for the 8(a) program term: contract targets, capability expansion.", maxChars: 1500 },
];

const GUIDED_BP_QUESTIONS = [
  { id: "whatDoYouDo", question: "What does your company do? What specific services or products do you offer?" },
  { id: "legalStructure", question: "What is your legal structure (LLC, Corp, etc.) and when was the company established?" },
  { id: "targetAgencies", question: "Which federal agencies or prime contractors are your primary targets?" },
  { id: "competitiveEdge", question: "What makes your company different from competitors? What's your unique value proposition?" },
  { id: "currentRevenue", question: "What is your current annual revenue and how many employees do you have?" },
  { id: "growthPlan", question: "Where do you want the company to be in 3-5 years? Revenue targets? New capabilities?" },
  { id: "marketingApproach", question: "How do you currently find and win business? What marketing channels do you use?" },
  { id: "teamStrength", question: "Describe your key personnel — their qualifications, certifications, and roles." },
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
  const [generatingAll, setGeneratingAll] = useState(false);
  const [mode, setMode] = useState<"gather" | "refine">("gather");
  const [bpAnswers, setBpAnswers] = useState<Record<string, string>>({});
  const [bpScore, setBpScore] = useState<number | null>(null);
  const [bpSuggestions, setBpSuggestions] = useState<string[]>([]);

  // Document-first flow
  const [docCount, setDocCount] = useState(0);
  const [prefilling, setPrefilling] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

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
          if (Object.values(parsed).some((v: any) => v?.trim())) setMode("refine");
        } catch {}
      }
      if (data.application?.businessPlanAnswers) {
        try { setBpAnswers(JSON.parse(data.application.businessPlanAnswers)); } catch {}
      }
      // Check uploaded document count
      try {
        const docs = await apiRequest(`/api/upload/documents?clientId=${data.clientId}`);
        setDocCount(Array.isArray(docs) ? docs.length : 0);
      } catch {}
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

  const API = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

  async function prefillFromDocuments() {
    if (!cert?.clientId) return;
    setPrefilling(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/extract", {
        method: "POST",
        body: JSON.stringify({
          proposalText: "__USE_CLIENT_DOCUMENTS__",
          businessName: cert?.client?.businessName || "",
          certType: "EIGHT_A",
          clientId: cert.clientId,
        }),
      });
      // Map extracted businessInfo + sections to guided answers
      const newAnswers: Record<string, string> = { ...bpAnswers };
      const bi = data.businessInfo || {};
      const sec = data.sections || {};

      if (bi.coreServiceAreas?.length && !newAnswers.whatDoYouDo) {
        newAnswers.whatDoYouDo = bi.coreServiceAreas.join(", ");
      }
      if (bi.entityType && !newAnswers.legalStructure) {
        newAnswers.legalStructure = `${bi.entityType}${bi.foundedYear ? `, established ${bi.foundedYear}` : ""}`;
      }
      if (sec.overview && !newAnswers.whatDoYouDo) {
        newAnswers.whatDoYouDo = sec.overview;
      }
      if (bi.keyDifferentiators?.length && !newAnswers.competitiveEdge) {
        newAnswers.competitiveEdge = bi.keyDifferentiators.join(". ");
      }
      if ((bi.annualRevenue || bi.employeeCount) && !newAnswers.currentRevenue) {
        newAnswers.currentRevenue = [
          bi.annualRevenue ? `Revenue: ${bi.annualRevenue}` : "",
          bi.employeeCount ? `${bi.employeeCount} employees` : "",
        ].filter(Boolean).join(", ");
      }
      if (sec.marketing && !newAnswers.marketingApproach) {
        newAnswers.marketingApproach = sec.marketing;
      }
      if (sec.employees && !newAnswers.teamStrength) {
        newAnswers.teamStrength = sec.employees;
      }
      if (sec.capabilities && !newAnswers.whatDoYouDo) {
        newAnswers.whatDoYouDo = sec.capabilities;
      }

      setBpAnswers(newAnswers);
      setPrefilled(true);
    } catch (err: any) {
      setError("Document scan failed: " + (err.message || "Try uploading more documents."));
    } finally {
      setPrefilling(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !cert?.clientId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", cert.clientId);
      fd.append("category", "PAST_PROPOSAL");
      fd.append("description", "Uploaded for business plan AI extraction");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      setDocCount(prev => prev + 1);
      // Wait for AI classification then pre-fill
      setTimeout(() => prefillFromDocuments(), 3000);
    } catch (err: any) {
      setError("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function generateAllSections() {
    setGeneratingAll(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/8a/business-plan", {
        method: "POST",
        body: JSON.stringify({
          answers: bpAnswers,
          clientId: cert?.clientId,
        }),
      });
      // Map response to sections
      const newSections: Record<string, string> = {};
      BP_SECTIONS.forEach(s => {
        if (data[s.id]) newSections[s.id] = data[s.id];
      });
      setSections(prev => ({ ...prev, ...newSections }));
      if (data.strengthScore) setBpScore(data.strengthScore);
      if (data.suggestions) setBpSuggestions(data.suggestions);
      setMode("refine");
    } catch (err: any) {
      setError("AI generation failed: " + (err.message || "Please try again."));
    } finally {
      setGeneratingAll(false);
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
          businessPlanAnswers: JSON.stringify(bpAnswers),
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

          {/* Mode switcher */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {[{ id: "gather" as const, label: "Answer Questions", icon: "📝", desc: "Quick guided questions" }, { id: "refine" as const, label: "Edit Sections", icon: "✨", desc: `${filledCount}/${BP_SECTIONS.length} drafted` }].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{
                  flex: 1, padding: "14px 18px", background: mode === m.id ? "#fff" : "var(--cream)",
                  border: `2px solid ${mode === m.id ? "var(--gold)" : "var(--border)"}`,
                  borderRadius: "var(--rl)", cursor: "pointer", textAlign: "left" as const,
                }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{m.label}</div>
                <div style={{ fontSize: 12, color: "var(--ink3)" }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {/* GATHER MODE — Guided questions */}
          {mode === "gather" && (
            <div>
              {/* Step 1: Document-first panel */}
              <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,.06) 0%, rgba(200,155,60,.06) 100%)", border: "1px solid rgba(99,102,241,.15)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
                      Step 1: Let AI read your documents
                    </div>
                    <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 0 }}>
                      {docCount > 0
                        ? `You have ${docCount} document${docCount !== 1 ? "s" : ""} uploaded. Click "Scan Documents" to have AI pre-fill the answers below from your proposals, capability statements, and business documents. Then review and edit before generating your plan.`
                        : "Upload a proposal, capability statement, business plan, or company overview and our AI will pre-fill answers for you. This saves significant time."}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {docCount > 0 && (
                    <button onClick={prefillFromDocuments} disabled={prefilling}
                      style={{
                        padding: "10px 24px",
                        background: prefilling ? "var(--ink4)" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                        border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff",
                        cursor: prefilling ? "wait" : "pointer",
                        boxShadow: "0 4px 16px rgba(99,102,241,.3)",
                      }}>
                      {prefilling ? "Scanning your documents..." : `🤖 Scan ${docCount} Document${docCount !== 1 ? "s" : ""} & Pre-fill Answers`}
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv,.pptx" style={{ display: "none" }} onChange={handleFileUpload} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{
                      padding: "10px 20px", background: "#fff",
                      border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontWeight: 500,
                      color: "var(--ink3)", cursor: "pointer",
                    }}>
                    {uploading ? "Uploading..." : "+ Upload a Document"}
                  </button>
                </div>
                {prefilled && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 12, color: "var(--green)", fontWeight: 500 }}>
                    ✓ AI has pre-filled answers from your documents. Review and edit below, then click "Generate Business Plan."
                  </div>
                )}
              </div>

              {/* Step 2: Generate header */}
              <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>Answer a few questions and AI will generate all 8 business plan sections.</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length}/{GUIDED_BP_QUESTIONS.length} answered</div>
                </div>
                <button onClick={generateAllSections} disabled={generatingAll || GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length < 3}
                  style={{
                    padding: "10px 24px",
                    background: GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length >= 3 ? "var(--gold)" : "rgba(255,255,255,.1)",
                    border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff",
                    cursor: GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length >= 3 ? "pointer" : "not-allowed",
                    boxShadow: GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length >= 3 ? "0 4px 16px rgba(200,155,60,.3)" : "none",
                  }}>
                  {generatingAll ? "Generating all 8 sections..." : "Generate Business Plan \u2728"}
                </button>
              </div>
              {GUIDED_BP_QUESTIONS.map((q, i) => (
                <div key={q.id} style={{ background: "#fff", border: `1px solid ${bpAnswers[q.id]?.trim() ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", padding: "18px 22px", marginBottom: 10, boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: bpAnswers[q.id]?.trim() ? "var(--green)" : "var(--cream2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: bpAnswers[q.id]?.trim() ? "#fff" : "var(--ink4)", fontWeight: 700 }}>
                      {bpAnswers[q.id]?.trim() ? "\u2713" : i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{q.question}</span>
                  </div>
                  <textarea value={bpAnswers[q.id] || ""} onChange={e => setBpAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Type your answer..." rows={2}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <button onClick={generateAllSections} disabled={generatingAll || GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length < 3}
                  style={{
                    padding: "14px 40px",
                    background: GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length >= 3 ? "var(--gold)" : "var(--cream2)",
                    border: "none", borderRadius: "var(--r)", fontSize: 16, fontWeight: 600,
                    color: GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length >= 3 ? "#fff" : "var(--ink4)",
                    cursor: GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length >= 3 ? "pointer" : "not-allowed",
                    boxShadow: GUIDED_BP_QUESTIONS.filter(q => bpAnswers[q.id]?.trim()).length >= 3 ? "0 4px 24px rgba(200,155,60,.4)" : "none",
                  }}>
                  {generatingAll ? "AI is writing your business plan..." : "Generate All 8 Sections \u2728"}
                </button>
              </div>
            </div>
          )}

          {/* REFINE MODE — Edit sections */}
          {mode === "refine" && (<>
          {/* Score + Progress */}
          {bpScore !== null && (
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "#fff", border: `2px solid ${bpScore >= 7 ? "var(--green)" : "var(--gold)"}`, borderRadius: "var(--rl)", padding: "16px 24px", textAlign: "center" as const, minWidth: 100 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink4)", marginBottom: 4 }}>Strength</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: bpScore >= 7 ? "var(--green)" : "var(--gold)" }}>{bpScore}</div>
                <div style={{ fontSize: 11, color: "var(--ink4)" }}>/10</div>
              </div>
              {bpSuggestions.length > 0 && (
                <div style={{ flex: 1, background: "rgba(200,155,60,.04)", border: "1px solid rgba(200,155,60,.15)", borderRadius: "var(--rl)", padding: "14px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)", marginBottom: 6 }}>Suggestions</div>
                  {bpSuggestions.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.5, marginBottom: 3 }}>&bull; {s}</div>
                  ))}
                </div>
              )}
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
          </>
          )}

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
