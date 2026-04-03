"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function SubcontractingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState("");
  const [goals, setGoals] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expectedSales, setExpectedSales] = useState("$1,000,000");
  const [isSmallBusiness, setIsSmallBusiness] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);

      // Load saved plan from eofferData
      let eofferData: any = {};
      try { eofferData = JSON.parse(data.application?.eofferData || "{}"); } catch {}

      if (eofferData.subcontractingPlan) {
        setPlan(eofferData.subcontractingPlan);
        setSaved(true);
      }
      if (eofferData.subcontractingGoals) {
        setGoals(eofferData.subcontractingGoals);
      }
      if (eofferData.expectedAnnualSales) {
        setExpectedSales(eofferData.expectedAnnualSales);
      }

      // Check small business status from eofferData or default
      if (eofferData.clauseSmallBiz && eofferData.clauseSmallBiz !== "Small Business") {
        setIsSmallBusiness(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    setGenerating(true);
    setError(null);
    try {
      const clientId = cert?.clientId || cert?.client?.id;
      const data = await apiRequest("/api/applications/ai/generate-subcontracting-plan", {
        method: "POST",
        body: JSON.stringify({ clientId, certType: cert?.type, expectedAnnualSales: expectedSales }),
      });
      setPlan(data.document || "");
      setGoals(data.goals || null);
      setSaved(true); // Auto-saved by the backend
    } catch (err: any) {
      setError(err.message || "Failed to generate subcontracting plan");
    } finally {
      setGenerating(false);
    }
  }

  async function savePlan() {
    try {
      let eofferData: any = {};
      try { eofferData = JSON.parse(cert?.application?.eofferData || "{}"); } catch {}
      eofferData.subcontractingPlan = plan;
      eofferData.subcontractingGoals = goals;
      eofferData.expectedAnnualSales = expectedSales;
      await apiRequest(`/api/certifications/${certId}`, {
        method: "PUT",
        body: JSON.stringify({ eofferData: JSON.stringify(eofferData) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError("Failed to save: " + err.message);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px" }}>
        <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
          ← Back to Application Dashboard
        </a>

        <div style={{ marginTop: 20, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
            eOffer Upload Document
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
            Subcontracting Plan
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
            Required for Other Than Small Business offerors expecting annual GSA sales over $750,000. Must comply with FAR 52.219-9. Small businesses are exempt.
          </p>
        </div>

        {error && (
          <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>&times;</button>
          </div>
        )}

        {/* Small Business Check */}
        {isSmallBusiness && (
          <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{"\u2713"}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "var(--green)", marginBottom: 4 }}>Small Business Exempt</div>
                <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6 }}>
                  Your company is classified as a small business. You are exempt from the subcontracting plan requirement. In eOffer, select "Small Business Exempt" when prompted.
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink4)" }}>
              If this is incorrect and your company is Other Than Small Business,
              <button onClick={() => setIsSmallBusiness(false)} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", textDecoration: "underline", fontSize: 12, padding: "0 4px" }}>
                click here to generate a subcontracting plan
              </button>.
            </div>
          </div>
        )}

        {/* Plan Generation */}
        {!isSmallBusiness && (
          <>
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 16 }}>
                Estimated Annual GSA Sales
              </h3>
              <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 12, lineHeight: 1.6 }}>
                Enter your expected annual sales under the GSA Schedule. This drives the dollar amounts in your subcontracting goals (SB, SDB, WOSB, HUBZone, SDVOSB percentages).
              </p>
              <input
                value={expectedSales}
                onChange={e => setExpectedSales(e.target.value)}
                placeholder="e.g., $1,500,000"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
              />

              <button onClick={generatePlan} disabled={generating}
                style={{ marginTop: 16, padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: generating ? "not-allowed" : "pointer", width: "100%" }}>
                {generating ? "Generating FAR 52.219-9 Compliant Plan..." : plan ? "Regenerate Plan" : "Generate Subcontracting Plan"}
              </button>
            </div>

            {/* Goals Summary */}
            {goals && (
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "var(--navy)", fontWeight: 400, marginBottom: 12 }}>Subcontracting Goals</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Small Business (SB)", value: goals.smallBusiness, min: "23%" },
                    { label: "Small Disadvantaged (SDB)", value: goals.sdb, min: "5%" },
                    { label: "Women-Owned (WOSB)", value: goals.wosb, min: "5%" },
                    { label: "HUBZone", value: goals.hubzone, min: "3%" },
                    { label: "Service-Disabled Vet (SDVOSB)", value: goals.sdvosb, min: "3%" },
                    { label: "Total Subcontracted", value: goals.totalSubcontracted, min: "" },
                  ].map(g => (
                    <div key={g.label} style={{ padding: "10px 12px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{g.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>{g.value || "—"}</div>
                      {g.min && <div style={{ fontSize: 10, color: "var(--ink4)" }}>FAR min: {g.min}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan Text */}
            {plan && (
              <div style={{ background: "#fff", border: "1px solid var(--green-b)", borderRadius: "var(--rl)", padding: "24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, margin: 0 }}>
                    Generated Plan
                  </h3>
                  {saved && <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500 }}>{"\u2713"} Saved</span>}
                </div>

                <textarea
                  value={plan}
                  onChange={e => { setPlan(e.target.value); setSaved(false); }}
                  style={{ width: "100%", minHeight: 400, padding: "16px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--ink4)" }}>{plan.split(/\s+/).length.toLocaleString()} words</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => navigator.clipboard.writeText(plan)}
                      style={{ padding: "7px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}>
                      Copy
                    </button>
                    <button onClick={savePlan}
                      style={{ padding: "7px 16px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, color: "var(--gold2)", cursor: "pointer", fontWeight: 500 }}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
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
