"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import CertSidebar from "@/components/CertSidebar";
import RedraftWizard from "@/components/RedraftWizard";
import { ProvenanceBadge } from "@/components/SecurityBadge";

const EIGHT_A_SECTIONS = [
  { id: "social-disadvantage", label: "Social Disadvantage" },
  { id: "economic-disadvantage", label: "Economic Disadvantage" },
  { id: "business-plan", label: "Business Plan" },
  { id: "corporate", label: "Corporate Experience" },
  { id: "past-performance", label: "Past Performance" },
  { id: "financials", label: "Financials" },
  { id: "submit", label: "Submit" },
];

const GUIDED_QUESTIONS = [
  { id: "yearsInBusiness", label: "Years in Business", question: "How long has your company been in business?", placeholder: "e.g. Founded in 2015, 10 years of operation.", type: "short" },
  { id: "coreServices", label: "Core Service Areas", question: "What are your 3 primary service areas relevant to the 8(a) program?", placeholder: "e.g. IT modernization, cybersecurity, cloud migration for federal agencies", type: "medium" },
  { id: "customerBase", label: "Customer Base", question: "Who are your primary customers? Government vs. commercial split?", placeholder: "e.g. 60% federal, 25% state/local, 15% commercial", type: "medium" },
  { id: "differentiators", label: "Key Differentiators", question: "What makes your company uniquely qualified? What do you do better than competitors?", placeholder: "e.g. Niche expertise in FedRAMP compliance, 30+ cleared staff...", type: "medium" },
  { id: "teamCapacity", label: "Team Size & Capacity", question: "How many employees? Where are you located?", placeholder: "e.g. 15 FTEs, HQ in Washington DC", type: "short" },
  { id: "ownerExperience", label: "Owner's Experience", question: "Describe the disadvantaged owner's relevant business and industry experience.", placeholder: "e.g. 15 years in federal IT, former CIO at agency X...", type: "medium" },
  { id: "growthPlan", label: "Growth Plan", question: "How will the 8(a) program help grow your business? What is your 5-year vision?", placeholder: "e.g. Target sole-source contracts, build past performance, expand into DoD...", type: "medium" },
];

const NARRATIVE_SECTIONS = [
  { id: "overview", label: "Company Overview", hint: "History, mission, founding story, legal structure.", maxChars: 2000 },
  { id: "capabilities", label: "Core Capabilities", hint: "Specific services, NAICS codes, and areas of expertise.", maxChars: 2000 },
  { id: "management", label: "Management & Personnel", hint: "Ownership structure, key personnel, qualifications.", maxChars: 1500 },
  { id: "operations", label: "Operations & Controls", hint: "Accounting systems, internal controls, compliance posture.", maxChars: 1000 },
  { id: "experience", label: "Relevant Experience", hint: "Summary of past projects demonstrating 8(a) readiness.", maxChars: 1500 },
];

