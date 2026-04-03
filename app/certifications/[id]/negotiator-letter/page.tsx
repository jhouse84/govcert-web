"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface Negotiator {
  name: string;
  title: string;
  email: string;
  phone: string;
  hasSignatureAuthority: boolean;
}

const EMPTY_NEGOTIATOR: Negotiator = { name: "", title: "", email: "", phone: "", hasSignatureAuthority: true };

export default function NegotiatorLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Authorizing Officer (the person who SIGNS the letter)
  const [officerName, setOfficerName] = useState("");
  const [officerTitle, setOfficerTitle] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");
  const [officerPhone, setOfficerPhone] = useState("");

  // Step 2: Authorized Negotiators (people being designated)
  const [negotiators, setNegotiators] = useState<Negotiator[]>([{ ...EMPTY_NEGOTIATOR }]);

  // Step 3: Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Step 4: Generated letter
  const [letter, setLetter] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);

      let eofferData: any = {};
      try { eofferData = JSON.parse(data.application?.eofferData || "{}"); } catch {}

      // Load saved data
      if (eofferData.authOfficerName) {
        setOfficerName(eofferData.authOfficerName);
        setOfficerTitle(eofferData.authOfficerTitle || "");
        setOfficerEmail(eofferData.authOfficerEmail || data.client?.email || "");
        setOfficerPhone(eofferData.authOfficerPhone || data.client?.phone || "");
      } else {
        // Default to client contact info
        setOfficerEmail(data.client?.email || "");
        setOfficerPhone(data.client?.phone || "");
      }

      if (eofferData.authorizedNegotiators?.length > 0) {
        setNegotiators(eofferData.authorizedNegotiators);
      }

      if (eofferData.signatureImage) {
        setSignatureData(eofferData.signatureImage);
      }

      if (eofferData.negotiatorLetter) {
        setLetter(eofferData.negotiatorLetter);
        // If everything is filled, go to step 4
        if (eofferData.authOfficerName && eofferData.signatureImage) setStep(4);
        else if (eofferData.authOfficerName) setStep(3);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  // ── Signature Canvas ──
  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;
    setIsDrawing(true);
    setLastPoint(point);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing || !lastPoint) return;
    const point = getCanvasPoint(e);
    if (!point) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = "#1A2332";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setLastPoint(point);
  }

  function stopDrawing() {
    setIsDrawing(false);
    setLastPoint(null);
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  }

  // Initialize canvas with white background when step 3 loads
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // Restore saved signature if exists
        if (signatureData) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = signatureData;
        }
      }
    }
  }, [step]);

  // ── Generate & Save ──
  async function generateAndSave() {
    if (!officerName.trim()) { setError("Authorizing officer name is required."); return; }
    if (negotiators.every(n => !n.name.trim())) { setError("At least one negotiator name is required."); return; }

    const clientId = cert?.clientId || cert?.client?.id;
    const client = cert?.client || {};
    const address = [client.address, client.city, client.state, client.zip].filter(Boolean).join(", ");
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const validNegotiators = negotiators.filter(n => n.name.trim());

    const negList = validNegotiators.map((n, i) => `    ${i + 1}. ${n.name}
       Title: ${n.title || "Authorized Representative"}
       Email: ${n.email}
       Phone: ${n.phone}
       Signature Authority: ${n.hasSignatureAuthority ? "Yes — authorized to sign contracts" : "No — negotiation only"}`
    ).join("\n\n");

    const generatedLetter = `${client.businessName || "[Company Name]"}
${address}
${officerPhone}
${officerEmail}

${today}

General Services Administration
Federal Acquisition Service
Office of Acquisition Management

RE: Authorized Negotiator Designation — GSA Multiple Award Schedule Offer

Dear Contracting Officer,

This letter serves to designate the following individual${validNegotiators.length > 1 ? "s" : ""} as authorized negotiator${validNegotiators.length > 1 ? "s" : ""} for ${client.businessName || "[Company Name]"} in connection with our offer under the GSA Multiple Award Schedule (MAS) program:

${negList}

The above-named individual${validNegotiators.length > 1 ? "s are" : " is"} hereby authorized to negotiate all terms, conditions, and pricing on behalf of ${client.businessName || "[Company Name]"}${validNegotiators.some(n => n.hasSignatureAuthority) ? " and to bind the company to any resulting GSA Schedule contract" : ""}. This authorization includes, but is not limited to:

    •  Negotiating pricing and discount structures
    •  Responding to clarification requests from GSA
    •  Executing contract modifications
${validNegotiators.some(n => n.hasSignatureAuthority) ? "    •  Signing the final contract award on behalf of " + (client.businessName || "[Company Name]") : ""}

This designation shall remain in effect until revoked in writing by an authorized officer of ${client.businessName || "[Company Name]"}.

If you require any additional information or verification, please do not hesitate to contact me directly.

Respectfully,


[See attached signature]

_____________________________________________
${officerName}
${officerTitle}
${client.businessName || "[Company Name]"}
${officerEmail} | ${officerPhone}

UEI: ${client.uei || "[Enter UEI]"}
EIN: ${client.ein || "[Enter EIN]"}`;

    setLetter(generatedLetter);

    // Save everything
    try {
      let eofferData: any = {};
      try { eofferData = JSON.parse(cert?.application?.eofferData || "{}"); } catch {}
      eofferData.authOfficerName = officerName;
      eofferData.authOfficerTitle = officerTitle;
      eofferData.authOfficerEmail = officerEmail;
      eofferData.authOfficerPhone = officerPhone;
      eofferData.authorizedNegotiators = validNegotiators;
      eofferData.signatureImage = signatureData;
      eofferData.negotiatorLetter = generatedLetter;
      // Also set legacy fields for submit page compatibility
      eofferData.negotiatorName = validNegotiators[0]?.name || officerName;
      eofferData.negotiatorTitle = validNegotiators[0]?.title || officerTitle;
      eofferData.negotiatorEmail = validNegotiators[0]?.email || officerEmail;
      eofferData.negotiatorPhone = validNegotiators[0]?.phone || officerPhone;
      eofferData.negotiatorSignature = "Yes";

      await apiRequest(`/api/certifications/${certId}`, {
        method: "PUT",
        body: JSON.stringify({ eofferData: JSON.stringify(eofferData) }),
      });
      setSaved(true);
      setStep(4);
    } catch (err: any) {
      setError("Failed to save: " + err.message);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid var(--border2)",
    borderRadius: "var(--r)", fontSize: 13.5, outline: "none",
    boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 500, color: "var(--ink3)",
    textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px" }}>
        <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
          ← Back to Application Dashboard
        </a>

        <div style={{ marginTop: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>eOffer Upload Document</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
            Authorized Negotiator Letter
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
            A corporate officer designates who can negotiate and sign the GSA contract. The officer signs the letter — the negotiators are listed in it.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {[
            { n: 1, label: "Authorizing Officer" },
            { n: 2, label: "Negotiators" },
            { n: 3, label: "Signature" },
            { n: 4, label: "Letter" },
          ].map(s => (
            <div key={s.n} onClick={() => { if (s.n <= step || (s.n === 4 && letter)) setStep(s.n as any); }}
              style={{ flex: 1, padding: "10px 12px", borderRadius: "var(--r)", cursor: s.n <= step ? "pointer" : "default",
                background: step === s.n ? "var(--navy)" : s.n < step ? "var(--green-bg)" : "var(--cream2)",
                border: `1px solid ${step === s.n ? "var(--navy)" : s.n < step ? "var(--green-b)" : "var(--border)"}`,
                textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: step === s.n ? "var(--gold2)" : s.n < step ? "var(--green)" : "var(--ink4)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                {s.n < step ? "\u2713 " : ""}Step {s.n}
              </div>
              <div style={{ fontSize: 12, color: step === s.n ? "#fff" : "var(--ink3)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>&times;</button>
          </div>
        )}

        {/* ═══ STEP 1: Authorizing Officer ═══ */}
        {step === 1 && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>
              Authorizing Officer
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>
              The corporate officer who has authority to bind the company — typically the CEO, President, or Managing Member. This person <strong>signs</strong> the letter.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={officerName} onChange={e => setOfficerName(e.target.value)} placeholder="e.g., Jelani House" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Title *</label>
                <input value={officerTitle} onChange={e => setOfficerTitle(e.target.value)} placeholder="e.g., Managing Director, CEO, President" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={officerEmail} onChange={e => setOfficerEmail(e.target.value)} placeholder="officer@company.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={officerPhone} onChange={e => setOfficerPhone(e.target.value)} placeholder="(555) 123-4567" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => { if (!officerName.trim()) { setError("Officer name is required"); return; } setError(null); setStep(2); }}
                style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                Next: Add Negotiators →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Authorized Negotiators ═══ */}
        {step === 2 && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>
              Authorized Negotiators
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>
              Who is authorized to negotiate with GSA? This can be the same person as the authorizing officer, or different people (e.g., a contracts manager, consultant).
            </p>

            {/* Quick-fill: same as officer */}
            {negotiators[0]?.name !== officerName && (
              <button onClick={() => setNegotiators([{ name: officerName, title: officerTitle, email: officerEmail, phone: officerPhone, hasSignatureAuthority: true }])}
                style={{ padding: "8px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, color: "var(--ink3)", cursor: "pointer", marginBottom: 16 }}>
                Same as authorizing officer ({officerName})
              </button>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {negotiators.map((neg, i) => (
                <div key={i} style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--cream)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>Negotiator {i + 1}</div>
                    {negotiators.length > 1 && (
                      <button onClick={() => setNegotiators(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 12 }}>Remove</button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input value={neg.name} onChange={e => setNegotiators(prev => prev.map((n, j) => j === i ? { ...n, name: e.target.value } : n))} placeholder="Full name" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Title</label>
                      <input value={neg.title} onChange={e => setNegotiators(prev => prev.map((n, j) => j === i ? { ...n, title: e.target.value } : n))} placeholder="Title" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input value={neg.email} onChange={e => setNegotiators(prev => prev.map((n, j) => j === i ? { ...n, email: e.target.value } : n))} placeholder="Email" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input value={neg.phone} onChange={e => setNegotiators(prev => prev.map((n, j) => j === i ? { ...n, phone: e.target.value } : n))} placeholder="Phone" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink2)", cursor: "pointer" }}>
                      <input type="checkbox" checked={neg.hasSignatureAuthority}
                        onChange={e => setNegotiators(prev => prev.map((n, j) => j === i ? { ...n, hasSignatureAuthority: e.target.checked } : n))}
                        style={{ width: 16, height: 16 }} />
                      Has signature authority (can sign contracts on behalf of the company)
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setNegotiators(prev => [...prev, { ...EMPTY_NEGOTIATOR }])}
              style={{ marginTop: 12, padding: "8px 16px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, color: "var(--ink3)", cursor: "pointer" }}>
              + Add Another Negotiator
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button onClick={() => setStep(1)} style={{ padding: "10px 20px", background: "var(--cream2)", border: "none", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>← Back</button>
              <button onClick={() => { if (negotiators.every(n => !n.name.trim())) { setError("At least one negotiator name is required"); return; } setError(null); setStep(3); }}
                style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                Next: Sign the Letter →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Signature ═══ */}
        {step === 3 && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>
              Officer Signature
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.6 }}>
              Sign below using your mouse or touchscreen. This signature will be embedded in the letter as {officerName}'s authorization.
            </p>

            <div style={{ border: "2px solid var(--navy)", borderRadius: "var(--r)", overflow: "hidden", marginBottom: 12, position: "relative", background: "#fff" }}>
              <canvas
                ref={canvasRef}
                width={700}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ width: "100%", height: 200, cursor: "crosshair", touchAction: "none" }}
              />
              {!signatureData && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", fontSize: 14, color: "var(--border2)" }}>
                  Sign here
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={clearSignature}
                style={{ padding: "7px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}>
                Clear Signature
              </button>
              <div style={{ fontSize: 12, color: "var(--ink4)" }}>
                Signing as: <strong style={{ color: "var(--navy)" }}>{officerName}</strong>, {officerTitle}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button onClick={() => setStep(2)} style={{ padding: "10px 20px", background: "var(--cream2)", border: "none", borderRadius: "var(--r)", fontSize: 13, cursor: "pointer", color: "var(--ink3)" }}>← Back</button>
              <button onClick={() => { if (!signatureData) { setError("Please sign before continuing"); return; } setError(null); generateAndSave(); }}
                style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                Generate & Sign Letter →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Completed Letter ═══ */}
        {step === 4 && letter && (
          <div>
            <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, color: "var(--green)" }}>{"\u2713"}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--green)" }}>Letter generated and signed</div>
                <div style={{ fontSize: 12, color: "var(--ink3)" }}>Download as PDF for upload to eOffer, or copy the text.</div>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid var(--green-b)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 16, boxShadow: "var(--shadow)" }}>
              <pre style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8, whiteSpace: "pre-wrap", color: "var(--ink)", margin: 0 }}>
                {letter}
              </pre>

              {/* Signature image */}
              {signatureData && (
                <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <div style={{ fontSize: 11, color: "var(--ink4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>Signature of {officerName}</div>
                  <img src={signatureData} alt="Signature" style={{ maxHeight: 80, border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 4, background: "#fff" }} />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 24 }}>
              <button onClick={() => setStep(1)}
                style={{ padding: "8px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}>
                Edit Details
              </button>
              <button onClick={() => navigator.clipboard.writeText(letter)}
                style={{ padding: "8px 18px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, color: "var(--gold2)", cursor: "pointer", fontWeight: 500 }}>
                Copy to Clipboard
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>← Back to Dashboard</a>
          <a href={`/certifications/${certId}/submit`}
            style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
            Continue to Submission →
          </a>
        </div>
      </div>
    </div>
  );
}
