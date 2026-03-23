"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

// ── STRUCTURED QUESTIONS ──
const GUIDED_QUESTIONS = [
  { id: "yearsInBusiness", label: "Years in Business", question: "How long has your company been in business?", placeholder: "e.g. We were founded in 2015, so we have been operating for 10 years.", type: "short" },
  { id: "coreServices", label: "Core Service Areas", question: "What are your 3 primary service areas? Be specific — not 'consulting' but 'IT project management for federal civilian agencies'.", placeholder: "e.g. 1. Cloud migration and infrastructure modernization for federal agencies\n2. Cybersecurity assessment and compliance (NIST, FedRAMP)\n3. Program management and acquisition support", type: "medium" },
  { id: "customerBase", label: "Customer Base", question: "Who are your primary customers? What percentage of your work is government vs. commercial?", placeholder: "e.g. Approximately 70% of our work is with federal agencies including DHS, VA, and DOE. The remaining 30% is with state/local governments and commercial clients in regulated industries.", type: "medium" },
  { id: "differentiators", label: "Key Differentiators", question: "What makes your company distinctly qualified for this GSA Schedule? What do you do better than competitors?", placeholder: "e.g. Our team holds 45 active security clearances, enabling rapid deployment on sensitive federal programs. We are one of only 12 firms certified as both ISO 27001 and CMMI Level 3...", type: "medium" },
  { id: "teamCapacity", label: "Team Size & Locations", question: "How many full-time employees do you have? Where are your offices located?", placeholder: "e.g. We employ 28 full-time staff and 14 contractors. Our headquarters is in Arlington, VA with a satellite office in San Antonio, TX. All staff are U.S. citizens.", type: "short" },
  { id: "certifications", label: "Certifications & Awards", question: "What relevant certifications, awards, or recognitions does your company hold?", placeholder: "e.g. 8(a) certified (SBA), WOSB certified, ISO 9001:2015, CMMI Dev Level 2, GSA STARS III prime contractor, 2023 Washington Technology Fast 50...", type: "short" },
  { id: "revenueStability", label: "Financial Stability", question: "What is your approximate annual revenue range? Has your company been profitable and growing?", placeholder: "e.g. Annual revenue of $4-6M over the past 3 years, with consistent year-over-year growth of 20%+. We maintain a current ratio above 2.0 and carry no long-term debt.", type: "short" },
  { id: "toolsMethodologies", label: "Tools, Technologies & Methodologies", question: "What key tools, platforms, technologies, or methodologies are central to your service delivery?", placeholder: "e.g. AWS GovCloud, Azure Government, Agile/SAFe, Jira, Confluence, FISMA compliance frameworks, ServiceNow ITSM...", type: "short" },
  { id: "managementTeam", label: "Management Team Experience", question: "Briefly describe your leadership team's relevant experience.", placeholder: "e.g. Our CEO brings 20 years of federal IT experience including 8 years as a CIO at DHS. Our CTO holds a TS/SCI clearance and led digital transformation at a Big 4 firm for 12 years...", type: "medium" },
  { id: "additionalContext", label: "Anything Else", question: "Is there anything else about your company that should be included in the Corporate Experience narrative?", placeholder: "Any additional context, notable achievements, unique circumstances, or information that sets your company apart...", type: "long" },
];

