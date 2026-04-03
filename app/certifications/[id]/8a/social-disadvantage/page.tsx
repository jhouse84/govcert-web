"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import CertSidebar from "@/components/CertSidebar";
import { SecurityBanner } from "@/components/SecurityBadge";

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
  {
    id: "identity",
    label: "Your Background",
    question: "What is your racial, ethnic, cultural background, gender, disability status, or other characteristic that forms the basis of your social disadvantage?",
    hint: "Be specific about how you identify. For example: 'I am a Black American woman,' 'I am a first-generation Mexican-American,' 'I am a South Asian immigrant,' or 'I have a documented physical disability.' The SBA needs to clearly understand the identity at the root of your experiences.",
    prompts: [
      "How do you identify racially and/or ethnically?",
      "Were you born in the U.S. or did you immigrate? If so, from where?",
      "Do you identify as a woman, a person with a disability, or a member of another disadvantaged group?",
    ],
  },
  {
    id: "incident1",
    label: "First Incident of Bias",
    question: "Think of a time when something went wrong in your education, career, or business — a setback, a rejection, a missed opportunity. Now trace it back: was there a moment where bias, prejudice, or discrimination played a role?",
    hint: "Work backwards from the outcome. Maybe you were passed over for a promotion, denied a loan, lost a contract, or were excluded from a group. Then ask: would this have happened to someone who didn't share my background? Describe the specifics — SBA needs the 5 W's: When, Where, Who, What, Why it was bias, and How it impacted you.",
    prompts: [
      "What was the negative outcome? (e.g., denied a loan, passed over for promotion, lost a contract bid)",
      "When and where did this happen? (approximate dates, organization, or city are fine)",
      "Who was involved? (a boss, a loan officer, a contracting officer, a professor — you don't need exact names)",
      "What made you believe it was motivated by your background rather than other factors?",
      "What was the tangible impact? (e.g., delayed your business 2 years, cost you $50K, forced a career change)",
    ],
  },
  {
    id: "incident2",
    label: "Second Incident of Bias",
    question: "Think of another time when your background created a barrier. Ideally, choose a different area of your life — if your first example was about employment, think about school or your business. If it was about education, think about a time in your professional career.",
    hint: "SBA looks for a pattern across your life — not just one isolated event. A strong second incident from a different category (education, employment, or business) shows that discrimination wasn't a one-time thing. Even subtle bias counts: being talked over in meetings, excluded from networking events, steered away from leadership roles, or receiving harsher scrutiny than peers.",
    prompts: [
      "Was there a time in school where you were treated differently, discouraged, or excluded because of your background?",
      "In your career, were you ever paid less, given fewer opportunities, or treated with suspicion compared to colleagues?",
      "In business, were you denied credit, shut out of partnerships, or treated differently by potential clients or agencies?",
      "Did you ever feel you had to work twice as hard to get the same recognition as someone from a different background?",
    ],
  },
  {
    id: "education",
    label: "Educational Impact",
    question: "How did your background shape your educational journey? Think about whether you had the same access, support, and encouragement as your peers.",
    hint: "This doesn't have to be dramatic — subtle patterns matter too. Think about: Were you in underfunded schools? Did guidance counselors steer you away from college or professional programs? Were you the only person who looked like you in your classes? Did financial barriers related to your background limit your options? Did you feel pressure to take a 'safe' path instead of pursuing business or advanced education?",
    prompts: [
      "What kind of schools did you attend? Were they well-funded and supportive?",
      "Did anyone discourage you from pursuing higher education or professional training?",
      "Were you excluded from honors programs, mentorships, or social groups that helped others advance?",
      "Did financial hardship linked to your family's circumstances limit your educational choices?",
      "Were you the first in your family to attend college or pursue a professional career?",
    ],
  },
  {
    id: "employment",
    label: "Employment Impact",
    question: "In your work history, were there moments where your background held you back — even if it wasn't said out loud?",
    hint: "Discrimination at work is often unspoken. Think about: Were you hired at a lower level or salary than equally qualified peers? Were you passed over for promotions that went to less experienced colleagues? Were you assigned to less visible projects? Did you face microaggressions, assumptions about your competence, or a hostile work environment? Were you channeled into support roles instead of leadership?",
    prompts: [
      "Were you ever paid less or started at a lower level than peers with similar qualifications?",
      "Were promotions or leadership opportunities given to others who were less qualified or experienced?",
      "Did colleagues or supervisors make assumptions about your abilities based on your background?",
      "Were you given less desirable assignments, excluded from important meetings, or left off key projects?",
      "Did you ever leave a position — or feel forced to — because of how you were treated?",
    ],
  },
  {
    id: "business",
    label: "Business Impact",
    question: "As a business owner, where have you encountered barriers that you believe are connected to your background? Think about access to capital, contracts, networks, and opportunities.",
    hint: "This is often the most impactful section for SBA. Think about: Were you denied business loans or offered worse terms than you deserved? Did you struggle to break into industry networks or professional associations? Were potential clients or partners dismissive? Did government or commercial buyers seem to overlook you? Were teaming partners reluctant to work with you? Did you lack access to mentors or sponsors in your industry?",
    prompts: [
      "Were you denied a business loan, line of credit, or bonding — or offered unfavorable terms?",
      "Did you have difficulty finding teaming partners, mentors, or sponsors in your industry?",
      "Were potential clients or agencies dismissive or skeptical in ways that felt connected to your background?",
      "Were you excluded from industry associations, networking events, or 'old boys' club' circles?",
      "Have you lost contract opportunities where you felt your background was a factor?",
    ],
  },
  {
    id: "ongoing",
    label: "Ongoing Impact",
    question: "How do these experiences continue to affect your business today? Don't focus on how you overcame them — focus on how they are still a hurdle.",
    hint: "This is critical. SBA wants to see that disadvantage is ONGOING, not historical. Think about: Do you still lack access to the networks and capital that competitors have? Is your business smaller or growing slower than it would be without these barriers? Are you still competing at a disadvantage for contracts? Does your background still create trust barriers with clients or partners? The 8(a) program exists to level this playing field — explain why you still need it.",
    prompts: [
      "Is your business still smaller or less capitalized than it would be without these barriers?",
      "Do you still lack access to professional networks that competitors take for granted?",
      "Are you still at a disadvantage when competing for contracts against established firms?",
      "Do clients or partners still make assumptions about your company based on your background?",
      "How would the 8(a) program specifically help overcome the disadvantages you still face?",
    ],
  },
];

