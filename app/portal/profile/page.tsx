"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const FIELDS = [
  { key: "businessName", label: "Legal Business Name", placeholder: "e.g., House Strategies Group LLC", group: "company" },
  { key: "ownerName", label: "Owner / Principal Name", placeholder: "e.g., Jelani House", group: "company" },
  { key: "entityType", label: "Entity Type", placeholder: "e.g., LLC, S-Corp, C-Corp", group: "company" },
  { key: "ein", label: "EIN / Tax ID", placeholder: "XX-XXXXXXX", group: "identifiers" },
  { key: "uei", label: "Unique Entity Identifier (UEI)", placeholder: "12-character UEI from SAM.gov", group: "identifiers" },
  { key: "cageCode", label: "CAGE Code", placeholder: "5-character CAGE code", group: "identifiers" },
  { key: "address", label: "Street Address", placeholder: "123 Main St", group: "address" },
  { key: "city", label: "City", placeholder: "Washington", group: "address" },
  { key: "state", label: "State", placeholder: "DC", group: "address" },
  { key: "zip", label: "ZIP Code", placeholder: "20001", group: "address" },
  { key: "phone", label: "Phone", placeholder: "(202) 555-0100", group: "contact" },
  { key: "email", label: "Business Email", placeholder: "contact@company.com", group: "contact" },
  { key: "website", label: "Website", placeholder: "https://www.company.com", group: "contact" },
  { key: "naicsCodes", label: "NAICS Codes", placeholder: "541511, 541512, 541611", group: "identifiers" },
];

const GROUPS = [
  { id: "company", label: "Business Details", icon: "🏢" },
  { id: "identifiers", label: "Federal Identifiers", icon: "🆔" },
  { id: "address", label: "Physical Address", icon: "📍" },
  { id: "contact", label: "Contact Information", icon: "📞" },
];

const API = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

