"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const PROMPTS = [
  { id: "overview", label: "Quality Control Overview", question: "Describe your overall approach to quality control and why it matters to your clients.", hint: "Explain your QC philosophy, how long it has been in place, and the overall framework you use.", maxChars: 2000 },
  { id: "supervision", label: "Direct Supervision of Projects", question: "How do you directly supervise projects to ensure quality deliverables?", hint: "Describe your project oversight process — who reviews work, how often, what checkpoints exist, and how you catch issues early.", maxChars: 2000 },
  { id: "personnel", label: "Quality Control Personnel", question: "Who is responsible for quality control at your company, and what are their qualifications?", hint: "Name the QC lead or role, their relevant certifications, years of experience, and specific responsibilities.", maxChars: 1500 },
  { id: "subcontractors", label: "Subcontractor Quality Management", question: "How do you ensure subcontractors meet your quality standards?", hint: "Describe your subcontractor vetting process, performance monitoring, and corrective actions. If no subs, state that.", maxChars: 1500 },
  { id: "corrective", label: "Problem Areas & Corrective Action", question: "How do you identify potential problems and implement corrective actions?", hint: "Describe your process for catching issues before they escalate, documenting problems, and corrective action procedures.", maxChars: 1500 },
  { id: "urgent", label: "Urgent Requirements & Simultaneous Projects", question: "How do you maintain quality when handling urgent requirements or multiple simultaneous projects?", hint: "Describe your capacity management, surge staffing approach, and how quality is maintained under pressure.", maxChars: 1000 },
];

const QC_ATTRIBUTES = [
  {
    category: "Certifications & Standards",
    items: [
      { id: "iso9001", label: "ISO 9001 Certified", desc: "Quality Management System certification" },
      { id: "iso27001", label: "ISO 27001 Certified", desc: "Information Security Management" },
      { id: "cmmi3", label: "CMMI Level 3", desc: "Capability Maturity Model Integration" },
      { id: "cmmi5", label: "CMMI Level 5", desc: "Optimizing level process maturity" },
      { id: "six_sigma", label: "Six Sigma (Black/Green Belt)", desc: "Data-driven quality methodology" },
      { id: "as9100", label: "AS9100 Certified", desc: "Aerospace quality management" },
      { id: "fedramp", label: "FedRAMP Authorized", desc: "Federal cloud security authorization" },
      { id: "sox", label: "SOX Compliant", desc: "Sarbanes-Oxley financial controls" },
    ]
  },
  {
    category: "Project Management & Oversight",
    items: [
      { id: "pmp", label: "PMP-Certified Project Managers", desc: "Project Management Professional certification" },
      { id: "agile", label: "Agile / Scrum Methodology", desc: "Iterative project management approach" },
      { id: "pmbok", label: "PMBOK Framework", desc: "PMI's project management body of knowledge" },
      { id: "weekly_review", label: "Weekly Quality Reviews", desc: "Formal scheduled QC review meetings" },
      { id: "peer_review", label: "Peer Review Process", desc: "All deliverables reviewed before submission" },
      { id: "independent_qa", label: "Independent QA Team", desc: "Separate team dedicated to quality assurance" },
      { id: "milestone_gates", label: "Milestone Quality Gates", desc: "Formal approval checkpoints at project milestones" },
    ]
  },
  {
    category: "Tools & Technology",
    items: [
      { id: "jira", label: "Jira / Azure DevOps", desc: "Issue tracking and project management tools" },
      { id: "sharepoint", label: "SharePoint / Confluence", desc: "Document management and collaboration" },
      { id: "automated_testing", label: "Automated Testing", desc: "Automated QA and regression testing tools" },
      { id: "version_control", label: "Version Control (Git)", desc: "Code and document version management" },
      { id: "dashboards", label: "Real-Time KPI Dashboards", desc: "Live performance monitoring dashboards" },
    ]
  },
  {
    category: "Compliance & Documentation",
    items: [
      { id: "far_compliant", label: "FAR/DFARS Compliant Processes", desc: "Federal Acquisition Regulation compliance" },
      { id: "section508", label: "Section 508 Compliance", desc: "Accessibility standards for federal deliverables" },
      { id: "nist", label: "NIST Framework", desc: "National Institute of Standards and Technology" },
      { id: "documented_procedures", label: "Documented SOPs", desc: "Written Standard Operating Procedures for all key processes" },
      { id: "lessons_learned", label: "Lessons Learned Database", desc: "Formal capture and reuse of project lessons" },
      { id: "after_action", label: "After Action Reviews", desc: "Post-project reviews to improve future performance" },
    ]
  },
];