// ── NARRATIVE SECTIONS ──
const NARRATIVE_SECTIONS = [
  { id: "overview", label: "Company Overview", hint: "History, mission, founding, core identity. Max 1,500 chars.", maxChars: 1500 },
  { id: "capabilities", label: "Core Capabilities & Services", hint: "Specific services offered under the GSA Schedule. Align with selected SINs. Max 1,500 chars.", maxChars: 1500 },
  { id: "employees", label: "Employee Experience & Qualifications", hint: "Headcount, key personnel, certifications, clearances. Max 1,500 chars.", maxChars: 1500 },
  { id: "org_controls", label: "Organizational & Accounting Controls", hint: "Management structure, accounting system, internal controls. Max 1,000 chars.", maxChars: 1000 },
  { id: "resources", label: "Resources & Capacity", hint: "Office locations, technology infrastructure, ability to scale. Max 800 chars.", maxChars: 800 },
  { id: "past_projects", label: "Summary of Past Projects", hint: "2–3 most relevant contracts. Client, scope, outcomes. Max 1,500 chars.", maxChars: 1500 },
  { id: "marketing", label: "Federal Marketing Plan", hint: "How you will market this Schedule. Target agencies, channels, outreach plan. Max 800 chars.", maxChars: 800 },
  { id: "subcontractors", label: "Subcontractor Management", hint: "Will you use subs? If yes, describe oversight. If no, state clearly. Max 400 chars.", maxChars: 400 },
];

const INSTRUCTIONS = [
  { icon: "📋", title: "What GSA evaluates", body: "GSA reviewers assess whether your company has a proven track record of delivering the specific services on your Schedule. They look for specificity, credibility, and direct relevance to the SINs you selected." },
  { icon: "✍️", title: "Be specific, not vague", body: "\"We provide excellent consulting services\" scores poorly. \"We have delivered 23 federal IT modernization projects averaging $1.2M each over 8 years, primarily for DHS, VA, and DOE\" scores well." },
  { icon: "📏", title: "Character limits matter", body: "Each section has a character limit. GSA eOffer will reject submissions that exceed them. GovCert tracks every character and warns you before you go over." },
  { icon: "🔗", title: "Align with your SINs", body: "Every capability you describe should map directly to a SIN you selected. If you selected SIN 541611 (Management Consulting), your narrative should describe management consulting work — not unrelated services." },
  { icon: "📄", title: "Upload everything you have", body: "Capability statements, past proposals, award letters, LinkedIn exports, company bios — upload as many files as you have. GovCert reads all of them and uses the content to answer the structured questions automatically." },
];

