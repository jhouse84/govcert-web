"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const PROMPTS = [
  { id: "overview", label: "Company Overview", question: "Describe your company — what you do, when you were founded, and what makes you unique.", hint: "Include your core services, years in business, and primary markets served.", maxChars: 1500 },
  { id: "capabilities", label: "Core Capabilities & Services", question: "What specific products or services will you offer under your GSA Schedule?", hint: "Be specific about what you plan to sell to federal agencies. Align with your selected SINs.", maxChars: 1500 },
  { id: "employees", label: "Employee Experience & Qualifications", question: "Describe your employees — how many, their relevant experience, certifications, and expertise.", hint: "Include key personnel, their backgrounds, relevant certifications (PMP, CISSP, etc.), and how their experience supports your GSA offering.", maxChars: 1500 },
  { id: "org_controls", label: "Organizational & Accounting Controls", question: "Describe your organizational structure and accounting controls.", hint: "Include your management structure, accounting system (QuickBooks, etc.), internal controls, and how you track project costs.", maxChars: 1000 },
  { id: "resources", label: "Resources & Capacity", question: "What resources do you have available to meet federal ordering needs?", hint: "Include office locations, equipment, technology infrastructure, and your ability to scale to meet demand.", maxChars: 800 },
  { id: "past_projects", label: "Summary of Past Projects", question: "Briefly describe 2-3 of your most relevant past projects, especially any government work.", hint: "For each project: client name, scope of work, outcomes achieved, and relevance to your GSA offering.", maxChars: 1500 },
  { id: "marketing", label: "Federal Marketing Plan", question: "How do you plan to market your GSA Schedule contract to federal agencies?", hint: "Include targeted agencies, marketing channels (GSA Advantage, SAM.gov, direct outreach), and your plan to generate sales.", maxChars: 800 },
  { id: "subcontractors", label: "Subcontractor Management", question: "Will you use subcontractors? If so, how will you manage and oversee them?", hint: "Describe your subcontractor vetting process, oversight procedures, and how you ensure quality from subs. If no subs, state that clearly.", maxChars: 400 },
];

export default function CorporateExperiencePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedProposal, setPastedProposal] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [listening, setListening] = useState<string | null>(null);
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
      const data = await apiRequest(`/api/certifications/${params.id}`);
      setCert(data);
      if (data.application?.narrativeCorp) {
        try {
          const parsed = JSON.parse(data.application.narrativeCorp);
          setAnswers(parsed);
        } catch {
          setAnswers({ overview: data.application.narrativeCorp });
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const totalChars = Object.values(answers).join("").length;
  const charLimit = 10000;

  async function saveAnswers() {
    if (!cert) return;
    setSaving(true);
    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: params.id,
          clientId: cert.clientId,
          certType: cert.type,
          currentStep: cert.application?.currentStep || 1,
          narrativeCorp: JSON.stringify(answers),
        })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function generateWithAI(promptId: string) {
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
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n\n")
          }
        })
      });
      setAnswers(prev => ({ ...prev, [promptId]: data.text }));
    } catch (err) { console.error(err); }
    finally { setGenerating(null); }
  }

  async function extractFromProposal() {
    if (!pastedProposal.trim()) return;
    setExtracting(true);
    try {
      const data = await apiRequest("/api/applications/ai/extract", {
        method: "POST",
        body: JSON.stringify({
          proposalText: pastedProposal,
          businessName: cert?.client?.businessName
        })
      });
      setAnswers(prev => ({ ...prev, ...data.extracted }));
      setPasteMode(false);
      setPastedProposal("");
    } catch (err) { console.error(err); }
    finally { setExtracting(false); }
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

  function stopVoice() {
    recognitionRef.current?.stop();
    setListening(null);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (loading) return <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
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
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>Sections</div>
          {PROMPTS.map((p, i) => (
            <a key={p.id} href={`#${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, textDecoration: "none", color: answers[p.id]?.trim() ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)", fontSize: 12 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: answers[p.id]?.trim() ? "var(--green)" : "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, color: "#fff" }}>
                {answers[p.id]?.trim() ? "✓" : i + 1}
              </div>
              {p.label}
            </a>
          ))}
        </div>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>Sign Out</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${params.id}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 1 of 6</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Corporate Experience</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, marginBottom: 20 }}>Tell GSA about your company. This narrative is entered directly into eOffer and has a 10,000 character limit.</p>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 24, boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 20, color: totalChars > charLimit ? "var(--red)" : totalChars > charLimit * 0.8 ? "var(--amber)" : "var(--green)", fontWeight: 600 }}>{totalChars.toLocaleString()}</span>
                <span style={{ fontSize: 14, color: "var(--ink3)" }}> / {charLimit.toLocaleString()} characters</span>
              </div>
              <div style={{ height: 6, width: 200, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, totalChars / charLimit * 100)}%`, background: totalChars > charLimit ? "var(--red)" : totalChars > charLimit * 0.8 ? "var(--gold)" : "var(--green)", borderRadius: 100 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>Saved</span>}
              <button onClick={() => setPasteMode(!pasteMode)} style={{ padding: "8px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink)" }}>Paste Proposal</button>
              <button onClick={saveAnswers} disabled={saving} style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                {saving ? "Saving..." : "Save Progress"}
              </button>
            </div>
          </div>

          {pasteMode && (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Import</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Paste an Existing Proposal</h3>
              <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>
                Paste any previous proposal, capability statement, or company description. GovCert will extract and reformat the relevant content into each section automatically.
              </p>
              <textarea value={pastedProposal} onChange={e => setPastedProposal(e.target.value)} placeholder="Paste your existing proposal here..." style={{ width: "100%", minHeight: 200, padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const, marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={extractFromProposal} disabled={extracting || !pastedProposal.trim()} style={{ padding: "10px 24px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  {extracting ? "Extracting with AI..." : "Extract & Fill Sections"}
                </button>
                <button onClick={() => setPasteMode(false)} style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

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
                  <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 4 }}>{prompt.question}</p>
                  <p style={{ fontSize: 12, color: "var(--ink4)", fontStyle: "italic" }}>{prompt.hint}</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                  <button onClick={() => listening === prompt.id ? stopVoice() : startVoice(prompt.id)} style={{ padding: "7px 12px", background: listening === prompt.id ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening === prompt.id ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: listening === prompt.id ? "var(--red)" : "var(--ink3)" }}>
                    {listening === prompt.id ? "Stop" : "Speak"}
                  </button>
                  <button onClick={() => generateWithAI(prompt.id)} disabled={generating === prompt.id} style={{ padding: "7px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                    {generating === prompt.id ? "Generating..." : "AI Draft"}
                  </button>
                </div>
              </div>
              <textarea value={answers[prompt.id] || ""} onChange={e => setAnswers(prev => ({ ...prev, [prompt.id]: e.target.value }))} placeholder="Write your response here, or use AI Draft or Voice input above..." style={{ width: "100%", minHeight: 120, padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }} />
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
      </div>
    </div>
  );
}