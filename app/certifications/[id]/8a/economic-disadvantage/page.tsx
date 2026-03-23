"use client";
import React, { useEffect, useState } from "react";
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

const NET_WORTH_THRESHOLD = 850000;
const TOTAL_ASSETS_THRESHOLD = 6500000;

type AssetCategory = { key: string; label: string; hint: string };

const ASSET_CATEGORIES: AssetCategory[] = [
  { key: "cash", label: "Cash & Checking", hint: "All bank account balances" },
  { key: "savings", label: "Savings & CDs", hint: "Savings accounts, certificates of deposit" },
  { key: "ira", label: "IRA / 401(k) / Retirement", hint: "Retirement account balances" },
  { key: "stocks", label: "Stocks, Bonds & Investments", hint: "Brokerage accounts, mutual funds" },
  { key: "realEstate", label: "Real Estate (Market Value)", hint: "Fair market value of all properties owned" },
  { key: "vehicles", label: "Vehicles", hint: "Current value of cars, trucks, boats, etc." },
  { key: "otherAssets", label: "Other Assets", hint: "Life insurance cash value, business interests, etc." },
];

const LIABILITY_CATEGORIES: AssetCategory[] = [
  { key: "mortgages", label: "Mortgages", hint: "Outstanding mortgage balances" },
  { key: "loans", label: "Loans (Auto, Personal, Student)", hint: "All loan balances" },
  { key: "creditCards", label: "Credit Card Debt", hint: "Total credit card balances" },
  { key: "otherLiabilities", label: "Other Liabilities", hint: "Tax liens, judgments, other debts" },
];

type IncomeYear = { year: string; adjustedGross: string; source: string };

const currentYear = new Date().getFullYear();