export default function CorporateExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mode: gather (step 1) → refine (step 2)
  const [mode, setMode] = useState<"gather" | "refine">("gather");
  const [instructionsOpen, setInstructionsOpen] = useState(true);

  // Gather mode state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedTexts, setUploadedTexts] = useState<{ name: string; text: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [guidedAnswers, setGuidedAnswers] = useState<Record<string, string>>({});
  const [generatingFromGuided, setGeneratingFromGuided] = useState(false);

  // Refine mode state
  const [narratives, setNarratives] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [listening, setListening] = useState<string | null>(null);

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
          // Check if it has narrative sections or guided answers
          if (parsed.narratives) {
            setNarratives(parsed.narratives);
            setGuidedAnswers(parsed.guidedAnswers || {});
            setMode("refine");
          } else {
            // Legacy format — treat as old answers
            setNarratives(parsed);
            setMode("refine");
          }
        } catch {
          setNarratives({ overview: data.application.narrativeCorp });
          setMode("refine");
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  // ── AUTO-PREFILL from existing client data on load ──
  useEffect(() => {
    if (!cert?.clientId || Object.values(guidedAnswers).some(v => v && v.trim() !== "")) return;
    // Only auto-prefill if guided answers are empty
    (async () => {
      try {
        const clientId = cert.clientId || cert.client?.id;
        if (!clientId) return;
        // Fetch eligibility data
        const eligData = await apiRequest(`/api/eligibility/${clientId}`).catch(() => null);
        const clientData = cert.client || {};

        const auto: Record<string, string> = {};

        // Years in business
        if (eligData?.yearEstablished) {
          const years = new Date().getFullYear() - eligData.yearEstablished;
          auto.yearsInBusiness = `${clientData.businessName || "Our company"} was established in ${eligData.yearEstablished}, giving us ${years} years of experience in the industry.`;
        }

        // NAICS / core services
        if (eligData?.naicsCodes) {
          auto.coreServices = `Our core service areas align with NAICS codes ${eligData.naicsCodes}. We specialize in delivering professional services to both government and commercial clients.`;
        }

        // Employees
        if (eligData?.employeeCount) {
          auto.teamCapacity = `Our team consists of ${eligData.employeeCount} professionals with expertise across our service areas.`;
        }

        // Revenue
        let revenue3: any[] = [];
        if (eligData?.revenue3Years) {
          try { revenue3 = typeof eligData.revenue3Years === "string" ? JSON.parse(eligData.revenue3Years) : eligData.revenue3Years; } catch {}
        }
        if (revenue3.some(Boolean)) {
          const revStr = revenue3.filter(Boolean).map((r: any) => "$" + Number(r).toLocaleString()).join(", ");
          auto.revenueStability = `Our annual revenue over the past three years has been ${revStr}, demonstrating consistent financial stability and growth.`;
        }

        // SAM registration
        if (eligData?.samRegistered === "Yes" || eligData?.samRegistered === "yes") {
          auto.certifications = (auto.certifications || "") + " We are registered in SAM.gov and maintain active registration.";
        }

        // Past contracts
        if (eligData?.completedContracts && eligData.completedContracts > 0) {
          auto.customerBase = `We have successfully completed ${eligData.completedContracts} contracts spanning both government and commercial sectors.`;
        }

        // Location
        if (clientData.city && clientData.state) {
          auto.additionalContext = `Based in ${clientData.city}, ${clientData.state}, ${clientData.businessName || "our company"} serves clients across multiple regions.`;
        }

        if (Object.keys(auto).length > 0) {
          setGuidedAnswers(prev => {
            const merged = { ...prev };
            for (const [k, v] of Object.entries(auto)) {
              if (!merged[k] || merged[k].trim() === "") merged[k] = v;
            }
            return merged;
          });
        }
      } catch {}
    })();
  }, [cert?.clientId]);

  // ── FILE UPLOAD ──
  async function handleFileUpload(files: File[]) {
    setUploading(true);
    const newTexts: { name: string; text: string }[] = [];
    const token = localStorage.getItem("token");
    const clientId = cert?.clientId || cert?.client?.id;
    try {
      for (const file of files) {
        // 1. Extract text for AI use
        const extractForm = new FormData();
        extractForm.append("file", file);
        const extractRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app"}/api/upload/extract-text`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: extractForm,
        });
        const extractData = await extractRes.json();
        if (extractData.text) newTexts.push({ name: file.name, text: extractData.text });

        // 2. Also save to document vault (so it appears in My Documents)
        if (clientId) {
          const saveForm = new FormData();
          saveForm.append("file", file);
          saveForm.append("clientId", clientId);
          saveForm.append("category", "OTHER");
          saveForm.append("description", `Uploaded during ${cert?.type || "certification"} application — Corporate Experience section`);
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app"}/api/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: saveForm,
          }).catch(() => {}); // Fire and forget — don't block the wizard
        }
      }
      setUploadedFiles(prev => [...prev, ...files]);
      setUploadedTexts(prev => [...prev, ...newTexts]);
    } catch (err) { setError("Failed to process one or more files."); }
    finally { setUploading(false); }
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedTexts(prev => prev.filter((_, i) => i !== index));
  }

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState<{ message: string; suggestions: string[] } | null>(null);

  // ── AI: Pre-fill guided questions from uploaded files ──
  async function prefillFromDocuments() {
    if (uploadedTexts.length === 0) return;
    setGeneratingFromGuided(true);
    setExtractionFailed(null);
    try {
      const combined = uploadedTexts.map(t => `--- ${t.name} ---\n${t.text}`).join("\n\n").substring(0, 8000);
      const data = await apiRequest("/api/applications/ai/extract", {
        method: "POST",
        body: JSON.stringify({
          proposalText: combined,
          businessName: cert?.client?.businessName || "the company",
          certType: cert?.type || "GSA_MAS",
          clientId: cert?.clientId || cert?.client?.id,
          extractionContext: "corporate-experience",
          extractionQuestions: GUIDED_QUESTIONS.map(q => q.question).join("\n"),
        }),
      });

      if (data.error && data.suggestedDocuments) {
        setExtractionFailed({ message: data.error, suggestions: data.suggestedDocuments || [] });
        return;
      }

      // Map extracted business info to guided answers
      const bi = data.businessInfo || {};
      const sections = data.extracted || {};
      const mapped: any = {};
      if (bi.yearsInBusiness || bi.foundedYear) mapped.yearsInBusiness = bi.yearsInBusiness || `Founded ${bi.foundedYear}`;
      if (bi.coreServiceAreas?.length) mapped.coreServices = bi.coreServiceAreas.join(", ");
      if (bi.employeeCount) mapped.teamCapacity = String(bi.employeeCount) + " employees";
      if (bi.keyDifferentiators?.length) mapped.differentiators = bi.keyDifferentiators.join(". ");
      if (bi.annualRevenue) mapped.revenueStability = String(bi.annualRevenue);
      if (bi.naicsCodes?.length) mapped.certifications = "NAICS: " + bi.naicsCodes.join(", ");
      if (sections.overview) mapped.additionalContext = sections.overview;
      if (sections.past_projects) mapped.customerBase = sections.past_projects;
      if (sections.resources) mapped.toolsMethodologies = sections.resources;
      if (sections.employees) mapped.managementTeam = sections.employees;

      // Fill any remaining empty fields from sections
      if (!mapped.coreServices && sections.capabilities) mapped.coreServices = sections.capabilities;
      if (!mapped.differentiators && sections.overview) mapped.differentiators = sections.overview;

      setGuidedAnswers((prev: Record<string, string>) => {
        const merged = { ...prev };
        for (const [key, val] of Object.entries(mapped)) {
          const strVal = typeof val === "string" ? val : Array.isArray(val) ? val.join(", ") : String(val || "");
          if (strVal && (!merged[key] || (merged[key] as string).trim() === "")) merged[key] = strVal;
        }
        return merged;
      });

      // Show disclaimer popup
      setShowDisclaimer(true);
    } catch (err: any) {
      setExtractionFailed({
        message: err.message || "Could not extract information from the uploaded documents.",
        suggestions: [
          "Capability Statement — typically has company overview, core competencies, and past performance",
          "Past Proposal or SOW — contains detailed service descriptions and project experience",
          "Business Plan — includes market analysis, service offerings, and growth strategy",
          "Company website 'About' page content",
        ],
      });
    } finally {
      setGeneratingFromGuided(false);
    }
  }

  // ── AI: Generate all 8 narrative sections ──
  async function generateAllSections() {
    setGeneratingAll(true);
    setError(null);
    try {
      const guidedContext = GUIDED_QUESTIONS.map(q => `${q.label}: ${guidedAnswers[q.id] || "Not provided"}`).join("\n\n");
      const docsContext = uploadedTexts.map(t => `--- ${t.name} ---\n${t.text.substring(0, 2000)}`).join("\n\n");

      const data = await apiRequest("/api/applications/ai/generate-all", {
        method: "POST",
        body: JSON.stringify({
          businessName: cert?.client?.businessName,
          entityType: cert?.client?.entityType,
          employeeCount: cert?.application?.employeeCount,
          naicsCode: cert?.application?.naicsCode,
          yearsInBusiness: guidedAnswers.yearsInBusiness || cert?.application?.yearsInBusiness,
          annualRevenue: guidedAnswers.revenueStability || cert?.application?.annualRevenue,
          userDescription: guidedContext,
          extractedText: docsContext,
          clientId: cert?.clientId || cert?.client?.id,
        }),
      });
      setNarratives(data.sections);
      setMode("refine");
      await saveData(data.sections, guidedAnswers);
    } catch (err) { setError("Failed to generate sections. Please try again."); }
    finally { setGeneratingAll(false); }
  }

  // ── AI: Regenerate single section ──
  async function regenerateSection(sectionId: string) {
    setGenerating(sectionId);
    try {
      const section = NARRATIVE_SECTIONS.find(s => s.id === sectionId);
      const guidedContext = GUIDED_QUESTIONS.map(q => `${q.label}: ${guidedAnswers[q.id] || ""}`).filter(s => s.split(":")[1].trim()).join("\n\n");
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: section?.label,
          prompt: `Write the "${section?.label}" section of a GSA Multiple Award Schedule Corporate Experience narrative for this company. Max ${section?.maxChars} characters. Be specific and credible. Use real data from the context provided.`,
          context: {
            businessName: cert?.client?.businessName,
            entityType: cert?.client?.entityType,
            otherSections: guidedContext + "\n\n" + Object.entries(narratives).filter(([k]) => k !== sectionId).map(([k, v]) => `${k}: ${v}`).join("\n\n"),
          },
          clientId: cert?.clientId || cert?.client?.id,
        }),
      });
      setNarratives(prev => ({ ...prev, [sectionId]: data.text }));
    } catch (err) { setError("Failed to regenerate section."); }
    finally { setGenerating(null); }
  }

  // ── VOICE ──
  function startVoice(fieldId: string, isGuided: boolean) {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input requires Chrome browser.");
      return;
    }
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

  // ── SAVE ──
  async function saveData(narrativeData: Record<string, string>, guidedData: Record<string, string>) {
    if (!cert) return;
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
      // Navigate to next section based on cert type
      const nextPage = cert?.type === "EIGHT_A"
        ? `/certifications/${certId}/8a/corporate`
        : `/certifications/${certId}/qcp`;
      setTimeout(() => router.push(nextPage), 500);
    } catch (err: any) {
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const totalNarrativeChars = Object.values(narratives).join("").length;
  const totalGuidedFilled = GUIDED_QUESTIONS.filter(q => guidedAnswers[q.id]?.trim()).length;
  const totalNarrativeFilled = NARRATIVE_SECTIONS.filter(s => narratives[s.id]?.trim()).length;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>

      {/* AI Disclaimer Popup */}
      {showDisclaimer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,25,41,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowDisclaimer(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 520, width: "100%", padding: "32px 28px", boxShadow: "0 12px 40px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, textAlign: "center", marginBottom: 12 }}>AI-Generated Content — Review Required</h3>
            <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.7, marginBottom: 16, textAlign: "center" }}>
              The information below was extracted by AI from your uploaded documents. Some answers may be <strong>inferred or estimated</strong> and are marked with <em>[AI Estimate]</em>.
            </p>
            <div style={{ background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.2)", borderRadius: 8, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
              <strong>You must review and verify all pre-filled answers</strong> before generating your draft narrative sections. Incorrect information will produce inaccurate application content that could delay or jeopardize your certification.
            </div>
            <button onClick={() => setShowDisclaimer(false)} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              I Understand — Review My Answers
            </button>
          </div>
        </div>
      )}

      {/* Extraction Failed Popup */}
      {extractionFailed && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,25,41,.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setExtractionFailed(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 520, width: "100%", padding: "32px 28px", boxShadow: "0 12px 40px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>📄</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, textAlign: "center", marginBottom: 12 }}>We Need More to Work With</h3>
            <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.7, marginBottom: 16, textAlign: "center" }}>
              {extractionFailed.message}
            </p>
            <div style={{ background: "var(--cream)", borderRadius: 8, padding: "16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--gold)", marginBottom: 10 }}>Try uploading one of these:</div>
              {extractionFailed.suggestions.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }}>→</span>
                  <span style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setExtractionFailed(null)} style={{ width: "100%", padding: "13px", background: "var(--navy)", border: "none", borderRadius: 8, color: "var(--gold2)", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Got It — I'll Upload More Documents
            </button>
          </div>
        </div>
      )}

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
          {/* Mode switcher */}
          <div style={{ margin: "0 0 16px", padding: "10px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
            <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.3)", marginBottom: 8, fontWeight: 600 }}>Mode</div>
            <button onClick={() => setMode("gather")} style={{ width: "100%", padding: "7px 10px", marginBottom: 4, background: mode === "gather" ? "rgba(200,155,60,.2)" : "transparent", border: `1px solid ${mode === "gather" ? "rgba(200,155,60,.4)" : "transparent"}`, borderRadius: "var(--r)", color: mode === "gather" ? "var(--gold2)" : "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer", textAlign: "left" as const }}>
              1. Gather Information
            </button>
            <button onClick={() => setMode("refine")} style={{ width: "100%", padding: "7px 10px", background: mode === "refine" ? "rgba(200,155,60,.2)" : "transparent", border: `1px solid ${mode === "refine" ? "rgba(200,155,60,.4)" : "transparent"}`, borderRadius: "var(--r)", color: mode === "refine" ? "var(--gold2)" : "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer", textAlign: "left" as const }}>
              2. Review Narratives
            </button>
          </div>

          {/* Progress */}
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>Progress</div>
          <div style={{ padding: "10px 12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>Questions answered</span>
              <span style={{ fontSize: 13, color: totalGuidedFilled >= 5 ? "var(--green)" : "var(--gold2)", fontFamily: "'Cormorant Garamond', serif" }}>{totalGuidedFilled}/{GUIDED_QUESTIONS.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>Sections drafted</span>
              <span style={{ fontSize: 13, color: totalNarrativeFilled >= 6 ? "var(--green)" : "var(--gold2)", fontFamily: "'Cormorant Garamond', serif" }}>{totalNarrativeFilled}/{NARRATIVE_SECTIONS.length}</span>
            </div>
          </div>

          {mode === "refine" && (
            <>
              <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>Sections</div>
              {NARRATIVE_SECTIONS.map((s, i) => (
                <a key={s.id} href={`#ns-${s.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, textDecoration: "none", color: narratives[s.id]?.trim() ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)", fontSize: 12 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: narratives[s.id]?.trim() ? "var(--green)" : "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, color: "#fff", fontWeight: 700 }}>
                    {narratives[s.id]?.trim() ? "✓" : i + 1}
                  </div>
                  {s.label}
                </a>
              ))}
            </>
          )}

          <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>
            ← Back to Dashboard
          </a>
        </div>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>Sign Out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application Dashboard
          </a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 1 of 6</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Corporate Experience</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              {mode === "gather"
                ? "Upload your company documents and answer the guided questions. GovCert drafts all 8 required narrative sections from your inputs."
                : "Review and refine your AI-drafted narratives. All sections are editable — adjust tone, add specifics, or redraft any section."}
            </p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* ── GSA INSTRUCTIONS (collapsible) ── */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", marginBottom: 24, overflow: "hidden" }}>
            <button
              onClick={() => setInstructionsOpen(!instructionsOpen)}
              style={{ width: "100%", padding: "16px 22px", background: "transparent", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold2)", textTransform: "uppercase", letterSpacing: ".08em" }}>GSA Requirements & Instructions</span>
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,.4)", transition: "transform .2s", display: "inline-block", transform: instructionsOpen ? "rotate(180deg)" : "none" }}>▼</span>
            </button>
            {instructionsOpen && (
              <div style={{ padding: "0 22px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {INSTRUCTIONS.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", lineHeight: 1.6 }}>{item.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ GATHER MODE ══ */}
          {mode === "gather" && (
            <div>
              {/* Multi-file upload */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Step 1 — Upload Documents</div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Upload Any Company Documents</h3>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>
                  Upload as many files as you have — capability statements, past proposals, company overviews, org charts, award letters, past performance write-ups, LinkedIn exports, Word docs, PDFs, CSVs, spreadsheets. GovCert reads all of them. The more you upload, the better the AI drafts.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv,.pptx,.ppt"
                  style={{ display: "none" }}
                  onChange={e => { if (e.target.files) handleFileUpload(Array.from(e.target.files)); }}
                />

                {uploadedFiles.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "40px 24px", textAlign: "center" as const, cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Click to upload company documents</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)", lineHeight: 1.6 }}>
                      PDF · Word (.docx) · Excel · CSV · PowerPoint · Plain text<br />
                      Select multiple files at once · Up to 10MB each
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                      {uploadedFiles.map((file, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: uploadedTexts[i] ? "var(--green-bg)" : "var(--amber-bg)", border: `1px solid ${uploadedTexts[i] ? "var(--green-b)" : "var(--amber-b)"}`, borderRadius: "var(--r)" }}>
                          <span style={{ fontSize: 16 }}>📄</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: uploadedTexts[i] ? "var(--green)" : "var(--amber)" }}>{file.name}</div>
                            <div style={{ fontSize: 11, color: "var(--ink3)" }}>
                              {uploading && !uploadedTexts[i] ? "Processing..." : uploadedTexts[i] ? `${uploadedTexts[i].text.length.toLocaleString()} characters extracted` : "Pending"}
                            </div>
                          </div>
                          <button onClick={() => removeFile(i)} style={{ padding: "3px 8px", background: "transparent", border: `1px solid ${uploadedTexts[i] ? "var(--green-b)" : "var(--amber-b)"}`, borderRadius: "var(--r)", color: uploadedTexts[i] ? "var(--green)" : "var(--amber)", fontSize: 11, cursor: "pointer" }}>Remove</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => fileInputRef.current?.click()} style={{ padding: "8px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>
                        + Add More Files
                      </button>
                      {uploadedTexts.length > 0 && (
                        <button onClick={prefillFromDocuments} disabled={generatingFromGuided} style={{ padding: "8px 20px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: generatingFromGuided ? "not-allowed" : "pointer", opacity: generatingFromGuided ? 0.7 : 1 }}>
                          {generatingFromGuided ? "✦ Reading documents..." : "✦ Pre-fill questions from documents →"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Guided questions */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Step 2 — Answer Guided Questions</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Tell Us About Your Company</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 24, lineHeight: 1.6 }}>
                  Answer as many questions as you can. If you uploaded documents above and clicked "Pre-fill", some may already be filled in. You can type, speak, or leave any field blank — GovCert will do its best with what it has.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {GUIDED_QUESTIONS.map(q => (
                    <div key={q.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{q.label}</label>
                          <div style={{ fontSize: 12, color: "var(--ink3)", fontStyle: "italic" }}>{q.question}</div>
                        </div>
                        <button
                          onClick={() => listening === q.id ? stopVoice() : startVoice(q.id, true)}
                          style={{ padding: "5px 10px", background: listening === q.id ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening === q.id ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 11, cursor: "pointer", color: listening === q.id ? "var(--red)" : "var(--ink3)", flexShrink: 0, marginLeft: 12 }}>
                          {listening === q.id ? "⏹ Stop" : "🎤"}
                        </button>
                      </div>
                      <textarea
                        value={guidedAnswers[q.id] || ""}
                        onChange={e => setGuidedAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder={q.placeholder}
                        style={{ width: "100%", minHeight: q.type === "long" ? 120 : q.type === "medium" ? 90 : 64, padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const, color: guidedAnswers[q.id] ? "var(--ink)" : undefined }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "28px 32px", textAlign: "center" as const }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 8 }}>Step 3 — Generate</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", fontWeight: 400, marginBottom: 8 }}>Draft All 8 Narrative Sections</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 24px" }}>
                  GovCert will use your uploaded documents and guided question answers to write all 8 Corporate Experience sections. You review and edit everything after.
                </p>
                <button
                  onClick={generateAllSections}
                  disabled={generatingAll || (totalGuidedFilled === 0 && uploadedTexts.length === 0)}
                  style={{ padding: "14px 40px", background: generatingAll ? "rgba(200,155,60,.5)" : "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 16, fontWeight: 500, cursor: generatingAll ? "not-allowed" : "pointer", boxShadow: "0 4px 24px rgba(200,155,60,.4)", transition: "all .2s" }}>
                  {generatingAll ? "✦ Drafting all sections... (~30 seconds)" : "✦ Generate All 8 Sections →"}
                </button>
                {totalGuidedFilled === 0 && uploadedTexts.length === 0 && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 12 }}>Upload a document or answer at least one question to get started</p>
                )}
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => setMode("refine")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.35)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                    Skip and write manually instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ REFINE MODE ══ */}
          {mode === "refine" && (
            <div>
              {/* Sticky action bar */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "14px 20px", marginBottom: 24, boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: totalNarrativeChars > 10000 ? "var(--red)" : totalNarrativeChars > 8000 ? "var(--amber)" : "var(--navy)", fontWeight: 600 }}>{totalNarrativeChars.toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: "var(--ink3)" }}> / 10,000 chars total</span>
                  </div>
                  <div style={{ height: 6, width: 120, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, totalNarrativeChars / 10000 * 100)}%`, background: totalNarrativeChars > 10000 ? "var(--red)" : totalNarrativeChars > 8000 ? "var(--gold)" : "var(--green)", borderRadius: 100 }} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink4)" }}>{totalNarrativeFilled}/{NARRATIVE_SECTIONS.length} sections</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                  <button onClick={() => setMode("gather")} style={{ padding: "8px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>
                    ← Back to Gather
                  </button>
                  <button onClick={saveAll} disabled={saving} style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save Progress"}
                  </button>
                </div>
              </div>

              {/* Narrative section cards */}
              {NARRATIVE_SECTIONS.map((section, i) => (
                <div key={section.id} id={`ns-${section.id}`} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ width: 26, height: 26, borderRadius: "50%", background: narratives[section.id]?.trim() ? "var(--green)" : "var(--cream2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: narratives[section.id]?.trim() ? "#fff" : "var(--ink4)", fontWeight: 700, flexShrink: 0 }}>
                          {narratives[section.id]?.trim() ? "✓" : i + 1}
                        </span>
                        <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)" }}>{section.label}</h3>
                        <span style={{ fontSize: 11, color: "var(--ink4)", padding: "2px 8px", background: "var(--cream)", borderRadius: 100 }}>Max {section.maxChars.toLocaleString()} chars</span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--ink4)", fontStyle: "italic", paddingLeft: 36 }}>{section.hint}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                      <button
                        onClick={() => listening === section.id ? stopVoice() : startVoice(section.id, false)}
                        style={{ padding: "7px 12px", background: listening === section.id ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening === section.id ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: listening === section.id ? "var(--red)" : "var(--ink3)" }}>
                        {listening === section.id ? "⏹ Stop" : "🎤 Speak"}
                      </button>
                      <button
                        onClick={() => regenerateSection(section.id)}
                        disabled={generating === section.id}
                        style={{ padding: "7px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500, cursor: generating === section.id ? "not-allowed" : "pointer", opacity: generating === section.id ? 0.7 : 1 }}>
                        {generating === section.id ? "✦ Drafting..." : "✦ Redraft"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={narratives[section.id] || ""}
                    onChange={e => setNarratives(prev => ({ ...prev, [section.id]: e.target.value }))}
                    placeholder={`Write or dictate the ${section.label} section, or click Redraft to have AI draft it...`}
                    style={{ width: "100%", minHeight: 140, padding: "12px 14px", border: `1px solid ${(narratives[section.id]?.length || 0) > section.maxChars ? "var(--red)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: (narratives[section.id]?.length || 0) > section.maxChars ? "var(--red)" : "var(--ink4)", fontFamily: "'DM Mono', monospace" }}>
                      {(narratives[section.id]?.length || 0).toLocaleString()} / {section.maxChars.toLocaleString()}
                      {(narratives[section.id]?.length || 0) > section.maxChars && " ⚠ Over limit"}
                    </span>
                  </div>
                </div>
              ))}

              {/* Bottom nav */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
                <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>← Back to Dashboard</a>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                  <button onClick={saveAll} disabled={saving} style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
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