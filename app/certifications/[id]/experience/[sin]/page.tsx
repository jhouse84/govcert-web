"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

import { SIN_LABELS } from "@/lib/sins";

export default function ProjectExperiencePage({ params }: { params: Promise<{ id: string; sin: string }> }) {
  const router = useRouter();
  const { id, sin } = React.use(params);
  const certId = String(id);
  const sinCode = String(sin);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [homeLink, setHomeLink] = useState("/portal");
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role === "ADMIN" || payload.role === "ADVISOR") setHomeLink("/dashboard");
      }
    } catch {}
  }, []);
  const [narrative, setNarrative] = useState("");
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [mode, setMode] = useState<"gather" | "refine">("gather");
  const [userDescription, setUserDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedText, setUploadedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sinLabel = SIN_LABELS[sinCode] || `SIN ${sinCode}`;
  const sinHint = `Describe relevant project experience for ${sinLabel || 'this SIN'}. Include specific projects, methodologies, outcomes, and how the work aligns with this service category.`;
  const charLimit = 10000;

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
      // Load existing narrative for this SIN if saved
      if (data.application?.narrativeExp) {
        try {
          const parsed = JSON.parse(data.application.narrativeExp);
          if (parsed[sinCode]) {
            setNarrative(parsed[sinCode]);
            setMode("refine");
          }
        } catch {
          // not JSON, ignore
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadedFile(file);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";
      const res = await fetch(`${apiUrl}/api/upload/extract-text`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.text) setUploadedText(data.text);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function generateNarrative() {
    setGenerating(true);
    try {
      const data = await apiRequest("/api/applications/ai/draft", {
        method: "POST",
        body: JSON.stringify({
          section: `Project Experience — SIN ${sinCode}: ${sinLabel}`,
          prompt: `Write a compelling GSA MAS Project Experience narrative for SIN ${sinCode} (${sinLabel}). 

This narrative must demonstrate that the company has directly relevant experience performing work similar in scope and complexity to what they will offer under this SIN. 

Include:
- Specific projects or engagements that align with this SIN
- Methodologies and approaches used
- Measurable outcomes and results achieved
- Compliance with applicable regulations or standards
- How the experience demonstrates capability to perform under a GSA Schedule

Write in a professional, factual tone suitable for a federal contract application. Be specific and avoid vague claims.`,
          context: {
            businessName: cert?.client?.businessName,
            entityType: cert?.client?.entityType,
            naicsCode: cert?.application?.naicsCode,
            yearsInBusiness: cert?.application?.yearsInBusiness,
            annualRevenue: cert?.application?.annualRevenue,
            employeeCount: cert?.application?.employeeCount,
            otherSections: [
              userDescription ? `Company description: ${userDescription}` : "",
              uploadedText ? `From uploaded document: ${uploadedText.substring(0, 2000)}` : "",
              cert?.application?.narrativeCorp ? `Corporate Experience: ${(() => { try { const p = JSON.parse(cert.application.narrativeCorp); return Object.values(p).join(" ").substring(0, 1000); } catch { return cert.application.narrativeCorp?.substring(0, 1000); } })()}` : "",
            ].filter(Boolean).join("\n\n"),
          },
        }),
      });
      setNarrative(data.text);
      setMode("refine");
      await saveNarrativeData(data.text);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  async function saveNarrativeData(text: string) {
    if (!cert) return;
    try {
      // Load existing narrativeExp object and merge this SIN's narrative in
      let existing: Record<string, string> = {};
      if (cert.application?.narrativeExp) {
        try { existing = JSON.parse(cert.application.narrativeExp); } catch {}
      }
      const updated = { ...existing, [sinCode]: text };
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert.clientId,
          certType: cert.type,
          currentStep: cert.application?.currentStep || 1,
          narrativeExp: JSON.stringify(updated),
        }),
      });
      // Update local cert state so subsequent saves merge correctly
      setCert((prev: any) => ({
        ...prev,
        application: {
          ...prev?.application,
          narrativeExp: JSON.stringify(updated),
        },
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function saveNarrative() {
    setSaving(true);
    try {
      await saveNarrativeData(narrative);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
    setListening(true);
    let final = userDescription;
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += " " + event.results[i][0].transcript;
        else interim = event.results[i][0].transcript;
      }
      setUserDescription((final + " " + interim).trim());
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  // Find which section number this SIN is in the cert dashboard
  const selectedSINs = cert?.application?.selectedSINs
    ? cert.application.selectedSINs.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];
  const sinIndex = selectedSINs.indexOf(sinCode);
  const sectionNumber = sinIndex >= 0 ? sinIndex + 3 : 3; // sections 1=corp, 2=qcp, then SINs start at 3

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <a href={homeLink} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
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
            SIN {sinCode}
          </div>
          <div style={{ margin: "8px 9px 16px", padding: "12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>SIN Label</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", lineHeight: 1.5 }}>{sinLabel}</div>
          </div>

          {/* Other SINs on this cert */}
          {selectedSINs.length > 1 && (
            <>
              <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 6, marginTop: 8, fontWeight: 600 }}>All SINs</div>
              {selectedSINs.map((s: string) => (
                <a key={s} href={`/certifications/${certId}/experience/${s}`}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, textDecoration: "none", background: s === sinCode ? "rgba(200,155,60,.1)" : "transparent" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: s === sinCode ? "var(--gold)" : "rgba(255,255,255,.1)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: s === sinCode ? "var(--gold2)" : "rgba(255,255,255,.4)" }}>SIN {s}</span>
                </a>
              ))}
            </>
          )}

          <div style={{ marginTop: 16 }}>
            <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12 }}>
              ← Back to Dashboard
            </a>
          </div>
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
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application Dashboard
          </a>

          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              Section {sectionNumber} · SIN {sinCode}
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Project Experience
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>{sinLabel}</p>
          </div>

          {/* GSA Requirement callout */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 10 }}>GSA Requirement</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              {[
                { icon: "📋", title: "One narrative per SIN", body: "Each SIN you've selected requires its own Project Experience narrative demonstrating relevant work." },
                { icon: "🎯", title: "Show direct relevance", body: "The work described must be similar in scope and complexity to what you'll offer under this specific SIN." },
                { icon: "📏", title: "10,000 character limit", body: "GSA's eOffer system enforces a 10,000 character limit. GovCert tracks this in real time." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GATHER MODE */}
          {mode === "gather" && (
            <div>
              {/* Upload */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Option 1</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Upload a Relevant Document</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16, lineHeight: 1.6 }}>
                  Upload a past proposal, statement of work, contract summary, or any document describing relevant work under SIN {sinCode}. GovCert extracts the content and uses it to draft your narrative.
                </p>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                {!uploadedFile ? (
                  <div onClick={() => fileInputRef.current?.click()}
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
                    <button onClick={() => { setUploadedFile(null); setUploadedText(""); }}
                      style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--green-b)", borderRadius: "var(--r)", color: "var(--green)", fontSize: 12, cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Option 2</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Describe Your Relevant Experience</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 6, lineHeight: 1.6 }}>
                  {sinHint}
                </p>
                <p style={{ fontSize: 12, color: "var(--ink4)", marginBottom: 16, lineHeight: 1.6 }}>
                  Type or speak a few sentences — even rough notes work. GovCert will shape them into a polished narrative.
                </p>
                <textarea
                  value={userDescription}
                  onChange={e => setUserDescription(e.target.value)}
                  placeholder={`Describe your experience related to SIN ${sinCode}: ${sinLabel}...`}
                  style={{ width: "100%", minHeight: 120, padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    onClick={() => listening ? stopVoice() : startDescriptionVoice()}
                    style={{ padding: "7px 16px", background: listening ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: listening ? "var(--red)" : "var(--ink3)", display: "flex", alignItems: "center", gap: 6 }}>
                    {listening ? "⏹ Stop Recording" : "🎤 Speak Instead"}
                  </button>
                </div>
              </div>

              {/* Generate button */}
              <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "28px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold2)", marginBottom: 8 }}>Ready to Draft</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", fontWeight: 400, marginBottom: 8 }}>
                  Generate Project Experience Narrative
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24, maxWidth: 500, margin: "0 auto 24px", lineHeight: 1.6 }}>
                  GovCert will draft a GSA-compliant Project Experience narrative for SIN {sinCode} using your inputs and company profile.
                </p>
                <button
                  onClick={generateNarrative}
                  disabled={generating || (!userDescription.trim() && !uploadedText.trim())}
                  style={{ padding: "14px 40px", background: generating ? "rgba(200,155,60,.5)" : "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 16, fontWeight: 500, cursor: generating ? "not-allowed" : "pointer", boxShadow: "0 4px 24px rgba(200,155,60,.4)", transition: "all .2s" }}>
                  {generating ? "✦ Drafting narrative... (~20 seconds)" : "✦ Generate Narrative →"}
                </button>
                {!userDescription.trim() && !uploadedText.trim() && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 12 }}>Add a document or description above to get started</p>
                )}
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => setMode("refine")}
                    style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.35)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                    Skip and write manually instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REFINE MODE */}
          {mode === "refine" && (
            <div>
              {/* Sticky char counter + save bar */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 24, boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 20, color: narrative.length > charLimit ? "var(--red)" : narrative.length > charLimit * 0.8 ? "var(--amber)" : "var(--navy)", fontWeight: 600 }}>
                      {narrative.length.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--ink3)" }}> / {charLimit.toLocaleString()} chars</span>
                  </div>
                  <div style={{ height: 6, width: 160, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, narrative.length / charLimit * 100)}%`, background: narrative.length > charLimit ? "var(--red)" : narrative.length > charLimit * 0.8 ? "var(--gold)" : "var(--green)", borderRadius: 100 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Saved</span>}
                  <button onClick={() => setMode("gather")}
                    style={{ padding: "8px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>
                    Regenerate
                  </button>
                  <button onClick={saveNarrative} disabled={saving}
                    style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    {saving ? "Saving..." : "Save Progress"}
                  </button>
                </div>
              </div>

              {/* Narrative editor */}
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: narrative.trim() ? "var(--green)" : "var(--cream2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: narrative.trim() ? "#fff" : "var(--ink4)", fontWeight: 600, flexShrink: 0 }}>
                        {narrative.trim() ? "✓" : "1"}
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)" }}>
                        Project Experience — SIN {sinCode}
                      </h3>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--ink4)", fontStyle: "italic" }}>{sinHint}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                    <button
                      onClick={() => listening ? stopVoice() : startVoice()}
                      style={{ padding: "7px 12px", background: listening ? "var(--red-bg)" : "var(--cream)", border: `1px solid ${listening ? "var(--red-b)" : "var(--border2)"}`, borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: listening ? "var(--red)" : "var(--ink3)" }}>
                      {listening ? "Stop" : "🎤 Speak"}
                    </button>
                    <button onClick={generateNarrative} disabled={generating}
                      style={{ padding: "7px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      {generating ? "Drafting..." : "✦ Redraft"}
                    </button>
                  </div>
                </div>
                <textarea
                  value={narrative}
                  onChange={e => setNarrative(e.target.value)}
                  placeholder={`Write your Project Experience narrative for SIN ${sinCode} here, or use Redraft above...`}
                  style={{ width: "100%", minHeight: 400, padding: "14px 16px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--ink4)" }}>Tip: Be specific about projects, outcomes, and methodologies. Vague language weakens your application.</span>
                  <span style={{ fontSize: 11, color: narrative.length > charLimit ? "var(--red)" : "var(--ink4)", fontFamily: "monospace" }}>
                    {narrative.length.toLocaleString()} / {charLimit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Bottom nav */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20 }}>
                <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>← Back to Dashboard</a>
                <div style={{ display: "flex", gap: 12 }}>
                  {/* Link to next SIN if there is one */}
                  {sinIndex >= 0 && sinIndex < selectedSINs.length - 1 && (
                    <a href={`/certifications/${certId}/experience/${selectedSINs[sinIndex + 1]}`}
                      onClick={saveNarrative}
                      style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                      Next SIN →
                    </a>
                  )}
                  <button onClick={saveNarrative} disabled={saving}
                    style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
                    {saving ? "Saving..." : "Save & Continue"}
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