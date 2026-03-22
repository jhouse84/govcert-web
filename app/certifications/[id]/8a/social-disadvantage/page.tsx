"use client";
import React, { useEffect, useState, useRef } from "react";
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

  const [narrative, setNarrative] = useState("");
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

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
      if (data.application?.socialDisadvantageNarrative) {
        setNarrative(data.application.socialDisadvantageNarrative);
      }
      // Determine completed sections from application data
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

  async function draftNarrative() {
    setGenerating(true);
    setError(null);
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: "socialDisadvantage",
          certType: "8a",
          prompt: `Write a detailed personal narrative describing social disadvantage for an SBA 8(a) Business Development Program application. The narrative should describe specific instances of bias, prejudice, or discrimination the applicant has experienced in their personal and professional life. The narrative should be written in first person, be genuine and specific, and meet the SBA's standard of preponderance of evidence. It should be at least 2000 characters.`,
          context: {
            businessName: cert?.client?.businessName,
            ownerName: `${cert?.client?.ownerFirstName || ""} ${cert?.client?.ownerLastName || ""}`.trim(),
            existingNarrative: narrative || undefined,
          },
        }),
      });
      setNarrative(data.text);
    } catch (err) {
      setError("Failed to generate narrative. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function startVoice() {
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
    setListening(true);
    let final = narrative;
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += " " + event.results[i][0].transcript;
        else interim = event.results[i][0].transcript;
      }
      setNarrative((final + " " + interim).trim());
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function handleFileUpload(files: File[]) {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("token");
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/extract-text`, {
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

  async function saveAndNext() {
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
          socialDisadvantageNarrative: narrative,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveAndNavigate(next: boolean) {
    await saveAndNext();
    if (next) router.push(`/certifications/${certId}/8a/economic-disadvantage`);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const sidebarContent = (
    <div>
      <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>8(a) Sections</div>
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
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 1 of 7</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Social Disadvantage Narrative</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Write your personal narrative describing experiences of social disadvantage as required by the SBA 8(a) program.
            </p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* Guidance box */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "22px 28px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 12 }}>SBA Requirements</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { icon: "\u270D\uFE0F", title: "Personal narrative required", body: "SBA requires a detailed personal narrative describing specific instances of bias, prejudice, or discrimination you have experienced in American society." },
                { icon: "\uD83D\uDCCF", title: "Preponderance of evidence", body: "Your narrative must demonstrate that social disadvantage has negatively impacted your entry into or advancement in the business world. Provide specific examples with dates and details." },
                { icon: "\uD83D\uDC64", title: "First-person account", body: "Write in first person. Describe your personal experiences — not general statistics or societal issues. Reviewers look for authenticity and specificity." },
                { icon: "\uD83D\uDCC4", title: "Supporting documentation", body: "Upload any supporting evidence: affidavits, news articles, legal documents, letters of support, or other materials that corroborate your narrative." },
              ].map((item, i) => (
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

          {/* Main editor */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Personal Narrative</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>
                  Describe specific experiences of social disadvantage. Minimum 2,000 characters recommended.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={listening ? stopVoice : startVoice}
                  style={{
                    padding: "8px 16px",
                    background: listening ? "#C62828" : "var(--cream)",
                    border: `1px solid ${listening ? "#C62828" : "var(--border2)"}`,
                    borderRadius: "var(--r)",
                    fontSize: 13,
                    color: listening ? "#fff" : "var(--ink3)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {listening ? "\u23F9 Stop" : "\uD83C\uDF99\uFE0F Voice"}
                </button>
                <button
                  onClick={draftNarrative}
                  disabled={generating}
                  style={{
                    padding: "8px 16px",
                    background: "var(--gold)",
                    border: "none",
                    borderRadius: "var(--r)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: generating ? "not-allowed" : "pointer",
                    opacity: generating ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {generating ? "Drafting..." : "\u2728 Draft Narrative"}
                </button>
              </div>
            </div>

            <textarea
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              placeholder="Begin your personal narrative here. Describe specific instances where you experienced bias, prejudice, or discrimination based on your race, ethnicity, gender, or other social factors. Include dates, locations, and the impact these experiences had on your personal and professional life..."
              style={{
                width: "100%",
                minHeight: 400,
                padding: 20,
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

            {/* Character counter */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: narrative.length >= 2000 ? "#1B7A3D" : narrative.length >= 1000 ? "#F57F17" : "#C62828",
                }} />
                <span style={{ fontSize: 13, color: "var(--ink3)" }}>
                  {narrative.length.toLocaleString()} characters
                </span>
              </div>
              <span style={{
                fontSize: 12,
                color: narrative.length >= 2000 ? "#1B7A3D" : "#F57F17",
                fontWeight: 500,
              }}>
                {narrative.length >= 2000 ? "\u2713 Meets minimum length" : `${(2000 - narrative.length).toLocaleString()} more characters recommended`}
              </span>
            </div>
          </div>

          {/* Supporting evidence upload */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Supporting Evidence</h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.5 }}>
              Upload any documents that corroborate your social disadvantage narrative (optional but recommended).
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files) handleFileUpload(Array.from(e.target.files)); }}
            />

            {uploadedFiles.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {uploadedFiles.map((file, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)" }}>
                    <span style={{ fontSize: 16 }}>{"\uD83D\uDCC4"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--green)" }}>{file.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink3)" }}>{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))} style={{ padding: "3px 8px", background: "transparent", border: "1px solid var(--green-b)", borderRadius: "var(--r)", color: "var(--green)", fontSize: 11, cursor: "pointer" }}>Remove</button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: "12px 20px",
                background: "var(--cream)",
                border: "2px dashed var(--border2)",
                borderRadius: "var(--r)",
                fontSize: 13,
                color: "var(--ink3)",
                cursor: "pointer",
                width: "100%",
                textAlign: "center" as const,
              }}
            >
              {uploading ? "Uploading..." : "+ Upload Supporting Documents"}
            </button>
          </div>

          {/* Save / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <div>
              {saved && <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>{"\u2713"} Saved</span>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => saveAndNavigate(false)}
                disabled={saving}
                style={{
                  padding: "10px 24px",
                  background: "transparent",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--r)",
                  fontSize: 14,
                  color: "var(--ink3)",
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => saveAndNavigate(true)}
                disabled={saving}
                style={{
                  padding: "10px 24px",
                  background: "var(--gold)",
                  border: "none",
                  borderRadius: "var(--r)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Save & Next &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
