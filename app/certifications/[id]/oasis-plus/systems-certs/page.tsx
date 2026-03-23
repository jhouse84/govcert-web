"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { trackPageView } from "@/lib/activity";
import CertSidebar from "@/components/CertSidebar";
import { OASIS_SECTIONS } from "@/lib/oasis-domains";

const API = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";
const CLEARANCE_LEVELS = ["None", "Confidential", "Secret", "Top Secret", "TS/SCI"];
const STANDARD_CERTS = [
  { id: "iso-9001", name: "ISO 9001", desc: "Quality Management Systems" },
  { id: "iso-27001", name: "ISO 27001", desc: "Information Security Management" },
  { id: "iso-20000", name: "ISO 20000", desc: "IT Service Management" },
  { id: "cmmi-dev", name: "CMMI Dev", desc: "Capability Maturity Model Integration — Development" },
  { id: "cmmi-svc", name: "CMMI SVC", desc: "Capability Maturity Model Integration — Services" },
  { id: "as9100", name: "AS9100", desc: "Aerospace Quality Management" },
  { id: "soc-2", name: "SOC 2", desc: "Service Organization Controls" },
];

interface BusinessSystem {
  name: string;
  approved: boolean;
  approvalAgency: string;
}

interface FacilityClearance {
  level: string;
  expirationDate: string;
  facilityName: string;
}

interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  expirationDate: string;
}

interface SystemsCertsData {
  businessSystems: BusinessSystem[];
  facilityClearance: FacilityClearance;
  certifications: { standard: string[]; custom: Certification[] };
}

