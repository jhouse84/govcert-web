"use client";

import React, { useState } from "react";

/**
 * Section-specific guided questions/prompts that help generate better AI content.
 * Each section has checkboxes for what to emphasize + text prompts for specific details.
 */
const SECTION_GUIDES: Record<string, {
  title: string;
  description: string;
  checkboxes: { id: string; label: string; hint: string }[];
  prompts: { id: string; label: string; placeholder: string }[];
}> = {
  // GSA MAS Corporate Experience sections
  "company-overview": {
    title: "Company Overview",
    description: "Help the AI understand what makes your company unique. The more specific you are, the stronger the narrative.",
    checkboxes: [
      { id: "founding_story", label: "Include founding story", hint: "How and why the company was started" },
      { id: "mission_driven", label: "Emphasize mission/values", hint: "What drives your team beyond profit" },
      { id: "growth_trajectory", label: "Highlight growth trajectory", hint: "Show consistent revenue and capability growth" },
      { id: "geographic_reach", label: "Mention geographic coverage", hint: "Where you operate — local, regional, national" },
    ],
    prompts: [
      { id: "differentiator", label: "What makes your company different from competitors?", placeholder: "e.g., We're the only firm in the DMV that combines cybersecurity expertise with cleared personnel for DoD work..." },
      { id: "special_capabilities", label: "Any unique capabilities, certifications, or tools?", placeholder: "e.g., ISO 9001 certified, CMMI Level 3, proprietary risk assessment framework..." },
    ],
  },
  "corporate-experience": {
    title: "Corporate Experience",
    description: "This section demonstrates your company can perform the work. Be specific about contracts, agencies, and outcomes.",
    checkboxes: [
      { id: "federal_focus", label: "Emphasize federal contract experience", hint: "Prioritize DoD, civilian agencies" },
      { id: "commercial_mix", label: "Include commercial experience", hint: "Show breadth beyond government" },
      { id: "contract_types", label: "Mention contract types managed", hint: "FFP, T&M, cost-reimbursement, IDIQ" },
      { id: "clearances", label: "Highlight security clearances held", hint: "Secret, TS/SCI, facility clearance" },
    ],
    prompts: [
      { id: "best_contract", label: "Describe your most impressive contract in 2-3 sentences", placeholder: "e.g., $4.2M IT modernization contract with VA where we migrated 12,000 users to cloud infrastructure, completing 3 months ahead of schedule..." },
      { id: "key_agencies", label: "Which agencies know your work best?", placeholder: "e.g., Department of Defense (Army), VA, Department of Energy..." },
    ],
  },
  "management-personnel": {
    title: "Management & Personnel",
    description: "GSA wants to know your team can deliver. Highlight leadership experience and technical depth.",
    checkboxes: [
      { id: "owner_background", label: "Detail owner's background", hint: "Education, years of experience, industry expertise" },
      { id: "key_personnel", label: "Highlight key personnel", hint: "Project managers, technical leads, subject matter experts" },
      { id: "retention_rate", label: "Mention employee retention", hint: "Low turnover = stable delivery" },
      { id: "certifications", label: "List team certifications", hint: "PMP, CISSP, AWS, Agile, etc." },
    ],
    prompts: [
      { id: "team_strength", label: "What's your team's biggest strength?", placeholder: "e.g., Average 15 years of federal IT experience, 80% hold active Secret clearance, all PMs are PMP certified..." },
      { id: "hiring_approach", label: "How do you recruit and retain talent?", placeholder: "e.g., Competitive salaries, professional development budget, employee stock ownership..." },
    ],
  },
  "operations-controls": {
    title: "Operations & Controls",
    description: "Demonstrate your company has mature processes. GSA evaluates your ability to manage contracts responsibly.",
    checkboxes: [
      { id: "accounting_system", label: "Describe accounting system", hint: "QuickBooks, Deltek, DCAA-compliant" },
      { id: "project_management", label: "Project management methodology", hint: "Agile, Waterfall, hybrid, PMI-based" },
      { id: "compliance", label: "Compliance and regulatory adherence", hint: "FAR/DFARS, CUI handling, cyber compliance" },
      { id: "insurance", label: "Insurance coverage", hint: "General liability, professional liability, cyber insurance" },
    ],
    prompts: [
      { id: "qms_overview", label: "Briefly describe your quality management approach", placeholder: "e.g., ISO 9001-aligned QMS with quarterly internal audits, corrective action tracking, and customer satisfaction surveys..." },
      { id: "risk_management", label: "How do you manage project risks?", placeholder: "e.g., Risk register maintained for every project, monthly risk reviews with client, mitigation plans for top 5 risks..." },
    ],
  },
  "relevant-experience": {
    title: "Relevant Experience",
    description: "Tie your experience directly to the SINs you're offering. Each example should show you've done this exact work before.",
    checkboxes: [
      { id: "naics_alignment", label: "Align with primary NAICS codes", hint: "Show work directly in your NAICS areas" },
      { id: "sin_specific", label: "Reference specific SIN categories", hint: "Tie examples to the SINs on your schedule" },
      { id: "outcomes_focused", label: "Focus on measurable outcomes", hint: "Cost savings, efficiency gains, on-time delivery" },
      { id: "scale_variety", label: "Show range of project sizes", hint: "From small tasks to multi-million dollar programs" },
    ],
    prompts: [
      { id: "best_outcome", label: "What's the best outcome you've delivered for a client?", placeholder: "e.g., Reduced processing time by 60% for USDA's grant management system, saving $2M annually..." },
      { id: "recurring_clients", label: "Any clients who've awarded you repeat work?", placeholder: "e.g., VA has awarded us 3 consecutive task orders since 2021..." },
    ],
  },
  // 8(a) sections
  "social-disadvantage": {
    title: "Social Disadvantage Narrative",
    description: "This is the heart of your 8(a) application. Be specific and personal — SBA needs to see real incidents, not generalizations.",
    checkboxes: [
      { id: "education_incidents", label: "Include education-related incidents", hint: "Discrimination in schools, denial of opportunities" },
      { id: "employment_incidents", label: "Include employment-related incidents", hint: "Unequal pay, denied promotions, hostile environment" },
      { id: "business_incidents", label: "Include business-related incidents", hint: "Denied credit, lost contracts due to bias, exclusion" },
      { id: "ongoing_impact", label: "Emphasize ongoing impact (not resilience)", hint: "SBA wants to see the hurdle, not how you overcame it" },
    ],
    prompts: [
      { id: "incident_detail", label: "Describe your most significant experience with discrimination", placeholder: "e.g., In 2018, I was denied a business loan by XYZ Bank despite having stronger financials than a comparable non-minority applicant who was approved..." },
      { id: "business_impact", label: "How has this affected your ability to start or grow your business?", placeholder: "e.g., Without the loan, I had to self-fund operations for 2 years, limiting my ability to hire and pursue larger contracts..." },
    ],
  },
  "business-plan": {
    title: "Business Plan",
    description: "SBA wants to see a viable growth strategy. Focus on realistic goals and how 8(a) certification will help achieve them.",
    checkboxes: [
      { id: "market_analysis", label: "Include market analysis", hint: "Target agencies, market size, trends" },
      { id: "competitive_advantage", label: "Define competitive advantages", hint: "What you do better than others" },
      { id: "growth_strategy", label: "Detail growth strategy", hint: "How you plan to grow revenue 3-5 years" },
      { id: "eightA_leverage", label: "Explain how 8(a) helps", hint: "Sole source, set-asides, mentorship" },
    ],
    prompts: [
      { id: "target_market", label: "Who are your target government customers?", placeholder: "e.g., DoD components (Army, Navy), VA, DHS — we focus on IT modernization and cybersecurity services..." },
      { id: "revenue_goal", label: "What's your 3-year revenue goal?", placeholder: "e.g., Grow from $2.5M to $8M by Year 3 through a mix of 8(a) sole source contracts and competitive set-asides..." },
    ],
  },
};