const API = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

export default function SocialDisadvantagePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Two-mode system
  const [mode, setMode] = useState<"gather" | "refine">("gather");

  // Gather mode state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [listeningField, setListeningField] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [expandedCoaching, setExpandedCoaching] = useState<string | null>(null);
  const [showIntroPopup, setShowIntroPopup] = useState(true);

  // Refine mode state
  const [narrative, setNarrative] = useState("");
  const [generating, setGenerating] = useState(false);
  const [feedbackRound, setFeedbackRound] = useState(0);
  const [strengthScore, setStrengthScore] = useState<number | null>(null);
  const [gaps, setGaps] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [feedbackQuestions, setFeedbackQuestions] = useState<any[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [coverageAnalysis, setCoverageAnalysis] = useState<any>(null);
  const [improvementsSummary, setImprovementsSummary] = useState("");
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  // File upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
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
      // Load existing data
      if (data.application?.socialDisadvantageNarrative) {
        setNarrative(data.application.socialDisadvantageNarrative);
        setMode("refine");
      }
      // Load guided answers if they exist
      if (data.application?.socialDisadvantageAnswers) {
        try {
          const parsed = JSON.parse(data.application.socialDisadvantageAnswers);
          setAnswers(parsed);
          if (data.application.socialDisadvantageNarrative) setMode("refine");
        } catch {}
      }
      // Completed sections
      const completed: Record<string, boolean> = {};
      const app = data.application;
      if (app) {
        if (app.socialDisadvantageNarrative?.trim()) completed["social-disadvantage"] = true;
        if (app.economicDisadvantageData) completed["economic-disadvantage"] = true;
        if (app.businessPlanData) completed["business-plan"] = true;
        if (app.narrativeCorp) completed["corporate"] = true;
        if ((app.pastPerformance?.length || 0) > 0) completed["past-performance"] = true;
        if (app.financialData) completed["financials"] = true;
      }
      setCompletedSections(completed);
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  // Voice input
  function startVoice(fieldId: string) {
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
    setListeningField(fieldId);
    let base = answers[fieldId] || "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) base += " " + event.results[i][0].transcript;
        else interim = event.results[i][0].transcript;
      }
      setAnswers(prev => ({ ...prev, [fieldId]: (base + " " + interim).trim() }));
    };
    recognition.onend = () => setListeningField(null);
    recognition.start();
  }
  function stopVoice() { recognitionRef.current?.stop(); setListeningField(null); }

  // Generate narrative from guided answers
  async function generateNarrative() {
    setGenerating(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/8a/social-narrative", {
        method: "POST",
        body: JSON.stringify({
          answers,
          existingNarrative: narrative || undefined,
          feedbackRound: 0,
          clientId: cert?.clientId,
        }),
      });
      const generatedNarrative = data.narrative || "";
      setNarrative(generatedNarrative);
      setStrengthScore(data.strengthScore || null);
      setGaps(data.gaps || []);
      setSuggestions(data.suggestions || []);
      setFeedbackQuestions(data.feedbackQuestions || []);
      setCoverageAnalysis(data.coverageAnalysis || null);
      setFeedbackRound(1);
      setFollowUpAnswers({});
      setMode("refine");
      // Auto-save immediately — this cost money to generate
      apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId, clientId: cert?.clientId, certType: cert?.type,
          currentStep: cert?.application?.currentStep || 1,
          socialDisadvantageNarrative: generatedNarrative,
          socialDisadvantageAnswers: JSON.stringify(answers),
        }),
      }).catch(e => console.error("Auto-save social narrative failed:", e));
    } catch (err: any) {
      setError("AI generation failed: " + (err.message || "Please try again."));
    } finally {
      setGenerating(false);
    }
  }

  // Strengthen with follow-up answers
  async function strengthenNarrative() {
    setGenerating(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/8a/social-narrative", {
        method: "POST",
        body: JSON.stringify({
          answers,
          existingNarrative: narrative,
          followUpAnswers,
          feedbackRound,
          clientId: cert?.clientId,
        }),
      });
      const strengthenedNarrative = data.narrative || narrative;
      setNarrative(strengthenedNarrative);
      setStrengthScore(data.strengthScore || strengthScore);
      setGaps(data.gaps || []);
      setSuggestions(data.suggestions || []);
      setFeedbackQuestions(data.feedbackQuestions || []);
      setCoverageAnalysis(data.coverageAnalysis || coverageAnalysis);
      setImprovementsSummary(data.improvementsSummary || "");
      setFeedbackRound(prev => prev + 1);
      setFollowUpAnswers({});
      // Auto-save strengthened version
      apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId, clientId: cert?.clientId, certType: cert?.type,
          currentStep: cert?.application?.currentStep || 1,
          socialDisadvantageNarrative: strengthenedNarrative,
          socialDisadvantageAnswers: JSON.stringify(answers),
        }),
      }).catch(e => console.error("Auto-save strengthened narrative failed:", e));
    } catch (err: any) {
      setError("Failed to strengthen narrative: " + (err.message || "Please try again."));
    } finally {
      setGenerating(false);
    }
  }

  // File upload
  async function handleFileUpload(files: File[]) {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", cert?.clientId || "");
        formData.append("category", "CERTIFICATION_DOCUMENT");
        formData.append("description", "Social disadvantage supporting evidence");
        const token = localStorage.getItem("token");
        await fetch(`${API}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
      setUploadedFiles(prev => [...prev, ...files]);
    } catch {
      setError("Failed to upload files.");
    } finally {
      setUploading(false);
    }
  }

  // Save
  async function saveData() {
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert?.clientId,
          certType: cert?.type,
          currentStep: cert?.application?.currentStep || 1,
          socialDisadvantageNarrative: narrative,
          socialDisadvantageAnswers: JSON.stringify(answers),
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

  async function saveAndNext() {
    const ok = await saveData();
    if (ok) setTimeout(() => router.push(`/certifications/${certId}/8a/economic-disadvantage`), 500);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const answeredCount = GUIDED_QUESTIONS.filter(q => answers[q.id]?.trim()).length;
  const scoreColor = !strengthScore ? "var(--ink4)" : strengthScore >= 8 ? "var(--green)" : strengthScore >= 5 ? "var(--gold)" : "var(--red)";

  const sidebarContent = (
    <div>
      <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>8(a) Sections</div>
      {EIGHT_A_SECTIONS.map((s, i) => {
        const isActive = s.id === "social-disadvantage";
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
      {/* Mode switcher */}
      <div style={{ marginTop: 20, padding: "12px 9px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "rgba(255,255,255,.25)", marginBottom: 8, fontWeight: 600 }}>Mode</div>
        {[{ id: "gather" as const, label: "Your Story", icon: "📝" }, { id: "refine" as const, label: "AI Narrative", icon: "✨" }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 9px", borderRadius: "var(--r)",
            marginBottom: 2, border: "none", cursor: "pointer", textAlign: "left" as const,
            background: mode === m.id ? "rgba(200,155,60,.15)" : "transparent",
            color: mode === m.id ? "var(--gold2)" : "rgba(255,255,255,.4)", fontSize: 12,
          }}>
            <span>{m.icon}</span> {m.label}
          </button>
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
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 1 of 7</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Social Disadvantage Narrative</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Our AI will guide you through crafting a narrative that meets SBA regulatory standards under 13 CFR &sect; 124.103. Answer the questions below, and we'll draft a compliant narrative for you.
            </p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          <SecurityBanner
            message="This section contains highly sensitive personal information. Your data is encrypted, access-controlled, and never shared without your explicit consent."
            badges={["encrypted-at-rest", "pii-protected", "audit-logged"]}
          />

          {/* SBA Requirements box */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "22px 28px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 12 }}>SBA Three-Part Review Standard (13 CFR &sect; 124.103)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { num: "1", title: "Qualifying Incidents", body: "Each claim must establish a specific incident of bias based on your identity that could support a finding of social disadvantage." },
                { num: "2", title: "Business Impact", body: "Each incident must have negatively impacted your entry into or advancement in the business world. Show the tangible effect." },
                { num: "3", title: "Chronic & Substantial", body: "In totality, your incidents must establish chronic and substantial social disadvantage — not isolated events but a pattern." },
              ].map(item => (
                <div key={item.num} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(200,155,60,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--gold2)", fontWeight: 700, flexShrink: 0 }}>{item.num}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.45)", lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intro coaching popup */}
          {showIntroPopup && mode === "gather" && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(11,25,41,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
              onClick={() => setShowIntroPopup(false)}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "36px 40px", maxWidth: 580, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,.25)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 12 }}>Before you begin</h2>
                <p style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.7, marginBottom: 16 }}>
                  This section asks you to recall personal experiences of disadvantage. These memories can be challenging, but they are essential to your 8(a) application. Here are some tips:
                </p>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 20 }}>
                  {[
                    { icon: "🔄", text: "Work backwards from outcomes. Think of a time something went wrong — a rejection, a setback, a missed opportunity — and trace it back to a moment where bias may have played a role." },
                    { icon: "📝", text: "Answer every question you can. The more detail you provide, the stronger your AI-generated narrative will be. Even a few sentences per question helps." },
                    { icon: "💡", text: "Use the 'Need Help?' button on each question. It provides specific prompts to jog your memory and help you recall relevant experiences." },
                    { icon: "🎙️", text: "Try voice input if writing is difficult. Sometimes it's easier to talk through your experiences than to type them." },
                    { icon: "🤖", text: "Don't worry about polished language. Our AI will transform your raw answers into a professional, SBA-compliant narrative." },
                  ].map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.icon}</span>
                      <span style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 }}>{tip.text}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowIntroPopup(false)}
                  style={{ width: "100%", padding: "14px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 15, fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(200,155,60,.3)" }}>
                  I'm Ready — Let's Begin
                </button>
              </div>
            </div>
          )}

          {/* ═══ GATHER MODE ═══ */}
          {mode === "gather" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "var(--ink3)" }}>{answeredCount}/{GUIDED_QUESTIONS.length} questions answered</div>
                <button onClick={generateNarrative} disabled={generating || answeredCount < 2}
                  style={{
                    padding: "10px 24px", background: answeredCount >= 2 ? "var(--gold)" : "var(--cream2)",
                    border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600,
                    color: answeredCount >= 2 ? "#fff" : "var(--ink4)", cursor: answeredCount >= 2 ? "pointer" : "not-allowed",
                    boxShadow: answeredCount >= 2 ? "0 4px 20px rgba(200,155,60,.3)" : "none",
                  }}>
                  {generating ? "Generating narrative..." : "Generate AI Narrative \u2728"}
                </button>
              </div>

              {GUIDED_QUESTIONS.map((q, i) => {
                const isCoachingOpen = expandedCoaching === q.id;
                return (
                <div key={q.id} style={{ background: "#fff", border: `1px solid ${answers[q.id]?.trim() ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", padding: "22px 26px", marginBottom: 14, boxShadow: "var(--shadow)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: answers[q.id]?.trim() ? "var(--green)" : "var(--cream2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: answers[q.id]?.trim() ? "#fff" : "var(--ink4)", fontWeight: 700 }}>
                          {answers[q.id]?.trim() ? "\u2713" : i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{q.label}</span>
                      </div>
                      <p style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.6, marginBottom: 0 }}>{q.question}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setExpandedCoaching(isCoachingOpen ? null : q.id)}
                        style={{ padding: "6px 12px", background: isCoachingOpen ? "rgba(99,102,241,.1)" : "var(--cream)", border: `1px solid ${isCoachingOpen ? "rgba(99,102,241,.3)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 12, color: isCoachingOpen ? "#6366F1" : "var(--ink3)", cursor: "pointer" }}>
                        {isCoachingOpen ? "Hide Tips" : "Need Help?"}
                      </button>
                      <button onClick={listeningField === q.id ? stopVoice : () => startVoice(q.id)}
                        style={{ padding: "6px 12px", background: listeningField === q.id ? "#C62828" : "var(--cream)", border: `1px solid ${listeningField === q.id ? "#C62828" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 12, color: listeningField === q.id ? "#fff" : "var(--ink3)", cursor: "pointer" }}>
                        {listeningField === q.id ? "\u23F9 Stop" : "\uD83C\uDF99\uFE0F Voice"}
                      </button>
                    </div>
                  </div>

                  {/* Coaching prompts — expandable */}
                  {isCoachingOpen && (
                    <div style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.12)", borderRadius: "var(--r)", padding: "14px 18px", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#6366F1", marginBottom: 8 }}>Think about these questions to help you recall:</div>
                      {q.prompts.map((p: string, pi: number) => (
                        <div key={pi} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.5 }}>
                          <span style={{ color: "#6366F1", flexShrink: 0, fontWeight: 600 }}>{pi + 1}.</span>
                          <span>{p}</span>
                        </div>
                      ))}
                      <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 8, fontStyle: "italic", lineHeight: 1.5, borderTop: "1px solid rgba(99,102,241,.1)", paddingTop: 8 }}>
                        {q.hint}
                      </div>
                    </div>
                  )}

                  <textarea
                    value={answers[q.id] || ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Tell us in your own words..."
                    rows={4}
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                  />
                  {(q.id === "incident1" || q.id === "incident2") && (
                    <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 4, textAlign: "right" as const, color: (answers[q.id] || "").length > 1000 ? "var(--red)" : "var(--gold)" }}>
                      {(answers[q.id] || "").length.toLocaleString()} / 1,000 characters
                    </div>
                  )}
                  {!isCoachingOpen && <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 4, fontStyle: "italic" }}>{q.hint}</div>}
                </div>
                );
              })}

              {/* Supporting evidence upload */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "22px 26px", marginBottom: 14, boxShadow: "var(--shadow)" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Supporting Evidence (Optional)</h3>
                <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 12, lineHeight: 1.5 }}>Affidavits, news articles, legal documents, letters of support, or other materials that corroborate your narrative.</p>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png" style={{ display: "none" }}
                  onChange={e => { if (e.target.files) handleFileUpload(Array.from(e.target.files)); }} />
                {uploadedFiles.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {uploadedFiles.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 12 }}>
                        <span>📄</span> <span style={{ flex: 1, color: "var(--green)", fontWeight: 500 }}>{f.name}</span>
                        <span style={{ color: "var(--ink4)" }}>{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ padding: "10px 18px", background: "var(--cream)", border: "2px dashed var(--border2)", borderRadius: "var(--r)", fontSize: 12, color: "var(--ink3)", cursor: "pointer", width: "100%", textAlign: "center" as const }}>
                  {uploading ? "Uploading..." : "+ Upload Supporting Documents"}
                </button>
              </div>

              {/* Generate button at bottom */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                <button onClick={generateNarrative} disabled={generating || answeredCount < 2}
                  style={{
                    padding: "14px 40px", background: answeredCount >= 2 ? "var(--gold)" : "var(--cream2)",
                    border: "none", borderRadius: "var(--r)", fontSize: 16, fontWeight: 600,
                    color: answeredCount >= 2 ? "#fff" : "var(--ink4)", cursor: answeredCount >= 2 ? "pointer" : "not-allowed",
                    boxShadow: answeredCount >= 2 ? "0 4px 24px rgba(200,155,60,.4)" : "none",
                  }}>
                  {generating ? "AI is crafting your narrative..." : "Generate SBA-Compliant Narrative \u2728"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ REFINE MODE ═══ */}
          {mode === "refine" && (
            <div>
              {/* Strength Score + Coverage */}
              {strengthScore !== null && (
                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, marginBottom: 20 }}>
                  {/* Score card */}
                  <div style={{ background: "#fff", border: `2px solid ${scoreColor}`, borderRadius: "var(--rl)", padding: "20px", textAlign: "center" as const, boxShadow: "var(--shadow)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink4)", marginBottom: 8 }}>Approval Likelihood</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, color: scoreColor, lineHeight: 1 }}>{strengthScore}</div>
                    <div style={{ fontSize: 12, color: scoreColor, fontWeight: 500, marginTop: 4 }}>/10</div>
                    {feedbackRound > 1 && improvementsSummary && (
                      <div style={{ fontSize: 11, color: "var(--green)", marginTop: 8, lineHeight: 1.4 }}>{improvementsSummary}</div>
                    )}
                  </div>
                  {/* Coverage analysis */}
                  {coverageAnalysis && (
                    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 20px", boxShadow: "var(--shadow)" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink4)", marginBottom: 10 }}>SBA Regulatory Coverage</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[
                          { label: "Identity Specified", ok: coverageAnalysis.identitySpecified },
                          { label: "Education Impact", ok: coverageAnalysis.educationCovered },
                          { label: "Employment Impact", ok: coverageAnalysis.employmentCovered },
                          { label: "Business Impact", ok: coverageAnalysis.businessCovered },
                          { label: "Impact Articulated", ok: coverageAnalysis.impactArticulated },
                          { label: `${coverageAnalysis.incidentCount || 0} Incident(s)`, ok: (coverageAnalysis.incidentCount || 0) >= 2 },
                        ].map(item => (
                          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: item.ok ? "var(--green-bg)" : "rgba(239,68,68,.05)", border: `1px solid ${item.ok ? "var(--green-b)" : "rgba(239,68,68,.2)"}`, borderRadius: "var(--r)", fontSize: 11.5, color: item.ok ? "var(--green)" : "var(--red)", fontWeight: 500 }}>
                            {item.ok ? "\u2713" : "\u2717"} {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gaps & Suggestions */}
              {(gaps.length > 0 || suggestions.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {gaps.length > 0 && (
                    <div style={{ background: "rgba(239,68,68,.04)", border: "1px solid rgba(239,68,68,.15)", borderRadius: "var(--rl)", padding: "16px 20px" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--red)", marginBottom: 8 }}>Regulatory Gaps</div>
                      {gaps.map((g, i) => (
                        <div key={i} style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.5, marginBottom: 4, display: "flex", gap: 6 }}>
                          <span style={{ color: "var(--red)", flexShrink: 0 }}>&bull;</span> {g}
                        </div>
                      ))}
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <div style={{ background: "rgba(200,155,60,.04)", border: "1px solid rgba(200,155,60,.15)", borderRadius: "var(--rl)", padding: "16px 20px" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", marginBottom: 8 }}>Suggestions to Strengthen</div>
                      {suggestions.map((s, i) => (
                        <div key={i} style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.5, marginBottom: 4, display: "flex", gap: 6 }}>
                          <span style={{ color: "var(--gold)", flexShrink: 0 }}>&bull;</span> {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Narrative editor */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Your Narrative</h3>
                  <div style={{ fontSize: 12, color: "var(--ink4)" }}>Round {feedbackRound}</div>
                </div>
                <textarea
                  value={narrative}
                  onChange={e => setNarrative(e.target.value)}
                  placeholder="Your AI-generated narrative will appear here. You can also write directly..."
                  style={{ width: "100%", minHeight: 400, padding: 20, border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8, resize: "vertical", color: "var(--navy)", outline: "none", boxSizing: "border-box" as const }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: narrative.length >= 2000 ? "#1B7A3D" : narrative.length >= 1000 ? "#F57F17" : "#C62828" }} />
                    <span style={{ fontSize: 13, color: "var(--ink3)" }}>{narrative.length.toLocaleString()} characters</span>
                  </div>
                  <span style={{ fontSize: 12, color: narrative.length >= 2000 ? "#1B7A3D" : "#F57F17", fontWeight: 500 }}>
                    {narrative.length >= 2000 ? "\u2713 Meets minimum length" : `${(2000 - narrative.length).toLocaleString()} more characters recommended`}
                  </span>
                </div>
              </div>

              {/* AI Follow-up Questions */}
              {feedbackQuestions.length > 0 && (
                <div style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.2)", borderRadius: "var(--rl)", padding: "22px 26px", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>AI Coaching — Answer these to strengthen your narrative</div>
                      <div style={{ fontSize: 12, color: "var(--ink3)" }}>The more detail you provide, the stronger your application.</div>
                    </div>
                  </div>
                  {feedbackQuestions.map((fq: any) => (
                    <div key={fq.id} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>{fq.question}</div>
                      {fq.why && <div style={{ fontSize: 11, color: "var(--ink4)", marginBottom: 6, fontStyle: "italic" }}>{fq.why}</div>}
                      <textarea
                        value={followUpAnswers[fq.id] || ""}
                        onChange={e => setFollowUpAnswers(prev => ({ ...prev, [fq.id]: e.target.value }))}
                        placeholder="Type your answer..."
                        rows={3}
                        style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(99,102,241,.2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                      />
                    </div>
                  ))}
                  <button onClick={strengthenNarrative} disabled={generating || Object.values(followUpAnswers).every(v => !v?.trim())}
                    style={{
                      padding: "12px 28px",
                      background: Object.values(followUpAnswers).some(v => v?.trim()) ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "var(--cream2)",
                      border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600,
                      color: Object.values(followUpAnswers).some(v => v?.trim()) ? "#fff" : "var(--ink4)",
                      cursor: Object.values(followUpAnswers).some(v => v?.trim()) ? "pointer" : "not-allowed",
                      boxShadow: Object.values(followUpAnswers).some(v => v?.trim()) ? "0 4px 20px rgba(99,102,241,.3)" : "none",
                    }}>
                    {generating ? "Strengthening..." : "Strengthen Narrative \u2728"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Save / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
            <div>
              {saved && <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>{"\u2713"} Saved</span>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => saveData()} disabled={saving}
                style={{ padding: "10px 24px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, color: "var(--ink3)", cursor: "pointer" }}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={saveAndNext} disabled={saving}
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
