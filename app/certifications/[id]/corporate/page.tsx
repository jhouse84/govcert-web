"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const PROMPTS = [
  { id: "overview", label: "Company Overview", question: "Describe your company — what you do, when you were founded, and what makes you unique.", hint: "Include your core services, years in business, and primary markets served.", maxChars: 1500 },
  { id: "capabilities", label: "Core Capabilities & Services", question: "What specific products or services will you offer under your GSA Schedule?", hint: "Be specific about what you plan to sell to federal agencies. Align with your selected SINs.", maxChars: 1500 },
  { id: "employees", label: "Employee Experience & Qualifications", question: "Describe your employees — how many, their relevant experience, certifications, and expertise.", hint: "Include key personnel, relevant certifications (PMP, CISSP, etc.), and how their experience supports your GSA offering.", maxChars: 1500 },
  { id: "org_controls", label: "Organizational & Accounting Controls", question: "Describe your organizational structure and accounting controls.", hint: "Include your management structure, accounting system, internal controls, and how you track project costs.", maxChars: 1000 },
  { id: "resources", label: "Resources & Capacity", question: "What resources do you have available to meet federal ordering needs?", hint: "Include office locations, equipment, technology infrastructure, and ability to scale.", maxChars: 800 },
  { id: "past_projects", label: "Summary of Past Projects", question: "Briefly describe 2-3 of your most relevant past projects, especially any government work.", hint: "For each: client name, scope, outcomes, and relevance to your GSA offering.", maxChars: 1500 },
  { id: "marketing", label: "Federal Marketing Plan", question: "How do you plan to market your GSA Schedule contract to federal agencies?", hint: "Include targeted agencies, marketing channels (GSA Advantage, SAM.gov, direct outreach), and sales plan.", maxChars: 800 },
  { id: "subcontractors", label: "Subcontractor Management", question: "Will you use subcontractors? If so, how will you manage and oversee them?", hint: "Describe vetting process, oversight procedures, and quality assurance. If no subs, state that clearly.", maxChars: 400 },
];