export default function QCPPage({ params }: { params: { id: string } }) {
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
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
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
      if (data.application?.narrativeQCP) {
        try {
          const parsed = JSON.parse(data.application.narrativeQCP);
          if (parsed.answers) {
            setAnswers(parsed.answers);
            setSelectedAttributes(parsed.attributes || []);
          } else {
            setAnswers(parsed);
          }
          setMode("refine");
        } catch {
          setAnswers({ overview: data.application.narrativeQCP });
          setMode("refine");
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const totalChars = Object.values(answers).join("").length;
  const charLimit = 10000;

  function toggleAttribute(id: string) {
    setSelectedAttributes(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }

  async function saveAnswersData(data: Record<string, string>) {
    if (!cert) return;
    await apiRequest("/api/applications", {
      method: "POST",
      body: JSON.stringify({
        certificationId: params.id,
        clientId: cert.clientId,
        certType: cert.type,
        currentStep: cert.application?.currentStep || 1,
        narrativeQCP: JSON.stringify({ answers: data, attributes: selectedAttributes }),
      })
    });
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

  function getSelectedLabels() {
    return QC_ATTRIBUTES.flatMap(cat =>
      cat.items.filter(item => selectedAttributes.includes(item.id))
        .map(item => `${item.label} (${item.desc})`)
    );
  }

  async function generateAll() {
    setGeneratingAll(true);
    try {
      const response = await apiRequest("/api/applications/ai/generate-qcp", {
        method: "POST",
        body: JSON.stringify({
          businessName: cert?.client?.businessName,
          entityType: cert?.client?.entityType,
          employeeCount: cert?.application?.employeeCount,
          naicsCode: cert?.application?.naicsCode,
          yearsInBusiness: cert?.application?.yearsInBusiness,
          userDescription,
          selectedAttributes: getSelectedLabels(),
          corporateExperience: cert?.application?.narrativeCorp,
        })
      });
      setAnswers(response.sections);
      setMode("refine");
      await saveAnswersData(response.sections);
    } catch (err) { console.error(err); }
    finally { setGeneratingAll(false); }
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
      alert("Voice input requires Chrome browser."); return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    setListening(promptId);
    let final = promptId === "description" ? userDescription : (answers[promptId] || "");
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += " " + event.results[i][0].transcript;
        else interim = event.results[i][0].transcript;
      }
      if (promptId === "description") setUserDescription((final + " " + interim).trim());
      else setAnswers(prev => ({ ...prev, [promptId]: (final + " " + interim).trim() }));
    };
    recognition.onend = () => setListening(null);
    recognition.start();
  }

  function stopVoice() { recognitionRef.current?.stop(); setListening(null); }

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
          {selectedAttributes.length > 0 && (
            <div style={{ margin: "12px 9px 0", padding: "8px 10px", background: "rgba(200,155,60,.12)", borderRadius: "var(--r)", border: "1px solid rgba(200,155,60,.2)" }}>
              <div style={{ fontSize: 10, color: "var(--gold2)", fontWeight: 600, marginBottom: 4 }}>{selectedAttributes.length} QC ATTRIBUTES</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.4)", lineHeight: 1.5 }}>
                {getSelectedLabels().slice(0, 3).map(l => l.split(" (")[0]).join(", ")}
                {selectedAttributes.length > 3 ? ` +${selectedAttributes.length - 3} more` : ""}
              </div>
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

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${params.id}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>Back to Application Dashboard</a>

          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 2 of 6</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Quality Control Plan</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>
              {mode === "gather"
                ? "Select your QC attributes and describe your approach. GovCert will draft all 6 sections automatically."
                : "Review and refine your Quality Control Plan. Each section is fully editable."}
            </p>
          </div>

          {mode === "gather" && (
            <div>
              {/* QC Attributes Checklist */}
              {QC_ATTRIBUTES.map(category => (
                <div key={category.category} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 16, boxShadow: "var(--shadow)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>{category.category}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                    {category.items.map(item => (
                      <div key={item.id} onClick={() => toggleAttribute(item.id)}
                        style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", border: `1px solid ${selectedAttributes.includes(item.id) ? "var(--gold)" : "var(--border)"}`, borderRadius: "var(--r)", cursor: "pointer", background: selectedAttributes.includes(item.id) ? "rgba(200,155,60,.06)" : "#fff", transition: "all .12s" }}>
                        <div style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${selectedAttributes.includes(item.id) ? "var(--gold)" : "var(--border2)"}`, background: selectedAttributes.includes(item.id) ? "var(--gold)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          {selectedAttributes.includes(item.id) && <span style={{ fontSize: 9, color: "#fff", fontWeight: 800 }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: "var(--ink4)" }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Additional Description */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Optional</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Additional QC Details</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>
                  Describe any specific QC processes, tools, or approaches not covered above. Even a sentence or two helps the AI produce a more specific narrative.
                </p>
                <textarea
                  value={userDescription}
                  onChange={e => setUserDescription(e.target.value)}
                  placeholder="Example: Our QC lead has 15 years of federal contracting experience. We conduct bi-weekly internal audits and use a lessons-learned database from 50+ completed projects..."
                  style={{ width: "100%", minHeight: 100, padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button onClick={() => listening === "description" ? stopVoice() : startVoice("description")}
                    style={{ padding: "7px 16px", background: listening === "description" ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening === "description" ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: listening === "description" ? "var(--red)" : "var(--ink3)" }}>
                    {listening === "description" ? "Stop Recording" : "🎤 Speak Instead"}
                  </button>
                </div>
              </div>

              {/* Generate */}
              <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "28px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 8 }}>
                  {selectedAttributes.length > 0 ? `${selectedAttributes.length} attributes selected` : "Ready to Draft"}
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", fontWeight: 400, marginBottom: 8 }}>Generate Quality Control Plan</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24, maxWidth: 520, margin: "0 auto 24px", lineHeight: 1.6 }}>
                  {selectedAttributes.length > 0
                    ? `GovCert will incorporate your ${selectedAttributes.length} selected QC attributes into a tailored, GSA-compliant Quality Control Plan.`
                    : "Select QC attributes above, or generate a general QCP based on your company profile."}
                </p>
                <button onClick={generateAll} disabled={generatingAll}
                  style={{ padding: "14px 40px", background: generatingAll ? "rgba(200,155,60,.5)" : "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 16, fontWeight: 500, cursor: generatingAll ? "not-allowed" : "pointer", boxShadow: "0 4px 24px rgba(200,155,60,.4)" }}>
                  {generatingAll ? "✦ Drafting QCP... (~30 seconds)" : "✦ Generate Quality Control Plan →"}
                </button>
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => setMode("refine")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.35)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                    Skip and write manually
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "refine" && (
            <div>
              {/* Selected attributes summary */}
              {selectedAttributes.length > 0 && (
                <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--rl)", padding: "14px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--amber)", marginBottom: 4 }}>QC Attributes Incorporated</div>
                    <div style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.6 }}>
                      {getSelectedLabels().map(l => l.split(" (")[0]).join(" · ")}
                    </div>
                  </div>
                  <button onClick={() => setMode("gather")} style={{ marginLeft: "auto", padding: "5px 12px", background: "transparent", border: "1px solid var(--amber-b)", borderRadius: "var(--r)", color: "var(--amber)", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                    Edit
                  </button>
                </div>
              )}

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 24, boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 20, color: totalChars > charLimit ? "var(--red)" : "var(--navy)", fontWeight: 600 }}>{totalChars.toLocaleString()}</span>
                    <span style={{ fontSize: 14, color: "var(--ink3)" }}> / {charLimit.toLocaleString()} chars</span>
                  </div>
                  <div style={{ height: 6, width: 160, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, totalChars / charLimit * 100)}%`, background: totalChars > charLimit ? "var(--red)" : "var(--green)", borderRadius: 100 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                  <button onClick={() => setMode("gather")} style={{ padding: "8px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>Regenerate</button>
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
                    style={{ width: "100%", minHeight: 140, padding: "12px 14px", border: `1px solid ${(answers[prompt.id]?.length || 0) > prompt.maxChars ? "var(--red)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center" }}>
                    {(answers[prompt.id]?.length || 0) > prompt.maxChars && (
                      <span style={{ fontSize: 11, color: "var(--red)" }}>Over limit — please trim this section</span>
                    )}
                    <span style={{ fontSize: 11, color: (answers[prompt.id]?.length || 0) > prompt.maxChars ? "var(--red)" : "var(--ink4)", fontFamily: "monospace", marginLeft: "auto" }}>
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