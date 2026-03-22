"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const PROMPTS = [
  { id: "overview", label: "Quality Control Overview", hint: "Overall QC approach and philosophy", maxChars: 2000 },
  { id: "supervision", label: "Direct Supervision of Projects", hint: "Project oversight, review cadence, checkpoints", maxChars: 2000 },
  { id: "personnel", label: "Quality Control Personnel", hint: "QC lead roles, qualifications, responsibilities", maxChars: 1500 },
  { id: "subcontractors", label: "Subcontractor Quality Management", hint: "Vetting process, performance monitoring", maxChars: 1500 },
  { id: "corrective", label: "Problem Areas & Corrective Action", hint: "Issue identification, documentation, resolution", maxChars: 1500 },
  { id: "urgent", label: "Urgent Requirements & Simultaneous Projects", hint: "Capacity management, surge staffing, quality under pressure", maxChars: 1000 },
];

const QC_ATTRIBUTES = [
  {
    category: "Certifications & Standards",
    items: [
      { id: "iso9001", label: "ISO 9001 Certified", desc: "International Quality Management System standard. Shows GSA you have documented, audited QC processes.", clarifications: [{ id: "year", label: "Year certified (optional)" }, { id: "registrar", label: "Certifying body / registrar (optional)" }] },
      { id: "iso27001", label: "ISO 27001 Certified", desc: "Information Security Management System. Required or preferred for IT and data-handling contracts.", clarifications: [{ id: "year", label: "Year certified (optional)" }] },
      { id: "cmmi3", label: "CMMI Level 3", desc: "Defined, organization-wide processes. Strong signal for DoD and large agency contracts.", clarifications: [{ id: "appraiser", label: "Appraiser organization (optional)" }] },
      { id: "cmmi5", label: "CMMI Level 5", desc: "Optimizing-level process maturity. Rare and highly valued for complex government programs.", clarifications: [] },
      { id: "six_sigma", label: "Six Sigma", desc: "Data-driven defect reduction methodology. Shows quantitative quality management.", clarifications: [{ id: "level", label: "Belt level — Black, Green, or both (optional)" }, { id: "count", label: "Number of certified practitioners (optional)" }] },
      { id: "as9100", label: "AS9100 Certified", desc: "Aerospace/defense quality standard. Required for aerospace-related SINs.", clarifications: [] },
      { id: "fedramp", label: "FedRAMP Authorized", desc: "Cloud security authorization for federal systems. Required for cloud service offerings.", clarifications: [{ id: "level", label: "Authorization level — Low, Moderate, or High (optional)" }] },
    ]
  },
  {
    category: "Project Management",
    items: [
      { id: "pmp", label: "PMP-Certified Project Managers", desc: "Project Management Professional certification. Demonstrates formal PM discipline and accountability.", clarifications: [{ id: "count", label: "Number of PMP-certified staff (optional)" }] },
      { id: "agile", label: "Agile / Scrum", desc: "Iterative delivery methodology. Increasingly preferred by federal agencies for technology projects.", clarifications: [{ id: "count", label: "Number of certified Scrum Masters / practitioners (optional)" }, { id: "tool", label: "Primary tool — Jira, Azure DevOps, etc. (optional)" }] },
      { id: "pmbok", label: "PMBOK Framework", desc: "PMI's project management body of knowledge. Shows structured, standardized PM approach.", clarifications: [] },
      { id: "weekly_review", label: "Weekly Quality Reviews", desc: "Formal scheduled QC review meetings. Demonstrates proactive quality oversight.", clarifications: [{ id: "format", label: "Format — in-person, virtual, written report (optional)" }] },
      { id: "peer_review", label: "Peer Review Process", desc: "All deliverables reviewed by a second qualified staff member before submission.", clarifications: [{ id: "pct", label: "% of deliverables that go through peer review (optional)" }] },
      { id: "independent_qa", label: "Independent QA Team", desc: "Separate team dedicated solely to quality assurance, not involved in delivery.", clarifications: [{ id: "size", label: "Size of QA team (optional)" }] },
      { id: "milestone_gates", label: "Milestone Quality Gates", desc: "Formal go/no-go approval checkpoints at defined project milestones.", clarifications: [] },
    ]
  },
  {
    category: "Tools & Technology",
    items: [
      { id: "jira", label: "Jira / Azure DevOps", desc: "Issue tracking and sprint management. Enables transparent project visibility for clients.", clarifications: [{ id: "tool", label: "Which tool(s) specifically (optional)" }] },
      { id: "sharepoint", label: "SharePoint / Confluence", desc: "Document management and team collaboration. Ensures version control and audit trails.", clarifications: [] },
      { id: "automated_testing", label: "Automated Testing", desc: "Automated QA and regression testing. Reduces human error in software and data deliverables.", clarifications: [{ id: "tools", label: "Testing tools used (optional)" }] },
      { id: "dashboards", label: "Real-Time KPI Dashboards", desc: "Live performance monitoring dashboards shared with clients. Demonstrates transparency.", clarifications: [{ id: "tool", label: "Dashboard platform (optional)" }] },
    ]
  },
  {
    category: "Compliance & Documentation",
    items: [
      { id: "far_compliant", label: "FAR/DFARS Compliant Processes", desc: "Processes aligned with Federal Acquisition Regulation. Required for federal contracting.", clarifications: [] },
      { id: "section508", label: "Section 508 Compliance", desc: "Accessibility standards for federal deliverables. Required for IT and document deliverables.", clarifications: [] },
      { id: "nist", label: "NIST Framework", desc: "National Institute of Standards cybersecurity framework. Important for IT and security SINs.", clarifications: [{ id: "version", label: "NIST framework version (optional)" }] },
      { id: "documented_sops", label: "Documented SOPs", desc: "Written Standard Operating Procedures for all key processes. Shows organizational maturity.", clarifications: [{ id: "count", label: "Approximate number of documented SOPs (optional)" }] },
      { id: "lessons_learned", label: "Lessons Learned Database", desc: "Formal capture and reuse of project lessons. Shows continuous improvement culture.", clarifications: [] },
      { id: "after_action", label: "After Action Reviews", desc: "Post-project reviews to improve future performance. Demonstrates accountability.", clarifications: [] },
    ]
  },
];

