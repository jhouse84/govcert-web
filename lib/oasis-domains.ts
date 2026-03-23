/**
 * GSA OASIS+ Domain Definitions
 * 13 domains across Phase I (8 original) and Phase II (5 new)
 * Based on OASIS+ RFP and Qualifications Matrix (Attachment J.P-1)
 */

export interface OASISDomain {
  id: string;
  name: string;
  phase: "I" | "II";
  description: string;
  naicsExamples: string[];
  minAAV: { unrestricted: number; smallBusiness: number };
  scoringThreshold: { unrestricted: number; smallBusiness: number };
  maxCredits: number;
}

export const OASIS_DOMAINS: OASISDomain[] = [
  // Phase I — Original 8 Domains
  {
    id: "management-advisory",
    name: "Management & Advisory",
    phase: "I",
    description: "Management consulting, strategic planning, organizational development, program management, and advisory services.",
    naicsExamples: ["541611", "541612", "541613", "541614", "541618"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "technical-engineering",
    name: "Technical & Engineering",
    phase: "I",
    description: "Engineering services, technical consulting, systems engineering, test and evaluation, and technical program support.",
    naicsExamples: ["541330", "541380", "541715", "541690"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "research-development",
    name: "Research & Development",
    phase: "I",
    description: "Scientific research, technology development, R&D program management, and innovation services.",
    naicsExamples: ["541711", "541712", "541715", "541720"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "intelligence-services",
    name: "Intelligence Services",
    phase: "I",
    description: "Intelligence analysis, counterintelligence, surveillance, reconnaissance, and intelligence program support.",
    naicsExamples: ["541990", "561611", "541519"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "enterprise-solutions",
    name: "Enterprise Solutions",
    phase: "I",
    description: "Enterprise-level IT solutions, digital transformation, cloud services, cybersecurity, and enterprise architecture.",
    naicsExamples: ["541512", "541511", "541513", "541519", "518210"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 45, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "environmental-services",
    name: "Environmental Services",
    phase: "I",
    description: "Environmental consulting, remediation, compliance, sustainability, and environmental program management.",
    naicsExamples: ["541620", "562910", "541690"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "facility-services",
    name: "Facility Services",
    phase: "I",
    description: "Facility management, operations & maintenance, construction management, and real property services.",
    naicsExamples: ["561210", "561720", "561730", "238220"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "logistics",
    name: "Logistics",
    phase: "I",
    description: "Supply chain management, transportation, warehousing, distribution, and logistics program support.",
    naicsExamples: ["484110", "488510", "493110", "541614"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  // Phase II — 5 New Domains
  {
    id: "business-administration",
    name: "Business Administration",
    phase: "II",
    description: "Administrative support, records management, office operations, correspondence management, and business process services.",
    naicsExamples: ["561110", "561410", "561439", "561499"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "financial-services",
    name: "Financial Services",
    phase: "II",
    description: "Financial management, accounting, audit support, budget analysis, and financial advisory services.",
    naicsExamples: ["541211", "541219", "541214", "523999"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "human-capital",
    name: "Human Capital",
    phase: "II",
    description: "HR consulting, workforce development, training, organizational design, and talent management services.",
    naicsExamples: ["541612", "611430", "611710", "561311"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "marketing-pr",
    name: "Marketing & Public Relations",
    phase: "II",
    description: "Marketing strategy, public affairs, communications, media relations, and outreach services.",
    naicsExamples: ["541810", "541820", "541910", "541922"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
  {
    id: "social-services",
    name: "Social Services",
    phase: "II",
    description: "Social program management, community development, public health support, and social welfare services.",
    naicsExamples: ["624110", "624190", "621999", "541720"],
    minAAV: { unrestricted: 1000000, smallBusiness: 500000 },
    scoringThreshold: { unrestricted: 42, smallBusiness: 36 },
    maxCredits: 50,
  },
];

export const OASIS_SOLICITATION_TYPES = [
  { id: "unrestricted", label: "Unrestricted", threshold: 42 },
  { id: "small-business", label: "Total Small Business", threshold: 36 },
  { id: "8a", label: "8(a) Set-Aside", threshold: 36 },
  { id: "wosb", label: "WOSB Set-Aside", threshold: 36 },
  { id: "hubzone", label: "HUBZone Set-Aside", threshold: 36 },
  { id: "sdvosb", label: "SDVOSB Set-Aside", threshold: 36 },
];

/** Scoring categories in the OASIS+ Qualifications Matrix */
export const OASIS_SCORING_CATEGORIES = [
  { id: "qp-relevance", label: "QP — Relevance", maxCredits: 20, description: "Qualifying Projects relevant to the proposed domain scope" },
  { id: "qp-value", label: "QP — Average Annual Value", maxCredits: 10, description: "AAV of qualifying projects meets or exceeds threshold" },
  { id: "qp-integrated", label: "QP — Integrated Experience", maxCredits: 4, description: "Multi-disciplinary or cross-functional project experience" },
  { id: "qp-management", label: "QP — Management & Staffing", maxCredits: 4, description: "Project management approach and staffing levels" },
  { id: "past-performance", label: "Past Performance", maxCredits: 4, description: "CPARS or other past performance ratings from relevant QPs" },
  { id: "federal-experience", label: "Federal Prime Experience", maxCredits: 3, description: "Federal prime contract experience (separate from QPs)" },
  { id: "business-systems", label: "Contractor Business Systems", maxCredits: 2, description: "Government-approved accounting, estimating, or purchasing systems" },
  { id: "facility-clearance", label: "Government Facility Clearances", maxCredits: 1, description: "Active facility security clearances" },
  { id: "certifications", label: "Other Certifications", maxCredits: 2, description: "ISO, CMMI, or other relevant third-party certifications" },
];

export const OASIS_SECTIONS = [
  { id: "domains", label: "Domain Selection" },
  { id: "contract-history", label: "Contract History" },
  { id: "scorecard", label: "Self-Scoring Worksheet" },
  { id: "qualifying-projects", label: "Qualifying Projects" },
  { id: "past-performance", label: "Past Performance" },
  { id: "federal-experience", label: "Federal Experience" },
  { id: "systems-certs", label: "Systems & Certifications" },
  { id: "review", label: "GovCert Review" },
  { id: "submit", label: "Submit" },
];
