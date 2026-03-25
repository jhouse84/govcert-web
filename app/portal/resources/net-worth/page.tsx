"use client";

import React, { useState } from "react";

function fmt(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function parseNum(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

const ASSET_FIELDS = [
  { key: "cash", label: "Cash & Checking Accounts", hint: "All bank checking and savings accounts" },
  { key: "savings", label: "Savings & CDs", hint: "Savings accounts, money market, certificates of deposit" },
  { key: "retirement", label: "Retirement Accounts (IRA, 401k)", hint: "Total current value of all retirement accounts" },
  { key: "stocks", label: "Stocks, Bonds & Investments", hint: "Brokerage accounts, mutual funds, investment portfolios" },
  { key: "realEstate", label: "Real Estate (Market Value)", hint: "Current market value of all property you own (home, rental, land)" },
  { key: "vehicles", label: "Vehicles", hint: "Cars, trucks, boats — use current resale value, not purchase price" },
  { key: "businessEquity", label: "Business Equity", hint: "Your ownership share of any business (your % x company net worth)" },
  { key: "otherAssets", label: "Other Assets", hint: "Life insurance cash value, collectibles, equipment, other valuables" },
];

const LIABILITY_FIELDS = [
  { key: "mortgage", label: "Mortgages", hint: "Remaining balance on all mortgages" },
  { key: "autoLoans", label: "Auto Loans", hint: "Remaining balance on vehicle loans" },
  { key: "studentLoans", label: "Student Loans", hint: "Federal and private student loan balances" },
  { key: "creditCards", label: "Credit Card Balances", hint: "Total outstanding credit card debt" },
  { key: "personalLoans", label: "Personal Loans", hint: "Lines of credit, personal loans, family loans" },
  { key: "businessLoans", label: "Business Loans (personal guarantee)", hint: "Only if you personally guaranteed the loan" },
  { key: "otherDebts", label: "Other Debts", hint: "Tax liens, judgments, medical debt, other obligations" },
];

export default function NetWorthCalculatorPage() {
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [liabilities, setLiabilities] = useState<Record<string, string>>({});

  const totalAssets = ASSET_FIELDS.reduce((sum, f) => sum + parseNum(assets[f.key] || ""), 0);
  const totalLiabilities = LIABILITY_FIELDS.reduce((sum, f) => sum + parseNum(liabilities[f.key] || ""), 0);
  const netWorth = totalAssets - totalLiabilities;

  const sbaEligible = netWorth < 850000;
  const edwosbEligible = netWorth < 850000;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a href="/portal/eligibility/results" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
          &larr; Back to Eligibility Results
        </a>

        <div style={{ marginTop: 20, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
            Resource Guide
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
            How to Calculate Your Net Worth
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.7 }}>
            Several SBA certification programs require you to report your personal net worth. This calculator walks you through the process step by step.
          </p>
        </div>

        {/* Explainer */}
        <div style={{ background: "linear-gradient(135deg, #0B1929, #1A2F45)", borderRadius: 14, padding: "24px 28px", marginBottom: 28, color: "#fff" }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, margin: "0 0 12px" }}>What is net worth?</h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)", lineHeight: 1.7, margin: 0 }}>
            Your personal net worth is simply <strong style={{ color: "#E8B84B" }}>everything you own minus everything you owe</strong>. The SBA uses this figure to determine economic disadvantage for programs like 8(a) and EDWOSB. For 8(a), your personal net worth must be <strong style={{ color: "#E8B84B" }}>under $850,000</strong> (excluding your primary residence equity and your ownership interest in the applicant business).
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,.08)", fontSize: 12, color: "rgba(255,255,255,.5)" }}>
              8(a) threshold: &lt; $850,000
            </div>
            <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,.08)", fontSize: 12, color: "rgba(255,255,255,.5)" }}>
              EDWOSB threshold: &lt; $850,000
            </div>
            <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,.08)", fontSize: 12, color: "rgba(255,255,255,.5)" }}>
              Primary residence equity: excluded
            </div>
          </div>
        </div>

        {/* Important notes */}
        <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: 10, padding: "16px 20px", marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--amber)", marginBottom: 6 }}>Important Notes</div>
          <ul style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
            <li>This calculator is for <strong>estimation purposes only</strong>. Your official net worth calculation must be documented on <a href="https://www.sba.gov/document/sba-form-413-personal-financial-statement" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>SBA Form 413</a>.</li>
            <li>The SBA <strong>excludes your primary residence equity</strong> from the net worth calculation for 8(a).</li>
            <li>Your ownership interest in the applicant business is also excluded.</li>
            <li>Net worth is calculated on the <strong>date of application</strong>, not annually.</li>
            <li>Consult a CPA or financial advisor for your official filing.</li>
          </ul>
        </div>

        {/* Assets */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 24, boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "16px 24px", background: "var(--navy)" }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#fff" }}>Step 1: Your Assets</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Everything you own — enter current market values</div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {ASSET_FIELDS.map(f => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink4)" }}>{f.hint}</div>
                </div>
                <div style={{ position: "relative", width: 180 }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink3)" }}>$</span>
                  <input
                    type="text"
                    value={assets[f.key] || ""}
                    onChange={e => setAssets(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="0"
                    style={{ width: "100%", padding: "8px 10px 8px 22px", border: "1px solid var(--border2)", borderRadius: 6, fontSize: 13, textAlign: "right", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            ))}
            <div style={{ borderTop: "2px solid var(--navy)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Total Assets</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)", fontFamily: "'DM Mono', monospace" }}>{fmt(totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 24, boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "16px 24px", background: "var(--navy)" }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#fff" }}>Step 2: Your Liabilities</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Everything you owe — enter outstanding balances</div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {LIABILITY_FIELDS.map(f => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink4)" }}>{f.hint}</div>
                </div>
                <div style={{ position: "relative", width: 180 }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink3)" }}>$</span>
                  <input
                    type="text"
                    value={liabilities[f.key] || ""}
                    onChange={e => setLiabilities(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="0"
                    style={{ width: "100%", padding: "8px 10px 8px 22px", border: "1px solid var(--border2)", borderRadius: 6, fontSize: 13, textAlign: "right", fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            ))}
            <div style={{ borderTop: "2px solid var(--navy)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Total Liabilities</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#C83C3C", fontFamily: "'DM Mono', monospace" }}>{fmt(totalLiabilities)}</span>
            </div>
          </div>
        </div>

        {/* Result */}
        <div style={{
          background: netWorth < 850000 ? "linear-gradient(135deg, #065F46, #047857)" : "linear-gradient(135deg, #7C2D12, #9A3412)",
          borderRadius: 14, padding: "28px 32px", marginBottom: 28, color: "#fff", textAlign: "center",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>
            Your Estimated Net Worth
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
            {fmt(netWorth)}
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.7)" }}>
            {fmt(totalAssets)} in assets &minus; {fmt(totalLiabilities)} in liabilities
          </div>
          <div style={{ marginTop: 16, padding: "10px 20px", borderRadius: 8, background: "rgba(255,255,255,.1)", display: "inline-block" }}>
            {sbaEligible ? (
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                &#10003; Below the $850,000 SBA threshold for 8(a) and EDWOSB
              </span>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                &#10007; Above the $850,000 SBA threshold &mdash; but remember: primary residence equity and applicant business equity are excluded
              </span>
            )}
          </div>
        </div>

        {/* What to do next */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "24px 28px", boxShadow: "var(--shadow)" }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, margin: "0 0 16px" }}>
            What to do with this number
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { step: "1", text: "Download and complete SBA Form 413 with these figures", link: "https://www.sba.gov/document/sba-form-413-personal-financial-statement" },
              { step: "2", text: "Gather supporting documentation: bank statements, investment account statements, property assessments, and loan statements" },
              { step: "3", text: "Consider consulting a CPA to verify your calculation before submitting" },
              { step: "4", text: "Upload your completed Form 413 and supporting documents to GovCert", link: "/portal/documents" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 24, height: 24, borderRadius: 12, background: "var(--gold)", color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.step}</span>
                <div>
                  <span style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 }}>{item.text}</span>
                  {item.link && (
                    <a href={item.link} target={item.link.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer"
                      style={{ display: "block", fontSize: 12, color: "var(--gold)", fontWeight: 500, textDecoration: "none", marginTop: 2 }}>
                      {item.link.startsWith("/") ? "Go to Documents \u2192" : "Download Form 413 \u2197"}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
