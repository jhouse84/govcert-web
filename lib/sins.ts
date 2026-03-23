/**
 * GSA MAS Special Item Numbers (SINs)
 * Organized by Large Category (A-L) per GSA MAS solicitation.
 * This covers the most commonly used SINs across all 12 categories.
 * Full list at: https://www.gsa.gov/buy-through-us/purchasing-programs/multiple-award-schedule
 */

export interface SINEntry {
  code: string;
  label: string;
  category: string;
}

export const GSA_SIN_LIST: SINEntry[] = [
  // ═══ LARGE CATEGORY A: FACILITIES ═══
  { code: "561210FAC", label: "Facilities Maintenance & Management", category: "Facilities" },
  { code: "561720", label: "Janitorial Services", category: "Facilities" },
  { code: "561730", label: "Landscaping Services", category: "Facilities" },
  { code: "238220", label: "Plumbing, Heating, AC Contractors", category: "Facilities" },
  { code: "238210", label: "Electrical Contractors", category: "Facilities" },
  { code: "238310", label: "Drywall & Insulation Contractors", category: "Facilities" },
  { code: "238320", label: "Painting & Wall Covering", category: "Facilities" },
  { code: "238990", label: "All Other Specialty Trade Contractors", category: "Facilities" },

  // ═══ LARGE CATEGORY B: FURNITURE & FURNISHINGS ═══
  { code: "337211", label: "Wood Office Furniture", category: "Furniture & Furnishings" },
  { code: "337214", label: "Office Furniture (non-wood)", category: "Furniture & Furnishings" },
  { code: "337127", label: "Institutional Furniture", category: "Furniture & Furnishings" },
  { code: "337920", label: "Blinds & Shades", category: "Furniture & Furnishings" },
  { code: "314110", label: "Carpet & Rug Mills", category: "Furniture & Furnishings" },

  // ═══ LARGE CATEGORY C: HUMAN CAPITAL ═══
  { code: "561311", label: "Employment Placement Agencies", category: "Human Capital" },
  { code: "561312", label: "Executive Search Services", category: "Human Capital" },
  { code: "561320", label: "Temporary Staffing Services", category: "Human Capital" },
  { code: "611430", label: "Professional & Management Development Training", category: "Human Capital" },
  { code: "611420", label: "Computer Training", category: "Human Capital" },
  { code: "611710", label: "Educational Support Services", category: "Human Capital" },
  { code: "611519", label: "Other Technical & Trade Schools", category: "Human Capital" },

  // ═══ LARGE CATEGORY D/E: INDUSTRIAL PRODUCTS & SERVICES ═══
  { code: "332510", label: "Hardware Manufacturing", category: "Industrial Products" },
  { code: "333318", label: "Other Commercial/Service Machinery", category: "Industrial Products" },
  { code: "333415", label: "AC, Refrigeration & Heating Equipment", category: "Industrial Products" },
  { code: "333120", label: "Construction Machinery Manufacturing", category: "Industrial Products" },
  { code: "325611", label: "Soap & Cleaning Compound Manufacturing", category: "Industrial Products" },
  { code: "339113", label: "Surgical Appliance & Supplies", category: "Industrial Products" },
  { code: "334516", label: "Analytical Laboratory Instruments", category: "Industrial Products" },
  { code: "332911", label: "Industrial Valve Manufacturing", category: "Industrial Products" },

  // ═══ LARGE CATEGORY F: INFORMATION TECHNOLOGY ═══
  // IT Hardware
  { code: "334111", label: "Electronic Computer Manufacturing", category: "IT Hardware" },
  { code: "334118", label: "Computer Terminal & Peripheral Equipment", category: "IT Hardware" },
  { code: "334210", label: "Telephone Apparatus Manufacturing", category: "IT Hardware" },
  { code: "334220", label: "Radio & TV Broadcasting Equipment", category: "IT Hardware" },
  { code: "334290", label: "Other Communications Equipment", category: "IT Hardware" },
  // IT Services
  { code: "541511", label: "Custom Computer Programming Services", category: "IT Services" },
  { code: "541512", label: "Computer Systems Design Services", category: "IT Services" },
  { code: "541513", label: "Computer Facilities Management", category: "IT Services" },
  { code: "541519", label: "Other Computer Related Services", category: "IT Services" },
  { code: "518210C", label: "Cloud Computing & Cloud IT Professional Services", category: "IT Services" },
  { code: "541519HACS", label: "Highly Adaptive Cybersecurity Services (HACS)", category: "IT Services" },
  { code: "541519CDM", label: "Continuous Diagnostics & Mitigation (CDM)", category: "IT Services" },
  { code: "541519PIV", label: "Identity & Access Management (PIV)", category: "IT Services" },
  // IT Software
  { code: "511210", label: "Software Publishers", category: "IT Software" },
  { code: "511210SAAS", label: "Software as a Service (SaaS)", category: "IT Software" },
  // IT Solutions
  { code: "541519IoT", label: "Internet of Things (IoT)", category: "IT Solutions" },
  { code: "541519AIS", label: "Artificial Intelligence Services", category: "IT Solutions" },
  { code: "541519DBS", label: "Database Services", category: "IT Solutions" },
  { code: "334614", label: "CD/DVD/Tape Duplication & Data Storage", category: "IT Solutions" },
  // Telecom
  { code: "517410", label: "Satellite Telecommunications", category: "Telecommunications" },
  { code: "517911", label: "Telecommunications Resellers", category: "Telecommunications" },
  { code: "517919", label: "All Other Telecommunications", category: "Telecommunications" },

  // ═══ LARGE CATEGORY G: MISCELLANEOUS ═══
  { code: "339940", label: "Office Supplies (except Paper)", category: "Miscellaneous" },
  { code: "322230", label: "Stationery Products Manufacturing", category: "Miscellaneous" },
  { code: "323111", label: "Commercial Printing", category: "Miscellaneous" },
  { code: "541922", label: "Commercial Photography", category: "Miscellaneous" },
  { code: "512110", label: "Motion Picture & Video Production", category: "Miscellaneous" },
  { code: "541810", label: "Advertising Agencies", category: "Miscellaneous" },

  // ═══ LARGE CATEGORY H: PROFESSIONAL SERVICES ═══
  { code: "541611", label: "Administrative Management & General Management Consulting", category: "Professional Services" },
  { code: "541612", label: "Human Resources Consulting", category: "Professional Services" },
  { code: "541613", label: "Marketing Consulting Services", category: "Professional Services" },
  { code: "541614", label: "Process, Physical Distribution, & Logistics Consulting", category: "Professional Services" },
  { code: "541618", label: "Other Management Consulting Services", category: "Professional Services" },
  { code: "541620", label: "Environmental Consulting Services", category: "Professional Services" },
  { code: "541690", label: "Other Scientific & Technical Consulting", category: "Professional Services" },
  { code: "541199", label: "All Other Legal Services", category: "Professional Services" },
  { code: "541211", label: "Offices of Certified Public Accountants", category: "Professional Services" },
  { code: "541214", label: "Payroll Services", category: "Professional Services" },
  { code: "541219", label: "Other Accounting Services", category: "Professional Services" },
  { code: "541310", label: "Architectural Services", category: "Professional Services" },
  { code: "541320", label: "Landscape Architecture Services", category: "Professional Services" },
  { code: "541330ENG", label: "Engineering Services", category: "Professional Services" },
  { code: "541350", label: "Building Inspection Services", category: "Professional Services" },
  { code: "541370", label: "Surveying & Mapping Services", category: "Professional Services" },
  { code: "541380", label: "Testing Laboratories", category: "Professional Services" },
  { code: "541410", label: "Interior Design Services", category: "Professional Services" },
  { code: "541420", label: "Industrial Design Services", category: "Professional Services" },
  { code: "541430", label: "Graphic Design Services", category: "Professional Services" },
  { code: "541511STLOC", label: "IT Professional Services (State & Local)", category: "Professional Services" },
  { code: "541910", label: "Marketing Research & Public Opinion Polling", category: "Professional Services" },
  { code: "541930", label: "Translation & Interpretation Services", category: "Professional Services" },
  { code: "541990", label: "All Other Professional, Scientific & Technical Services", category: "Professional Services" },
  { code: "561110", label: "Office Administrative Services", category: "Professional Services" },
  { code: "561210", label: "Facilities Support Services", category: "Professional Services" },
  { code: "561410", label: "Document Preparation Services", category: "Professional Services" },
  { code: "561439", label: "Other Business Service Centers", category: "Professional Services" },
  { code: "561440", label: "Collection Agencies", category: "Professional Services" },
  { code: "561450", label: "Credit Bureaus", category: "Professional Services" },
  { code: "561499", label: "All Other Business Support Services", category: "Professional Services" },
  { code: "561611", label: "Investigation Services", category: "Professional Services" },
  { code: "561990", label: "All Other Support Services", category: "Professional Services" },
  { code: "562910", label: "Environmental Remediation Services", category: "Professional Services" },

  // ═══ LARGE CATEGORY I: SCIENTIFIC MANAGEMENT & SOLUTIONS ═══
  { code: "541711", label: "Research & Development in Biotechnology", category: "Scientific Management" },
  { code: "541712", label: "R&D in Physical, Engineering & Life Sciences", category: "Scientific Management" },
  { code: "541715", label: "R&D in Social Sciences & Humanities", category: "Scientific Management" },
  { code: "334511", label: "Search, Detection, Navigation & Guidance Systems", category: "Scientific Management" },
  { code: "334515", label: "Electricity/Signal Testing Instruments", category: "Scientific Management" },

  // ═══ LARGE CATEGORY J: SECURITY & PROTECTION ═══
  { code: "561612", label: "Security Guards & Patrol Services", category: "Security & Protection" },
  { code: "561613", label: "Armored Car Services", category: "Security & Protection" },
  { code: "561621", label: "Security Systems Services", category: "Security & Protection" },
  { code: "922160", label: "Fire Protection", category: "Security & Protection" },
  { code: "334511SP", label: "Detection Systems & Equipment", category: "Security & Protection" },

  // ═══ LARGE CATEGORY K: TRANSPORTATION & LOGISTICS ═══
  { code: "484110", label: "General Freight Trucking (Local)", category: "Transportation & Logistics" },
  { code: "484121", label: "General Freight Trucking (Long-Distance)", category: "Transportation & Logistics" },
  { code: "488510", label: "Freight Transportation Arrangement", category: "Transportation & Logistics" },
  { code: "493110", label: "General Warehousing & Storage", category: "Transportation & Logistics" },
  { code: "532120", label: "Truck/Trailer/RV Rental & Leasing", category: "Transportation & Logistics" },

  // ═══ LARGE CATEGORY L: TRAVEL ═══
  { code: "561510", label: "Travel Agencies", category: "Travel" },
  { code: "561520", label: "Tour Operators", category: "Travel" },
  { code: "721110", label: "Hotels & Motels", category: "Travel" },
];

/** Quick lookup by SIN code */
export const SIN_LABELS: Record<string, string> = Object.fromEntries(
  GSA_SIN_LIST.map(s => [s.code, s.label])
);

/** Get all unique categories */
export const SIN_CATEGORIES = [...new Set(GSA_SIN_LIST.map(s => s.category))];