export default function CorporateExperiencePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [listening, setListening] = useState<string | null>(null);
  const [mode, setMode] = useState<"gather" | "refine">("gather");
  const [userDescription, setUserDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedText, setUploadedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${params.id}`);
      setCert(data);
      if (data.application?.narrativeCorp) {
        try {
          const parsed = JSON.parse(data.application.narrativeCorp);
          setAnswers(parsed);
          setMode("refine");
        } catch {
          setAnswers({ overview: data.application.narrativeCorp });
          setMode("refine");
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadedFile(file);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/extract-text`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.text) setUploadedText(data.text);
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  }

  async function generateAll() {
    setGeneratingAll(true);
    try {
      const data = await apiRequest("/api/applications/ai/generate-all", {
        method: "POST",
        body: JSON.stringify({
          businessName: cert?.client?.businessName,
          entityType: cert?.client?.entityType,
          employeeCount: cert?.application?.employeeCount,
          naicsCode: cert?.application?.naicsCode,
          yearsInBusiness: cert?.application?.yearsInBusiness,
          annualRevenue: cert?.application?.annualRevenue,
          userDescription,
          extractedText: uploadedText,
        })
      });
      setAnswers(data.sections);
      setMode("refine");
      await saveAnswersData(data.sections);
    } catch (err) { console.error(err); }
    finally { setGeneratingAll(false); }
  }

  async function saveAnswersData(data: Record<string, string>) {
    if (!cert) return;
    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: params.id,
          clientId: cert.clientId,
          certType: cert.type,
          currentStep: cert.application?.currentStep || 1,
          narrativeCorp: JSON.stringify(data),
        })
      });
    } catch (err) { console.error(err); }
  }

  async function saveAnswers() {
    setSaving(true);
    try {
      await saveAnswersData(answers);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function regenerateSection(promptId: string) {
    setGenerating(promptId);
    try {
      const prompt = PROMPTS.find(p => p.id === promptId);
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: prompt?.label,
          prompt: prompt?.question,
          context: {
            businessName: cert?.client?.businessName,
            entityType: cert?.client?.entityType,
            employeeCount: cert?.application?.employeeCount,
            naicsCode: cert?.application?.naicsCode,
            yearsInBusiness: cert?.application?.yearsInBusiness,
            annualRevenue: cert?.application?.annualRevenue,
            otherSections: Object.entries(answers)
              .filter(([k]) => k !== promptId && answers[k])
              .map(([k, v]) => `${k}: ${v}`).join("\n\n")
          }
        })
      });
      setAnswers(prev => ({ ...prev, [promptId]: data.text }));
    } catch (err) { console.error(err); }
    finally { setGenerating(null); }
  }

  function startVoice(promptId: string) {
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
    setListening(promptId);
    let final = answers[promptId] || "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += " " + event.results[i][0].transcript;
        else interim = event.results[i][0].transcript;
      }
      setAnswers(prev => ({ ...prev, [promptId]: (final + " " + interim).trim() }));
    };
    recognition.onend = () => setListening(null);
    recognition.start();
  }

  function stopVoice() { recognitionRef.current?.stop(); setListening(null); }

  function startDescriptionVoice() {
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
    setListening("description");
    let final = userDescription;
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += " " + event.results[i][0].transcript;
        else interim = event.results[i][0].transcript;
      }
      setUserDescription((final + " " + interim).trim());
    };
    recognition.onend = () => setListening(null);
    recognition.start();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const totalChars = Object.values(answers).join("").length;
  const charLimit = 10000;

  if (loading) return <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;

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
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>
            {mode === "gather" ? "Getting Started" : "Sections"}
          </div>
          {mode === "refine" && PROMPTS.map((p, i) => (
            <a key={p.id} href={`#${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, textDecoration: "none", color: answers[p.id]?.trim() ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)", fontSize: 12 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: answers[p.id]?.trim() ? "var(--green)" : "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, color: "#fff" }}>
                {answers[p.id]?.trim() ? "✓" : i + 1}
              </div>
              {p.label}
            </a>
          ))}
          {mode === "gather" && (
            <div style={{ padding: "8px 9px", fontSize: 12, color: "rgba(255,255,255,.35)", lineHeight: 1.6 }}>
              Provide information about your company and we will draft all 8 sections automatically.
            </div>
          )}
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
          <a href={`/certifications/${params.id}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            Back to Application Dashboard
          </a>

          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 1 of 6</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Corporate Experience</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>
              {mode === "gather"
                ? "Tell us about your company in any of the ways below. GovCert will draft all 8 required sections automatically."
                : "Review and refine your AI-generated narrative. Each section is editable — adjust as needed."}
            </p>
          </div>

          {/* GATHER MODE */}
          {mode === "gather" && (
            <div>
              {/* Upload */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Option 1</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Upload a Document</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>
                  Upload a capability statement, past proposal, company overview, or any document describing your business. GovCert extracts the relevant content automatically.
                </p>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                {!uploadedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "32px", textAlign: "center", cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Click to upload or drag and drop</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>PDF, Word (.docx), or plain text — up to 10MB</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)" }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--green)" }}>{uploadedFile.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink3)" }}>{uploading ? "Extracting text..." : `${uploadedText.length.toLocaleString()} characters extracted`}</div>
                    </div>
                    <button onClick={() => { setUploadedFile(null); setUploadedText(""); }} style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--green-b)", borderRadius: "var(--r)", color: "var(--green)", fontSize: 12, cursor: "pointer" }}>Remove</button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Option 2</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Describe Your Company</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>
                  Type or speak a few sentences about what your company does, who your clients are, and what makes you good at what you do. Even 2-3 sentences helps significantly.
                </p>
                <div style={{ position: "relative" }}>
                  <textarea
                    value={userDescription}
                    onChange={e => setUserDescription(e.target.value)}
                    placeholder="Example: We are a 12-person IT consulting firm based in Washington DC, specializing in cybersecurity and cloud migration for federal agencies. We have worked with the Department of Defense and several civilian agencies over the past 5 years..."
                    style={{ width: "100%", minHeight: 120, padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    onClick={() => listening === "description" ? stopVoice() : startDescriptionVoice()}
                    style={{ padding: "7px 16px", background: listening === "description" ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening === "description" ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: listening === "description" ? "var(--red)" : "var(--ink3)", display: "flex", alignItems: "center", gap: 6 }}>
                    {listening === "description" ? "⏹ Stop Recording" : "🎤 Speak Instead"}
                  </button>
                </div>
              </div>

              {/* Generate button */}
              <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "28px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 8 }}>Ready to Draft</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", fontWeight: 400, marginBottom: 8 }}>Generate All 8 Sections</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24, lineHeight: 1.6, maxWidth: 500, margin: "0 auto 24px" }}>
                  GovCert will use your uploaded document, description, and company profile to draft all 8 Corporate Experience sections. You can edit everything after.
                </p>
                <button
                  onClick={generateAll}
                  disabled={generatingAll || (!userDescription.trim() && !uploadedText.trim())}
                  style={{ padding: "14px 40px", background: generatingAll ? "rgba(200,155,60,.5)" : "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 16, fontWeight: 500, cursor: generatingAll ? "not-allowed" : "pointer", boxShadow: "0 4px 24px rgba(200,155,60,.4)", transition: "all .2s" }}>
                  {generatingAll ? "✦ Drafting all sections... (~30 seconds)" : "✦ Generate All Sections →"}
                </button>
                {!userDescription.trim() && !uploadedText.trim() && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 12 }}>Add a document or description above to get started</p>
                )}
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => setMode("refine")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.35)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                    Skip and write manually instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REFINE MODE */}
          {mode === "refine" && (
            <div>
              {/* Character counter */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 24, boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 20, color: totalChars > charLimit ? "var(--red)" : totalChars > charLimit * 0.8 ? "var(--amber)" : "var(--navy)", fontWeight: 600 }}>{totalChars.toLocaleString()}</span>
                    <span style={{ fontSize: 14, color: "var(--ink3)" }}> / {charLimit.toLocaleString()} chars</span>
                  </div>
                  <div style={{ height: 6, width: 160, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, totalChars / charLimit * 100)}%`, background: totalChars > charLimit ? "var(--red)" : totalChars > charLimit * 0.8 ? "var(--gold)" : "var(--green)", borderRadius: 100 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                  <button onClick={() => setMode("gather")} style={{ padding: "8px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>
                    Regenerate All
                  </button>
                  <button onClick={saveAnswers} disabled={saving} style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save Progress"}
                  </button>
                </div>
              </div>

              {PROMPTS.map((prompt, i) => (
                <div key={prompt.id} id={prompt.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ width: 24, height: 24, borderRadius: "50%", background: answers[prompt.id]?.trim() ? "var(--green)" : "var(--cream2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: answers[prompt.id]?.trim() ? "#fff" : "var(--ink4)", fontWeight: 600, flexShrink: 0 }}>
                          {answers[prompt.id]?.trim() ? "✓" : i + 1}
                        </span>
                        <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)" }}>{prompt.label}</h3>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--ink4)", fontStyle: "italic" }}>{prompt.hint}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                      <button onClick={() => listening === prompt.id ? stopVoice() : startVoice(prompt.id)} style={{ padding: "7px 12px", background: listening === prompt.id ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening === prompt.id ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: listening === prompt.id ? "var(--red)" : "var(--ink3)" }}>
                        {listening === prompt.id ? "Stop" : "🎤 Speak"}
                      </button>
                      <button onClick={() => regenerateSection(prompt.id)} disabled={generating === prompt.id} style={{ padding: "7px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                        {generating === prompt.id ? "Drafting..." : "✦ Redraft"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={answers[prompt.id] || ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [prompt.id]: e.target.value }))}
                    placeholder="Write your response here, or use Redraft or Speak above..."
                    style={{ width: "100%", minHeight: 140, padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: (answers[prompt.id]?.length || 0) > prompt.maxChars ? "var(--red)" : "var(--ink4)", fontFamily: "monospace" }}>
                      {(answers[prompt.id]?.length || 0).toLocaleString()} / {prompt.maxChars.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20 }}>
                <a href={`/certifications/${params.id}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>Back to Dashboard</a>
                <button onClick={saveAnswers} disabled={saving} style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                  {saving ? "Saving..." : "Save & Continue"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}