"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { usePaywall } from "@/lib/usePaywall";
import PaywallModal from "@/components/PaywallModal";
import FinancialReadiness from "@/components/FinancialReadiness";

// GSA eOffer field mapping — mirrors the EXACT eOffer submission flow
const EOFFER_FIELDS = [
  /* ─── PREREQUISITES ─── */
  {
    tab: "Step 0 — Prerequisites",
    tabColor: "var(--ink3)",
    tabBg: "var(--cream2)",
    fields: [
      { id: "prereq_pathways", label: "Pathways to Success Training", source: "static", staticValue: "You must complete GSA's free \"Pathways to Success\" training before submitting. This is a web-based seminar available on the Vendor Support Center (vsc.gsa.gov). Save your completion certificate — you'll upload it to eOffer.", charLimit: null, instructions: "Go to vsc.gsa.gov → Vendor Training → Pathways to Success. Complete the course and download the certificate PDF. This is a mandatory prerequisite — GSA will reject offers without it." },
      { id: "prereq_digitalcert", label: "Digital Certificate", source: "static", staticValue: "eOffer requires a digital certificate (not a password) for login and signing. You must request one through the GSA Vendor Support Center. Processing takes 1-3 business days. Install the .p12 file in your browser's certificate store.", charLimit: null, instructions: "Request at vsc.gsa.gov → Digital Certificates. You get 2 free certificates per UEI. Once received, import the .p12 file: Chrome/Edge → Settings → Privacy → Manage Certificates → Import. You cannot access eOffer without this." },
      { id: "prereq_sam", label: "SAM.gov Registration (Active)", source: "static", staticValue: "Your SAM.gov registration must be active with current NAICS codes matching your proposed SINs. Your UEI, CAGE code, and business information must match exactly what you enter in eOffer. Renew annually.", charLimit: null, instructions: "Log into sam.gov and verify your registration is active. eOffer pulls your data from SAM — if there's a mismatch, update SAM first and wait 24-48 hours for sync." },
    ]
  },

  /* ─── EOFFER STEP 1 — CORPORATE INFO ─── */
  {
    tab: "Step 1 — Corporate Information",
    tabColor: "var(--blue)",
    tabBg: "var(--blue-bg)",
    fields: [
      { id: "businessName", label: "Legal Business Name", source: "client", key: "businessName", charLimit: 100, instructions: "Enter your company's legal name exactly as it appears on your SAM.gov registration. eOffer pre-fills this from SAM — verify it matches." },
      { id: "ein", label: "EIN / Tax ID", source: "client", key: "ein", charLimit: 20, instructions: "9-digit Employer Identification Number from the IRS. Format: XX-XXXXXXX." },
      { id: "uei", label: "Unique Entity Identifier (UEI)", source: "client", key: "uei", charLimit: 12, instructions: "12-character UEI from your SAM.gov registration. This replaced DUNS as of April 2022." },
      { id: "cageCode", label: "CAGE Code", source: "client", key: "cageCode", charLimit: 5, instructions: "5-character Commercial and Government Entity code. Auto-assigned when you register in SAM.gov." },
    ]
  },

  /* ─── EOFFER STEP 2 — AUTHORIZED NEGOTIATORS ─── */
  {
    tab: "Step 2 — Authorized Negotiators",
    tabColor: "var(--navy)",
    tabBg: "rgba(26,35,50,.06)",
    fields: [
      { id: "neg_name", label: "Negotiator Full Name", source: "appField", appKey: "negotiatorName", charLimit: 100, instructions: "The person authorized to negotiate and bind the company to a GSA contract. This can be the owner, a VP, or an external consultant. eOffer requires at least one negotiator with signature authority." },
      { id: "neg_title", label: "Title", source: "appField", appKey: "negotiatorTitle", charLimit: 50, instructions: "Job title of the authorized negotiator (e.g., President, CEO, Managing Director)." },
      { id: "neg_email", label: "Email", source: "appField", appKey: "negotiatorEmail", charLimit: 100, instructions: "Email address for the negotiator. GSA will use this for all communications during offer review." },
      { id: "neg_phone", label: "Phone", source: "appField", appKey: "negotiatorPhone", charLimit: 20, instructions: "Direct phone number for the negotiator. GSA contracting officers may call during review." },
      { id: "neg_signature", label: "Has Signature Authority?", source: "appField", appKey: "negotiatorSignature", charLimit: 3, instructions: "Enter 'Yes' if this person can sign the contract on behalf of the company. At least one negotiator must have signature authority." },
    ]
  },

  /* ─── EOFFER STEP 3 — SIN SELECTION ─── */
  {
    tab: "Step 3 — SINs & Offerings",
    tabColor: "var(--purple)",
    tabBg: "var(--purple-bg)",
    fields: [
      { id: "sin_selection", label: "Selected SINs", source: "static", staticValue: "Your SIN selections are configured on the Application Dashboard. In eOffer, you'll select the same SINs under Goods/Services. You'll also need to designate a Preponderance of Work (your primary SIN) and a NAICS code for each SIN.", charLimit: null, instructions: "In eOffer → Goods/Services: Select your Large Category first, then Subcategory, then your SINs. Designate your primary SIN as Preponderance of Work. GovCert shows your selected SINs on the dashboard." },
    ]
  },

  /* ─── EOFFER STEP 4 — STANDARD RESPONSES ─── */
  {
    tab: "Step 4 — Standard Responses",
    tabColor: "var(--teal)",
    tabBg: "var(--teal-bg)",
    fields: [
      { id: "std_disaster", label: "Disaster Purchasing (Recommended: Yes)", source: "appField", appKey: "stdDisasterPurchasing", charLimit: 5, instructions: "eOffer asks: 'Will you participate in Disaster Purchasing?' GovCert recommends YES — it expands your contract opportunities and costs nothing. Select Yes in the dropdown on eOffer." },
      { id: "std_exceptions_tc", label: "Exceptions to Terms & Conditions (Recommended: No)", source: "appField", appKey: "stdExceptionsTC", charLimit: 5, instructions: "eOffer asks: 'Do you take any exceptions to the terms and conditions?' GovCert recommends NO — exceptions add complexity and can delay your offer by weeks or months. If you must take exceptions, consult with a contracts attorney first." },
      { id: "std_exceptions_reps", label: "Exceptions to Certs & Reps (Recommended: No)", source: "appField", appKey: "stdExceptionsReps", charLimit: 5, instructions: "eOffer asks: 'Do you take any exceptions to the Certifications and Representations?' GovCert recommends NO. Exceptions here are unusual and may trigger additional review." },
      { id: "std_min_order", label: "Minimum Order Value", source: "appField", appKey: "stdMinOrder", charLimit: 20, instructions: "The lowest dollar amount you'll accept for an individual order on your GSA Schedule. GovCert suggests a value based on your pricing — most services contractors set $100-$500. Setting it too high can limit orders." },
      { id: "std_subcontract", label: "Subcontracting Plan Required?", source: "appField", appKey: "stdSubcontractPlan", charLimit: 5, instructions: "Only required if you are NOT a small business AND expect annual GSA sales over $750K. If you are a small business, select 'Small Business Exempt' in eOffer. If required, upload a subcontracting plan in FAR 52.219-9 format." },
    ]
  },

  /* ─── EOFFER STEP 5 — SOLICITATION CLAUSES ─── */
  {
    tab: "Step 5 — Solicitation Clauses",
    tabColor: "var(--ink3)",
    tabBg: "rgba(26,35,50,.04)",
    fields: [
      { id: "clause_taa", label: "Trade Agreements Act (TAA) Compliance", source: "appField", appKey: "clauseTAA", charLimit: 5, instructions: "Confirm that your products/services comply with the TAA — meaning they are made or substantially transformed in the US or a designated country. Most professional services firms comply automatically. Enter 'Yes' to confirm." },
      { id: "clause_pop", label: "Place of Performance", source: "appField", appKey: "clausePOP", charLimit: 200, instructions: "Where will work be performed? For professional services, this is typically your office address. Enter your primary business address or 'Various locations nationwide.'" },
      { id: "clause_sca", label: "Service Contract Labor Standards", source: "appField", appKey: "clauseSCA", charLimit: 5, instructions: "Acknowledge compliance with Service Contract Act labor standards. For professional services (exempt from SCA), enter 'Professional Exemption Applies'. For non-exempt services, ensure your rates meet prevailing wage requirements." },
      { id: "clause_smallbiz", label: "Small Business Representation", source: "appField", appKey: "clauseSmallBiz", charLimit: 50, instructions: "Confirm your small business status and any applicable certifications (8(a), WOSB, VOSB, HUBZone, SDVOSB). This must match your SAM.gov registration exactly. Enter your designation or 'Other than Small Business'." },
    ]
  },

  /* ─── EOFFER STEP 6 — SOLICITATION PROVISIONS (NARRATIVES) ─── */
  {
    tab: "Step 6a — Corporate Experience",
    tabColor: "var(--purple)",
    tabBg: "var(--purple-bg)",
    fields: [
      { id: "corp_overview", label: "Company Overview", source: "narrativeCorp", narrativeKey: "overview", charLimit: 1500, instructions: "Paste into eOffer → Solicitation Provisions → Corporate Experience → Overview." },
      { id: "corp_capabilities", label: "Core Capabilities & Services", source: "narrativeCorp", narrativeKey: "capabilities", charLimit: 1500, instructions: "Paste into the 'Capabilities' field." },
      { id: "corp_employees", label: "Employee Experience & Qualifications", source: "narrativeCorp", narrativeKey: "employees", charLimit: 1500, instructions: "Paste into the 'Employee Experience' field." },
      { id: "corp_org", label: "Organizational & Accounting Controls", source: "narrativeCorp", narrativeKey: "org_controls", charLimit: 1000, instructions: "Paste into the 'Organizational Controls' field." },
      { id: "corp_resources", label: "Resources & Capacity", source: "narrativeCorp", narrativeKey: "resources", charLimit: 800, instructions: "Paste into the 'Resources' field." },
      { id: "corp_past", label: "Summary of Past Projects", source: "narrativeCorp", narrativeKey: "past_projects", charLimit: 1500, instructions: "Paste into the 'Past Projects' field." },
      { id: "corp_marketing", label: "Federal Marketing Plan", source: "narrativeCorp", narrativeKey: "marketing", charLimit: 800, instructions: "Paste into the 'Marketing Plan' field." },
      { id: "corp_subs", label: "Subcontractor Management", source: "narrativeCorp", narrativeKey: "subcontractors", charLimit: 400, instructions: "Paste into the 'Subcontractor Management' field." },
    ]
  },
  {
    tab: "Step 6b — Quality Control Plan",
    tabColor: "var(--teal)",
    tabBg: "var(--teal-bg)",
    fields: [
      { id: "qcp_overview", label: "Quality Control Overview", source: "narrativeQCP", narrativeKey: "overview", charLimit: 2000, instructions: "Paste into eOffer → Solicitation Provisions → Quality Control → Overview." },
      { id: "qcp_supervision", label: "Direct Supervision of Projects", source: "narrativeQCP", narrativeKey: "supervision", charLimit: 2000, instructions: "Paste into the 'Supervision' field." },
      { id: "qcp_personnel", label: "Quality Control Personnel", source: "narrativeQCP", narrativeKey: "personnel", charLimit: 1500, instructions: "Paste into the 'QC Personnel' field." },
      { id: "qcp_subs", label: "Subcontractor Quality Management", source: "narrativeQCP", narrativeKey: "subcontractors", charLimit: 1500, instructions: "Paste into the 'Subcontractor QC' field." },
      { id: "qcp_corrective", label: "Problem Areas & Corrective Action", source: "narrativeQCP", narrativeKey: "corrective", charLimit: 1500, instructions: "Paste into the 'Corrective Action' field." },
      { id: "qcp_urgent", label: "Urgent Requirements & Simultaneous Projects", source: "narrativeQCP", narrativeKey: "urgent", charLimit: 1000, instructions: "Paste into the 'Urgent Requirements' field." },
    ]
  },
  {
    tab: "Step 6c — Relevant Project Experience",
    tabColor: "var(--purple)",
    tabBg: "var(--purple-bg)",
    fields: [
      { id: "rpe_instructions", label: "SIN-Specific Project Experience (10,000 chars per SIN)", source: "static", staticValue: "Each SIN requires its own Relevant Project Experience narrative. These are drafted on the Past Performance page and pasted into eOffer under each SIN. Your SIN narratives appear in the Copy Narratives section below.", charLimit: null, instructions: "In eOffer → Solicitation Provisions → Relevant Project Experience: Each SIN has a separate 10,000-character text field. Paste the corresponding narrative from the copy section below." },
    ]
  },

  /* ─── EOFFER STEP 7 — UPLOADS ─── */
  {
    tab: "Step 7a — Past Performance Uploads",
    tabColor: "var(--amber)",
    tabBg: "var(--amber-bg)",
    fields: [
      { id: "pp_instructions", label: "Past Performance References (3+ CPARS or PPQs)", source: "static", staticValue: "Upload 3 past performance references as CPARS reports or completed PPQs. Each reference must be a separate PDF. Drag and drop files below or download them from your GovCert uploads.", charLimit: null, instructions: "In eOffer → Upload Documents: Upload each CPARS report or completed PPQ as a separate PDF. Minimum 3 references required." },
    ]
  },
  {
    tab: "Step 7b — Financial Statements",
    tabColor: "var(--green)",
    tabBg: "var(--green-bg)",
    fields: [
      { id: "fin_instructions", label: "2 Years P&L + Balance Sheet", source: "static", staticValue: "Upload your most recent 2 years of Profit & Loss statements and Balance Sheets as PDF files. Must show company name, period covered, and be signed or on CPA letterhead.", charLimit: null, instructions: "In eOffer → Upload Documents: Upload financial statements as PDF. One file per year or combined. Must include BOTH P&L AND Balance Sheet for each year." },
    ]
  },
  {
    tab: "Step 7c — CSP-1 Pricelist",
    tabColor: "var(--green)",
    tabBg: "var(--green-bg)",
    fields: [
      { id: "pricing_instructions", label: "CSP-1 Commercial Supplier Pricelist", source: "static", staticValue: "Export your CSP-1 from the Pricing page and upload the Excel/CSV file to eOffer. This contains your labor categories, MFC pricing, and proposed GSA rates.", charLimit: null, instructions: "In eOffer → Upload Documents: Upload the CSP-1 Excel file you exported from GovCert. Do not paste pricing data manually — the formatted file is required." },
    ]
  },
  {
    tab: "Step 7d — Additional Required Documents",
    tabColor: "var(--ink3)",
    tabBg: "rgba(26,35,50,.04)",
    fields: [
      { id: "doc_negotiator_letter", label: "Authorized Negotiator Letter", source: "static", staticValue: "A letter on company letterhead designating who is authorized to negotiate and bind the company. Must be signed by a corporate officer (CEO/President). Even if you are the owner AND negotiator, you still need this letter.", charLimit: null, instructions: "In eOffer → Upload Documents: Upload as PDF. Must include: company name, negotiator name and title, contact info, authorizing officer signature, and date." },
      { id: "doc_pathways", label: "Pathways to Success Certificate", source: "static", staticValue: "Upload your completion certificate from GSA's Pathways to Success training. This is a mandatory prerequisite.", charLimit: null, instructions: "In eOffer → Upload Documents: Upload the certificate PDF you saved from vsc.gsa.gov training completion." },
      { id: "doc_tech_proposal", label: "Technical Proposal / Capability Statement", source: "static", staticValue: "A formal document summarizing your technical approach and relevant experience for each SIN. Your capability statement can serve as a starting point — tailor it to your proposed SINs.", charLimit: null, instructions: "In eOffer → Upload Documents → Technical Proposal: Upload as a single PDF. Should directly address each SIN category you are proposing." },
      { id: "doc_price_proposal", label: "Price Proposal / Commercial Sales Practices", source: "static", staticValue: "A document showing how you arrived at your GSA pricing. Includes your commercial price list, discount structure, and basis for your proposed GSA discount off MFC rates.", charLimit: null, instructions: "In eOffer → Upload Documents → Price Proposal: Upload as PDF alongside your CSP-1. Include commercial rate card, MFC identification, and discount rationale." },
      { id: "doc_subcontract", label: "Subcontracting Plan (if applicable)", source: "static", staticValue: "Required only if you are NOT a small business and expect annual GSA sales over $750K. Must follow FAR 52.219-9 format with specific small business subcontracting goals.", charLimit: null, instructions: "In eOffer → Upload Documents: Upload as PDF if required. If you are a small business, you are exempt — select 'Small Business Exempt' in eOffer." },
    ]
  },

  /* ─── EOFFER STEP 8 — SUBMIT ─── */
  {
    tab: "Step 8 — Review & Submit",
    tabColor: "var(--gold)",
    tabBg: "rgba(200,155,60,.08)",
    fields: [
      { id: "submit_instructions", label: "Final Submission", source: "static", staticValue: "Review all sections in eOffer. Click 'Submit Proposal' to send your offer to GSA. Your digital certificate will be used to sign the submission. After submission, respond promptly to any GSA requests for clarification or additional documentation.", charLimit: null, instructions: "Before clicking Submit: verify all fields are populated, all documents are uploaded, your digital certificate is installed, and all solicitation clauses are acknowledged. Save a copy of the submission confirmation." },
    ]
  },
];