export default function CorporateExperience8aPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [mode, setMode] = useState<"gather" | "refine">("gather");
  const [guidedAnswers, setGuidedAnswers] = useState<Record<string, string>>({});
  const [narratives, setNarratives] = useState<Record<string, string>>({});
  const [redraftSection, setRedraftSection] = useState<string | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [listening, setListening] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedTexts, setUploadedTexts] = useState<{ name: string; text: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatingFromGuided, setGeneratingFromGuided] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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
      if (data.application?.narrativeCorp) {
        try {
          const parsed = JSON.parse(data.application.narrativeCorp);
          if (parsed.narratives) {
            setNarratives(parsed.narratives);
            setGuidedAnswers(parsed.guidedAnswers || {});
            setMode("refine");
          } else {
            setNarratives(parsed);
            setMode("refine");
          }
        } catch {
          setNarratives({ overview: data.application.narrativeCorp });
          setMode("refine");
        }
      }
      const completed: Record<string, boolean> = {};
      const app = data.application;
      if (app) {
        if (app.socialDisadvantageNarrative?.trim()) completed["social-disadvantage"] = true;
        if (app.economicDisadvantageData) completed["economic-disadvantage"] = true;
        if (app.businessPlanData) completed["business-plan"] = true;
        if (app.narrativeCorp) completed["corporate"] = true;
        if (app.pastPerformance8a?.length > 0) completed["past-performance"] = true;
        if (app.financialData8a) completed["financials"] = true;
      }
      setCompletedSections(completed);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleFileUpload(files: File[]) {
    setUploading(true);
    const newTexts: { name: string; text: string }[] = [];
    try {
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
        if (data.text) newTexts.push({ name: file.name, text: data.text });
      }
      setUploadedFiles(prev => [...prev, ...files]);
      setUploadedTexts(prev => [...prev, ...newTexts]);
    } catch { setError("Failed to process files."); }
    finally { setUploading(false); }
  }

  async function prefillFromDocuments() {
    setGeneratingFromGuided(true);
    setError(null);
    try {
      // Fetch documents with extracted text from server
      const docs = await apiRequest(`/api/upload/documents?clientId=${cert?.clientId}`);
      const docsWithText = (Array.isArray(docs) ? docs : []).filter((d: any) => d.extractedText?.trim());

      // Also include any locally uploaded texts
      let combinedText = "";
      for (const doc of docsWithText) {
        const snippet = `--- ${doc.originalName} ---\n${doc.extractedText.substring(0, 3000)}\n\n`;
        if (combinedText.length + snippet.length > 8000) break;
        combinedText += snippet;
      }
      for (const t of uploadedTexts) {
        const snippet = `--- ${t.name} ---\n${t.text.substring(0, 3000)}\n\n`;
        if (combinedText.length + snippet.length > 8000) break;
        combinedText += snippet;
      }

      if (!combinedText.trim()) {
        setError("No documents with extractable text found. Upload a proposal or capability statement.");
        setGeneratingFromGuided(false);
        return;
      }

      const data = await apiRequest("/api/applications/ai/extract", {
        method: "POST",
        body: JSON.stringify({
          proposalText: combinedText,
          businessName: cert?.client?.businessName || "",
          certType: "EIGHT_A",
          clientId: cert?.clientId,
          extractionContext: "corporate-experience",
          extractionQuestions: GUIDED_QUESTIONS.map(q => q.question).join("\n"),
        }),
      });

      const newAnswers: Record<string, string> = { ...guidedAnswers };
      const bi = data.businessInfo || {};
      const sec = data.sections || {};

      if (bi.yearsInBusiness && !newAnswers.yearsInBusiness) newAnswers.yearsInBusiness = String(bi.yearsInBusiness);
      if ((bi.coreServiceAreas?.length || sec.capabilities) && !newAnswers.coreServices) {
        newAnswers.coreServices = bi.coreServiceAreas?.length ? bi.coreServiceAreas.join(", ") : sec.capabilities || "";
      }
      if (bi.keyDifferentiators?.length && !newAnswers.differentiators) {
        newAnswers.differentiators = bi.keyDifferentiators.join(". ");
      }
      if (bi.employeeCount && !newAnswers.teamCapacity) {
        newAnswers.teamCapacity = `${bi.employeeCount} employees${bi.location ? `, based in ${bi.location}` : ""}`;
      }
      if (sec.employees && !newAnswers.ownerExperience) newAnswers.ownerExperience = sec.employees;
      if (sec.overview && !newAnswers.coreServices) newAnswers.coreServices = sec.overview;

      // Track which fields were auto-filled
      const filled: Record<string, string> = {};
      for (const key of Object.keys(newAnswers)) {
        if (newAnswers[key] && (!guidedAnswers[key] || !guidedAnswers[key].trim())) {
          filled[key] = "extractedProfile";
        }
      }
      if (Object.keys(filled).length > 0) setAutoFilledFields(prev => ({ ...prev, ...filled }));
      setGuidedAnswers(newAnswers);
    } catch (err: any) {
      setError("Document scan failed: " + (err.message || "Try uploading more documents."));
    } finally {
      setGeneratingFromGuided(false);
    }
  }

  async function generateAllSections() {
    setGeneratingAll(true);
    setError(null);
    try {
      const guidedContext = GUIDED_QUESTIONS.map(q => `${q.label}: ${guidedAnswers[q.id] || "Not provided"}`).join("\n\n");
      const docsContext = uploadedTexts.map(t => `--- ${t.name} ---\n${t.text.substring(0, 2000)}`).join("\n\n");
      const data = await apiRequest("/api/applications/ai/generate-all", {
        method: "POST",
        body: JSON.stringify({
          certType: "8a",
          businessName: cert?.client?.businessName,
          entityType: cert?.client?.entityType,
          userDescription: guidedContext,
          extractedText: docsContext,
          sections: NARRATIVE_SECTIONS.map(s => ({ id: s.id, label: s.label, maxChars: s.maxChars })),
        }),
      });
      setNarratives(data.sections);
      setMode("refine");
      await saveData(data.sections, guidedAnswers);
    } catch { setError("Failed to generate sections."); }
    finally { setGeneratingAll(false); }
  }

  async function regenerateSection(sectionId: string, guidance?: { emphases: string[]; details: Record<string, string> }) {
    setGenerating(sectionId);
    try {
      const section = NARRATIVE_SECTIONS.find(s => s.id === sectionId);
      const guidedContext = GUIDED_QUESTIONS.map(q => `${q.label}: ${guidedAnswers[q.id] || ""}`).filter(s => s.split(":")[1].trim()).join("\n\n");
      let guidanceStr = "";
      if (guidance) {
        if (guidance.emphases.length > 0) guidanceStr += "\n\nEMPHASIZE:\n" + guidance.emphases.map(e => `- ${e}`).join("\n");
        const details = Object.entries(guidance.details).filter(([_, v]) => v.trim());
        if (details.length > 0) guidanceStr += "\n\nADDITIONAL CONTEXT:\n" + details.map(([_, v]) => v).join("\n\n");
      }
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: section?.label,
          certType: "8a",
          prompt: `Write the "${section?.label}" section of an 8(a) Corporate Experience narrative. Max ${section?.maxChars} chars. Be specific, credible, aligned with SBA 8(a) requirements.${guidanceStr}`,
          context: {
            businessName: cert?.client?.businessName,
            otherSections: guidedContext + "\n\n" + Object.entries(narratives).filter(([k]) => k !== sectionId).map(([k, v]) => `${k}: ${v}`).join("\n\n"),
          },
        }),
      });
      setNarratives(prev => {
        const updated = { ...prev, [sectionId]: data.text };
        // Auto-save — this cost money to generate
        apiRequest("/api/applications", {
          method: "POST",
          body: JSON.stringify({
            certificationId: certId, clientId: cert?.clientId || cert?.client?.id, certType: cert?.type,
            currentStep: cert?.application?.currentStep || 1,
            narrativeCorp: JSON.stringify({ narratives: updated, guidedAnswers }),
          }),
        }).catch(e => console.error("Auto-save 8a corp narrative failed:", e));
        return updated;
      });
    } catch { setError("Failed to regenerate section."); }
    finally { setGenerating(null); }
  }

  function startVoice(fieldId: string, isGuided: boolean) {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) { alert("Voice input requires Chrome."); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    setListening(fieldId);
    let final = isGuided ? (guidedAnswers[fieldId] || "") : (narratives[fieldId] || "");
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += " " + event.results[i][0].transcript;
        else interim = event.results[i][0].transcript;
      }
      const val = (final + " " + interim).trim();
      if (isGuided) setGuidedAnswers(prev => ({ ...prev, [fieldId]: val }));
      else setNarratives(prev => ({ ...prev, [fieldId]: val }));
    };
    recognition.onend = () => setListening(null);
    recognition.start();
  }

  function stopVoice() { recognitionRef.current?.stop(); setListening(null); }

  async function saveData(narrativeData: Record<string, string>, guidedData: Record<string, string>) {
    await apiRequest("/api/applications", {
      method: "POST",
      body: JSON.stringify({
        certificationId: certId,
        clientId: cert.clientId,
        certType: cert.type,
        currentStep: cert.application?.currentStep || 1,
        narrativeCorp: JSON.stringify({ narratives: narrativeData, guidedAnswers: guidedData }),
      }),
    });
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    try {
      await saveData(narratives, guidedAnswers);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return true;
    } catch (err: any) { setError("Failed to save: " + err.message); return false; }
    finally { setSaving(false); }
  }

  async function saveAndNavigate(next: boolean) {
    const success = await saveAll();
    if (next && success) setTimeout(() => router.push(`/certifications/${certId}/8a/past-performance`), 500);
  }

  const totalGuidedFilled = GUIDED_QUESTIONS.filter(q => guidedAnswers[q.id]?.trim()).length;
  const totalNarrativeFilled = NARRATIVE_SECTIONS.filter(s => narratives[s.id]?.trim()).length;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const sidebarContent = (
    <div>
      <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>8(a) Sections</div>
      {EIGHT_A_SECTIONS.map((s, i) => {
        const isActive = s.id === "corporate";
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

      {/* Mode & progress */}
      <div style={{ margin: "12px 9px 0", padding: "10px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.3)", marginBottom: 6, fontWeight: 600 }}>Mode</div>
        <button onClick={() => setMode("gather")} style={{ width: "100%", padding: "6px 8px", marginBottom: 3, background: mode === "gather" ? "rgba(200,155,60,.2)" : "transparent", border: `1px solid ${mode === "gather" ? "rgba(200,155,60,.4)" : "transparent"}`, borderRadius: "var(--r)", color: mode === "gather" ? "var(--gold2)" : "rgba(255,255,255,.4)", fontSize: 11, cursor: "pointer", textAlign: "left" as const }}>
          1. Gather Info
        </button>
        <button onClick={() => setMode("refine")} style={{ width: "100%", padding: "6px 8px", background: mode === "refine" ? "rgba(200,155,60,.2)" : "transparent", border: `1px solid ${mode === "refine" ? "rgba(200,155,60,.4)" : "transparent"}`, borderRadius: "var(--r)", color: mode === "refine" ? "var(--gold2)" : "rgba(255,255,255,.4)", fontSize: 11, cursor: "pointer", textAlign: "left" as const }}>
          2. Review Narratives
        </button>
      </div>
      <div style={{ margin: "8px 9px", padding: "8px 10px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>Questions</span>
          <span style={{ fontSize: 11, color: "var(--gold2)", fontFamily: "'Cormorant Garamond', serif" }}>{totalGuidedFilled}/{GUIDED_QUESTIONS.length}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>Sections</span>
          <span style={{ fontSize: 11, color: "var(--gold2)", fontFamily: "'Cormorant Garamond', serif" }}>{totalNarrativeFilled}/{NARRATIVE_SECTIONS.length}</span>
        </div>
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
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 4 of 7</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Corporate Experience</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              {mode === "gather"
                ? "Upload documents and answer questions. GovCert drafts the narrative sections from your inputs."
                : "Review and refine your AI-drafted corporate experience narratives for the 8(a) application."}
            </p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* GATHER MODE */}
          {mode === "gather" && (
            <div>
              {/* Document-first AI panel */}
              <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,.06) 0%, rgba(200,155,60,.06) 100%)", border: "1px solid rgba(99,102,241,.15)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Step 1: Let AI read your documents</div>
                    <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 0 }}>
                      Click "Scan Documents" to have AI pre-fill the answers below from your uploaded proposals, capability statements, and business documents. Then review and edit.
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={prefillFromDocuments} disabled={generatingFromGuided}
                    style={{
                      padding: "10px 24px",
                      background: generatingFromGuided ? "var(--ink4)" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                      border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff",
                      cursor: generatingFromGuided ? "wait" : "pointer",
                      boxShadow: "0 4px 16px rgba(99,102,241,.3)",
                    }}>
                    {generatingFromGuided ? "Scanning documents..." : "🤖 Scan Documents & Pre-fill Answers"}
                  </button>
                </div>
              </div>

              {/* File upload */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Upload Additional Documents</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Upload Company Documents</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>
                  Capability statements, proposals, org charts, award letters — any docs about your company. The more you upload, the better the AI drafts.
                </p>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.xlsx,.csv" style={{ display: "none" }}
                  onChange={e => { if (e.target.files) handleFileUpload(Array.from(e.target.files)); }} />

                {uploadedFiles.length === 0 ? (
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "40px 24px", textAlign: "center" as const, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{"\uD83D\uDCC2"}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Click to upload company documents</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>PDF, Word, Excel, CSV, text files</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                      {uploadedFiles.map((file, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: uploadedTexts[i] ? "var(--green-bg)" : "var(--amber-bg)", border: `1px solid ${uploadedTexts[i] ? "var(--green-b)" : "var(--amber-b)"}`, borderRadius: "var(--r)" }}>
                          <span style={{ fontSize: 16 }}>{"\uD83D\uDCC4"}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: uploadedTexts[i] ? "var(--green)" : "var(--amber)" }}>{file.name}</div>
                            <div style={{ fontSize: 11, color: "var(--ink3)" }}>{uploading && !uploadedTexts[i] ? "Processing..." : uploadedTexts[i] ? `${uploadedTexts[i].text.length.toLocaleString()} chars extracted` : "Pending"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => fileInputRef.current?.click()} style={{ padding: "8px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>+ Add More Files</button>
                      {uploadedTexts.length > 0 && (
                        <button onClick={prefillFromDocuments} disabled={generatingFromGuided}
                          style={{ padding: "8px 16px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: generatingFromGuided ? 0.7 : 1 }}>
                          {generatingFromGuided ? "Pre-filling..." : "\u2728 Pre-fill Questions from Docs"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Guided Questions */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Step 2 — Answer Questions</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 16 }}>Guided Questions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {GUIDED_QUESTIONS.map(q => (
                    <div key={q.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                          <label style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500 }}>{q.question}</label>
                          {autoFilledFields[q.id] && <ProvenanceBadge source={autoFilledFields[q.id]} confidence="MEDIUM" />}
                        </div>
                        <button
                          onClick={() => listening === q.id ? stopVoice() : startVoice(q.id, true)}
                          style={{ padding: "4px 10px", background: listening === q.id ? "#C62828" : "var(--cream)", border: `1px solid ${listening === q.id ? "#C62828" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 11, color: listening === q.id ? "#fff" : "var(--ink3)", cursor: "pointer" }}>
                          {listening === q.id ? "\u23F9 Stop" : "\uD83C\uDF99\uFE0F Voice"}
                        </button>
                      </div>
                      <textarea
                        value={guidedAnswers[q.id] || ""}
                        onChange={e => setGuidedAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder={q.placeholder}
                        rows={q.type === "short" ? 2 : q.type === "medium" ? 4 : 6}
                        style={{ width: "100%", padding: 12, border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", color: "var(--navy)", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate all */}
              <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
                <button onClick={generateAllSections} disabled={generatingAll || totalGuidedFilled < 3}
                  style={{ padding: "14px 40px", background: totalGuidedFilled >= 3 ? "var(--gold)" : "var(--cream)", border: totalGuidedFilled >= 3 ? "none" : "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 16, fontWeight: 600, color: totalGuidedFilled >= 3 ? "#fff" : "var(--ink4)", cursor: totalGuidedFilled >= 3 ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
                  {generatingAll ? "Generating All Sections..." : `\u2728 Generate All ${NARRATIVE_SECTIONS.length} Narrative Sections`}
                </button>
                {totalGuidedFilled < 3 && <p style={{ fontSize: 12, color: "var(--ink4)", marginTop: 8 }}>Answer at least 3 questions to enable AI generation.</p>}
              </div>
            </div>
          )}

          {/* REFINE MODE */}
          {mode === "refine" && (
            <div>
              {NARRATIVE_SECTIONS.map((s, idx) => (
                <div key={s.id} id={`ns-${s.id}`} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Section {idx + 1}</div>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>{s.label}</h3>
                      <p style={{ fontSize: 13, color: "var(--ink3)" }}>{s.hint}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => listening === s.id ? stopVoice() : startVoice(s.id, false)}
                        style={{ padding: "6px 12px", background: listening === s.id ? "#C62828" : "var(--cream)", border: `1px solid ${listening === s.id ? "#C62828" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 12, color: listening === s.id ? "#fff" : "var(--ink3)", cursor: "pointer" }}>
                        {listening === s.id ? "\u23F9" : "\uD83C\uDF99\uFE0F"}
                      </button>
                      <button onClick={() => generating === s.id ? null : setRedraftSection(s.id)} disabled={generating === s.id}
                        style={{ padding: "6px 12px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: generating === s.id ? 0.7 : 1 }}>
                        {generating === s.id ? "..." : "\u2728 Redraft"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={narratives[s.id] || ""}
                    onChange={e => setNarratives(prev => ({ ...prev, [s.id]: e.target.value }))}
                    rows={8}
                    style={{ width: "100%", padding: 16, border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8, resize: "vertical", color: "var(--navy)", outline: "none", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--ink4)" }}>{(narratives[s.id]?.length || 0).toLocaleString()} / {s.maxChars.toLocaleString()} chars</span>
                    {(narratives[s.id]?.length || 0) > s.maxChars && <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 500 }}>Over limit</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <a href={`/certifications/${certId}/8a/business-plan`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>&larr; Previous: Business Plan</a>
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

      {/* RedraftWizard Modal */}
      {redraftSection && (
        <RedraftWizard
          sectionId={redraftSection}
          sectionLabel={NARRATIVE_SECTIONS.find(s => s.id === redraftSection)?.label || redraftSection}
          generating={generating === redraftSection}
          onGenerate={(guidance) => {
            regenerateSection(redraftSection, guidance);
            setRedraftSection(null);
          }}
          onClose={() => setRedraftSection(null)}
        />
      )}
    </div>
  );
}