export default function CompanyProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // SAM.gov
  const [samQuery, setSamQuery] = useState("");
  const [samSearching, setSamSearching] = useState(false);
  const [samResult, setSamResult] = useState<any>(null);
  const [samError, setSamError] = useState("");
  const [samApplied, setSamApplied] = useState(false);

  // AI extract from documents
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState("");
  const [aiApplied, setAiApplied] = useState(false);
  const [docCount, setDocCount] = useState(0);

  // File upload for AI extraction
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "ADMIN" || parsed.role === "ADVISOR") { router.push("/dashboard"); return; }
      setUser(parsed);
    }
    fetchClient();
  }, []);

  useEffect(() => {
    // Detect changes
    const changed = FIELDS.some(f => (formData[f.key] || "") !== (original[f.key] || ""));
    setHasChanges(changed);
  }, [formData, original]);

  async function fetchClient() {
    try {
      // Get client ID
      let cId: string | null = null;
      try {
        const certs = await apiRequest("/api/certifications");
        if (certs?.length > 0 && certs[0].clientId) cId = certs[0].clientId;
      } catch {}
      if (!cId) {
        try {
          const clients = await apiRequest("/api/clients");
          if (clients?.length > 0) cId = clients[0].id;
        } catch {}
      }
      if (!cId) {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const newClient = await apiRequest("/api/clients", {
          method: "POST",
          body: JSON.stringify({ name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "My Business", email: userData.email || "" }),
        });
        cId = newClient.id;
      }
      setClientId(cId);

      // Load client data
      if (cId) {
        const client = await apiRequest(`/api/clients/${cId}`);
        const data: Record<string, string> = {};
        FIELDS.forEach(f => { data[f.key] = client[f.key] || ""; });
        setFormData(data);
        setOriginal(data);

        // Check doc count
        try {
          const docs = await apiRequest(`/api/upload/documents?clientId=${cId}`);
          setDocCount(Array.isArray(docs) ? docs.length : 0);
        } catch {}
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function saveProfile() {
    if (!clientId) return;
    setSaving(true);
    try {
      await apiRequest(`/api/clients/${clientId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      setOriginal({ ...formData });
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  // SAM.gov lookup
  async function lookupSam() {
    if (!samQuery.trim()) return;
    setSamSearching(true);
    setSamResult(null);
    setSamError("");
    setSamApplied(false);
    try {
      const q = samQuery.trim();
      const param = q.length === 5 ? `cage=${encodeURIComponent(q)}` : `uei=${encodeURIComponent(q)}`;
      const data = await apiRequest(`/api/sam/lookup?${param}`);
      const entity = data?.entities?.[0] || data;
      if (!entity || (!entity.entityName && !entity.uei)) {
        setSamError("No entity found. Check your UEI or CAGE code.");
      } else {
        setSamResult(entity);
      }
    } catch (err: any) {
      setSamError(err.message || "SAM.gov lookup failed.");
    } finally {
      setSamSearching(false);
    }
  }

  function applySamData() {
    if (!samResult) return;
    const updates: Record<string, string> = { ...formData };
    if (samResult.entityName) updates.businessName = samResult.entityName;
    if (samResult.uei) updates.uei = samResult.uei;
    if (samResult.cageCode) updates.cageCode = samResult.cageCode;
    if (samResult.address?.line1) updates.address = samResult.address.line1;
    if (samResult.address?.city) updates.city = samResult.address.city;
    if (samResult.address?.state) updates.state = samResult.address.state;
    if (samResult.address?.zip) updates.zip = samResult.address.zip;
    if (samResult.naicsCodes?.length > 0) {
      updates.naicsCodes = samResult.naicsCodes.map((n: any) => n.code).join(", ");
    }
    setFormData(updates);
    setSamApplied(true);
  }

  // AI extraction from uploaded documents
  async function extractFromDocuments() {
    if (!clientId) return;
    setAiExtracting(true);
    setAiResult(null);
    setAiError("");
    setAiApplied(false);
    try {
      const data = await apiRequest(`/api/clients/${clientId}/ai-extract`, { method: "POST" });
      if (data.extracted && Object.keys(data.extracted).length > 0) {
        setAiResult(data);
      } else {
        setAiError("AI could not extract company info from your documents. Try uploading more detailed files.");
      }
    } catch (err: any) {
      setAiError(err.message || "AI extraction failed.");
    } finally {
      setAiExtracting(false);
    }
  }

  function applyAiData() {
    if (!aiResult?.extracted) return;
    const updates: Record<string, string> = { ...formData };
    const ex = aiResult.extracted;
    // Only fill in empty fields (don't overwrite existing data)
    FIELDS.forEach(f => {
      if (!updates[f.key] && ex[f.key]) {
        updates[f.key] = String(ex[f.key]);
      }
    });
    setFormData(updates);
    setAiApplied(true);
  }

  function applyAiDataAll() {
    if (!aiResult?.extracted) return;
    const updates: Record<string, string> = { ...formData };
    const ex = aiResult.extracted;
    FIELDS.forEach(f => {
      if (ex[f.key]) updates[f.key] = String(ex[f.key]);
    });
    setFormData(updates);
    setAiApplied(true);
  }

  // Upload a doc for AI extraction
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !clientId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", clientId);
      fd.append("category", "OTHER");
      fd.append("description", "Uploaded for company profile AI extraction");

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      // Wait a moment for AI classification to run, then extract
      setTimeout(() => {
        extractFromDocuments();
        setDocCount(prev => prev + 1);
      }, 3000);
    } catch (err: any) {
      alert("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const completedFields = FIELDS.filter(f => !!formData[f.key]?.trim()).length;
  const completionPct = Math.round((completedFields / FIELDS.length) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "var(--navy)", minHeight: "100vh", display: "flex", flexDirection: "column", position: "sticky", top: 0 }}>
        <div style={{ padding: "24px 16px 8px" }}>
          <a href="/portal" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#fff", letterSpacing: ".01em" }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ fontSize: 9.5, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>My Portal</div>
          <a href="/portal" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>🏠</span> Home
          </a>
          <a href="/portal/profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "rgba(200,155,60,.15)", border: "1px solid rgba(200,155,60,.25)", borderLeft: "3px solid var(--gold)", color: "var(--gold2)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>
            <span>🏢</span> Company Profile
          </a>
          <a href="/portal/applications" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>📋</span> My Applications
          </a>
          <a href="/portal/eligibility" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>✅</span> Eligibility
          </a>
          <a href="/portal/integrations" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>🔗</span> Integrations
          </a>
          <a href="/portal/documents" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "rgba(255,255,255,.5)", textDecoration: "none", fontSize: 13.5, marginBottom: 2 }}>
            <span>📄</span> My Documents
          </a>
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px" }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>Company Profile</h1>
            <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.5 }}>
              Your company information feeds all certification applications. Keep it up to date — changes here are reflected across every application.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {saved && <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>✓ Saved!</span>}
            <button onClick={saveProfile} disabled={saving || !hasChanges}
              style={{
                padding: "10px 28px",
                background: hasChanges ? "var(--gold)" : "var(--cream2)",
                border: "none", borderRadius: "var(--r)", fontSize: 14, fontWeight: 600,
                color: hasChanges ? "#fff" : "var(--ink4)",
                cursor: hasChanges ? "pointer" : "not-allowed",
                boxShadow: hasChanges ? "0 4px 20px rgba(200,155,60,.3)" : "none",
              }}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        {/* Completion bar */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 20, boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>Profile Completeness</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: completionPct === 100 ? "var(--green)" : "var(--gold)" }}>{completionPct}% — {completedFields}/{FIELDS.length} fields</span>
          </div>
          <div style={{ height: 6, background: "var(--cream2)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${completionPct}%`, background: completionPct === 100 ? "var(--green)" : "var(--gold)", borderRadius: 3, transition: "width .3s" }} />
          </div>
        </div>

        {/* Smart populate tools */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* SAM.gov lookup */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>🏛️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>SAM.gov Lookup</div>
                <div style={{ fontSize: 11, color: "var(--ink3)" }}>Auto-populate from your federal registration</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input type="text" value={samQuery} onChange={e => setSamQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookupSam()}
                placeholder="Enter UEI or CAGE code"
                style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
              <button onClick={lookupSam} disabled={samSearching || !samQuery.trim()}
                style={{ padding: "8px 16px", background: samSearching ? "var(--ink4)" : "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: samSearching ? "wait" : "pointer" }}>
                {samSearching ? "..." : "Search"}
              </button>
            </div>
            {samError && <div style={{ padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--r)", fontSize: 12, color: "#991B1B" }}>{samError}</div>}
            {samResult && (
              <div style={{ padding: "12px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: "var(--r)" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>{samResult.entityName}</div>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 8 }}>
                  UEI: {samResult.uei || "—"} · CAGE: {samResult.cageCode || "—"} · Status: <span style={{ color: samResult.registrationStatus === "Active" ? "var(--green)" : "#B45309" }}>{samResult.registrationStatus}</span>
                </div>
                {samApplied ? (
                  <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>✓ Applied to profile</span>
                ) : (
                  <button onClick={applySamData}
                    style={{ padding: "6px 16px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, color: "var(--gold2)", cursor: "pointer" }}>
                    Apply to Profile
                  </button>
                )}
              </div>
            )}
          </div>

          {/* AI Document extraction */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>AI Document Scan</div>
                <div style={{ fontSize: 11, color: "var(--ink3)" }}>Extract info from your uploaded documents</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {docCount > 0 ? (
                <button onClick={extractFromDocuments} disabled={aiExtracting}
                  style={{ flex: 1, padding: "9px 16px", background: aiExtracting ? "var(--ink4)" : "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, color: aiExtracting ? "#fff" : "var(--gold2)", cursor: aiExtracting ? "wait" : "pointer" }}>
                  {aiExtracting ? "Analyzing documents..." : `Scan ${docCount} uploaded document${docCount !== 1 ? "s" : ""}`}
                </button>
              ) : (
                <div style={{ flex: 1, fontSize: 12, color: "var(--ink4)", padding: "9px 0" }}>No documents uploaded yet</div>
              )}
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ padding: "9px 14px", background: "var(--cream)", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 12, color: "var(--ink3)", cursor: "pointer" }}>
                {uploading ? "Uploading..." : "Upload File"}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: "none" }} />
            </div>
            {aiError && <div style={{ padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "var(--r)", fontSize: 12, color: "#991B1B" }}>{aiError}</div>}
            {aiResult && (
              <div style={{ padding: "12px", background: "rgba(99,102,241,.05)", border: "1px solid rgba(99,102,241,.2)", borderRadius: "var(--r)" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--navy)", marginBottom: 6 }}>
                  Found {Object.keys(aiResult.extracted).length} fields from {aiResult.documentsAnalyzed} document{aiResult.documentsAnalyzed !== 1 ? "s" : ""}:
                </div>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 8, lineHeight: 1.6 }}>
                  {Object.entries(aiResult.extracted).map(([key, val]) => {
                    const field = FIELDS.find(f => f.key === key);
                    if (!field) return null;
                    const existing = formData[key];
                    return (
                      <div key={key}>
                        <strong>{field.label}:</strong> {String(val)}
                        {existing && existing !== val ? <span style={{ color: "var(--amber)", marginLeft: 4 }}>(current: {existing})</span> : ""}
                      </div>
                    );
                  })}
                </div>
                {aiApplied ? (
                  <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>✓ Applied to profile</span>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={applyAiData}
                      style={{ padding: "6px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, color: "var(--gold2)", cursor: "pointer" }}>
                      Fill Empty Fields Only
                    </button>
                    <button onClick={applyAiDataAll}
                      style={{ padding: "6px 14px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, color: "#fff", cursor: "pointer" }}>
                      Overwrite All Fields
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form fields by group */}
        {GROUPS.map(group => (
          <div key={group.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 16, boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>{group.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>{group.label}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: group.id === "address" ? "2fr 1fr 1fr 1fr" : "1fr 1fr", gap: 14 }}>
              {FIELDS.filter(f => f.group === group.id).map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink3)", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 5, display: "block" }}>
                    {field.label}
                    {formData[field.key]?.trim() ? (
                      <span style={{ color: "var(--green)", marginLeft: 6 }}>✓</span>
                    ) : (
                      <span style={{ color: "var(--amber)", marginLeft: 6 }}>empty</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData[field.key] || ""}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "9px 12px",
                      border: `1.5px solid ${formData[field.key]?.trim() ? "var(--green-b)" : "var(--border2)"}`,
                      borderRadius: "var(--r)", fontSize: 13, outline: "none",
                      boxSizing: "border-box" as const,
                      fontFamily: "'DM Sans', sans-serif",
                      background: formData[field.key]?.trim() ? "rgba(34,197,94,.02)" : "#fff",
                      transition: "border-color .15s",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom save bar */}
        {hasChanges && (
          <div style={{
            position: "sticky", bottom: 20, background: "var(--navy)", borderRadius: "var(--rl)",
            padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 8px 40px rgba(0,0,0,.25)", zIndex: 50,
          }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>
              You have unsaved changes
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setFormData({ ...original }); }}
                style={{ padding: "8px 20px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, cursor: "pointer" }}>
                Discard
              </button>
              <button onClick={saveProfile} disabled={saving}
                style={{ padding: "8px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(200,155,60,.3)" }}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