const GSA_MAS_CHECKLIST = [
  /* ── PREREQUISITES ── */
  { id: "pathwaysTraining", label: "1. Pathways to Success Training Certificate", section: "prerequisite", field: null,
    what: "Mandatory free training from GSA. You must complete it and save the certificate BEFORE you can submit an offer.",
    where: "Go to vsc.gsa.gov → Vendor Training → Pathways to Success. It's a web-based seminar. Download the completion certificate as PDF when done.",
    sbaPortal: "Upload the certificate PDF in eOffer → Upload Documents. GSA will reject your offer without this.",
    format: "PDF certificate. Download it immediately after completing the training.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "digitalCert", label: "2. Digital Certificate (for eOffer login & signing)", section: "prerequisite", field: null,
    what: "A digital certificate that lets you log into eoffer.gsa.gov and digitally sign your submission. Standard username/password will NOT work.",
    where: "Request at vsc.gsa.gov → Digital Certificates. Processing takes 1-3 business days. You get 2 free certificates per UEI.",
    sbaPortal: "Install the .p12 file in your browser: Chrome/Edge → Settings → Privacy & Security → Manage Certificates → Import. You cannot access eOffer without this.",
    format: "Digital file (.p12 or .pfx) installed in your browser. No upload to eOffer — it authenticates automatically when you log in.",
    docCategory: null,
  },
  { id: "samRegistration", label: "3. SAM.gov Registration (Active, Matching NAICS)", section: "prerequisite", field: null,
    what: "Active SAM.gov registration with current NAICS codes matching your proposed SINs. Your UEI, CAGE code, and business info must be up to date.",
    where: "Log into sam.gov and verify registration is active. Check NAICS codes, business size, and entity info. Renewals are required annually.",
    sbaPortal: "eOffer pulls your data from SAM. If there's a mismatch, update SAM first and wait 24-48 hours for sync.",
    format: "No upload. Print your SAM.gov entity registration summary as a backup.",
    docCategory: null,
  },

  /* ── DOCUMENTS FOR UPLOAD ── */
  { id: "financialStatements", label: "4. Financial Statements (2 Years P&L + Balance Sheet)", section: "upload", field: null,
    what: "Profit & Loss statements and Balance Sheets for the 2 most recent fiscal years. GSA verifies your financial stability.",
    where: "Your accountant or QuickBooks. Must show company name, period covered, and be signed or on CPA letterhead.",
    sbaPortal: "eOffer → Upload Documents. Upload as PDF.",
    format: "PDF. One file per year or combined. Must include BOTH P&L AND Balance Sheet for each year.",
    docCategory: "FINANCIAL_STATEMENT",
  },
  { id: "pastPerformance", label: "5. Past Performance References (3+ CPARS or PPQs)", section: "upload", field: null,
    what: "Minimum 3 past performance references. Each must be a CPARS report or completed PPQ. These go in eOffer under Upload Documents.",
    where: "Federal: download CPARS from cpars.gov. Commercial: use GovCert's PPQ email feature on the Past Performance page.",
    sbaPortal: "eOffer → Upload Documents. Upload each as a separate PDF. Minimum 3 required.",
    format: "PDF. Each reference as a separate file.",
    docCategory: ["PPQ_RESPONSE", "PPQ_COMPLETED", "CPARS_REPORT"],
  },
  { id: "csp1", label: "6. CSP-1 Pricelist (Excel/CSV)", section: "upload", field: null,
    what: "Your proposed pricing in GSA's CSP-1 format with labor categories, MFC pricing, and proposed GSA rates.",
    where: "GovCert's Pricing page builds this. Use the 'Download CSP-1' button below.",
    sbaPortal: "eOffer → Upload Documents. Upload the Excel/CSV file.",
    format: "Excel (.xlsx) or CSV. Use the GovCert export — do not paste pricing manually.",
    docCategory: null,
  },
  { id: "priceProposal", label: "7. Price Proposal / Commercial Sales Practices", section: "upload", field: null,
    what: "Document showing how you arrived at your GSA pricing. Commercial price list, MFC identification, discount rationale.",
    where: "Your commercial rate card plus documentation of MFC discounts. GSA expects a discount off your MFC pricing.",
    sbaPortal: "eOffer → Upload Documents → Price Proposal. Upload alongside your CSP-1.",
    format: "PDF. Include commercial price list, MFC identification, discount rationale, and supporting invoices.",
    docCategory: "INVOICE",
  },
  { id: "authNegotiator", label: "8. Authorized Negotiator Letter", section: "upload", field: null,
    what: "Letter on company letterhead designating who can negotiate and bind the company. Must be signed by a corporate officer.",
    where: "Draft on your letterhead. Include negotiator's name, title, phone, email. Even if you are the owner AND negotiator, you still need this.",
    sbaPortal: "eOffer → Upload Documents → Authorized Negotiator Letter.",
    format: "PDF on company letterhead. Must include: company name, negotiator name/title, contact info, signature, date.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },
  { id: "technicalProposal", label: "9. Technical Proposal / Capability Statement", section: "upload", field: null,
    what: "Formal document summarizing your technical approach and relevant experience for each proposed SIN.",
    where: "Your existing capability statement tailored to your proposed SINs. Include ISO, CMMI, or other certifications.",
    sbaPortal: "eOffer → Upload Documents → Technical Proposal. Upload as single PDF.",
    format: "PDF. 10-25 pages. Should directly address each SIN you are proposing.",
    docCategory: "CAPABILITY_STATEMENT",
  },
  { id: "subconPlan", label: "10. Subcontracting Plan (if >$750K & not small biz)", section: "upload", field: null,
    what: "Required ONLY if you are NOT a small business AND expect >$750K annual GSA sales. Describes subcontracting goals.",
    where: "Use SBA's subcontracting plan template from sba.gov. Set realistic small business subcontracting goals.",
    sbaPortal: "eOffer → Upload Documents. If small business, select 'Small Business Exempt'.",
    format: "PDF in FAR 52.219-9 format. Include dollar and percentage goals for each small business category.",
    docCategory: "CERTIFICATION_DOCUMENT",
  },

  /* ── NARRATIVES (copy/paste, not upload) ── */
  { id: "corpExperience", label: "11. Corporate Experience Narrative (paste into eOffer)", section: "narrative", field: null,
    what: "Your company's history, capabilities, key personnel, and relevant experience. Pasted directly into eOffer text fields.",
    where: "GovCert drafted this in the Corporate Experience section. Review and copy from the section below.",
    sbaPortal: "eOffer → Solicitation Provisions → Corporate Experience. Paste directly — 10,000 char limit.",
    format: "Text (pasted into eOffer). Use the Copy buttons in the section below.",
    docCategory: null,
  },
  { id: "qcp", label: "12. Quality Control Plan (paste into eOffer)", section: "narrative", field: null,
    what: "Your QC approach, supervision, personnel qualifications, corrective actions, subcontractor oversight.",
    where: "GovCert drafted this in the QCP section. Review and copy from the section below.",
    sbaPortal: "eOffer → Solicitation Provisions → Quality Control. Paste directly — 10,000 char limit.",
    format: "Text (pasted into eOffer). Use the Copy buttons in the section below.",
    docCategory: null,
  },
  { id: "sinNarratives", label: "13. Relevant Project Experience (1 per SIN, paste into eOffer)", section: "narrative", field: null,
    what: "A 10,000-char narrative per SIN describing relevant project experience. Separate from past performance references.",
    where: "GovCert drafts these on the Past Performance page → Area 2. Copy from the section below.",
    sbaPortal: "eOffer → Solicitation Provisions → Relevant Project Experience. Each SIN has its own text field.",
    format: "Text (pasted into eOffer). 10,000 chars per SIN.",
    docCategory: null,
  },
];

function extractNarrativeField(narrativeJson: string | undefined, key: string): string {
  if (!narrativeJson) return "";
  try {
    const parsed = JSON.parse(narrativeJson);
    // Handle both old format (direct keys) and new format (narratives + guidedAnswers)
    if (parsed.narratives) return parsed.narratives[key] || "";
    if (parsed.answers) return parsed.answers[key] || "";
    return parsed[key] || "";
  } catch {
    return "";
  }
}

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<string | null>("Tab 1 — Company Information");
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});
  const [clientDocs, setClientDocs] = useState<Record<string, any[]>>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pw = usePaywall("GSA_MAS");

  // Editable company info
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyEdits, setCompanyEdits] = useState<Record<string, string>>({});
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  // Inline editing for ALL fields
  const [inlineEdits, setInlineEdits] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);

  // SIN narratives (from past performance page)
  const [sinNarratives, setSinNarratives] = useState<Record<string, string>>({});

  // CSP-1 / pricing LCATs
  const [lcats, setLcats] = useState<any[]>([]);

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
      // Parse LCATs from pricingData
      if (data.application?.pricingData) {
        try {
          const pd = JSON.parse(data.application.pricingData);
          if (Array.isArray(pd)) setLcats(pd);
          else if (pd.lcats && Array.isArray(pd.lcats)) setLcats(pd.lcats);
        } catch {}
      }
      // Pre-populate recommended eOffer Standard Responses if not yet set
      if (data.application) {
        let eofferData: any = {};
        try { eofferData = JSON.parse(data.application.eofferData || "{}"); } catch {}
        let needsSave = false;

        // Negotiator defaults from client/user data
        if (!eofferData.negotiatorName && data.client) {
          const owner = data.client.primaryContact || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
          if (owner) { eofferData.negotiatorName = owner; needsSave = true; }
        }
        if (!eofferData.negotiatorEmail && (data.client?.email || user?.email)) {
          eofferData.negotiatorEmail = data.client?.email || user?.email; needsSave = true;
        }
        if (!eofferData.negotiatorPhone && data.client?.phone) {
          eofferData.negotiatorPhone = data.client.phone; needsSave = true;
        }
        if (!eofferData.negotiatorSignature) {
          eofferData.negotiatorSignature = "Yes"; needsSave = true;
        }

        // Standard Responses — recommended defaults
        if (!eofferData.stdDisasterPurchasing) {
          eofferData.stdDisasterPurchasing = "Yes"; needsSave = true;
        }
        if (!eofferData.stdExceptionsTC) {
          eofferData.stdExceptionsTC = "No"; needsSave = true;
        }
        if (!eofferData.stdExceptionsReps) {
          eofferData.stdExceptionsReps = "No"; needsSave = true;
        }
        if (!eofferData.stdSubcontractPlan) {
          eofferData.stdSubcontractPlan = "Small Business Exempt"; needsSave = true;
        }
        // Minimum order — suggest based on pricing data
        if (!eofferData.stdMinOrder) {
          let suggestedMin = "$250.00";
          try {
            const pd = JSON.parse(data.application.pricingData || "{}");
            const lcatArr = pd.lcats || (Array.isArray(pd) ? pd : []);
            if (lcatArr.length > 0) {
              const rates = lcatArr.map((l: any) => parseFloat(l.gsaRate || l.mfcRate || l.baseRate || "0")).filter((r: number) => r > 0);
              if (rates.length > 0) {
                const avgRate = rates.reduce((a: number, b: number) => a + b, 0) / rates.length;
                // Suggest minimum order = ~2 hours of average rate, rounded to nearest $50
                const suggested = Math.round((avgRate * 2) / 50) * 50;
                suggestedMin = `$${Math.max(100, Math.min(500, suggested)).toFixed(2)}`;
              }
            }
          } catch {}
          eofferData.stdMinOrder = suggestedMin;
          needsSave = true;
        }
        // Solicitation Clauses — recommended defaults
        if (!eofferData.clauseTAA) {
          eofferData.clauseTAA = "Yes"; needsSave = true;
        }
        if (!eofferData.clausePOP) {
          const addr = [data.client?.address, data.client?.city, data.client?.state].filter(Boolean).join(", ");
          eofferData.clausePOP = addr || ""; needsSave = true;
        }
        if (!eofferData.clauseSCA) {
          eofferData.clauseSCA = "Professional Exemption Applies"; needsSave = true;
        }
        if (!eofferData.clauseSmallBiz) {
          eofferData.clauseSmallBiz = "Small Business"; needsSave = true;
        }

        if (needsSave) {
          // Save defaults to DB (fire and forget)
          apiRequest(`/api/certifications/${certId}`, {
            method: "PUT",
            body: JSON.stringify({ eofferData: JSON.stringify(eofferData) }),
          }).catch(() => {});
          data.application.eofferData = JSON.stringify(eofferData);
        }
      }

      // Parse SIN narratives
      if (data.application?.sinNarratives) {
        try {
          const sn = JSON.parse(data.application.sinNarratives);
          if (typeof sn === "object") setSinNarratives(sn);
        } catch {}
      }
      // Init company edits
      if (data.client) {
        setCompanyEdits({
          businessName: data.client.businessName || "",
          ein: data.client.ein || "",
          uei: data.client.uei || "",
          cageCode: data.client.cageCode || "",
          address: data.client.address || "",
          city: data.client.city || "",
          state: data.client.state || "",
          zip: data.client.zip || "",
          phone: data.client.phone || "",
          email: data.client.email || "",
          website: data.client.website || "",
        });
      }
      // Fetch all client documents grouped by category
      if (data.clientId) {
        try {
          const allCats = "FINANCIAL_STATEMENT,CONTRACT,CAPABILITY_STATEMENT,CERTIFICATION_DOCUMENT,INVOICE,TAX_RETURN,RESUME,BANK_STATEMENT,BUSINESS_LICENSE,OTHER";
          const docs = await apiRequest(`/api/uploads/by-category/${data.clientId}/${allCats}`);
          const grouped: Record<string, any[]> = {};
          for (const doc of docs) {
            if (!grouped[doc.category]) grouped[doc.category] = [];
            grouped[doc.category].push(doc);
          }
          setClientDocs(grouped);
        } catch {}
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function saveCompanyEdits() {
    if (!cert?.client?.id) return;
    setSavingCompany(true);
    try {
      await apiRequest(`/api/clients/${cert.client.id}`, {
        method: "PUT",
        body: JSON.stringify(companyEdits),
      });
      // Update local cert state
      setCert((prev: any) => ({ ...prev, client: { ...prev.client, ...companyEdits } }));
      setCompanySaved(true);
      setEditingCompany(false);
      setTimeout(() => setCompanySaved(false), 3000);
    } catch (err: any) {
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSavingCompany(false);
    }
  }

  function downloadCSP1() {
    if (lcats.length === 0) return;
    const headers = ["Labor Category Title", "Description", "Education", "Min Years Experience", "MFC Rate", "GSA Rate"];
    const rows = lcats.map((l: any) => [
      l.title || "", (l.description || "").replace(/"/g, '""'), l.education || "", l.experience || "",
      l.mfcRate || l.baseRate || "", l.gsaRate || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map((v: any) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CSP-1_${cert?.client?.businessName?.replace(/\s+/g, "_") || "pricing"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveInlineField(field: any) {
    const val = inlineEdits[field.id];
    if (val === undefined) return;
    setSavingField(field.id);
    try {
      if (field.source === "client") {
        // Save to client record
        await apiRequest(`/api/clients/${cert.client.id}`, {
          method: "PUT",
          body: JSON.stringify({ [field.key]: val }),
        });
        setCert((prev: any) => ({ ...prev, client: { ...prev.client, [field.key]: val } }));
      } else if (field.source === "appField") {
        // Save to eofferData JSON on the application
        let existing: any = {};
        try { existing = JSON.parse(cert?.application?.eofferData || "{}"); } catch {}
        existing[field.appKey] = val;
        await apiRequest(`/api/certifications/${certId}`, {
          method: "PUT",
          body: JSON.stringify({ eofferData: JSON.stringify(existing) }),
        });
        setCert((prev: any) => ({
          ...prev,
          application: { ...prev.application, eofferData: JSON.stringify(existing) }
        }));
      } else if (field.source === "narrativeCorp" || field.source === "narrativeQCP") {
        // Save to certification narrative JSON
        const narrativeField = field.source === "narrativeCorp" ? "narrativeCorp" : "narrativeQCP";
        let existing: any = {};
        try { existing = JSON.parse(cert?.application?.[narrativeField] || "{}"); } catch {}
        // Support nested narratives format
        if (existing.narratives) {
          existing.narratives[field.narrativeKey] = val;
        } else {
          existing[field.narrativeKey] = val;
        }
        await apiRequest(`/api/certifications/${certId}`, {
          method: "PUT",
          body: JSON.stringify({ [narrativeField]: JSON.stringify(existing) }),
        });
        setCert((prev: any) => ({
          ...prev,
          application: { ...prev.application, [narrativeField]: JSON.stringify(existing) }
        }));
      }
      setEditingField(null);
      setSavedField(field.id);
      setTimeout(() => setSavedField(null), 2000);
    } catch (err: any) {
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSavingField(null);
    }
  }

  function startEditing(field: any, currentValue: string) {
    setEditingField(field.id);
    setInlineEdits(prev => ({ ...prev, [field.id]: currentValue }));
  }

  function getFieldValue(field: any): string {
    if (field.source === "static") return field.staticValue || "";
    if (field.source === "client") return cert?.client?.[field.key] || "";
    if (field.source === "appField") {
      // Read from eofferData JSON on the application
      try {
        const eofferData = JSON.parse(cert?.application?.eofferData || "{}");
        return eofferData[field.appKey] || "";
      } catch { return ""; }
    }
    if (field.source === "narrativeCorp") return extractNarrativeField(cert?.application?.narrativeCorp, field.narrativeKey);
    if (field.source === "narrativeQCP") return extractNarrativeField(cert?.application?.narrativeQCP, field.narrativeKey);
    return "";
  }

  function isFieldComplete(field: any): boolean {
    if (field.source === "static") return true;
    return !!getFieldValue(field).trim();
  }

  async function copyToClipboard(fieldId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(fieldId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedId(fieldId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function isChecklistItemComplete(item: typeof GSA_MAS_CHECKLIST[0]): boolean {
    if (manualChecks[item.id]) return true;
    return false;
  }

  async function handleChecklistDrop(itemId: string, files: FileList | File[], docCategory: string | null) {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    setDragOverItem(null);
    setUploadingItem(itemId);
    const names: string[] = [];
    try {
      const token = localStorage.getItem("token");
      for (const file of fileArr) {
        const formData = new FormData();
        formData.append("file", file);
        if (cert?.clientId) formData.append("clientId", cert.clientId);
        if (docCategory) formData.append("category", docCategory);
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!resp.ok) throw new Error(`Upload failed for ${file.name}`);
        names.push(file.name);
      }
      setUploadedFiles(prev => ({ ...prev, [itemId]: names.length === 1 ? names[0] : `${names.length} files uploaded` }));
      setManualChecks(prev => ({ ...prev, [itemId]: true }));
    } catch (err: any) {
      setError("Failed to upload: " + (err.message || "Unknown error"));
    } finally {
      setUploadingItem(null);
    }
  }

  function getNarrativeText(field: string): string {
    if (!cert?.application) return "";
    const val = cert.application[field];
    if (!val) return "";
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed.narratives) {
        return Object.entries(parsed.narratives).map(([k, v]) => `## ${k}\n${v}`).join("\n\n");
      }
      if (typeof parsed === "object") {
        return Object.entries(parsed).map(([k, v]) => `## ${k}\n${v}`).join("\n\n");
      }
      return String(val);
    } catch {
      return String(val);
    }
  }

  async function copyNarrative(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  }

  const checklistCompleted = GSA_MAS_CHECKLIST.filter(item => isChecklistItemComplete(item)).length;
  const checklistTotal = GSA_MAS_CHECKLIST.length;

  const narrativeSections = [
    { label: "Corporate Experience", field: "narrativeCorp" },
    { label: "Quality Control Plan", field: "narrativeQCP" },
  ];

  function getCompletenessScore() {
    let total = 0, complete = 0;
    EOFFER_FIELDS.forEach(tab => {
      tab.fields.forEach(field => {
        if (field.source !== "static") {
          total++;
          if (isFieldComplete(field)) complete++;
        }
      });
    });
    return { total, complete, pct: total ? Math.round(complete / total * 100) : 0 };
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const score = getCompletenessScore();

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
          {/* Completeness score */}
          <div style={{ margin: "0 0 16px", padding: "12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>Complete</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: score.pct === 100 ? "var(--green)" : "var(--gold2)" }}>{score.pct}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 100, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${score.pct}%`, background: score.pct === 100 ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>{score.complete}/{score.total} fields ready</div>
          </div>

          {/* Tab nav */}
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 6, fontWeight: 600 }}>eOffer Tabs</div>
          {EOFFER_FIELDS.map(tab => {
            const tabComplete = tab.fields.filter(f => f.source !== "static").every(f => isFieldComplete(f));
            const tabTotal = tab.fields.filter(f => f.source !== "static").length;
            const tabDone = tab.fields.filter(f => f.source !== "static" && isFieldComplete(f)).length;
            return (
              <div key={tab.tab} onClick={() => setExpandedTab(expandedTab === tab.tab ? null : tab.tab)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, cursor: "pointer", background: expandedTab === tab.tab ? "rgba(200,155,60,.15)" : "transparent", color: expandedTab === tab.tab ? "var(--gold2)" : "rgba(255,255,255,.45)", fontSize: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: tabComplete ? "var(--green)" : tabTotal === 0 ? "rgba(255,255,255,.15)" : "rgba(200,155,60,.3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff" }}>
                  {tabComplete ? "✓" : ""}
                </div>
                <span style={{ flex: 1, fontSize: 11 }}>{tab.tab.split(" — ")[1]}</span>
                {tabTotal > 0 && <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)" }}>{tabDone}/{tabTotal}</span>}
              </div>
            );
          })}

          <a href={`/certifications/${certId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", textDecoration: "none", color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 16 }}>
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
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {pw.loading && (
          <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)", fontSize: 14 }}>
            Checking access...
          </div>
        )}
        {!pw.loading && !pw.generationAccess && (
          <PaywallModal
            certType="GSA_MAS"
            price={pw.price}
            betaMode={pw.betaMode}
            onUnlock={pw.onUnlock}
            onClose={pw.closePaywall}
          />
        )}
        <div style={!pw.loading && !pw.generationAccess ? { filter: "blur(8px)", pointerEvents: "none" as const, userSelect: "none" as const } : {}}>
        <div style={{ padding: "40px 48px", maxWidth: 920 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application Dashboard
          </a>

          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Final Step</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              eOffer Submission Package
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Your application is ready to submit to GSA. Click <strong style={{ color: "var(--navy)" }}>Copy</strong> next to each field, then paste it into the corresponding tab in GSA eOffer at <a href="https://eoffer.gsa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>eoffer.gsa.gov</a>.
            </p>
          </div>

          {/* Completeness banner */}
          <div style={{ background: score.pct === 100 ? "var(--green-bg)" : "var(--navy)", border: `1px solid ${score.pct === 100 ? "var(--green-b)" : "rgba(255,255,255,.08)"}`, borderRadius: "var(--rl)", padding: "20px 26px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: score.pct === 100 ? "var(--green)" : "var(--gold2)", marginBottom: 6 }}>
                {score.pct === 100 ? "✓ All fields complete — ready to submit" : `${score.complete} of ${score.total} fields complete`}
              </div>
              {score.pct < 100 && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>
                  {score.total - score.complete} field{score.total - score.complete !== 1 ? "s" : ""} still need content. Go back to the relevant sections to complete them, then return here.
                </div>
              )}
              {score.pct === 100 && (
                <div style={{ fontSize: 13, color: "var(--green)", lineHeight: 1.5 }}>
                  Every field is populated. Copy each section below and paste it into GSA eOffer.
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: score.pct === 100 ? "var(--green)" : "var(--gold2)", lineHeight: 1 }}>{score.pct}%</div>
              <div style={{ height: 6, width: 120, background: "rgba(255,255,255,.1)", borderRadius: 100, overflow: "hidden", marginTop: 6 }}>
                <div style={{ height: "100%", width: `${score.pct}%`, background: score.pct === 100 ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {cert?.clientId && <FinancialReadiness clientId={cert.clientId} certType="GSA_MAS" />}

          {/* GSA MAS Document Checklist Wizard */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400 }}>GSA MAS Submission Guide</h3>
              <a href="https://eoffer.gsa.gov" target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 16px", background: "var(--navy)", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "var(--gold2)", textDecoration: "none", whiteSpace: "nowrap" }}>
                Open eOffer.gsa.gov ↗
              </a>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 6 }}>Every document required for your GSA MAS application. Click any item for detailed guidance on what it is, where to find it, and exactly where to upload it on eOffer.</p>
            <div style={{ padding: "10px 14px", background: "rgba(200,155,60,.05)", borderRadius: "var(--r)", border: "1px solid rgba(200,155,60,.12)", marginBottom: 10, fontSize: 12, color: "var(--ink3)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--gold)" }}>Tip:</strong> Work through this list top to bottom. Items with uploaded documents are shown in green. For remaining items, click to expand and follow the guidance.
            </div>

            {/* Checklist progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "10px 14px", background: "var(--cream)", borderRadius: "var(--r)" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: checklistCompleted === checklistTotal ? "var(--green)" : "var(--navy)", fontWeight: 400 }}>
                {checklistCompleted}<span style={{ fontSize: 14, color: "var(--ink3)" }}> / {checklistTotal}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 6, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(checklistCompleted / checklistTotal) * 100}%`, background: checklistCompleted === checklistTotal ? "var(--green)" : "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink4)" }}>items confirmed</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {GSA_MAS_CHECKLIST.map(item => {
                const complete = isChecklistItemComplete(item);
                const isExpanded = manualChecks[`expanded_${item.id}`];
                const isDragTarget = dragOverItem === item.id;
                return (
                  <div key={item.id}
                    onDragOver={(e) => { e.preventDefault(); setDragOverItem(item.id); }}
                    onDragLeave={() => { if (dragOverItem === item.id) setDragOverItem(null); }}
                    onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleChecklistDrop(item.id, e.dataTransfer.files, Array.isArray(item.docCategory) ? item.docCategory[0] : item.docCategory || null); }}
                    style={{
                    border: `1px solid ${isDragTarget ? "var(--gold)" : complete ? "var(--green-b)" : isExpanded ? "rgba(200,155,60,.25)" : "var(--border)"}`,
                    borderRadius: "var(--r)", overflow: "hidden",
                    background: isDragTarget ? "rgba(200,155,60,.08)" : complete ? "var(--green-bg)" : isExpanded ? "rgba(200,155,60,.02)" : "#fff",
                    borderStyle: isDragTarget ? "dashed" : "solid",
                    transition: "all .15s",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      cursor: "pointer",
                    }}
                      onClick={() => setManualChecks(prev => ({ ...prev, [`expanded_${item.id}`]: !prev[`expanded_${item.id}`] }))}>
                      <div onClick={(e) => { e.stopPropagation(); setManualChecks(prev => ({ ...prev, [item.id]: !prev[item.id] })); }} style={{
                        width: 22, height: 22, borderRadius: 4,
                        border: `2px solid ${complete ? "var(--green)" : "var(--border2)"}`,
                        background: complete ? "var(--green)" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0,
                        cursor: "pointer",
                      }}>
                        {complete ? "\u2713" : ""}
                      </div>
                      <span style={{ fontSize: 14, color: complete ? "var(--green)" : "var(--navy)", fontWeight: complete ? 500 : 400, flex: 1 }}>{item.label}</span>
                      {uploadingItem === item.id && (
                        <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 500, marginRight: 8 }}>Uploading...</span>
                      )}
                      {uploadedFiles[item.id] && (
                        <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500, marginRight: 8, display: "flex", alignItems: "center", gap: 4 }}>
                          &#x2713; {uploadedFiles[item.id]}
                        </span>
                      )}
                      {complete && !uploadedFiles[item.id] && (
                        <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500, marginRight: 8 }}>Confirmed</span>
                      )}
                      <span style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 600 }}>{isExpanded ? "\u25B2" : "\u25BC"}</span>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                          <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>What is this?</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{item.what}</div>
                          </div>
                          <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>Where to find it</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{item.where}</div>
                          </div>
                          <div style={{ padding: "12px", background: "rgba(11,25,41,.03)", borderRadius: 8, border: "1px solid rgba(11,25,41,.06)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--navy)", marginBottom: 6 }}>On eOffer / GSA portal</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{item.sbaPortal}</div>
                          </div>
                          <div style={{ padding: "12px", background: "rgba(26,35,50,.02)", borderRadius: 8, border: "1px solid rgba(0,0,0,.04)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 6 }}>Format requirements</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6 }}>{item.format}</div>
                          </div>
                        </div>
                        {/* Show matching uploaded documents */}
                        {item.docCategory && (() => {
                          const cats = Array.isArray(item.docCategory) ? item.docCategory : [item.docCategory];
                          return cats.flatMap((c: string) => clientDocs[c] || []).length > 0;
                        })() && (
                          <div style={{ marginTop: 12, padding: "12px", background: "var(--green-bg)", borderRadius: 8, border: "1px solid var(--green-b)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--green)", marginBottom: 8 }}>Your uploaded files — ready to submit</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {(() => {
                                const cats = Array.isArray(item.docCategory) ? item.docCategory : [item.docCategory];
                                return cats.flatMap((c: string) => clientDocs[c] || []);
                              })().map((doc: any) => (
                                <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#fff", borderRadius: 6, border: "1px solid var(--border)" }}>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)" }}>{doc.originalName}</div>
                                    {doc.documentYear && <span style={{ fontSize: 10, color: "var(--ink4)" }}>{doc.documentYear}</span>}
                                  </div>
                                  <button onClick={async () => {
                                    try {
                                      const resp = await fetch(
                                        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/documents/download/${doc.id}`,
                                        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                                      );
                                      if (!resp.ok) { alert('Download failed'); return; }
                                      const blob = await resp.blob();
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url; a.download = doc.originalName || 'document'; a.click();
                                      URL.revokeObjectURL(url);
                                    } catch { alert('Download failed'); }
                                  }} style={{
                                    padding: "4px 12px", fontSize: 11, fontWeight: 600,
                                    color: "var(--green)", border: "1px solid var(--green-b)",
                                    borderRadius: 5, background: "transparent", cursor: "pointer",
                                  }}>
                                    Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.docCategory && (() => {
                          const cats = Array.isArray(item.docCategory) ? item.docCategory : [item.docCategory];
                          return cats.flatMap((c: string) => clientDocs[c] || []).length === 0;
                        })() && (
                          <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(200,60,60,.03)", borderRadius: 8, border: "1px solid rgba(200,60,60,.1)", fontSize: 12, color: "var(--red)" }}>
                            No matching file uploaded yet. Upload this document in <a href={`/portal/documents`} style={{ color: "var(--gold)", fontWeight: 600 }}>My Documents</a> or gather it from the source described above.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Copy Narratives for eOffer */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Copy Narratives for eOffer</h3>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 16 }}>Click to copy each section for pasting into GSA eOffer tabs.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {narrativeSections.map(ns => {
                const text = getNarrativeText(ns.field);
                const hasText = text.trim().length > 0;
                return (
                  <div key={ns.field} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px",
                    background: hasText ? "var(--cream)" : "var(--cream2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r)",
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: hasText ? "var(--navy)" : "var(--ink4)" }}>{ns.label}</div>
                      <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: hasText && text.length > 10000 ? "var(--red)" : "var(--ink4)" }}>
                        {hasText ? `${text.length.toLocaleString()} / 10,000 characters${text.length > 10000 ? " — over limit, trim before pasting" : ""}` : "Not yet drafted"}
                      </div>
                    </div>
                    <button
                      onClick={() => copyNarrative(text, ns.label)}
                      disabled={!hasText}
                      style={{
                        padding: "8px 16px",
                        background: hasText ? (copySuccess === ns.label ? "var(--green)" : "var(--gold)") : "var(--cream2)",
                        border: "none",
                        borderRadius: "var(--r)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: hasText ? "#fff" : "var(--ink4)",
                        cursor: hasText ? "pointer" : "not-allowed",
                      }}
                    >
                      {copySuccess === ns.label ? "\u2713 Copied!" : "Copy to Clipboard"}
                    </button>
                  </div>
                );
              })}
              {/* SIN Narratives */}
              {Object.keys(sinNarratives).length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--purple)", marginBottom: 8 }}>
                    Relevant Project Experience — Per SIN (Tab 3, Factor Four)
                  </div>
                  {Object.entries(sinNarratives).map(([sin, text]) => {
                    const hasText = (text as string).trim().length > 0;
                    const charCount = (text as string).length;
                    const label = `SIN ${sin}`;
                    return (
                      <div key={sin} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px",
                        background: hasText ? "var(--cream)" : "var(--cream2)",
                        border: `1px solid ${charCount > 10000 ? "var(--red-b)" : "var(--border)"}`,
                        borderRadius: "var(--r)", marginBottom: 6,
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: hasText ? "var(--navy)" : "var(--ink4)" }}>
                            SIN {sin}
                          </div>
                          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: charCount > 10000 ? "var(--red)" : "var(--ink4)" }}>
                            {hasText ? `${charCount.toLocaleString()} / 10,000 chars${charCount > 10000 ? " — over limit!" : ""}` : "Not drafted"}
                          </div>
                        </div>
                        <button
                          onClick={() => copyNarrative(text as string, label)}
                          disabled={!hasText}
                          style={{
                            padding: "6px 14px",
                            background: hasText ? (copySuccess === label ? "var(--green)" : "var(--purple)") : "var(--cream2)",
                            border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600,
                            color: hasText ? "#fff" : "var(--ink4)", cursor: hasText ? "pointer" : "not-allowed",
                          }}>
                          {copySuccess === label ? "\u2713 Copied!" : "Copy"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* GSA eOffer instructions */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏛️</span> How to Submit in GSA eOffer
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { n: "1", title: "Complete prerequisites", desc: "Pathways training, digital certificate, SAM.gov registration — all before you touch eOffer." },
                { n: "2", title: "Fill in eOffer sections", desc: "Company info, negotiators, SINs, standard responses, clauses — GovCert pre-fills all of these. Just copy and confirm." },
                { n: "3", title: "Paste narratives", desc: "Corporate Experience, QCP, and SIN Project Experience — use the Copy buttons below for each section." },
                { n: "4", title: "Upload documents & submit", desc: "Download your files from GovCert, then upload them into eOffer. Review everything and click Submit Proposal." },
              ].map(step => (
                <div key={step.n} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: "var(--gold2)", fontWeight: 700 }}>{step.n}</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>{step.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink3)", lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* eOffer tabs */}
          {EOFFER_FIELDS.map(tab => {
            const isExpanded = expandedTab === tab.tab;
            const tabComplete = tab.fields.filter(f => f.source !== "static").every(f => isFieldComplete(f));
            const tabTotal = tab.fields.filter(f => f.source !== "static").length;
            const tabDone = tab.fields.filter(f => f.source !== "static" && isFieldComplete(f)).length;
            return (
              <div key={tab.tab} style={{ background: "#fff", border: `1px solid ${tabComplete && tabTotal > 0 ? "var(--green-b)" : "var(--border)"}`, borderRadius: "var(--rl)", marginBottom: 12, boxShadow: "var(--shadow)", overflow: "hidden" }}>
                <div onClick={() => setExpandedTab(isExpanded ? null : tab.tab)}
                  style={{ padding: "16px 22px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: isExpanded ? "var(--cream)" : "#fff", transition: "background .12s" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: tab.tabBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {tabComplete && tabTotal > 0 ? "✓" : tabTotal === 0 ? "📤" : "○"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>{tab.tab}</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                      {tabTotal === 0 ? "Upload required — see instructions" : `${tabDone}/${tabTotal} fields complete`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                    {tabTotal > 0 && (
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: tabComplete ? "var(--green-bg)" : "var(--amber-bg)", color: tabComplete ? "var(--green)" : "var(--amber)" }}>
                        {tabComplete ? "✓ Complete" : `${tabDone}/${tabTotal}`}
                      </span>
                    )}
                    <span style={{ fontSize: 16, color: "var(--gold)" }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "20px 22px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {tab.fields.map(field => {
                        const value = getFieldValue(field);
                        const isComplete = isFieldComplete(field);
                        const isCopied = copiedId === field.id;
                        const isOver = field.charLimit && value.length > field.charLimit;
                        const isStatic = field.source === "static";

                        return (
                          <div key={field.id} style={{ border: `1px solid ${isOver ? "var(--red-b)" : isComplete && !isStatic ? "var(--green-b)" : isStatic ? "var(--blue-b)" : "var(--border)"}`, borderRadius: "var(--r)", overflow: "hidden" }}>
                            {/* Field header */}
                            <div style={{ padding: "12px 16px", background: isOver ? "var(--red-bg)" : isComplete && !isStatic ? "var(--green-bg)" : isStatic ? "var(--blue-bg)" : "var(--cream)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: isOver ? "var(--red)" : isStatic ? "var(--blue)" : "var(--navy)", marginBottom: 2 }}>
                                  {isComplete && !isStatic && !isOver && <span style={{ color: "var(--green)", marginRight: 6 }}>✓</span>}
                                  {!isComplete && !isStatic && <span style={{ color: "var(--amber)", marginRight: 6 }}>⚠</span>}
                                  {isOver && <span style={{ color: "var(--red)", marginRight: 6 }}>✕</span>}
                                  {field.label}
                                </div>
                                {field.charLimit && (
                                  <div style={{ fontSize: 11, color: isOver ? "var(--red)" : "var(--ink4)", fontFamily: "'DM Mono', monospace" }}>
                                    {value.length.toLocaleString()} / {field.charLimit.toLocaleString()} chars
                                    {isOver && " ⚠ Over limit — trim before pasting"}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                                <button
                                  onClick={() => setShowInstructions(showInstructions === field.id ? null : field.id)}
                                  style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}>
                                  {showInstructions === field.id ? "Hide" : "ℹ Instructions"}
                                </button>
                                {!isStatic && value && editingField !== field.id && (
                                  <button
                                    onClick={() => copyToClipboard(field.id, inlineEdits[field.id] ?? value)}
                                    style={{ padding: "6px 16px", background: isCopied ? "var(--green)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, cursor: "pointer", color: isCopied ? "#fff" : "var(--gold2)", transition: "all .15s", minWidth: 80 }}>
                                    {isCopied ? "✓ Copied!" : "Copy →"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Instructions */}
                            {showInstructions === field.id && (
                              <div style={{ padding: "10px 16px", background: "var(--amber-bg)", borderTop: "1px solid var(--amber-b)", fontSize: 12.5, color: "var(--ink2)", lineHeight: 1.6, display: "flex", gap: 8 }}>
                                <span style={{ fontSize: 14, flexShrink: 0 }}>📋</span>
                                <span>{field.instructions}</span>
                              </div>
                            )}

                            {/* Field content — inline editable */}
                            <div style={{ padding: "14px 16px" }}>
                              {isStatic ? (
                                <div style={{ fontSize: 13, color: "var(--blue)", lineHeight: 1.6, fontStyle: "italic" }}>{value}</div>
                              ) : editingField === field.id ? (
                                <div>
                                  <textarea
                                    value={inlineEdits[field.id] ?? value}
                                    onChange={e => setInlineEdits(prev => ({ ...prev, [field.id]: e.target.value }))}
                                    rows={field.source === "client" ? 1 : 8}
                                    style={{
                                      width: "100%", padding: "10px 14px", border: "2px solid var(--gold)",
                                      borderRadius: "var(--r)", fontSize: 13, lineHeight: 1.7, resize: "vertical",
                                      outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const,
                                      minHeight: field.source === "client" ? 40 : 150,
                                      background: "rgba(200,155,60,.03)",
                                    }}
                                    autoFocus
                                  />
                                  {field.charLimit && (
                                    <div style={{ fontSize: 11, color: (inlineEdits[field.id] || "").length > field.charLimit ? "var(--red)" : "var(--ink4)", marginTop: 4, textAlign: "right" as const }}>
                                      {(inlineEdits[field.id] || "").length.toLocaleString()} / {field.charLimit.toLocaleString()} chars
                                    </div>
                                  )}
                                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                                    <button onClick={() => setEditingField(null)}
                                      style={{ padding: "6px 16px", background: "var(--cream2)", border: "none", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}>
                                      Cancel
                                    </button>
                                    <button onClick={() => saveInlineField(field)} disabled={savingField === field.id}
                                      style={{ padding: "6px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#fff" }}>
                                      {savingField === field.id ? "Saving..." : "Save"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ cursor: "pointer", position: "relative" }}
                                  onClick={() => startEditing(field, value)}>
                                  {value ? (
                                    <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto", fontFamily: "'DM Sans', sans-serif" }}>
                                      {value}
                                      <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 8, fontWeight: 500 }}>Click to edit</div>
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                                      <span style={{ fontSize: 16 }}>✏️</span>
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--gold)", marginBottom: 2 }}>Click to add content</div>
                                        <div style={{ fontSize: 12, color: "var(--ink3)" }}>Type directly here, or go to the <a href={`/certifications/${certId}`} onClick={e => e.stopPropagation()} style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>Application Dashboard</a> for guided input.</div>
                                      </div>
                                    </div>
                                  )}
                                  {savedField === field.id && (
                                    <div style={{ position: "absolute", top: 0, right: 0, padding: "4px 12px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", fontSize: 11, color: "var(--green)", fontWeight: 500 }}>✓ Saved</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Edit Company Info */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 12, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editingCompany ? 16 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>&#x270F;&#xFE0F;</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Company Information</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>Update your business details before submitting to eOffer</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {companySaved && <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 500 }}>Saved</span>}
                <button onClick={() => setEditingCompany(!editingCompany)}
                  style={{ padding: "7px 16px", background: editingCompany ? "var(--cream2)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, color: editingCompany ? "var(--ink3)" : "var(--gold2)", cursor: "pointer" }}>
                  {editingCompany ? "Cancel" : "Edit Fields"}
                </button>
              </div>
            </div>
            {editingCompany && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { key: "businessName", label: "Legal Business Name" },
                    { key: "ein", label: "EIN / Tax ID" },
                    { key: "uei", label: "UEI" },
                    { key: "cageCode", label: "CAGE Code" },
                    { key: "address", label: "Address" },
                    { key: "city", label: "City" },
                    { key: "state", label: "State" },
                    { key: "zip", label: "ZIP" },
                    { key: "phone", label: "Phone" },
                    { key: "email", label: "Email" },
                    { key: "website", label: "Website" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink3)", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 4, display: "block" }}>{f.label}</label>
                      <input value={companyEdits[f.key] || ""} onChange={e => setCompanyEdits(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "'DM Sans', sans-serif" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={saveCompanyEdits} disabled={savingCompany}
                    style={{ padding: "8px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                    {savingCompany ? "Saving..." : "Save Company Info"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CSP-1 Download */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: lcats.length > 0 ? 16 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>&#x1F4CA;</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>CSP-1 Commercial Supplier Pricelist</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                    {lcats.length > 0 ? `${lcats.length} labor categor${lcats.length === 1 ? "y" : "ies"} configured` : "No labor categories configured yet"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`/certifications/${certId}/pricing`}
                  style={{ padding: "7px 16px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, color: "var(--ink3)", textDecoration: "none", cursor: "pointer" }}>
                  {lcats.length > 0 ? "Edit LCATs" : "Set Up Pricing"}
                </a>
                {lcats.length > 0 && (
                  <button onClick={downloadCSP1}
                    style={{ padding: "7px 16px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, color: "var(--gold2)", cursor: "pointer" }}>
                    Download CSP-1 (CSV)
                  </button>
                )}
              </div>
            </div>
            {lcats.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)" }}>
                      {["Labor Category", "Education", "Exp.", "MFC Rate", "GSA Rate"].map(h => (
                        <th key={h} style={{ textAlign: "left" as const, padding: "8px 10px", fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase" as const, letterSpacing: ".06em", fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lcats.map((l: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 500, color: "var(--navy)" }}>{l.title || "Untitled"}</td>
                        <td style={{ padding: "8px 10px", color: "var(--ink3)" }}>{l.education || "-"}</td>
                        <td style={{ padding: "8px 10px", color: "var(--ink3)" }}>{l.experience || "-"}</td>
                        <td style={{ padding: "8px 10px", color: "var(--ink3)" }}>${l.mfcRate || l.baseRate || "0"}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--green)" }}>${l.gsaRate || "0"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div style={{ background: "var(--navy)", borderRadius: "var(--rl)", padding: "28px 32px", marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#fff", marginBottom: 4 }}>Ready to submit to GSA?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)" }}>
                Open GSA eOffer in a new tab, then come back here to copy each field.
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <a href={`/certifications/${certId}`}
                style={{ padding: "12px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, textDecoration: "none" }}>
                ← Back to Dashboard
              </a>
              <a href={`/certifications/${certId}/review`}
                style={{ padding: "12px 24px", background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(99,102,241,.3)" }}>
                🔍 Run GovCert Analysis
              </a>
              <a href="https://eoffer.gsa.gov" target="_blank" rel="noopener noreferrer"
                style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 24px rgba(200,155,60,.4)" }}>
                Open GSA eOffer →
              </a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}