export default function QCPPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

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
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [expandedAttribute, setExpandedAttribute] = useState<string | null>(null);
  const [clarifications, setClarifications] = useState<Record<string, Record<string, string>>>({});
  const [rightMode, setRightMode] = useState<"describe" | "upload">("describe");
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
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      if (data.application?.narrativeQCP) {
        try {
          const parsed = JSON.parse(data.application.narrativeQCP);
          if (parsed.answers) {
            setAnswers(parsed.answers);
            setSelectedAttributes(parsed.attributes || []);
            setClarifications(parsed.clarifications || {});
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
    const isSelected = selectedAttributes.includes(id);
    setSelectedAttributes(prev => isSelected ? prev.filter(a => a !== id) : [...prev, id]);
    setExpandedAttribute(prev => (prev === id && isSelected) ? null : id);
  }

  function setClarification(attrId: string, fieldId: string, value: string) {
    setClarifications(prev => ({ ...prev, [attrId]: { ...(prev[attrId] || {}), [fieldId]: value } }));
  }

  function getAttributeSummary() {
    return QC_ATTRIBUTES.flatMap(cat =>
      cat.items.filter(item => selectedAttributes.includes(item.id)).map(item => {
        const c = clarifications[item.id] || {};
        const details = Object.entries(c).filter(([, v]) => v.trim()).map(([, v]) => v).join(", ");
        return details ? `${item.label}: ${details}` : item.label;
      })
    );
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

  async function saveAnswersData(data: Record<string, string>) {
    if (!cert) return;
    await apiRequest("/api/applications", {
      method: "POST",
      body: JSON.stringify({
        certificationId: certId,
        clientId: cert.clientId,
        certType: cert.type,
        currentStep: cert.application?.currentStep || 1,
        narrativeQCP: JSON.stringify({ answers: data, attributes: selectedAttributes, clarifications }),
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
          extractedText: uploadedText,
          selectedAttributes: getAttributeSummary(),
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
          prompt: `Write the ${prompt?.label} section of a GSA MAS Quality Control Plan. ${prompt?.hint}`,
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

  function startVoice(target: string) {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input requires Chrome browser."); return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    setListening(target);
    let final = target === "description" ? userDescription : (answers[target] || "");
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += " " + event.results[i][0].transcript;
        else interim = event.results[i][0].transcript;
      }
      if (target === "description") setUserDescription((final + " " + interim).trim());
      else setAnswers(prev => ({ ...prev, [target]: (final + " " + interim).trim() }));
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

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>
  );

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
            {mode === "refine" ? "Sections" : "Progress"}
          </div>
          {mode === "refine" ? (
            PROMPTS.map((p, i) => (
              <a key={p.id} href={`#${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, textDecoration: "none", color: answers[p.id]?.trim() ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)", fontSize: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: answers[p.id]?.trim() ? "var(--green)" : "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, color: "#fff" }}>
                  {answers[p.id]?.trim() ? "✓" : i + 1}
                </div>
                {p.label}
              </a>
            ))
          ) : (
            <div style={{ padding: "8px 9px" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 12 }}>
                <span style={{ color: "var(--gold2)", fontWeight: 600 }}>{selectedAttributes.length}</span> attributes selected
              </div>
              {selectedAttributes.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {selectedAttributes.slice(0, 7).map(id => {
                    const item = QC_ATTRIBUTES.flatMap(c => c.items).find(i => i.id === id);
                    return item ? (
                      <div key={id} style={{ fontSize: 11, color: "rgba(255,255,255,.4)", padding: "4px 8px", background: "rgba(200,155,60,.1)", borderRadius: 4 }}>
                        ✓ {item.label}
                      </div>
                    ) : null;
                  })}
                  {selectedAttributes.length > 7 && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", padding: "4px 8px" }}>
                      +{selectedAttributes.length - 7} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>
            ← Back to Dashboard
          </a>
        </div>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px" }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application Dashboard
          </a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 2 of 6</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Quality Control Plan
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>
              {mode === "gather"
                ? "Tell GovCert about your quality practices. The more you share, the stronger your narrative."
                : "Review and refine your Quality Control Plan. Each section is fully editable."}
            </p>
          </div>

          {mode === "gather" && (
            <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 12 }}>How This Works</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 16 }}>
                {[
                  { step: "1", title: "Select all that apply", body: "Check every QC attribute, certification, or practice your company actually has. Only check what is genuinely true." },
                  { step: "2", title: "Add optional details", body: "After selecting an attribute, click 'Add details' to provide specifics like staff counts or tools used." },
                  { step: "3", title: "Generate your QCP", body: "GovCert combines your selections, any details, your uploaded document, and Corporate Experience to produce a complete GSA-compliant QCP." },
                ].map(item => (
                  <div key={item.step} style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(200,155,60,.2)", border: "1px solid rgba(200,155,60,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: "var(--gold2)", fontWeight: 700 }}>
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", lineHeight: 1.6 }}>{item.body}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 14, display: "flex", gap: 24 }}>
                {[
                  { icon: "📄", text: "Upload a QMS manual, capability statement, or past proposal — GovCert extracts relevant QC content automatically." },
                  { icon: "🎤", text: "Use voice input on the right to describe your QC approach out loud instead of typing." },
                  { icon: "🔄", text: "After generating, every section is fully editable. Regenerate any individual section or the entire plan." },
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, flex: 1 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{tip.icon}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === "gather" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

              {/* LEFT — Attribute checklist */}
              <div>
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "18px 22px", marginBottom: 20, boxShadow: "var(--shadow)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>☑️</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Select everything that applies to your company</div>
                    <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>
                      Check every certification, practice, or tool your company genuinely has. After selecting, click <strong style={{ color: "var(--gold)" }}>"Add details"</strong> to optionally provide specifics.
                    </div>
                  </div>
                </div>

                {QC_ATTRIBUTES.map(category => (
                  <div key={category.category} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--ink3)", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>
                      {category.category}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {category.items.map(item => {
                        const isSelected = selectedAttributes.includes(item.id);
                        const isExpanded = expandedAttribute === item.id && isSelected;
                        return (
                          <div key={item.id} style={{ border: `1px solid ${isSelected ? "var(--gold)" : "var(--border)"}`, borderRadius: "var(--r)", overflow: "hidden", background: isSelected ? "rgba(200,155,60,.04)" : "#fff", transition: "all .12s", boxShadow: isSelected ? "0 0 0 1px rgba(200,155,60,.15)" : "none" }}>
                            <div onClick={() => toggleAttribute(item.id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", cursor: "pointer" }}>
                              <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${isSelected ? "var(--gold)" : "var(--border2)"}`, background: isSelected ? "var(--gold)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, transition: "all .12s" }}>
                                {isSelected && <span style={{ fontSize: 10, color: "#fff", fontWeight: 800 }}>✓</span>}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{item.label}</div>
                                <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>{item.desc}</div>
                              </div>
                              {isSelected && item.clarifications.length > 0 && (
                                <div
                                  onClick={e => { e.stopPropagation(); setExpandedAttribute(isExpanded ? null : item.id); }}
                                  style={{ fontSize: 11, color: "var(--gold)", flexShrink: 0, marginTop: 2, cursor: "pointer", padding: "3px 8px", background: "rgba(200,155,60,.12)", borderRadius: 4, whiteSpace: "nowrap" as const }}>
                                  {isExpanded ? "▲ Hide" : "▼ Add details"}
                                </div>
                              )}
                            </div>
                            {isExpanded && item.clarifications.length > 0 && (
                              <div style={{ padding: "12px 14px 14px 44px", borderTop: "1px solid rgba(200,155,60,.15)", background: "rgba(200,155,60,.02)" }}>
                                <div style={{ fontSize: 12, color: "var(--ink4)", marginBottom: 10, fontStyle: "italic" }}>
                                  Optional — these details help produce a more specific narrative.
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: item.clarifications.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
                                  {item.clarifications.map(field => (
                                    <div key={field.id}>
                                      <label style={{ display: "block", fontSize: 12, color: "var(--ink3)", marginBottom: 4, fontWeight: 500 }}>{field.label}</label>
                                      <input
                                        type="text"
                                        value={clarifications[item.id]?.[field.id] || ""}
                                        onChange={e => setClarification(item.id, field.id, e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                        placeholder="Leave blank to skip"
                                        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, background: "#fff", fontFamily: "'DM Sans', sans-serif" }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT — Context panel */}
              <div style={{ position: "sticky", top: 24 }}>
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--cream)" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Additional Context</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.5 }}>
                      Describe your QC approach or upload a document. Either, both, or neither — GovCert uses everything available.
                    </div>
                  </div>
                  <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                    {[{ id: "describe", label: "Describe / Speak" }, { id: "upload", label: "Upload Document" }].map(tab => (
                      <button key={tab.id} onClick={() => setRightMode(tab.id as any)}
                        style={{ flex: 1, padding: "11px", background: rightMode === tab.id ? "var(--navy)" : "#fff", color: rightMode === tab.id ? "var(--gold2)" : "var(--ink3)", border: "none", fontSize: 12.5, fontWeight: rightMode === tab.id ? 500 : 400, cursor: "pointer", transition: "all .15s" }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    {rightMode === "describe" && (
                      <div>
                        <p style={{ fontSize: 12.5, color: "var(--ink3)", marginBottom: 12, lineHeight: 1.6 }}>
                          Describe your QC approach in a few sentences, or speak it out loud using the button below.
                        </p>
                        <textarea
                          value={userDescription}
                          onChange={e => setUserDescription(e.target.value)}
                          placeholder="e.g. We have a dedicated QA manager with 15 years of federal contracting experience. Every deliverable goes through peer review before submission..."
                          style={{ width: "100%", minHeight: 150, padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                        />
                        <button
                          onClick={() => listening === "description" ? stopVoice() : startVoice("description")}
                          style={{ marginTop: 8, width: "100%", padding: "9px", background: listening === "description" ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening === "description" ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: listening === "description" ? "var(--red)" : "var(--ink3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          {listening === "description" ? "⏹ Stop Recording" : "🎤 Speak Instead of Typing"}
                        </button>
                      </div>
                    )}
                    {rightMode === "upload" && (
                      <div>
                        <p style={{ fontSize: 12.5, color: "var(--ink3)", marginBottom: 12, lineHeight: 1.6 }}>
                          Upload a QMS manual, capability statement, past proposal, or any document describing your quality processes.
                        </p>
                        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }}
                          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                        {!uploadedFile ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r)", padding: "28px 16px", textAlign: "center" as const, cursor: "pointer", transition: "border-color .15s" }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>Click to upload</div>
                            <div style={{ fontSize: 11, color: "var(--ink4)" }}>PDF, DOCX, or TXT — up to 10MB</div>
                          </div>
                        ) : (
                          <div style={{ padding: "14px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)" }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--green)", marginBottom: 4 }}>{uploadedFile.name}</div>
                            <div style={{ fontSize: 11, color: "var(--ink3)" }}>
                              {uploading ? "Extracting text..." : `${uploadedText.length.toLocaleString()} characters extracted`}
                            </div>
                            <button onClick={() => { setUploadedFile(null); setUploadedText(""); }}
                              style={{ marginTop: 8, padding: "4px 10px", background: "transparent", border: "1px solid var(--green-b)", borderRadius: "var(--r)", color: "var(--green)", fontSize: 11, cursor: "pointer" }}>
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {cert?.application?.narrativeCorp && (
                    <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border)", background: "rgba(26,102,68,.04)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--green)" }}>✓</span>
                      <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 500 }}>Corporate Experience narrative included automatically</span>
                    </div>
                  )}
                  <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
                    <button
                      onClick={generateAll}
                      disabled={generatingAll}
                      style={{ width: "100%", padding: "13px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: generatingAll ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.35)", opacity: generatingAll ? 0.7 : 1, transition: "all .2s" }}>
                      {generatingAll
                        ? "✦ Drafting your QCP... (~30 sec)"
                        : `✦ Generate Quality Control Plan${selectedAttributes.length > 0 ? ` (${selectedAttributes.length} attributes)` : ""} →`}
                    </button>
                    <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--cream)", borderRadius: "var(--r)" }}>
                      <div style={{ fontSize: 11, color: "var(--ink4)", lineHeight: 1.6 }}>
                        <strong style={{ color: "var(--ink3)" }}>What gets used:</strong> Your selected attributes, description or document, Corporate Experience, and company profile.
                      </div>
                    </div>
                    <button onClick={() => setMode("refine")}
                      style={{ width: "100%", marginTop: 8, padding: "8px", background: "transparent", border: "none", color: "var(--ink4)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                      Skip and write manually instead
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REFINE MODE */}
          {mode === "refine" && (
            <div>
              {selectedAttributes.length > 0 && (
                <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--rl)", padding: "14px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1, fontSize: 12, color: "var(--ink2)", lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 600, color: "var(--amber)" }}>{selectedAttributes.length} QC attributes incorporated: </span>
                    {getAttributeSummary().slice(0, 4).map(l => l.split(":")[0]).join(" · ")}
                    {selectedAttributes.length > 4 ? ` +${selectedAttributes.length - 4} more` : ""}
                  </div>
                  <button onClick={() => setMode("gather")}
                    style={{ padding: "6px 14px", background: "transparent", border: "1px solid var(--amber-b)", borderRadius: "var(--r)", color: "var(--amber)", fontSize: 12, cursor: "pointer", flexShrink: 0, fontWeight: 500 }}>
                    Edit Attributes
                  </button>
                </div>
              )}

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 22px", marginBottom: 20, boxShadow: "var(--shadow)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>✏️</div>
                <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--navy)" }}>Review and refine your draft.</strong> Every section is fully editable. Use <strong style={{ color: "var(--navy)" }}>Redraft</strong> to regenerate any section, or <strong style={{ color: "var(--navy)" }}>Speak</strong> to dictate changes. When satisfied, click <strong style={{ color: "var(--gold)" }}>Save & Continue</strong>.
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 24, boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 20, color: totalChars > charLimit ? "var(--red)" : "var(--navy)", fontWeight: 600 }}>
                      {totalChars.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--ink3)" }}> / {charLimit.toLocaleString()} chars</span>
                  </div>
                  <div style={{ height: 6, width: 160, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, totalChars / charLimit * 100)}%`, background: totalChars > charLimit ? "var(--red)" : totalChars > charLimit * 0.8 ? "var(--gold)" : "var(--green)", borderRadius: 100 }} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink4)" }}>eOffer limit: 10,000 chars total</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                  <button onClick={() => setMode("gather")}
                    style={{ padding: "8px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>
                    Regenerate All
                  </button>
                  <button onClick={saveAnswers} disabled={saving}
                    style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save Progress"}
                  </button>
                </div>
              </div>

              {PROMPTS.map((prompt, i) => (
                <div key={prompt.id} id={prompt.id}
                  style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ width: 24, height: 24, borderRadius: "50%", background: answers[prompt.id]?.trim() ? "var(--green)" : "var(--cream2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: answers[prompt.id]?.trim() ? "#fff" : "var(--ink4)", fontWeight: 600, flexShrink: 0 }}>
                          {answers[prompt.id]?.trim() ? "✓" : i + 1}
                        </span>
                        <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)" }}>{prompt.label}</h3>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--ink4)", fontStyle: "italic", paddingLeft: 34 }}>{prompt.hint}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                      <button
                        onClick={() => listening === prompt.id ? stopVoice() : startVoice(prompt.id)}
                        style={{ padding: "7px 12px", background: listening === prompt.id ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening === prompt.id ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: listening === prompt.id ? "var(--red)" : "var(--ink3)" }}>
                        {listening === prompt.id ? "⏹ Stop" : "🎤 Speak"}
                      </button>
                      <button
                        onClick={() => regenerateSection(prompt.id)}
                        disabled={generating === prompt.id}
                        style={{ padding: "7px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                        {generating === prompt.id ? "Drafting..." : "✦ Redraft"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={answers[prompt.id] || ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [prompt.id]: e.target.value }))}
                    placeholder="Your drafted content will appear here. You can also type or speak directly."
                    style={{ width: "100%", minHeight: 140, padding: "12px 14px", border: `1px solid ${(answers[prompt.id]?.length || 0) > prompt.maxChars ? "var(--red)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center" }}>
                    {(answers[prompt.id]?.length || 0) > prompt.maxChars
                      ? <span style={{ fontSize: 11, color: "var(--red)" }}>Over recommended limit — consider trimming</span>
                      : <span />}
                    <span style={{ fontSize: 11, color: (answers[prompt.id]?.length || 0) > prompt.maxChars ? "var(--red)" : "var(--ink4)", fontFamily: "monospace" }}>
                      {(answers[prompt.id]?.length || 0).toLocaleString()} / {prompt.maxChars.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20 }}>
                <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>
                  ← Back to Dashboard
                </a>
                <button onClick={saveAnswers} disabled={saving}
                  style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
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