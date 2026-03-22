"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];

const ENTITY_TYPES = ["LLC", "Corporation", "S-Corp", "Sole Proprietorship", "Partnership", "Non-Profit"];

const GENDER_OPTIONS = ["Male", "Female", "Non-Binary", "Prefer not to say"];
const ETHNICITY_OPTIONS = [
  "Hispanic/Latino", "Black/African American", "Asian", "Native American",
  "Pacific Islander", "White", "Two or More", "Prefer not to say"
];
const VETERAN_OPTIONS = ["Not a Veteran", "Veteran", "Service-Disabled Veteran"];

const EXISTING_CERTS = ["8(a)", "GSA MAS", "WOSB", "HUBZone", "SDVOSB", "VOSB", "MBE", "DBE", "None"];

const RECOMMENDED_DOCS = [
  { label: "Financial Statements (P&L, Balance Sheet)", category: "FINANCIAL_STATEMENT" },
  { label: "Tax Returns (last 3 years)", category: "TAX_RETURN" },
  { label: "Capability Statement", category: "CAPABILITY_STATEMENT" },
  { label: "Org Chart", category: "ORG_CHART" },
  { label: "Existing Certifications", category: "CERTIFICATION_DOCUMENT" },
];

const STEPS = [
  { n: 1, label: "Business Basics", time: "~2 min" },
  { n: 2, label: "Ownership", time: "~2 min" },
  { n: 3, label: "Financials", time: "~2 min" },
  { n: 4, label: "Location", time: "~1 min" },
  { n: 5, label: "Performance", time: "~2 min" },
  { n: 6, label: "Documents", time: "~2 min" },
  { n: 7, label: "Review", time: "~1 min" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", background: "#fff", border: "1px solid var(--border)",
  borderRadius: "var(--r)", fontSize: 14, color: "var(--ink)", outline: "none",
  boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em",
};
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" as const, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" };

const emptyOwner = () => ({
  name: "", ownershipPercentage: "", gender: "", ethnicity: "",
  veteranStatus: "Not a Veteran", disabilityStatus: false, usCitizen: true, managesDailyOps: false,
});

function PortalEligibilityPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showWelcome, setShowWelcome] = useState(() => searchParams.get("welcome") === "true");

  function dismissWelcome() {
    localStorage.setItem("govcert_onboarded", "true");
    setShowWelcome(false);
    window.history.replaceState({}, "", "/portal/eligibility");
  }

  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessing, setAssessing] = useState(false);

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [ein, setEin] = useState("");
  const [entityType, setEntityType] = useState("");
  const [stateOfIncorporation, setStateOfIncorporation] = useState("");
  const [principalAddress, setPrincipalAddress] = useState("");
  const [city, setCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [zip, setZip] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [firstRevenueDate, setFirstRevenueDate] = useState("");
  const [naicsCodes, setNaicsCodes] = useState("");

  // Step 2
  const [owners, setOwners] = useState<any[]>([emptyOwner()]);

  // Step 3
  const [revenueYear1, setRevenueYear1] = useState("");
  const [revenueYear2, setRevenueYear2] = useState("");
  const [revenueYear3, setRevenueYear3] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [netWorthRange, setNetWorthRange] = useState("");
  const [agiRange, setAgiRange] = useState("");
  const [totalAssetsRange, setTotalAssetsRange] = useState("");

  // Step 4
  const [hubzoneZip, setHubzoneZip] = useState("");
  const [hubzoneResult, setHubzoneResult] = useState<any>(null);
  const [hubzoneLoading, setHubzoneLoading] = useState(false);
  const [hubzoneEmployeePct, setHubzoneEmployeePct] = useState("");

  // Step 5
  const [samRegistered, setSamRegistered] = useState("");
  const [activeContracts, setActiveContracts] = useState(false);
  const [completedContracts, setCompletedContracts] = useState("");
  const [cparsAvailable, setCparsAvailable] = useState(false);
  const [pastPerfRefs, setPastPerfRefs] = useState(false);
  const [existingCerts, setExistingCerts] = useState<string[]>([]);

  // Step 6
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [uploadCategory, setUploadCategory] = useState("FINANCIAL_STATEMENT");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "ADMIN" || parsed.role === "ADVISOR") {
        router.push("/dashboard");
        return;
      }
      setUser(parsed);
    }
    fetchClientAndData();
  }, []);

  async function fetchClientAndData() {
    try {
      // Try to get clientId from certifications first
      let cId: string | null = null;
      try {
        const certs = await apiRequest("/api/certifications");
        if (certs && certs.length > 0) {
          cId = certs[0].clientId;
        }
      } catch {}

      // If no cert exists, try to get clients directly
      if (!cId) {
        try {
          const clients = await apiRequest("/api/clients");
          if (clients && clients.length > 0) {
            cId = clients[0].id;
          }
        } catch {}
      }

      // If still no client, create one from user info
      if (!cId) {
        try {
          const userData = JSON.parse(localStorage.getItem("user") || "{}");
          const newClient = await apiRequest("/api/clients", {
            method: "POST",
            body: JSON.stringify({
              name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "My Business",
              email: userData.email || "",
            }),
          });
          cId = newClient.id;
        } catch (err) {
          console.error("Could not create client:", err);
          setLoading(false);
          return;
        }
      }

      setClientId(cId);

      const clientData = await apiRequest(`/api/clients/${cId}`);
      setClient(clientData);
      setBusinessName(clientData.businessName || "");
      setEin(clientData.ein || "");

      try {
        const intake = await apiRequest(`/api/eligibility/${cId}`);
        if (intake) {
          if (intake.entityType) setEntityType(intake.entityType);
          if (intake.stateOfIncorporation) setStateOfIncorporation(intake.stateOfIncorporation);
          if (intake.principalAddress) setPrincipalAddress(intake.principalAddress);
          if (intake.city) setCity(intake.city);
          if (intake.state) setAddrState(intake.state);
          if (intake.zip) setZip(intake.zip);
          if (intake.yearEstablished) setYearEstablished(String(intake.yearEstablished));
          if (intake.firstRevenueDate) setFirstRevenueDate(intake.firstRevenueDate);
          if (intake.naicsCodes) setNaicsCodes(intake.naicsCodes);
          if (intake.owners?.length) setOwners(intake.owners);
          if (intake.revenueYear1) setRevenueYear1(String(intake.revenueYear1));
          if (intake.revenueYear2) setRevenueYear2(String(intake.revenueYear2));
          if (intake.revenueYear3) setRevenueYear3(String(intake.revenueYear3));
          if (intake.employeeCount) setEmployeeCount(String(intake.employeeCount));
          if (intake.netWorthRange) setNetWorthRange(intake.netWorthRange);
          if (intake.agiRange) setAgiRange(intake.agiRange);
          if (intake.totalAssetsRange) setTotalAssetsRange(intake.totalAssetsRange);
          if (intake.hubzoneZip) setHubzoneZip(intake.hubzoneZip);
          if (intake.hubzoneEmployeePct) setHubzoneEmployeePct(String(intake.hubzoneEmployeePct));
          if (intake.samRegistered) setSamRegistered(intake.samRegistered);
          if (intake.activeContracts) setActiveContracts(intake.activeContracts);
          if (intake.completedContracts) setCompletedContracts(String(intake.completedContracts));
          if (intake.cparsAvailable) setCparsAvailable(intake.cparsAvailable);
          if (intake.pastPerfRefs) setPastPerfRefs(intake.pastPerfRefs);
          if (intake.existingCerts) setExistingCerts(intake.existingCerts);
          if (intake.currentStep) setStep(intake.currentStep);
        }
      } catch { /* no existing intake */ }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function buildPayload() {
    return {
      businessName, ein, entityType, stateOfIncorporation, principalAddress,
      city, state: addrState, zip, yearEstablished: yearEstablished ? Number(yearEstablished) : null,
      firstRevenueDate, naicsCodes, owners,
      revenueYear1: revenueYear1 ? Number(revenueYear1.replace(/,/g, "")) : null,
      revenueYear2: revenueYear2 ? Number(revenueYear2.replace(/,/g, "")) : null,
      revenueYear3: revenueYear3 ? Number(revenueYear3.replace(/,/g, "")) : null,
      employeeCount: employeeCount ? Number(employeeCount) : null,
      netWorthRange, agiRange, totalAssetsRange,
      hubzoneZip, hubzoneEmployeePct: hubzoneEmployeePct ? Number(hubzoneEmployeePct) : null,
      samRegistered, activeContracts, completedContracts: completedContracts ? Number(completedContracts) : null,
      cparsAvailable, pastPerfRefs, existingCerts, currentStep: step,
    };
  }

  async function saveAndNext() {
    if (!clientId) return;
    setSaving(true);
    try {
      await apiRequest(`/api/eligibility/${clientId}`, {
        method: "PUT",
        body: JSON.stringify({ ...buildPayload(), completedSteps: step }),
      });
      if (step < 7) setStep(s => (s + 1) as any);
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function skipStep() {
    if (step < 7) setStep(s => (s + 1) as any);
  }

  async function saveAndExit() {
    if (!clientId) return;
    setSaving(true);
    try {
      await apiRequest(`/api/eligibility/${clientId}`, {
        method: "PUT",
        body: JSON.stringify({ ...buildPayload(), completedSteps: step }),
      });
      router.push("/portal");
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("Failed to save: " + (err.message || "Unknown error"));
      setSaving(false);
    }
  }

  async function checkHubzone() {
    if (!hubzoneZip) return;
    setHubzoneLoading(true);
    try {
      const result = await apiRequest(`/api/eligibility/hubzone/${hubzoneZip}`);
      setHubzoneResult(result);
    } catch (err: any) {
      setHubzoneResult({ error: err.message || "Lookup failed" });
    } finally {
      setHubzoneLoading(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile || !clientId) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("clientId", clientId);
      formData.append("category", uploadCategory);
      formData.append("description", `Eligibility intake - ${uploadCategory}`);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadedDocs(prev => [...prev, { ...data, category: uploadCategory }]);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function runAssessment() {
    if (!clientId) return;
    setAssessing(true);
    try {
      await apiRequest(`/api/eligibility/${clientId}`, {
        method: "PUT",
        body: JSON.stringify(buildPayload()),
      });
      await apiRequest(`/api/eligibility/${clientId}/assess`, { method: "POST" });
      router.push("/portal?assessed=true");
    } catch (err) {
      console.error(err);
      setAssessing(false);
    }
  }

  function connectQuickBooks() {
    if (!clientId) return;
    const token = localStorage.getItem("token");
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/quickbooks/start?clientId=${clientId}&token=${token}`;
  }

  function updateOwner(idx: number, field: string, value: any) {
    setOwners(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  }

  function toggleCert(cert: string) {
    setExistingCerts(prev =>
      cert === "None"
        ? prev.includes("None") ? [] : ["None"]
        : prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev.filter(c => c !== "None"), cert]
    );
  }

  const totalOwnership = owners.reduce((sum, o) => sum + (Number(o.ownershipPercentage) || 0), 0);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading eligibility wizard...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>

      {/* Welcome Video Modal */}
      {showWelcome && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(11,25,41,0.85)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, maxWidth: 720, width: "90%",
            overflow: "hidden", boxShadow: "0 24px 64px rgba(11,25,41,0.4)",
          }}>
            {/* Video embed area – 16:9 aspect ratio */}
            <div style={{
              position: "relative", width: "100%", paddingBottom: "56.25%",
              background: "#0B1929",
            }}>
              <iframe src="https://www.youtube.com/embed/DHH112pNJJM?autoplay=1" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>

            {/* Modal content below video */}
            <div style={{ padding: "28px 36px 32px" }}>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400,
                color: "#0B1929", marginBottom: 10, textAlign: "center" as const,
              }}>
                Welcome to GovCert
              </h2>
              <p style={{
                fontSize: 14, color: "var(--ink3)", lineHeight: 1.7,
                textAlign: "center" as const, maxWidth: 520, margin: "0 auto 24px",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Watch this quick overview to understand how our eligibility assessment works, then get started below.
              </p>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <button
                  onClick={dismissWelcome}
                  style={{
                    padding: "13px 36px", background: "#C89B3C", border: "none",
                    borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    boxShadow: "0 4px 16px rgba(200,155,60,0.3)",
                  }}
                >
                  Get Started &rarr;
                </button>
                <button
                  onClick={dismissWelcome}
                  style={{
                    background: "none", border: "none", color: "var(--ink4)",
                    fontSize: 13, cursor: "pointer", textDecoration: "underline",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Skip video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </div>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>My Portal</div>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83C\uDFE0"}</span> Home
          </a>
          <a href="/portal/applications" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83D\uDCCB"}</span> My Applications
          </a>
          <a href="/portal/eligibility" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", borderLeft: "3px solid var(--gold)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
            <span>{"\u2705"}</span> Eligibility
          </a>
          <a href="/portal/integrations" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83D\uDD17"}</span> Integrations
          </a>
          <a href="/portal/documents" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83D\uDCC4"}</span> My Documents
          </a>
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Client Portal</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 860 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Eligibility Intake</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Eligibility Wizard
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink3)", fontWeight: 300 }}>Complete each section so we can assess which certifications you qualify for.</p>
          </div>

          {/* Progress Bar */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0, marginBottom: 40, flexWrap: "wrap" }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: step > s.n ? "pointer" : "default" }} onClick={() => { if (step > s.n) setStep(s.n); }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: step > s.n ? "var(--gold)" : step === s.n ? "#fff" : "transparent",
                    border: step > s.n ? "2px solid var(--gold)" : step === s.n ? "2px solid var(--gold)" : "2px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600,
                    color: step > s.n ? "#fff" : step === s.n ? "var(--gold)" : "var(--ink4)",
                    transition: "all .3s",
                  }}>
                    {step > s.n ? "\u2713" : s.n}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: step >= s.n ? "var(--ink)" : "var(--ink4)", whiteSpace: "nowrap" }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: "var(--ink4)" }}>{s.time}</div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 40, height: 2, background: step > s.n ? "var(--gold)" : "var(--border)", marginTop: -20, marginLeft: 4, marginRight: 4 }} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "36px 32px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 24 }}>

            {/* STEP 1: Business Basics */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Business Basics</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Business Name</label>
                    <input style={inputStyle} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Corp" />
                  </div>
                  <div>
                    <label style={labelStyle}>EIN</label>
                    <input style={inputStyle} value={ein} onChange={e => setEin(e.target.value)} placeholder="XX-XXXXXXX" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Entity Type</label>
                    <select style={selectStyle} value={entityType} onChange={e => setEntityType(e.target.value)}>
                      <option value="">Select...</option>
                      {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>State of Incorporation</label>
                    <select style={selectStyle} value={stateOfIncorporation} onChange={e => setStateOfIncorporation(e.target.value)}>
                      <option value="">Select...</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Principal Address</label>
                  <input style={inputStyle} value={principalAddress} onChange={e => setPrincipalAddress(e.target.value)} placeholder="123 Main St" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Washington" />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <select style={selectStyle} value={addrState} onChange={e => setAddrState(e.target.value)}>
                      <option value="">Select...</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>ZIP</label>
                    <input style={inputStyle} value={zip} onChange={e => setZip(e.target.value)} placeholder="20001" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Year Established</label>
                    <input style={inputStyle} type="number" value={yearEstablished} onChange={e => setYearEstablished(e.target.value)} placeholder="2015" />
                  </div>
                  <div>
                    <label style={labelStyle}>First Revenue Date</label>
                    <input style={{ ...inputStyle }} type="date" value={firstRevenueDate} onChange={e => setFirstRevenueDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>NAICS Codes</label>
                  <input style={inputStyle} value={naicsCodes} onChange={e => setNaicsCodes(e.target.value)} placeholder="541512, 541611, 541519" />
                  <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 4 }}>Comma-separated. Common examples: 541512 (Computer Systems Design), 541611 (Management Consulting), 541519 (Other Computer Services), 236220 (Commercial Construction)</div>
                </div>
              </div>
            )}

            {/* STEP 2: Ownership & Demographics */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Ownership & Demographics</h2>

                {owners.map((owner, idx) => (
                  <div key={idx} style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "20px 20px 16px", marginBottom: 16, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Owner {idx + 1}</div>
                      {owners.length > 1 && (
                        <button onClick={() => setOwners(prev => prev.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "var(--red, #c0392b)", fontSize: 12, cursor: "pointer" }}>Remove</button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={labelStyle}>Full Name</label>
                        <input style={inputStyle} value={owner.name} onChange={e => updateOwner(idx, "name", e.target.value)} placeholder="Jane Smith" />
                      </div>
                      <div>
                        <label style={labelStyle}>Ownership %</label>
                        <input style={inputStyle} type="number" min="0" max="100" value={owner.ownershipPercentage} onChange={e => updateOwner(idx, "ownershipPercentage", e.target.value)} placeholder="51" />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={labelStyle}>Gender</label>
                        <select style={selectStyle} value={owner.gender} onChange={e => updateOwner(idx, "gender", e.target.value)}>
                          <option value="">Select...</option>
                          {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Ethnicity</label>
                        <select style={selectStyle} value={owner.ethnicity} onChange={e => updateOwner(idx, "ethnicity", e.target.value)}>
                          <option value="">Select...</option>
                          {ETHNICITY_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Veteran Status</label>
                        <select style={selectStyle} value={owner.veteranStatus} onChange={e => updateOwner(idx, "veteranStatus", e.target.value)}>
                          {VETERAN_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Disability Status", field: "disabilityStatus" },
                        { label: "U.S. Citizen", field: "usCitizen" },
                        { label: "Manages Daily Ops", field: "managesDailyOps" },
                      ].map(opt => (
                        <label key={opt.field} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>
                          <input type="checkbox" checked={owner[opt.field]} onChange={e => updateOwner(idx, opt.field, e.target.checked)} style={{ accentColor: "var(--gold)" }} />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <button onClick={() => setOwners(prev => [...prev, emptyOwner()])} style={{ background: "none", border: "1px solid var(--gold)", borderRadius: "var(--r)", padding: "8px 16px", color: "var(--gold)", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    + Add Owner
                  </button>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: totalOwnership === 100 ? "var(--green, #27ae60)" : totalOwnership > 100 ? "var(--red, #c0392b)" : "var(--ink3)",
                  }}>
                    Total: {totalOwnership}%
                    {totalOwnership !== 100 && totalOwnership > 0 && (
                      <span style={{ fontSize: 11, color: "var(--red, #c0392b)", marginLeft: 8 }}>
                        (should equal 100%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Financials */}
            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Financials</h2>

                <div style={{ background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.2)", borderRadius: "var(--r)", padding: "20px", marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 8 }}>Import from QuickBooks</div>
                  <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 12 }}>Connect QuickBooks to auto-populate financial data.</p>
                  <button onClick={connectQuickBooks} style={{ padding: "10px 20px", background: "#2CA01C", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    Connect QuickBooks
                  </button>
                </div>

                <div style={{ fontSize: 13, color: "var(--ink4)", textAlign: "center", marginBottom: 20 }}>- or enter manually -</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={labelStyle}>Revenue Year 1</label>
                    <input style={inputStyle} value={revenueYear1} onChange={e => setRevenueYear1(e.target.value)} placeholder="$500,000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Revenue Year 2</label>
                    <input style={inputStyle} value={revenueYear2} onChange={e => setRevenueYear2(e.target.value)} placeholder="$750,000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Revenue Year 3</label>
                    <input style={inputStyle} value={revenueYear3} onChange={e => setRevenueYear3(e.target.value)} placeholder="$1,000,000" />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Employee Count</label>
                  <input style={{ ...inputStyle, maxWidth: 200 }} type="number" value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} placeholder="25" />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Owner Net Worth Range</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["<$250K", "$250K-$500K", "$500K-$850K", ">$850K"].map(opt => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--ink)", cursor: "pointer" }}>
                        <input type="radio" name="netWorth" checked={netWorthRange === opt} onChange={() => setNetWorthRange(opt)} style={{ accentColor: "var(--gold)" }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Owner Average AGI (Last 3 Years)</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["<$200K", "$200K-$400K", ">$400K"].map(opt => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--ink)", cursor: "pointer" }}>
                        <input type="radio" name="agi" checked={agiRange === opt} onChange={() => setAgiRange(opt)} style={{ accentColor: "var(--gold)" }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Owner Total Assets</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["<$2M", "$2M-$6.5M", ">$6.5M"].map(opt => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--ink)", cursor: "pointer" }}>
                        <input type="radio" name="assets" checked={totalAssetsRange === opt} onChange={() => setTotalAssetsRange(opt)} style={{ accentColor: "var(--gold)" }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Location */}
            {step === 4 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Location</h2>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Principal Office ZIP Code</label>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <input style={{ ...inputStyle, maxWidth: 200 }} value={hubzoneZip} onChange={e => setHubzoneZip(e.target.value)} placeholder="20001" />
                    <button onClick={checkHubzone} disabled={hubzoneLoading || !hubzoneZip} style={{ padding: "11px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: hubzoneLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                      {hubzoneLoading ? "Checking..." : "Check HUBZone"}
                    </button>
                  </div>
                </div>

                {hubzoneResult && (
                  <div style={{
                    padding: "16px 20px", borderRadius: "var(--r)", marginBottom: 20,
                    background: hubzoneResult.error ? "var(--red-bg, rgba(192,57,43,.08))" : hubzoneResult.isHubzone ? "var(--green-bg, rgba(39,174,96,.08))" : "var(--amber-bg, rgba(200,155,60,.08))",
                    border: `1px solid ${hubzoneResult.error ? "var(--red-b, rgba(192,57,43,.2))" : hubzoneResult.isHubzone ? "rgba(39,174,96,.2)" : "rgba(200,155,60,.2)"}`,
                  }}>
                    {hubzoneResult.error ? (
                      <div style={{ fontSize: 13, color: "var(--red, #c0392b)" }}>{hubzoneResult.error}</div>
                    ) : (
                      <div style={{ fontSize: 13, color: "var(--ink)" }}>
                        <strong>{hubzoneResult.isHubzone ? "This ZIP is in a HUBZone" : "This ZIP is NOT in a HUBZone"}</strong>
                        {hubzoneResult.details && <div style={{ marginTop: 4, color: "var(--ink3)" }}>{hubzoneResult.details}</div>}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>% of Employees in HUBZone</label>
                  <input style={{ ...inputStyle, maxWidth: 200 }} type="number" min="0" max="100" value={hubzoneEmployeePct} onChange={e => setHubzoneEmployeePct(e.target.value)} placeholder="35" />
                  <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 4 }}>HUBZone certification requires at least 35% of employees to reside in a HUBZone.</div>
                </div>

                <div>
                  <label style={labelStyle}>State</label>
                  <input style={{ ...inputStyle, maxWidth: 200, background: "var(--cream)", color: "var(--ink3)" }} value={addrState || client?.state || ""} readOnly />
                  <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 4 }}>Auto-detected from your profile or address.</div>
                </div>
              </div>
            )}

            {/* STEP 5: Past Performance & Registrations */}
            {step === 5 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Past Performance & Registrations</h2>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>SAM.gov Registered?</label>
                  <div style={{ display: "flex", gap: 16 }}>
                    {["Yes", "No", "In Progress"].map(opt => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--ink)", cursor: "pointer" }}>
                        <input type="radio" name="sam" checked={samRegistered === opt} onChange={() => setSamRegistered(opt)} style={{ accentColor: "var(--gold)" }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>Active Federal Contracts?</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--ink)", cursor: "pointer" }}>
                    <input type="checkbox" checked={activeContracts} onChange={e => setActiveContracts(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
                    Yes, we have active federal contracts
                  </label>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Number of Completed Contracts</label>
                  <input style={{ ...inputStyle, maxWidth: 200 }} type="number" min="0" value={completedContracts} onChange={e => setCompletedContracts(e.target.value)} placeholder="0" />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>CPARS Reports Available?</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--ink)", cursor: "pointer" }}>
                    <input type="checkbox" checked={cparsAvailable} onChange={e => setCparsAvailable(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
                    Yes
                  </label>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>Past Performance References Available?</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--ink)", cursor: "pointer" }}>
                    <input type="checkbox" checked={pastPerfRefs} onChange={e => setPastPerfRefs(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
                    Yes
                  </label>
                </div>

                <div>
                  <label style={labelStyle}>Existing Certifications</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {EXISTING_CERTS.map(cert => (
                      <label key={cert} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", cursor: "pointer", padding: "8px 12px", background: existingCerts.includes(cert) ? "rgba(200,155,60,.08)" : "var(--cream)", borderRadius: "var(--r)", border: `1px solid ${existingCerts.includes(cert) ? "rgba(200,155,60,.3)" : "var(--border)"}` }}>
                        <input type="checkbox" checked={existingCerts.includes(cert)} onChange={() => toggleCert(cert)} style={{ accentColor: "var(--gold)" }} />
                        {cert}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Document Upload */}
            {step === 6 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>Document Upload</h2>
                <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 24 }}>Upload supporting documents to strengthen your eligibility assessment.</p>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Recommended Documents</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {RECOMMENDED_DOCS.map(doc => {
                      const uploaded = uploadedDocs.some(u => u.category === doc.category);
                      return (
                        <div key={doc.category} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: uploaded ? "rgba(39,174,96,.06)" : "var(--cream)", borderRadius: "var(--r)", border: `1px solid ${uploaded ? "rgba(39,174,96,.2)" : "var(--border)"}` }}>
                          <span style={{ fontSize: 16, color: uploaded ? "var(--green, #27ae60)" : "var(--ink4)" }}>{uploaded ? "\u2713" : "\u25CB"}</span>
                          <span style={{ fontSize: 13, color: "var(--ink)", flex: 1 }}>{doc.label}</span>
                          <span style={{ fontSize: 11, color: "var(--ink4)" }}>{doc.category.replace(/_/g, " ")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ border: "2px dashed var(--border)", borderRadius: "var(--r)", padding: "24px", textAlign: "center", marginBottom: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Category</label>
                    <select style={{ ...selectStyle, maxWidth: 300, margin: "0 auto" }} value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                      {RECOMMENDED_DOCS.map(d => <option key={d.category} value={d.category}>{d.label}</option>)}
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={e => setUploadFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: "10px 24px", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {uploadFile ? uploadFile.name : "Choose File"}
                  </button>
                  {uploadFile && (
                    <button onClick={handleUpload} disabled={uploading} style={{ marginLeft: 12, padding: "10px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: uploading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                  )}
                </div>
                {uploadError && <div style={{ fontSize: 13, color: "var(--red, #c0392b)", marginBottom: 12 }}>{uploadError}</div>}

                {uploadedDocs.length > 0 && (
                  <div>
                    <label style={labelStyle}>Uploaded Documents</label>
                    {uploadedDocs.map((doc, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--cream)", borderRadius: "var(--r)", marginBottom: 4, border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 14 }}>{"\uD83D\uDCC4"}</span>
                        <span style={{ fontSize: 13, color: "var(--ink)", flex: 1 }}>{doc.originalName || doc.name || "Document"}</span>
                        <span style={{ fontSize: 11, color: "var(--ink4)", background: "rgba(200,155,60,.1)", padding: "2px 8px", borderRadius: 4 }}>{doc.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 7: Review & Assess */}
            {step === 7 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>Review & Assess</h2>

                {/* Business Basics Summary */}
                <div style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "20px", marginBottom: 16, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Business Basics</div>
                    <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "var(--ink3)" }}>
                    <div><strong>Business:</strong> {businessName}</div>
                    <div><strong>EIN:</strong> {ein}</div>
                    <div><strong>Entity:</strong> {entityType}</div>
                    <div><strong>State:</strong> {stateOfIncorporation}</div>
                    <div><strong>Address:</strong> {principalAddress}, {city}, {addrState} {zip}</div>
                    <div><strong>Year Est.:</strong> {yearEstablished}</div>
                    <div><strong>First Revenue:</strong> {firstRevenueDate}</div>
                    <div><strong>NAICS:</strong> {naicsCodes}</div>
                  </div>
                </div>

                {/* Ownership Summary */}
                <div style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "20px", marginBottom: 16, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Ownership & Demographics</div>
                    <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                  </div>
                  {owners.map((o, i) => (
                    <div key={i} style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 6 }}>
                      <strong>{o.name}</strong> &mdash; {o.ownershipPercentage}% | {o.gender} | {o.ethnicity} | {o.veteranStatus}
                      {o.disabilityStatus && " | Disability"}{o.usCitizen && " | US Citizen"}{o.managesDailyOps && " | Daily Ops"}
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: totalOwnership === 100 ? "var(--green, #27ae60)" : "var(--red, #c0392b)", marginTop: 4 }}>Total ownership: {totalOwnership}%</div>
                </div>

                {/* Financials Summary */}
                <div style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "20px", marginBottom: 16, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Financials</div>
                    <button onClick={() => setStep(3)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "var(--ink3)" }}>
                    <div><strong>Revenue Y1:</strong> {revenueYear1 || "\u2014"}</div>
                    <div><strong>Revenue Y2:</strong> {revenueYear2 || "\u2014"}</div>
                    <div><strong>Revenue Y3:</strong> {revenueYear3 || "\u2014"}</div>
                    <div><strong>Employees:</strong> {employeeCount || "\u2014"}</div>
                    <div><strong>Net Worth:</strong> {netWorthRange || "\u2014"}</div>
                    <div><strong>AGI:</strong> {agiRange || "\u2014"}</div>
                    <div><strong>Total Assets:</strong> {totalAssetsRange || "\u2014"}</div>
                  </div>
                </div>

                {/* Location Summary */}
                <div style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "20px", marginBottom: 16, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Location</div>
                    <button onClick={() => setStep(4)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink3)" }}>
                    <div><strong>ZIP:</strong> {hubzoneZip || "\u2014"}</div>
                    <div><strong>Employees in HUBZone:</strong> {hubzoneEmployeePct ? `${hubzoneEmployeePct}%` : "\u2014"}</div>
                    <div><strong>State:</strong> {addrState || client?.state || "\u2014"}</div>
                  </div>
                </div>

                {/* Performance Summary */}
                <div style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "20px", marginBottom: 16, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Past Performance & Registrations</div>
                    <button onClick={() => setStep(5)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "var(--ink3)" }}>
                    <div><strong>SAM.gov:</strong> {samRegistered || "\u2014"}</div>
                    <div><strong>Active Contracts:</strong> {activeContracts ? "Yes" : "No"}</div>
                    <div><strong>Completed:</strong> {completedContracts || "0"}</div>
                    <div><strong>CPARS:</strong> {cparsAvailable ? "Yes" : "No"}</div>
                    <div><strong>References:</strong> {pastPerfRefs ? "Yes" : "No"}</div>
                    <div><strong>Certifications:</strong> {existingCerts.length ? existingCerts.join(", ") : "None"}</div>
                  </div>
                </div>

                {/* Documents Summary */}
                <div style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "20px", marginBottom: 24, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Documents</div>
                    <button onClick={() => setStep(6)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Edit</button>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink3)" }}>
                    {uploadedDocs.length > 0
                      ? <span>{uploadedDocs.length} document(s) uploaded</span>
                      : <span>No documents uploaded yet</span>
                    }
                  </div>
                </div>

                {/* Assess Button */}
                {assessing ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ width: 48, height: 48, border: "4px solid var(--border)", borderTopColor: "var(--gold)", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                    <div style={{ fontSize: 16, fontWeight: 500, color: "var(--navy)" }}>Analyzing eligibility...</div>
                    <div style={{ fontSize: 13, color: "var(--ink4)", marginTop: 4 }}>This may take a moment.</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : (
                  <button onClick={runAssessment} style={{ width: "100%", padding: "16px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 24px rgba(200,155,60,.4)", letterSpacing: ".02em" }}>
                    Run Eligibility Assessment
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} style={{ padding: "10px 24px", background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 14, color: "var(--ink)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Back
                </button>
              )}
              <button onClick={saveAndExit} disabled={saving} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                {saving ? "Saving..." : "Save & Exit"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {step < 7 && (
                <>
                  <button onClick={() => setStep(s => s + 1)} style={{ background: "none", border: "none", color: "var(--ink4)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                    Skip this step
                  </button>
                  <button onClick={saveAndNext} disabled={saving} style={{ padding: "10px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 24px rgba(200,155,60,.3)" }}>
                    {saving ? "Saving..." : "Next"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortalEligibilityPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
        Loading eligibility wizard...
      </div>
    }>
      <PortalEligibilityPageInner />
    </Suspense>
  );
}