export default function EconomicDisadvantagePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  const [assets, setAssets] = useState<Record<string, string>>({});
  const [liabilities, setLiabilities] = useState<Record<string, string>>({});
  const [incomeYears, setIncomeYears] = useState<IncomeYear[]>([
    { year: String(currentYear - 1), adjustedGross: "", source: "" },
    { year: String(currentYear - 2), adjustedGross: "", source: "" },
    { year: String(currentYear - 3), adjustedGross: "", source: "" },
  ]);

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
      if (data.application?.economicDisadvantageData) {
        try {
          const parsed = JSON.parse(data.application.economicDisadvantageData);
          if (parsed.assets) setAssets(parsed.assets);
          if (parsed.liabilities) setLiabilities(parsed.liabilities);
          if (parsed.incomeYears) setIncomeYears(parsed.incomeYears);
        } catch {}
      }
      // Auto-fill from intake if available
      if (data.client?.intakeData) {
        try {
          const intake = typeof data.client.intakeData === "string" ? JSON.parse(data.client.intakeData) : data.client.intakeData;
          if (intake.incomeYears && incomeYears.every(y => !y.adjustedGross)) {
            setIncomeYears(intake.incomeYears);
          }
        } catch {}
      }
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

  function parseNum(val: string): number {
    const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  const totalAssets = ASSET_CATEGORIES.reduce((sum, c) => sum + parseNum(assets[c.key] || ""), 0);
  const totalLiabilities = LIABILITY_CATEGORIES.reduce((sum, c) => sum + parseNum(liabilities[c.key] || ""), 0);
  const netWorth = totalAssets - totalLiabilities;

  function fmt(n: number): string {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
          economicDisadvantageData: JSON.stringify({ assets, liabilities, incomeYears }),
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

  async function saveAndNavigate(next: boolean) {
    const success = await saveAndNext();
    if (next && success) setTimeout(() => router.push(`/certifications/${certId}/8a/business-plan`), 500);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const sidebarContent = (
    <div>
      <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>8(a) Sections</div>
      {EIGHT_A_SECTIONS.map((s, i) => {
        const isActive = s.id === "economic-disadvantage";
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
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 2 of 7</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Economic Disadvantage</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              SBA Form 413 — Personal Financial Statement. Demonstrates economic disadvantage through net worth and income thresholds.
            </p>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* Threshold summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            <div style={{
              background: netWorth <= NET_WORTH_THRESHOLD ? "var(--green-bg)" : "var(--red-bg)",
              border: `2px solid ${netWorth <= NET_WORTH_THRESHOLD ? "var(--green-b)" : "var(--red-b)"}`,
              borderRadius: "var(--rl)",
              padding: "20px 24px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: netWorth <= NET_WORTH_THRESHOLD ? "var(--green)" : "var(--red)", marginBottom: 4 }}>Net Worth</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: netWorth <= NET_WORTH_THRESHOLD ? "var(--green)" : "var(--red)", fontWeight: 400 }}>
                {fmt(netWorth)}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 4 }}>
                Threshold: {fmt(NET_WORTH_THRESHOLD)} {netWorth <= NET_WORTH_THRESHOLD ? "\u2713 Under limit" : "\u2717 Over limit"}
              </div>
            </div>
            <div style={{
              background: totalAssets <= TOTAL_ASSETS_THRESHOLD ? "var(--green-bg)" : "var(--red-bg)",
              border: `2px solid ${totalAssets <= TOTAL_ASSETS_THRESHOLD ? "var(--green-b)" : "var(--red-b)"}`,
              borderRadius: "var(--rl)",
              padding: "20px 24px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: totalAssets <= TOTAL_ASSETS_THRESHOLD ? "var(--green)" : "var(--red)", marginBottom: 4 }}>Total Assets</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: totalAssets <= TOTAL_ASSETS_THRESHOLD ? "var(--green)" : "var(--red)", fontWeight: 400 }}>
                {fmt(totalAssets)}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 4 }}>
                Threshold: {fmt(TOTAL_ASSETS_THRESHOLD)} {totalAssets <= TOTAL_ASSETS_THRESHOLD ? "\u2713 Under limit" : "\u2717 Over limit"}
              </div>
            </div>
          </div>

          {/* Assets */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Assets</h3>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)" }}>{fmt(totalAssets)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ASSET_CATEGORIES.map(cat => (
                <div key={cat.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500 }}>{cat.label}</label>
                    <span style={{ fontSize: 11, color: "var(--ink4)" }}>{cat.hint}</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--ink4)" }}>$</span>
                    <input
                      type="text"
                      value={assets[cat.key] || ""}
                      onChange={e => setAssets(prev => ({ ...prev, [cat.key]: e.target.value }))}
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 24px",
                        border: "1px solid var(--border2)",
                        borderRadius: "var(--r)",
                        fontSize: 14,
                        fontFamily: "'DM Sans', sans-serif",
                        color: "var(--navy)",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Liabilities */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>Liabilities</h3>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)" }}>{fmt(totalLiabilities)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {LIABILITY_CATEGORIES.map(cat => (
                <div key={cat.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 14, color: "var(--navy)", fontWeight: 500 }}>{cat.label}</label>
                    <span style={{ fontSize: 11, color: "var(--ink4)" }}>{cat.hint}</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--ink4)" }}>$</span>
                    <input
                      type="text"
                      value={liabilities[cat.key] || ""}
                      onChange={e => setLiabilities(prev => ({ ...prev, [cat.key]: e.target.value }))}
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 24px",
                        border: "1px solid var(--border2)",
                        borderRadius: "var(--r)",
                        fontSize: 14,
                        fontFamily: "'DM Sans', sans-serif",
                        color: "var(--navy)",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Year Income Table */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 16 }}>3-Year Income History</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink4)" }}>Tax Year</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink4)" }}>Adjusted Gross Income</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink4)" }}>Primary Source</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeYears.map((iy, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 500, color: "var(--navy)" }}>{iy.year}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ position: "relative", maxWidth: 200 }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--ink4)" }}>$</span>
                          <input
                            type="text"
                            value={iy.adjustedGross}
                            onChange={e => {
                              const updated = [...incomeYears];
                              updated[i] = { ...updated[i], adjustedGross: e.target.value };
                              setIncomeYears(updated);
                            }}
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "8px 10px 8px 22px",
                              border: "1px solid var(--border2)",
                              borderRadius: "var(--r)",
                              fontSize: 14,
                              fontFamily: "'DM Sans', sans-serif",
                              color: "var(--navy)",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <input
                          type="text"
                          value={iy.source}
                          onChange={e => {
                            const updated = [...incomeYears];
                            updated[i] = { ...updated[i], source: e.target.value };
                            setIncomeYears(updated);
                          }}
                          placeholder="e.g., Employment, Business, Investments"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: "1px solid var(--border2)",
                            borderRadius: "var(--r)",
                            fontSize: 14,
                            fontFamily: "'DM Sans', sans-serif",
                            color: "var(--navy)",
                            outline: "none",
                            boxSizing: "border-box",
                            maxWidth: 280,
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <a href={`/certifications/${certId}/8a/social-disadvantage`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
              &larr; Previous: Social Disadvantage
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saved && <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>{"\u2713"} Saved</span>}
              <button
                onClick={() => saveAndNavigate(false)}
                disabled={saving}
                style={{ padding: "10px 24px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, color: "var(--ink3)", cursor: "pointer" }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => saveAndNavigate(true)}
                disabled={saving}
                style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
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