// Fallback for sections not in the guide
const DEFAULT_GUIDE = {
  title: "Draft This Section",
  description: "Help the AI generate better content by providing some details about what to emphasize.",
  checkboxes: [
    { id: "be_specific", label: "Use specific numbers and examples", hint: "Dollar values, dates, agency names" },
    { id: "highlight_strengths", label: "Emphasize company strengths", hint: "What sets you apart" },
    { id: "keep_concise", label: "Keep it concise and professional", hint: "Government reviewers scan quickly" },
  ],
  prompts: [
    { id: "key_point", label: "What's the most important thing to convey in this section?", placeholder: "Tell us the key message you want this section to communicate..." },
  ],
};

interface Props {
  sectionId: string;
  sectionLabel: string;
  onGenerate: (guidance: { emphases: string[]; details: Record<string, string> }) => void;
  onClose: () => void;
  generating?: boolean;
}

export default function RedraftWizard({ sectionId, sectionLabel, onGenerate, onClose, generating }: Props) {
  const guide = SECTION_GUIDES[sectionId] || { ...DEFAULT_GUIDE, title: sectionLabel };
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function handleGenerate() {
    const emphases = Object.entries(checked).filter(([_, v]) => v).map(([k]) => {
      const cb = guide.checkboxes.find(c => c.id === k);
      return cb ? `${cb.label}: ${cb.hint}` : k;
    });
    onGenerate({ emphases, details: answers });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      backgroundColor: "rgba(11, 25, 41, 0.7)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        backgroundColor: "#FDF8F0",
        borderRadius: 16, width: "100%", maxWidth: 600,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        border: "1px solid rgba(180, 155, 80, 0.15)",
        maxHeight: "85vh", overflow: "auto",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0B1929, #1A2F45)",
          padding: "24px 28px 20px", borderRadius: "16px 16px 0 0",
        }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(200,155,60,.8)", marginBottom: 4 }}>
            AI Draft Assistant
          </div>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22, fontWeight: 400, color: "#fff", margin: 0,
          }}>
            {guide.title}
          </h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", margin: "6px 0 0", lineHeight: 1.5 }}>
            {guide.description}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 28px" }}>
          {/* Emphasis checkboxes */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 10 }}>
              What should we emphasize?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {guide.checkboxes.map(cb => (
                <label key={cb.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                  padding: "8px 12px", borderRadius: 8,
                  background: checked[cb.id] ? "rgba(200,155,60,.06)" : "transparent",
                  border: `1px solid ${checked[cb.id] ? "rgba(200,155,60,.2)" : "rgba(0,0,0,.05)"}`,
                  transition: "all .15s",
                }}>
                  <input
                    type="checkbox"
                    checked={!!checked[cb.id]}
                    onChange={e => setChecked(prev => ({ ...prev, [cb.id]: e.target.checked }))}
                    style={{ accentColor: "#C89B3C", marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{cb.label}</div>
                    <div style={{ fontSize: 11, color: "var(--ink4)" }}>{cb.hint}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Detail prompts */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 10 }}>
              Help us get specific
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {guide.prompts.map(p => (
                <div key={p.id}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", display: "block", marginBottom: 6 }}>
                    {p.label}
                  </label>
                  <textarea
                    value={answers[p.id] || ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder={p.placeholder}
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 12px",
                      border: "1px solid var(--border2)", borderRadius: 8,
                      fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.6, resize: "vertical", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, color: "var(--ink4)", fontStyle: "italic", marginBottom: 16, lineHeight: 1.5 }}>
            💡 The more detail you provide, the better the AI output. But you can skip anything you want — the AI will use your uploaded documents to fill gaps.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: "1px solid var(--border)",
        }}>
          <button onClick={onClose} disabled={generating} style={{
            padding: "10px 20px", borderRadius: 8,
            border: "1px solid var(--border2)", background: "transparent",
            fontSize: 13, color: "var(--ink3)", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={handleGenerate} disabled={generating} style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: generating ? "var(--ink4)" : "linear-gradient(135deg, #B49B50, #D4B850)",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: generating ? "default" : "pointer",
            boxShadow: generating ? "none" : "0 4px 16px rgba(180, 155, 80, 0.3)",
          }}>
            {generating ? "Generating..." : "✨ Generate Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
