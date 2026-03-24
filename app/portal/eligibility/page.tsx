"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("welcome") === "true";
  });

  // Also check on mount in case router.push hasn't updated URL yet
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Check URL param
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "true") {
      setShowWelcome(true);
      return;
    }
    // Also check if user is brand new (no onboarded flag = show welcome)
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const onboardKey = `govcert_onboarded_${parsed.id || parsed.email}`;
        const onboarded = localStorage.getItem(onboardKey) || localStorage.getItem("govcert_onboarded");
        if (!onboarded) {
          setShowWelcome(true);
        }
      } catch {}
    }
  }, []);

  function dismissWelcome() {
    // Set user-specific onboarding flag
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        localStorage.setItem(`govcert_onboarded_${parsed.id || parsed.email}`, "true");
      } catch {}
    }
    localStorage.setItem("govcert_onboarded", "true"); // legacy fallback
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
  const [domainMatch, setDomainMatch] = useState<any>(null);
  const [importing, setImporting] = useState(false);

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
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
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

      // Check for domain-matched company data to offer import
      if (cId) {
        try {
          const domainMatch = await apiRequest("/api/clients/domain-match");
          if (domainMatch.found && domainMatch.clientData) {
            setDomainMatch(domainMatch);
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

      // Load business fields from client record
      if (clientData.entityType) setEntityType(clientData.entityType);
      if (clientData.address) setPrincipalAddress(clientData.address);
      if (clientData.city) setCity(clientData.city);
      if (clientData.state) setAddrState(clientData.state);
      if (clientData.zip) setZip(clientData.zip);

      // Load intake data
      try {
        const intake = await apiRequest(`/api/eligibility/${cId}`);
        if (intake) {
          if (intake.yearEstablished) setYearEstablished(String(intake.yearEstablished));
          if (intake.firstRevenueDate) setFirstRevenueDate(String(intake.firstRevenueDate).split("T")[0]);
          if (intake.naicsCodes) setNaicsCodes(intake.naicsCodes);

          // Owners (JSON string from API)
          if (intake.owners) {
            try {
              const parsed = typeof intake.owners === "string" ? JSON.parse(intake.owners) : intake.owners;
              if (Array.isArray(parsed) && parsed.length > 0) setOwners(parsed);
            } catch {}
          }

          // Revenue (stored as JSON array [yr1, yr2, yr3])
          if (intake.revenue3Years) {
            try {
              const rev = typeof intake.revenue3Years === "string" ? JSON.parse(intake.revenue3Years) : intake.revenue3Years;
              if (Array.isArray(rev)) {
                if (rev[0]) setRevenueYear1(String(rev[0]));
                if (rev[1]) setRevenueYear2(String(rev[1]));
                if (rev[2]) setRevenueYear3(String(rev[2]));
              }
            } catch {}
          }

          if (intake.employeeCount) setEmployeeCount(String(intake.employeeCount));
          if (intake.ownerNetWorth) setNetWorthRange(intake.ownerNetWorth);
          if (intake.ownerAGI) setAgiRange(intake.ownerAGI);
          if (intake.ownerTotalAssets) setTotalAssetsRange(intake.ownerTotalAssets);
          if (intake.principalZip) setHubzoneZip(intake.principalZip);
          if (intake.hubZoneEmployeePct) setHubzoneEmployeePct(String(intake.hubZoneEmployeePct));
          if (intake.isHubZone !== null && intake.isHubZone !== undefined) setHubzoneResult(intake.isHubZone);
          if (intake.samRegistered) setSamRegistered(intake.samRegistered);
          if (intake.activeFederalContracts !== null && intake.activeFederalContracts !== undefined) setActiveContracts(intake.activeFederalContracts);
          if (intake.completedContracts) setCompletedContracts(String(intake.completedContracts));

          // Existing certs (JSON string)
          if (intake.existingCerts) {
            try {
              const parsed = typeof intake.existingCerts === "string" ? JSON.parse(intake.existingCerts) : intake.existingCerts;
              if (Array.isArray(parsed)) setExistingCerts(parsed);
            } catch {}
          }

          if (intake.completedSteps && intake.completedSteps > 0) setStep(Math.min(intake.completedSteps + 1, 7) as any);
        }
      } catch { /* no existing intake */ }

      // Load existing uploaded documents for this client
      try {
        const docs = await apiRequest(`/api/upload/documents?clientId=${cId}`);
        if (docs && docs.length > 0) {
          setUploadedDocs(docs.map((d: any) => ({ document: d, aiAnalysis: d.aiAnalysis, documentYear: d.documentYear, category: d.category })));
        }
      } catch { /* no docs yet */ }
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

  async function pollForAIAnalysis(docId: string) {
    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";
    let attempts = 0;
    const maxAttempts = 15;
    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`${apiUrl}/api/upload/documents/${docId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const doc = await res.json();
        if (doc.aiAnalysis) {
          setUploadedDocs(prev => prev.map(d =>
            (d.document?.id === docId || d.id === docId)
              ? { ...d, document: doc, aiAnalysis: doc.aiAnalysis, documentYear: doc.documentYear, category: doc.category }
              : d
          ));
          setAnalyzingIds(prev => { const next = new Set(prev); next.delete(docId); return next; });
          return;
        }
      } catch {}
      if (attempts < maxAttempts) {
        setTimeout(poll, 3000);
      } else {
        setAnalyzingIds(prev => { const next = new Set(prev); next.delete(docId); return next; });
      }
    };
    setTimeout(poll, 2000);
  }

  async function handleUpload() {
    if (uploadFiles.length === 0 || !clientId) return;
    setUploading(true);
    setUploadError("");
    try {
      const token = localStorage.getItem("token");
      const results: any[] = [];
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", clientId);
        formData.append("category", uploadCategory);
        formData.append("description", `Eligibility intake - ${uploadCategory}`);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app"}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Upload failed for ${file.name}`);
        results.push(data);
        // Start polling for AI analysis
        if (data.document?.id) {
          setAnalyzingIds(prev => new Set(prev).add(data.document.id));
          pollForAIAnalysis(data.document.id);
        }
      }
      setUploadedDocs(prev => [...prev, ...results]);
      setUploadFiles([]);
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
      // Save current data (don't block assessment if save fails)
      try {
        await apiRequest(`/api/eligibility/${clientId}`, {
          method: "PUT",
          body: JSON.stringify({ ...buildPayload(), completedSteps: 7 }),
        });
      } catch (saveErr) {
        console.error("Save before assess failed (continuing):", saveErr);
      }
      // Run assessment
      const result = await apiRequest(`/api/eligibility/${clientId}/assess`, { method: "POST" });
      console.log("Assessment result:", result);
      // Mark onboarding complete so portal home shows dashboard
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(`govcert_onboarded_${userData.id || userData.email}`, "true");
        localStorage.setItem("govcert_onboarded", "true");
      } catch {}
      router.push("/portal/eligibility/results");
    } catch (err: any) {
      console.error("Assessment failed:", err);
      alert("Assessment failed: " + (err.message || "Unknown error. Please try again."));
      setAssessing(false);
    }
  }

  function connectQuickBooks() {
    if (!clientId) return;
    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";
    window.location.href = `${apiUrl}/api/oauth/quickbooks/start?clientId=${clientId}&token=${token}`;
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
                textAlign: "center" as const, maxWidth: 560, margin: "0 auto 16px",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Watch the overview above, then download your sample data package below. These files contain a fictional company profile that you can upload to test every feature of the platform.
              </p>

              {/* Beta Sample Data Download */}
              <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>📦</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#4338CA" }}>Step 1: Download Sample Data</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)" }}>8 files — capability statement, financials (Excel), proposal, and invoices (CSV)</div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const data = await apiRequest("/api/clients/beta/dummy-package");
                      for (const file of data.files) {
                        let blob;
                        if (file.contentBase64) {
                          const binary = atob(file.contentBase64);
                          const bytes = new Uint8Array(binary.length);
                          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                          blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        } else {
                          const mimeTypes: Record<string, string> = { csv: "text/csv", txt: "text/plain" };
                          blob = new Blob([file.content], { type: mimeTypes[file.type] || "text/plain" });
                        }
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = file.name;
                        document.body.appendChild(a); a.click();
                        document.body.removeChild(a); URL.revokeObjectURL(url);
                      }
                      // Show cert intent
                      if (data.certificationIntent) {
                        const ci = data.certificationIntent;
                        alert(`📦 Downloaded ${data.totalFiles} files for "${data.companyName}"\n\n🎯 Targeting: ${ci.primaryLabel}\n📊 Openness to other certs: ${ci.explorationLevel.toUpperCase()}\n\n${ci.explorationNote}\n\nNow click "Start Eligibility Wizard" to begin uploading these files!`);
                      }
                    } catch (err: any) { alert("Download failed: " + err.message); }
                  }}
                  style={{
                    width: "100%", padding: "11px", background: "#4338CA", border: "none",
                    borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", boxShadow: "0 2px 10px rgba(67,56,202,.3)",
                  }}
                >
                  Download Sample Files
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "var(--cream)", borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>📋</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Step 2: Start the Eligibility Wizard</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>Use the sample data to fill in the wizard and test the AI analysis</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 10 }}>
                <button
                  onClick={dismissWelcome}
                  style={{
                    width: "100%", padding: "13px", background: "#C89B3C", border: "none",
                    borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    boxShadow: "0 4px 16px rgba(200,155,60,0.3)",
                  }}
                >
                  Start Eligibility Wizard &rarr;
                </button>
                <button
                  onClick={dismissWelcome}
                  style={{
                    background: "none", border: "none", color: "var(--ink4)",
                    fontSize: 13, cursor: "pointer", textDecoration: "underline",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain match prompt — offer to import existing company data */}
      {domainMatch && domainMatch.found && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,25,41,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "36px 40px", maxWidth: 520, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,.25)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>
              We found existing company data
            </h2>
            <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 16 }}>
              Another user from <strong>@{domainMatch.domain}</strong> has already entered data for <strong>{domainMatch.companyName}</strong>. Would you like to import it to save time?
            </p>
            <div style={{ background: "var(--cream)", borderRadius: "var(--r)", padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", marginBottom: 8 }}>Available to import ({domainMatch.fieldsAvailable} fields):</div>
              {domainMatch.clientData.businessName && <div style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 3 }}>Business Name: <strong>{domainMatch.clientData.businessName}</strong></div>}
              {domainMatch.clientData.uei && <div style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 3 }}>UEI: {domainMatch.clientData.uei}</div>}
              {domainMatch.clientData.cageCode && <div style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 3 }}>CAGE: {domainMatch.clientData.cageCode}</div>}
              {domainMatch.clientData.address && <div style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 3 }}>Address: {[domainMatch.clientData.address, domainMatch.clientData.city, domainMatch.clientData.state].filter(Boolean).join(", ")}</div>}
              {domainMatch.clientData.naicsCodes && <div style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 3 }}>NAICS: {domainMatch.clientData.naicsCodes}</div>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={async () => {
                setImporting(true);
                try {
                  await apiRequest(`/api/clients/${clientId}/import-domain`, {
                    method: "POST",
                    body: JSON.stringify({ sourceData: domainMatch.clientData }),
                  });
                  setDomainMatch(null);
                  window.location.reload();
                } catch { setDomainMatch(null); }
                finally { setImporting(false); }
              }}
                style={{ flex: 1, padding: "12px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {importing ? "Importing..." : "Yes, Import Data"}
              </button>
              <button onClick={() => setDomainMatch(null)}
                style={{ flex: 1, padding: "12px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 14, color: "var(--ink3)", cursor: "pointer" }}>
                No, Start Fresh
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--ink4)", textAlign: "center" as const, marginTop: 12 }}>
              Imported data will only fill empty fields. You can always edit everything later.
            </p>
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
          <a href="/portal/profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>{"\uD83C\uDFE2"}</span> Company Profile
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
                  <input type="file" ref={fileInputRef} multiple onChange={e => setUploadFiles(Array.from(e.target.files || []))} style={{ display: "none" }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: "10px 24px", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    {uploadFiles.length > 0 ? `${uploadFiles.length} file${uploadFiles.length > 1 ? "s" : ""} selected` : "Choose Files"}
                  </button>
                  {uploadFiles.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 8 }}>
                        {uploadFiles.map((f, i) => <div key={i} style={{ padding: "2px 0" }}>📎 {f.name} ({(f.size / 1024).toFixed(0)} KB)</div>)}
                      </div>
                      <button onClick={handleUpload} disabled={uploading} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: uploading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px rgba(200,155,60,.35)" }}>
                        {uploading ? "Uploading..." : `Upload ${uploadFiles.length} File${uploadFiles.length > 1 ? "s" : ""}`}
                      </button>
                    </div>
                  )}
                </div>
                {uploadError && <div style={{ fontSize: 13, color: "var(--red, #c0392b)", marginBottom: 12 }}>{uploadError}</div>}

                {uploadedDocs.length > 0 && (
                  <div>
                    <label style={labelStyle}>Uploaded Documents</label>
                    {uploadedDocs.map((doc, i) => {
                      const docRecord = doc.document || doc;
                      const docId = docRecord.id;
                      const isAnalyzing = analyzingIds.has(docId);
                      let analysis: any = null;
                      try {
                        const raw = doc.aiAnalysis || docRecord.aiAnalysis;
                        if (raw) analysis = typeof raw === "string" ? JSON.parse(raw) : raw;
                      } catch {}
                      const year = doc.documentYear || docRecord.documentYear;
                      const category = doc.category || docRecord.category || "OTHER";
                      return (
                        <div key={i} style={{ background: "var(--cream)", borderRadius: "var(--r)", marginBottom: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                            <span style={{ fontSize: 14 }}>{"\uD83D\uDCC4"}</span>
                            <span style={{ fontSize: 13, color: "var(--ink)", flex: 1, fontWeight: 500 }}>{docRecord.originalName || docRecord.name || "Document"}</span>
                            {year && (
                              <span style={{ fontSize: 11, color: "#0B1929", background: "rgba(39,174,96,.12)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{year}</span>
                            )}
                            <span style={{ fontSize: 11, color: "var(--ink4)", background: "rgba(200,155,60,.1)", padding: "2px 8px", borderRadius: 4 }}>{category.replace(/_/g, " ")}</span>
                          </div>
                          {isAnalyzing && (
                            <div style={{ padding: "8px 14px 10px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                              <span style={{ fontSize: 12, color: "var(--ink4)" }}>AI is reviewing this document...</span>
                            </div>
                          )}
                          {analysis && (
                            <div style={{ padding: "10px 14px 12px", borderTop: "1px solid var(--border)", background: "rgba(200,155,60,.03)" }}>
                              <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 6 }}>{analysis.description}</div>
                              {analysis.usage && (
                                <div style={{ fontSize: 11, color: "var(--ink4)", marginBottom: 6 }}>
                                  <strong>Cert use:</strong> {analysis.usage}
                                </div>
                              )}
                              {analysis.keyDataPoints && analysis.keyDataPoints.length > 0 && (
                                <div style={{ fontSize: 11, color: "var(--ink3)" }}>
                                  {analysis.keyDataPoints.map((pt: string, j: number) => (
                                    <div key={j} style={{ padding: "1px 0" }}>&#x2022; {pt}</div>
                                  ))}
                                </div>
                              )}
                              {analysis.usefulness && (
                                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                                  <div style={{ fontSize: 10, color: "var(--ink4)", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Usefulness</div>
                                  <div style={{ flex: 1, maxWidth: 80, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                                    <div style={{ width: `${(analysis.usefulness / 10) * 100}%`, height: "100%", background: analysis.usefulness >= 7 ? "#27ae60" : analysis.usefulness >= 4 ? "var(--gold)" : "#c0392b", borderRadius: 2 }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)" }}>{analysis.usefulness}/10</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
                      ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ marginBottom: 4 }}>{uploadedDocs.length} document(s) uploaded</div>
                          {uploadedDocs.map((doc, i) => {
                            const docRecord = doc.document || doc;
                            const year = doc.documentYear || docRecord.documentYear;
                            const cat = (doc.category || docRecord.category || "OTHER").replace(/_/g, " ");
                            return (
                              <div key={i} style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                                <span>{"\uD83D\uDCC4"}</span>
                                <span style={{ flex: 1 }}>{docRecord.originalName || docRecord.name || "Document"}</span>
                                {year && <span style={{ fontSize: 10, color: "#27ae60", fontWeight: 600 }}>{year}</span>}
                                <span style={{ fontSize: 10, color: "var(--ink4)" }}>{cat}</span>
                              </div>
                            );
                          })}
                        </div>
                      )
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
  return <PortalEligibilityPageInner />;
}