export default function OASISSystemsCertsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [businessSystems, setBusinessSystems] = useState<BusinessSystem[]>([
    { name: "Accounting System", approved: false, approvalAgency: "" },
    { name: "Estimating System", approved: false, approvalAgency: "" },
    { name: "Purchasing System", approved: false, approvalAgency: "" },
  ]);
  const [facilityClearance, setFacilityClearance] = useState<FacilityClearance>({ level: "None", expirationDate: "", facilityName: "" });
  const [selectedStandardCerts, setSelectedStandardCerts] = useState<string[]>([]);
  const [customCerts, setCustomCerts] = useState<Certification[]>([]);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    trackPageView("oasis-systems-certs");
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${certId}`);
      setCert(data);
      const app = data.application;
      if (app?.oasisSystemsData) {
        try {
          const parsed: SystemsCertsData = JSON.parse(app.oasisSystemsData);
          if (parsed.businessSystems) setBusinessSystems(parsed.businessSystems);
          if (parsed.facilityClearance) setFacilityClearance(parsed.facilityClearance);
          if (parsed.certifications?.standard) setSelectedStandardCerts(parsed.certifications.standard);
          if (parsed.certifications?.custom) setCustomCerts(parsed.certifications.custom);
        } catch { }
      }
      const completed: Record<string, boolean> = {};
      if (app) {
        if (app.oasisDomains) completed["domains"] = true;
        if (app.oasisScorecardData) completed["scorecard"] = true;
        if (app.oasisQPData) completed["qualifying-projects"] = true;
        if (app.oasisPPData) completed["past-performance"] = true;
        if (app.oasisFEPData) completed["federal-experience"] = true;
        if (app.oasisSystemsData) completed["systems-certs"] = true;
      }
      setCompletedSections(completed);
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  function updateBusinessSystem(idx: number, field: keyof BusinessSystem, value: any) {
    setBusinessSystems(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    setSaved(false);
  }

  function toggleStandardCert(certId: string) {
    setSelectedStandardCerts(prev => prev.includes(certId) ? prev.filter(c => c !== certId) : [...prev, certId]);
    setSaved(false);
  }

  function addCustomCert() {
    setCustomCerts(prev => [...prev, { id: crypto.randomUUID(), name: "", issuingBody: "", expirationDate: "" }]);
  }

  function updateCustomCert(certId: string, field: keyof Certification, value: string) {
    setCustomCerts(prev => prev.map(c => c.id === certId ? { ...c, [field]: value } : c));
    setSaved(false);
  }

  function removeCustomCert(certId: string) {
    setCustomCerts(prev => prev.filter(c => c.id !== certId));
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("clientId", cert?.clientId || "");
        formData.append("category", "OASIS_SYSTEMS_CERTS");
        formData.append("description", "Business systems or certification documentation");
        const token = localStorage.getItem("token");
        await fetch(`${API}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
    } catch (err: any) {
      setError("Upload failed: " + (err.message || "Please try again."));
    } finally {
      setUploading(false);
    }
  }

  async function save(andNavigate?: boolean) {
    setSaving(true);
    setError(null);
    try {
      const data: SystemsCertsData = {
        businessSystems,
        facilityClearance,
        certifications: { standard: selectedStandardCerts, custom: customCerts },
      };
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert?.clientId,
          certType: "OASIS_PLUS",
          oasisSystemsData: JSON.stringify(data),
        }),
      });
      setSaved(true);
      if (andNavigate) {
        router.push(`/certifications/${certId}/oasis-plus/review`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      <CertSidebar user={user} certId={certId} activePage="systems-certs" sidebarContent={
        <div>
          <div style={{ padding: "8px 9px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>OASIS+ Sections</div>
          </div>
          {OASIS_SECTIONS.map(section => {
            const isActive = section.id === "systems-certs";
            const isComplete = completedSections[section.id];
            return (
              <a key={section.id} href={`/certifications/${certId}/oasis-plus/${section.id}`} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: "var(--r)",
                background: isActive ? "rgba(200,155,60,.15)" : "transparent",
                border: isActive ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
                color: isActive ? "var(--gold2)" : isComplete ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.35)",
                textDecoration: "none", fontSize: 12.5, fontWeight: isActive ? 500 : 400, marginBottom: 1,
              }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: isComplete ? "var(--green)" : "rgba(255,255,255,.08)", border: isComplete ? "none" : "1px solid rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: isComplete ? "#fff" : "rgba(255,255,255,.3)", fontWeight: 600, flexShrink: 0 }}>
                  {isComplete ? "✓" : ""}
                </span>
                {section.label}
              </a>
            );
          })}
        </div>
      } />

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            ← Back to Application
          </a>

          <div style={{ marginTop: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
              GSA OASIS+ — Step 6 of 8
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
              Systems & Certifications
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6, maxWidth: 680 }}>
              Document your government-approved business systems, facility security clearances, and third-party certifications. These contribute to the Business Systems, Facility Clearance, and Certifications scoring categories.
            </p>
          </div>

          {error && (
            <div style={{ padding: "12px 18px", background: "rgba(231,76,60,.08)", border: "1px solid rgba(231,76,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "#e74c3c" }}>{error}</div>
          )}
          {saved && (
            <div style={{ padding: "12px 18px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 13, color: "var(--green)" }}>Systems and certifications saved successfully.</div>
          )}

          {/* Section A: Contractor Business Systems */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Section A</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>Contractor Business Systems</h2>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20 }}>Government-approved business systems earn up to 2 scoring credits.</p>

            {businessSystems.map((sys, idx) => (
              <div key={sys.name} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: idx < businessSystems.length - 1 ? "1px solid var(--border)" : "none" }}>
                <input type="checkbox" checked={sys.approved} onChange={e => updateBusinessSystem(idx, "approved", e.target.checked)}
                  style={{ accentColor: "var(--gold)", width: 18, height: 18, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: sys.approved ? "var(--gold)" : "var(--navy)" }}>{sys.name}</div>
                </div>
                {sys.approved && (
                  <input type="text" value={sys.approvalAgency} onChange={e => updateBusinessSystem(idx, "approvalAgency", e.target.value)}
                    placeholder="Approval agency (e.g., DCAA)"
                    style={{ width: 260, padding: "8px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                )}
              </div>
            ))}
          </div>

          {/* Section B: Facility Clearances */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Section B</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>Facility Clearances</h2>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20 }}>Active facility security clearances earn up to 1 scoring credit.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Clearance Level</label>
                <select value={facilityClearance.level} onChange={e => { setFacilityClearance(prev => ({ ...prev, level: e.target.value })); setSaved(false); }}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, background: "#fff", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}>
                  {CLEARANCE_LEVELS.map(cl => <option key={cl} value={cl}>{cl}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Expiration Date</label>
                <input type="date" value={facilityClearance.expirationDate} onChange={e => { setFacilityClearance(prev => ({ ...prev, expirationDate: e.target.value })); setSaved(false); }}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Cleared Facility Name</label>
                <input type="text" value={facilityClearance.facilityName} onChange={e => { setFacilityClearance(prev => ({ ...prev, facilityName: e.target.value })); setSaved(false); }}
                  placeholder="Facility name"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>

          {/* Section C: Third-Party Certifications */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Section C</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>Third-Party Certifications</h2>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20 }}>Industry certifications earn up to 2 scoring credits. Check any that your company holds.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {STANDARD_CERTS.map(cert => {
                const isSelected = selectedStandardCerts.includes(cert.id);
                return (
                  <div key={cert.id} onClick={() => toggleStandardCert(cert.id)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: "var(--r)", cursor: "pointer",
                    border: isSelected ? "2px solid var(--gold)" : "1px solid var(--border)",
                    background: isSelected ? "rgba(200,155,60,.04)" : "#fff",
                  }}>
                    <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: "var(--gold)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? "var(--gold)" : "var(--navy)" }}>{cert.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink4)" }}>{cert.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Certs */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 12 }}>Additional Certifications</div>
              {customCerts.map(cert => (
                <div key={cert.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, marginBottom: 10 }}>
                  <input type="text" value={cert.name} onChange={e => updateCustomCert(cert.id, "name", e.target.value)}
                    placeholder="Certification name"
                    style={{ padding: "8px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                  <input type="text" value={cert.issuingBody} onChange={e => updateCustomCert(cert.id, "issuingBody", e.target.value)}
                    placeholder="Issuing body"
                    style={{ padding: "8px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                  <input type="date" value={cert.expirationDate} onChange={e => updateCustomCert(cert.id, "expirationDate", e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} />
                  <button onClick={() => removeCustomCert(cert.id)} style={{ padding: "8px 12px", background: "rgba(231,76,60,.06)", border: "1px solid rgba(231,76,60,.15)", borderRadius: "var(--r)", color: "#e74c3c", fontSize: 11, cursor: "pointer" }}>✕</button>
                </div>
              ))}
              <button onClick={addCustomCert} style={{ padding: "8px 16px", background: "transparent", border: "1px dashed var(--border2)", borderRadius: "var(--r)", color: "var(--gold)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                + Add Certification
              </button>
            </div>
          </div>

          {/* Document Upload */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Supporting Documentation</div>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 14 }}>Upload approval letters, clearance documentation, and certification copies.</p>
            <input type="file" ref={fileInputRef} multiple onChange={e => handleFileUpload(e.target.files)} style={{ display: "none" }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{
              padding: "10px 20px", background: "var(--cream)", border: "1px solid var(--border2)",
              borderRadius: "var(--r)", color: "var(--navy)", fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>
              {uploading ? "Uploading..." : "Upload Documents"}
            </button>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <a href={`/certifications/${certId}/oasis-plus/federal-experience`} style={{ padding: "12px 24px", background: "var(--cream2)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>
              ← Federal Experience
            </a>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => save(false)} disabled={saving} style={{
                padding: "12px 24px", background: "#fff", border: "1px solid var(--border2)", borderRadius: "var(--r)",
                color: "var(--navy)", fontSize: 14, fontWeight: 500, cursor: saving ? "wait" : "pointer",
              }}>
                {saving ? "Saving..." : "Save Progress"}
              </button>
              <button onClick={() => save(true)} disabled={saving} style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
                border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(200,155,60,.3)",
              }}>
                Save & Next → Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
