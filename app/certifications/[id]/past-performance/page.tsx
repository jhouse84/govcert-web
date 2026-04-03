"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { SecurityBanner } from "@/components/SecurityBadge";
import CureBanner, { useCure } from "@/components/CureBanner";

const API = process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app";

/* ── SIN descriptions ── */
const SIN_DESCRIPTIONS: Record<string, string> = {
  "541611": "Management Consulting Services",
  "541612": "Human Resources Consulting Services",
  "541613": "Marketing Consulting Services",
  "541614": "Process, Physical Distribution, and Logistics Consulting Services",
  "541618": "Other Management Consulting Services",
  "541620": "Environmental Consulting Services",
  "541690": "Other Scientific and Technical Consulting Services",
  "541511": "Custom Computer Programming Services",
  "541512": "Computer Systems Design Services",
  "541519": "Other Computer Related Services",
  "611430": "Professional and Management Development Training",
  "541990": "All Other Professional, Scientific, and Technical Services",
  "541330": "Engineering Services",
  "541350": "Building Inspection Services",
};

/* ── Reference data model ── */
type RefStatus = "EMPTY" | "PPQ_SENT" | "PPQ_OPENED" | "COMPLETE";

interface PastPerfReference {
  id: string;
  name: string;
  agency: string;
  status: RefStatus;
  fileName: string | null;
  documentId: string | null;
  ppqId: string | null;
  contractDetails: {
    agencyName: string;
    contractNumber: string;
    contractValue: string;
    periodStart: string;
    periodEnd: string;
    description: string;
  } | null;
}

const EMPTY_REF: PastPerfReference = {
  id: "",
  name: "",
  agency: "",
  status: "EMPTY",
  fileName: null,
  documentId: null,
  ppqId: null,
  contractDetails: null,
};

const STATUS_COLORS: Record<RefStatus, { bg: string; color: string; label: string }> = {
  EMPTY:      { bg: "var(--cream2)", color: "var(--ink4)", label: "Empty" },
  PPQ_SENT:   { bg: "var(--amber-bg, #FFF8E8)", color: "var(--amber, #B8860B)", label: "PPQ Sent" },
  PPQ_OPENED: { bg: "var(--blue-bg, #E8EEF8)", color: "var(--blue, #1A3F7A)", label: "PPQ Opened" },
  COMPLETE:   { bg: "var(--green-bg)", color: "var(--green)", label: "Complete" },
};

/* ── Input style helper ── */
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid var(--border2)",
  borderRadius: "var(--r)", fontSize: 13.5, outline: "none",
  boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11.5, fontWeight: 500, color: "var(--ink3)",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em",
};

/* ══════════════════════════════════════════════════════════════════ */
export default function PastPerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);

  const cureText = useCure();
  /* ── Core state ── */
  const [cert, setCert] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* ── Smart scan ── */
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);

  /* ── Area 1: References ── */
  const [references, setReferences] = useState<PastPerfReference[]>([]);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [ppqModal, setPpqModal] = useState<{
    open: boolean; step: 1 | 2 | 3;
    refIndex: number | null;
    name: string; email: string; title: string; agency: string;
    relationship: string;
    emailSubject: string; emailBody: string;
    drafting: boolean; sending: boolean;
  }>({
    open: false, step: 1, refIndex: null,
    name: "", email: "", title: "", agency: "",
    relationship: "",
    emailSubject: "", emailBody: "",
    drafting: false, sending: false,
  });

  /* ── Area 2: SIN Narratives ── */
  const [sinNarratives, setSinNarratives] = useState<Record<string, string>>({});
  const [generatingSin, setGeneratingSin] = useState<string | null>(null);
  const [condensingSin, setCondensingSin] = useState<string | null>(null);
  const [sinPromptOpen, setSinPromptOpen] = useState<string | null>(null);
  const [sinPrompts, setSinPrompts] = useState<Record<string, string>>({});

  /* ── Drag and drop ── */
  const [dragOverArea, setDragOverArea] = useState<string | null>(null);

  /* ── Misc ── */
  const ppqFileRef = useRef<HTMLInputElement>(null);
  const cparsFileRef = useRef<HTMLInputElement>(null);
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

  /* ── Initial load ── */
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

      // ── Build references from TWO sources and merge ──
      // Source 1: PastPerformance records (may have AI-extracted details)
      // Source 2: Document records with PPQ/CPARS categories (the actual files — always visible)
      const ppRecords = data.application?.pastPerformance || [];
      const ppDocIds = new Set(ppRecords.map((pp: any) => pp.documentId).filter(Boolean));

      const mappedFromPP: PastPerfReference[] = ppRecords.map((pp: any) => {
        const ppqStatus = pp.ppqs?.[0]?.status || "NOT_SENT";
        let status: RefStatus = "EMPTY";
        if (pp.cparsUploaded || pp.fileName || pp.documentId || ppqStatus === "COMPLETED") status = "COMPLETE";
        else if (ppqStatus === "OPENED") status = "PPQ_OPENED";
        else if (ppqStatus === "SENT" || ppqStatus === "PENDING") status = "PPQ_SENT";

        return {
          id: pp.id,
          name: [pp.referenceFirstName, pp.referenceLastName].filter(Boolean).join(" ") || pp.agencyName || pp.fileName?.replace(/\.[^.]+$/, "") || `Reference ${pp.id.slice(-4)}`,
          agency: pp.agencyName || "",
          status,
          fileName: pp.fileName || null,
          documentId: pp.documentId || null,
          ppqId: pp.ppqs?.[0]?.id || null,
          contractDetails: {
            agencyName: pp.agencyName || "",
            contractNumber: pp.contractNumber || "",
            contractValue: pp.contractValue || "",
            periodStart: pp.periodStart || "",
            periodEnd: pp.periodEnd || "",
            description: pp.description || pp.sowDescription || "",
          },
        };
      });

      // Source 2: Query actual uploaded PPQ/CPARS documents for this client
      // Any document that exists but has no PastPerformance record still shows up
      const clientId = data.clientId || data.client?.id;
      let mappedFromDocs: PastPerfReference[] = [];
      if (clientId) {
        try {
          const cats = "PPQ_RESPONSE,PPQ_COMPLETED,CPARS_REPORT";
          const docs = await apiRequest(`/api/upload/documents/by-category/${clientId}/${cats}`);
          mappedFromDocs = (Array.isArray(docs) ? docs : [])
            .filter((doc: any) => !ppDocIds.has(doc.id)) // Don't duplicate ones already linked to PP records
            .map((doc: any) => ({
              id: `doc-${doc.id}`,
              name: doc.originalName?.replace(/\.[^.]+$/, "") || "Uploaded Reference",
              agency: "",
              status: "COMPLETE" as RefStatus,
              fileName: doc.originalName || null,
              documentId: doc.id,
              ppqId: null,
              contractDetails: null,
            }));
        } catch {}
      }

      // Merge: PP records first (they have richer data), then orphan documents
      setReferences([...mappedFromPP, ...mappedFromDocs]);

      // Load saved SIN narratives
      if (data.application?.sinNarratives) {
        try {
          const parsed = typeof data.application.sinNarratives === "string"
            ? JSON.parse(data.application.sinNarratives)
            : data.application.sinNarratives;
          setSinNarratives(parsed);
        } catch {}
      }

      // Run smart scan (clientId already declared above)
      if (clientId) {
        runSmartScan(clientId);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load certification data.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Smart Scan ── */
  async function runSmartScan(clientId: string) {
    setScanning(true);
    try {
      const data = await apiRequest("/api/applications/ai/scan-past-performance", {
        method: "POST",
        body: JSON.stringify({ clientId }),
      });
      setScanResults(data);
    } catch (err) {
      console.error("Smart scan failed:", err);
      // Silently fail — show manual entry UI
    } finally {
      setScanning(false);
    }
  }

  /* ── Ensure application exists ── */
  async function ensureApplication() {
    let appId = cert?.application?.id;
    if (!appId) {
      const app = await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert.clientId,
          certType: cert.type,
          currentStep: 1,
        }),
      });
      appId = app.id;
      setCert((prev: any) => ({ ...prev, application: app }));
    }
    return appId;
  }

  /* ── Upload & extract PPQ / CPARS (supports multiple files) ── */
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  async function handleRefUploads(files: FileList | File[], category: "PPQ_RESPONSE" | "CPARS_REPORT") {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    setUploadingRef(true);
    setError(null);
    const appId = await ensureApplication();

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      setUploadProgress({ current: i + 1, total: fileArr.length, fileName: file.name });
      try {
        const token = localStorage.getItem("token");
        const clientId = cert?.clientId || cert?.client?.id;
        if (!clientId) throw new Error("No client ID found.");

        // 1. Upload file
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("clientId", clientId);
        uploadForm.append("category", category);
        const uploadRes = await fetch(`${API}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadForm,
        });
        if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);
        const uploadData = await uploadRes.json();

        // 2. Wait briefly for backend text extraction, then read extracted text from the Document record
        //    (the upload endpoint already extracts text via classifyDocumentWithAI — don't re-upload)
        const docId = uploadData.document?.id || uploadData.id || null;
        let text = "";
        if (docId) {
          // Give the backend 3 seconds to extract text asynchronously
          await new Promise(r => setTimeout(r, 3000));
          try {
            const docData = await apiRequest(`/api/upload/documents/${docId}`);
            text = docData.extractedText || "";
          } catch {}
        }

        // If the document record doesn't have text yet, fall back to direct extraction
        if (!text.trim()) {
          const extractForm = new FormData();
          extractForm.append("file", file);
          const extractRes = await fetch(`${API}/api/upload/extract-text`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: extractForm,
          });
          if (extractRes.ok) {
            const extractData = await extractRes.json();
            text = extractData.text || "";
            if (extractData.warning) {
              console.warn("Text extraction warning:", extractData.warning);
            }
          }
        }

        // 3. AI extract contract details
        let first: any = {};
        if (text.trim() && text.trim().length > 20) {
          try {
            const aiRes = await apiRequest("/api/applications/ai/extract-past-performance", {
              method: "POST",
              body: JSON.stringify({ text, clientId, certType: "GSA_MAS" }),
            });
            const contracts = aiRes.contracts || aiRes || [];
            first = contracts[0] || {};
          } catch (aiErr: any) {
            console.error("AI extraction failed:", aiErr.message || aiErr);
            // File is still saved — we just won't have auto-populated fields
          }
        } else if (!text.trim()) {
          console.warn(`No text extracted from "${file.name}" — file was saved but contract details could not be auto-populated. Try uploading a text-based PDF.`);
        }

        // 4. Save past performance record to DB (with file tracking)
        const result = await apiRequest(`/api/applications/${appId}/past-performance`, {
          method: "POST",
          body: JSON.stringify({
            agencyName: first.agencyName || file.name.replace(/\.[^.]+$/, ""),
            contractNumber: first.contractNumber || "",
            contractType: first.contractType || "Federal Government",
            contractValue: first.contractValue || "",
            periodStart: first.periodStart || "",
            periodEnd: first.periodEnd || "",
            description: first.sowDescription || first.description || "",
            cparsUploaded: category === "CPARS_REPORT",
            referenceFirstName: first.referenceFirstName || "",
            referenceLastName: first.referenceLastName || "",
            referenceEmail: first.referenceEmail || "",
            referencePhone: first.referencePhone || "",
            referenceTitle: first.referenceTitle || "",
            fileName: file.name,
            documentId: docId,
          }),
        });

        // 5. Add to references (persisted via API above)
        const newRef: PastPerfReference = {
          id: result.id,
          name: [first.referenceFirstName, first.referenceLastName].filter(Boolean).join(" ") || first.agencyName || file.name,
          agency: first.agencyName || "",
          status: "COMPLETE",
          fileName: file.name,
          documentId: uploadData.document?.id || uploadData.id || null,
          ppqId: null,
          contractDetails: {
            agencyName: first.agencyName || "",
            contractNumber: first.contractNumber || "",
            contractValue: first.contractValue || "",
            periodStart: first.periodStart || "",
            periodEnd: first.periodEnd || "",
            description: first.sowDescription || first.description || "",
          },
        };
        setReferences(prev => [...prev, newRef]);
        successCount++;
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message || "Unknown error"}`);
      }
    }

    setUploadProgress(null);
    setUploadingRef(false);
    if (errors.length > 0) {
      setError(`Uploaded ${successCount}/${fileArr.length} files. Errors:\n${errors.join("\n")}`);
    }
  }

  /* ── Delete reference ── */
  async function deleteReference(index: number) {
    const ref = references[index];
    try {
      // Delete PastPerformance record if it exists (non-document-sourced)
      if (ref.id && !ref.id.startsWith("doc-") && cert?.application?.id) {
        await apiRequest(`/api/applications/${cert.application.id}/past-performance/${ref.id}`, { method: "DELETE" });
      }
      // Also delete the Document record if it exists
      if (ref.documentId) {
        const docId = ref.documentId.startsWith("doc-") ? ref.documentId.slice(4) : ref.documentId;
        try {
          await apiRequest(`/api/upload/documents/${docId}`, { method: "DELETE" });
        } catch {} // Non-fatal — document may already be gone
      }
      setReferences(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error(err);
      setError("Failed to remove reference.");
    }
  }

  /* ── PPQ modal flow ── */
  function openPPQModalForSuggestion(suggestion: any) {
    setPpqModal({
      open: true, step: 1, refIndex: null,
      name: suggestion.name || "",
      email: suggestion.email || "",
      title: suggestion.title || "",
      agency: suggestion.agency || "",
      relationship: "",
      emailSubject: "", emailBody: "",
      drafting: false, sending: false,
    });
  }

  function openPPQModalManual() {
    setPpqModal({
      open: true, step: 1, refIndex: null,
      name: "", email: "", title: "", agency: "",
      relationship: "",
      emailSubject: "", emailBody: "",
      drafting: false, sending: false,
    });
  }

  async function draftPPQEmail() {
    setPpqModal(prev => ({ ...prev, drafting: true }));
    try {
      const data = await apiRequest("/api/ppq/draft-email", {
        method: "POST",
        body: JSON.stringify({
          referenceEmail: ppqModal.email,
          referenceName: ppqModal.name,
          referenceTitle: ppqModal.title,
          referenceAgency: ppqModal.agency,
          relationship: ppqModal.relationship,
          certType: cert?.type || "GSA_MAS",
          businessName: cert?.client?.businessName || "",
          senderName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        }),
      });
      setPpqModal(prev => ({
        ...prev, step: 2, drafting: false,
        emailSubject: data.subject || "",
        emailBody: data.body || "",
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to draft email. Please try again.");
      setPpqModal(prev => ({ ...prev, drafting: false }));
    }
  }

  async function sendPPQFromModal() {
    setPpqModal(prev => ({ ...prev, sending: true }));
    try {
      // Ensure we have a past performance record
      const appId = await ensureApplication();
      let ppId = ppqModal.refIndex !== null ? references[ppqModal.refIndex]?.id : null;

      if (!ppId) {
        // Create a new past performance entry for this reference
        const result = await apiRequest(`/api/applications/${appId}/past-performance`, {
          method: "POST",
          body: JSON.stringify({
            agencyName: ppqModal.agency,
            referenceFirstName: ppqModal.name.split(" ")[0] || "",
            referenceLastName: ppqModal.name.split(" ").slice(1).join(" ") || "",
            referenceEmail: ppqModal.email,
            referenceTitle: ppqModal.title,
          }),
        });
        ppId = result.id;
      }

      await apiRequest("/api/ppq", {
        method: "POST",
        body: JSON.stringify({
          pastPerformanceId: ppId,
          referenceEmail: ppqModal.email,
          referenceName: ppqModal.name,
          referenceTitle: ppqModal.title,
          referenceAgency: ppqModal.agency,
          customEmailBody: ppqModal.emailBody,
          customEmailSubject: ppqModal.emailSubject,
          senderName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          contractorName: cert?.client?.businessName || "",
          agencyName: ppqModal.agency,
        }),
      });

      // Add or update reference
      const newRef: PastPerfReference = {
        id: ppId || "",
        name: ppqModal.name,
        agency: ppqModal.agency,
        status: "PPQ_SENT",
        fileName: null,
        documentId: null,
        ppqId: null,
        contractDetails: null,
      };

      if (ppqModal.refIndex !== null) {
        setReferences(prev => {
          const updated = [...prev];
          updated[ppqModal.refIndex!] = { ...updated[ppqModal.refIndex!], status: "PPQ_SENT" };
          return updated;
        });
      } else {
        setReferences(prev => [...prev, newRef]);
      }

      setPpqModal(prev => ({ ...prev, step: 3, sending: false }));
    } catch (err) {
      console.error(err);
      setError("Failed to send PPQ. Please try again.");
      setPpqModal(prev => ({ ...prev, sending: false }));
    }
  }

  /* ── SIN Narrative generation ── */
  const selectedSINs: string[] = (() => {
    if (!cert?.application?.selectedSINs) return [];
    const raw = cert.application.selectedSINs;
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch {}
    return String(raw).split(",").map((s: string) => s.trim()).filter(Boolean);
  })();

  async function generateSinNarrative(sin: string) {
    setGeneratingSin(sin);
    setSinPromptOpen(null);
    try {
      const clientId = cert?.clientId || cert?.client?.id;
      const userGuidance = sinPrompts[sin]?.trim() || cureText || "";
      const data = await apiRequest("/api/applications/ai/draft-sin-narrative", {
        method: "POST",
        body: JSON.stringify({
          sinNumber: sin,
          sinDescription: SIN_DESCRIPTIONS[sin] || sin,
          clientId,
          userGuidance,
        }),
      });
      const narrative = data.text || data.narrative || "";
      setSinNarratives(prev => {
        const updated = { ...prev, [sin]: narrative };
        // Auto-save immediately — this cost money to generate
        (async () => {
          try {
            await apiRequest("/api/applications", {
              method: "POST",
              body: JSON.stringify({
                certificationId: certId,
                clientId: cert?.clientId || cert?.client?.id,
                certType: cert?.type,
                currentStep: cert?.application?.currentStep || 1,
                sinNarratives: JSON.stringify(updated),
              }),
            });
          } catch (e) { console.error("Auto-save SIN narrative failed:", e); }
        })();
        return updated;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to generate narrative for SIN " + sin);
    } finally {
      setGeneratingSin(null);
    }
  }

  async function condenseSinNarrative(sin: string) {
    const narrative = sinNarratives[sin];
    if (!narrative || narrative.length <= 10000) return;
    setCondensingSin(sin);
    try {
      const data = await apiRequest("/api/applications/ai/condense-narrative", {
        method: "POST",
        body: JSON.stringify({ narrative, charLimit: 10000 }),
      });
      if (data.narrative) {
        setSinNarratives(prev => {
          const updated = { ...prev, [sin]: data.narrative };
          // Auto-save condensed version
          (async () => {
            try {
              const appId = await ensureApplication();
              await apiRequest(`/api/applications/${appId}`, {
                method: "PUT",
                body: JSON.stringify({ sinNarratives: JSON.stringify(updated) }),
              });
            } catch (e) { console.error("Auto-save condensed narrative failed:", e); }
          })();
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to condense narrative for SIN " + sin);
    } finally {
      setCondensingSin(null);
    }
  }

  /* ── Save SIN narratives ── */
  async function saveSinNarratives() {
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          certificationId: certId,
          clientId: cert?.clientId || cert?.client?.id,
          certType: cert?.type,
          currentStep: cert?.application?.currentStep || 1,
          sinNarratives: JSON.stringify(sinNarratives),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError("Failed to save narratives: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  /* ── Computed ── */
  const completedRefs = references.filter(r => r.status === "COMPLETE").length;
  const sentRefs = references.filter(r => r.status === "PPQ_SENT" || r.status === "PPQ_OPENED").length;

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>

      {/* ═══ SIDEBAR ═══ */}
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
          {/* References summary */}
          <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, fontWeight: 600 }}>References</div>
          <div style={{ margin: "8px 9px 16px", padding: "12px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>Complete</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: completedRefs >= 3 ? "var(--green)" : "var(--gold2)" }}>
                {completedRefs}<span style={{ fontSize: 13 }}>/3</span>
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,.08)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, completedRefs / 3 * 100)}%`, background: completedRefs >= 3 ? "var(--green)" : "var(--gold)", borderRadius: 100 }} />
            </div>
            {sentRefs > 0 && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 6 }}>
                {sentRefs} PPQ{sentRefs !== 1 ? "s" : ""} awaiting response
              </div>
            )}
          </div>

          {/* Reference list */}
          {references.map((ref, i) => (
            <div key={ref.id || i}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2, cursor: "default",
                background: "transparent" }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff",
                background: ref.status === "COMPLETE" ? "var(--green)" : ref.status === "PPQ_SENT" || ref.status === "PPQ_OPENED" ? "#1A3F7A" : "rgba(255,255,255,.1)",
              }}>
                {ref.status === "COMPLETE" ? "\u2713" : i + 1}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ref.name || ref.agency || "Reference " + (i + 1)}
              </span>
            </div>
          ))}

          {/* SIN narratives sidebar */}
          {selectedSINs.length > 0 && (
            <>
              <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.25)", padding: "0 9px", marginBottom: 8, marginTop: 20, fontWeight: 600 }}>SIN Narratives</div>
              {selectedSINs.map(sin => (
                <div key={sin} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: "var(--r)", marginBottom: 2 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff",
                    background: sinNarratives[sin]?.trim() ? "var(--green)" : "rgba(255,255,255,.1)",
                  }}>
                    {sinNarratives[sin]?.trim() ? "\u2713" : ""}
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sin}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* User footer */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 900 }}>
          <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            &larr; Back to Application Dashboard
          </a>
          <div style={{ marginTop: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Section 3 of 6</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>Past Performance</h1>
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>
              Upload references and draft project narratives for your GSA MAS application.
            </p>
          </div>

          <CureBanner />

          <SecurityBanner
            message="Contract details and reference contact information are encrypted and only shared via secure PPQ questionnaires."
            badges={["encryption", "audit-logged"]}
          />

          {/* Error banner */}
          {error && (
            <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-b)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--red)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>&times;</button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SMART SCAN                                            */}
          {/* ═══════════════════════════════════════════════════════ */}
          {scanning && (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 24, boxShadow: "var(--shadow)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 16, color: "var(--gold2)", animation: "spin 1.5s linear infinite" }}>&#9881;</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>Scanning your documents for references...</div>
                <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 2 }}>Looking for past contracts, contacts, and performance data in your uploaded files.</div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* AREA 1 — PAST PERFORMANCE REFERENCES                  */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, margin: 0 }}>Past Performance References</h2>
              <span style={{ fontSize: 12, color: "var(--ink4)" }}>3 required for eOffer Tab 4</span>
            </div>

            {/* Progress bar */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "16px 20px", marginBottom: 16, boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: completedRefs >= 3 ? "var(--green)" : "var(--navy)", fontWeight: 400 }}>{completedRefs}</span>
                  <span style={{ fontSize: 14, color: "var(--ink3)" }}> / 3 complete</span>
                  {sentRefs > 0 && <span style={{ fontSize: 12, color: "var(--ink4)", marginLeft: 12 }}>&middot; {sentRefs} PPQ{sentRefs !== 1 ? "s" : ""} pending</span>}
                </div>
                {completedRefs >= 3 && (
                  <span style={{ padding: "5px 14px", background: "var(--green-bg)", border: "1px solid var(--green-b)", borderRadius: 100, fontSize: 12, fontWeight: 500, color: "var(--green)" }}>{"\u2713"} Requirement Met</span>
                )}
              </div>
              <div style={{ height: 6, background: "var(--cream2)", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, completedRefs / 3 * 100)}%`, background: completedRefs >= 3 ? "var(--green)" : "var(--gold)", borderRadius: 100, transition: "width .5s" }} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink3)" }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: i < completedRefs ? "var(--green)" : i < completedRefs + sentRefs ? "#1A3F7A" : "var(--cream2)",
                      border: `2px solid ${i < completedRefs ? "var(--green)" : i < completedRefs + sentRefs ? "#1A3F7A" : "var(--border2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff",
                    }}>
                      {i < completedRefs ? "\u2713" : i < completedRefs + sentRefs ? "\u2192" : ""}
                    </div>
                    Reference {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 16 }}>
              Upload completed PPQ documents or CPARS reports. Each file counts as one reference. You can also request PPQs from references via email.
            </p>

            {/* Upload zone */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 16, boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>&#128196;</span>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, margin: 0 }}>Upload PPQ or CPARS</h3>
                  <p style={{ fontSize: 12, color: "var(--ink4)", margin: 0, marginTop: 2 }}>AI will extract contract details automatically</p>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input ref={ppqFileRef} type="file" accept=".pdf,.docx" multiple style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.length) handleRefUploads(e.target.files, "PPQ_RESPONSE"); e.target.value = ""; }} />
              <input ref={cparsFileRef} type="file" accept=".pdf,.docx" multiple style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.length) handleRefUploads(e.target.files, "CPARS_REPORT"); e.target.value = ""; }} />

              {/* Drag and drop area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverArea("ref-upload"); }}
                onDragLeave={() => setDragOverArea(null)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOverArea(null);
                  if (e.dataTransfer.files?.length) handleRefUploads(e.dataTransfer.files, "PPQ_RESPONSE");
                }}
                style={{
                  border: `2px dashed ${dragOverArea === "ref-upload" ? "var(--gold)" : "var(--border2)"}`,
                  borderRadius: "var(--r)", padding: uploadingRef ? "24px" : "32px",
                  textAlign: "center", cursor: uploadingRef ? "default" : "pointer",
                  background: dragOverArea === "ref-upload" ? "rgba(200,155,60,.06)" : "var(--cream)",
                  transition: "all .2s",
                }}
                onClick={() => !uploadingRef && ppqFileRef.current?.click()}
              >
                {uploadingRef ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>
                      {uploadProgress ? `Processing file ${uploadProgress.current} of ${uploadProgress.total}...` : "Processing document..."}
                    </div>
                    {uploadProgress && (
                      <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500, marginBottom: 4 }}>{uploadProgress.fileName}</div>
                    )}
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>Uploading, extracting text, and identifying contract details</div>
                    {uploadProgress && uploadProgress.total > 1 && (
                      <div style={{ marginTop: 8, height: 4, background: "var(--cream2)", borderRadius: 100, overflow: "hidden", maxWidth: 200, margin: "8px auto 0" }}>
                        <div style={{ height: "100%", width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, background: "var(--gold)", borderRadius: 100, transition: "width .3s" }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>&#128228;</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>
                      Drop completed PPQs or CPARS reports here
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink4)", marginBottom: 12 }}>
                      PDF or DOCX &middot; Select multiple files at once &middot; Each file counts as one reference for eOffer Tab 4
                    </div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                      <button onClick={(e) => { e.stopPropagation(); ppqFileRef.current?.click(); }}
                        style={{ padding: "8px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                        Upload PPQs
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); cparsFileRef.current?.click(); }}
                        style={{ padding: "8px 20px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, color: "var(--gold2)", cursor: "pointer" }}>
                        Upload CPARS
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Scan Suggestions */}
            {scanResults?.potentialReferences?.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid rgba(200,155,60,.2)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 16, boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 12 }}>
                  Smart Scan Found {scanResults.potentialReferences.length} Potential Reference{scanResults.potentialReferences.length !== 1 ? "s" : ""}
                </div>
                {scanResults.potentialReferences.map((suggestion: any, idx: number) => (
                  <div key={idx} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", background: "var(--cream)", borderRadius: "var(--r)",
                    border: "1px solid var(--border)", marginBottom: 8,
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)" }}>
                        {suggestion.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 2 }}>
                        {suggestion.title ? suggestion.title + " at " : ""}{suggestion.agency || "Unknown Agency"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openPPQModalForSuggestion(suggestion)}
                        style={{ padding: "7px 14px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                        Send PPQ Request
                      </button>
                      <button onClick={() => cparsFileRef.current?.click()}
                        style={{ padding: "7px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", fontSize: 12, fontWeight: 500, color: "var(--gold2)", cursor: "pointer" }}>
                        I have a CPARS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Manual add reference */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button onClick={openPPQModalManual}
                style={{ padding: "10px 20px", background: "#fff", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--ink3)"; }}>
                + Add Reference Manually
              </button>
            </div>

            {/* Reference Cards (slots) */}
            {references.length === 0 && !scanning && (
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "48px 40px", textAlign: "center", boxShadow: "var(--shadow)", marginBottom: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>&#128203;</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 6 }}>No references yet</h3>
                <p style={{ fontSize: 13, color: "var(--ink3)", maxWidth: 400, margin: "0 auto 20px", lineHeight: 1.6 }}>
                  Upload a PPQ or CPARS document above, or send a PPQ request to a reference by email.
                </p>
              </div>
            )}

            {references.map((ref, index) => {
              const sc = STATUS_COLORS[ref.status];
              return (
                <div key={ref.id || index} style={{
                  background: "#fff",
                  border: `1px solid ${ref.status === "COMPLETE" ? "var(--green-b)" : "var(--border)"}`,
                  borderRadius: "var(--rl)", marginBottom: 10, boxShadow: "var(--shadow)", overflow: "hidden",
                }}>
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: ref.status === "COMPLETE" ? "var(--green)" : ref.status === "PPQ_SENT" || ref.status === "PPQ_OPENED" ? "#1A3F7A" : "var(--cream2)",
                      border: `2px solid ${ref.status === "COMPLETE" ? "var(--green)" : ref.status === "PPQ_SENT" || ref.status === "PPQ_OPENED" ? "#1A3F7A" : "var(--border2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: "#fff", fontWeight: 600,
                    }}>
                      {ref.status === "COMPLETE" ? "\u2713" : index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 2 }}>
                        {ref.name || "Reference " + (index + 1)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink4)" }}>
                        {ref.agency}
                        {ref.contractDetails?.contractNumber ? " \u00B7 #" + ref.contractDetails.contractNumber : ""}
                        {ref.contractDetails?.contractValue ? " \u00B7 " + ref.contractDetails.contractValue : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                      {ref.fileName && (
                        <span style={{ fontSize: 11, color: "var(--ink4)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ref.fileName}>
                          {ref.fileName}
                        </span>
                      )}
                      {ref.documentId && (
                        <button onClick={async () => {
                          try {
                            const docIdClean = (ref.documentId || "").startsWith("doc-") ? (ref.documentId || "").slice(4) : ref.documentId;
                            const resp = await fetch(
                              `${API}/api/documents/download/${docIdClean}`,
                              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                            );
                            if (!resp.ok) { setError("Download failed"); return; }
                            const blob = await resp.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url; a.download = ref.fileName || "reference.pdf"; a.click();
                            URL.revokeObjectURL(url);
                          } catch { setError("Download failed"); }
                        }}
                          style={{ padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "var(--green)", border: "1px solid var(--green-b)", borderRadius: 5, background: "transparent", cursor: "pointer" }}
                          title="Download file to your computer for eOffer upload">
                          Download
                        </button>
                      )}
                      <button onClick={() => deleteReference(index)}
                        style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--ink4)", padding: "2px 6px" }}
                        title="Remove reference">
                        &times;
                      </button>
                    </div>
                  </div>

                  {/* Contract details if available */}
                  {ref.contractDetails && ref.contractDetails.description && (
                    <div style={{ padding: "0 20px 14px", borderTop: "1px solid var(--border)" }}>
                      <div style={{ padding: "12px 0", fontSize: 12, color: "var(--ink3)", lineHeight: 1.6 }}>
                        {ref.contractDetails.description.substring(0, 300)}
                        {ref.contractDetails.description.length > 300 ? "..." : ""}
                      </div>
                      {(ref.contractDetails.periodStart || ref.contractDetails.periodEnd) && (
                        <div style={{ fontSize: 11, color: "var(--ink4)" }}>
                          {ref.contractDetails.periodStart} &mdash; {ref.contractDetails.periodEnd || "Present"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* AREA 2 — SIN NARRATIVES                               */}
          {/* ═══════════════════════════════════════════════════════ */}
          {selectedSINs.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, margin: 0 }}>Relevant Project Experience</h2>
                <span style={{ fontSize: 12, color: "var(--ink4)" }}>1 narrative per SIN for eOffer Tab 3</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 16 }}>
                Write or generate a narrative for each selected SIN describing your relevant project experience, methodology, and outcomes.
              </p>

              {selectedSINs.map(sin => {
                const desc = SIN_DESCRIPTIONS[sin] || sin;
                const narrative = sinNarratives[sin] || "";
                const charCount = narrative.length;
                const hasContent = narrative.trim().length > 0;

                return (
                  <div key={sin} style={{
                    background: "#fff", border: `1px solid ${hasContent ? "var(--green-b)" : "var(--border)"}`,
                    borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 12, boxShadow: "var(--shadow)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "var(--navy)", fontWeight: 500 }}>
                            SIN {sin}
                          </span>
                          {hasContent && (
                            <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 500, background: "var(--green-bg)", color: "var(--green)" }}>
                              {charCount > 500 ? "Ready" : "Draft"}
                            </span>
                          )}
                          {!hasContent && (
                            <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 500, background: "var(--cream2)", color: "var(--ink4)" }}>
                              Empty
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink3)" }}>{desc}</div>
                      </div>
                      {generatingSin === sin ? (
                        <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500 }}>{"✦"} Generating narrative...</span>
                      ) : (
                        <button onClick={() => setSinPromptOpen(sinPromptOpen === sin ? null : sin)}
                          style={{
                            padding: "8px 16px", background: "var(--navy)", border: "none",
                            borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500,
                            cursor: "pointer", flexShrink: 0,
                          }}>
                          {"\u2726"} Generate from my documents
                        </button>
                      )}
                    </div>

                    {/* Guidance prompt */}
                    {sinPromptOpen === sin && (
                      <div style={{ background: "var(--cream)", border: "1px solid rgba(200,155,60,.2)", borderRadius: "var(--r)", padding: "16px 18px", marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                          What should this narrative focus on?
                        </div>
                        <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 10, lineHeight: 1.6 }}>
                          Tell us which project or experience to highlight for this SIN. The AI will combine your guidance with your uploaded documents to draft a 10,000-character narrative.
                        </p>
                        <textarea
                          value={sinPrompts[sin] || ""}
                          onChange={e => setSinPrompts(prev => ({ ...prev, [sin]: e.target.value }))}
                          placeholder={`e.g., "Production of the GovCert platform — a SaaS application for government certification automation" or "Our HUD Program Financial Advisor work spanning 2006-2025 across multiple contract vehicles"`}
                          rows={3}
                          style={{
                            width: "100%", padding: "10px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)",
                            fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box",
                            marginBottom: 10,
                          }}
                        />
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button onClick={() => generateSinNarrative(sin)}
                            style={{ padding: "9px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(200,155,60,.3)" }}>
                            {"✨"} Generate with Guidance
                          </button>
                          <button onClick={() => { setSinPrompts(prev => ({ ...prev, [sin]: "" })); generateSinNarrative(sin); }}
                            style={{ padding: "9px 16px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--ink3)", fontSize: 13, cursor: "pointer" }}>
                            Skip — just use my documents
                          </button>
                        </div>
                      </div>
                    )}

                    <textarea
                      value={narrative}
                      onChange={e => setSinNarratives(prev => ({ ...prev, [sin]: e.target.value }))}
                      onBlur={() => saveSinNarratives()}
                      placeholder={`Describe your relevant project experience for ${desc}. Include work performed, methodology, results achieved, and how this experience aligns with the services you propose under this SIN...`}
                      style={{
                        width: "100%", minHeight: 140, padding: "12px 14px",
                        border: "1px solid var(--border2)", borderRadius: "var(--r)",
                        fontSize: 13.5, color: "var(--ink)", fontFamily: "'DM Sans', sans-serif",
                        lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box",
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <button onClick={() => {
                        if (narrative) navigator.clipboard.writeText(narrative);
                      }}
                        style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink4)", cursor: narrative ? "pointer" : "default", padding: 0, textDecoration: narrative ? "underline" : "none" }}>
                        {narrative ? "Copy to clipboard" : ""}
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {charCount > 10000 && (
                          <button
                            onClick={() => condenseSinNarrative(sin)}
                            disabled={condensingSin === sin}
                            style={{
                              padding: "4px 14px", background: "var(--red)", border: "none",
                              borderRadius: "var(--r)", fontSize: 11, fontWeight: 600,
                              color: "#fff", cursor: condensingSin === sin ? "not-allowed" : "pointer",
                            }}>
                            {condensingSin === sin ? "Shortening..." : "Shorten to fit"}
                          </button>
                        )}
                        <span style={{
                          fontSize: 11, fontFamily: "monospace",
                          color: charCount > 10000 ? "var(--red)" : charCount > 9500 ? "var(--amber)" : charCount > 8000 ? "var(--amber)" : "var(--ink4)",
                        }}>
                          {charCount.toLocaleString()} / 10,000 characters
                          {charCount > 10000 && " — over limit!"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Save button for narratives */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center", marginTop: 8 }}>
                {saved && <span style={{ fontSize: 12, color: "var(--green)" }}>{"\u2713"} Saved</span>}
                <button onClick={saveSinNarratives} disabled={saving}
                  style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving..." : "Save Narratives"}
                </button>
              </div>
            </div>
          )}

          {/* No SINs selected notice */}
          {selectedSINs.length === 0 && (
            <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", marginBottom: 24, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--ink3)" }}>
                No SINs selected yet. Select your SINs in the eligibility step to see narrative sections here.
              </div>
            </div>
          )}

          {/* Bottom nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 32 }}>
            <a href={`/certifications/${certId}`} style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "none" }}>&larr; Back to Dashboard</a>
            <button onClick={() => router.push(`/certifications/${certId}/financials`)} disabled={saving}
              style={{ padding: "12px 28px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.35)" }}>
              {saving ? "Saving..." : "Save & Continue \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PPQ FLOW MODAL                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {ppqModal.open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => !ppqModal.drafting && !ppqModal.sending && setPpqModal(prev => ({ ...prev, open: false }))}
            style={{ position: "absolute", inset: 0, background: "rgba(11,25,41,.7)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "relative", width: ppqModal.step === 2 ? 680 : 520, maxHeight: "90vh", overflowY: "auto",
            background: "#fff", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,.25)",
            padding: ppqModal.step === 3 ? "48px 40px" : "32px 36px",
          }}>

            {/* Step indicator */}
            {ppqModal.step !== 3 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {[1, 2].map(s => (
                  <div key={s} style={{ flex: 1, height: 3, borderRadius: 100, background: s <= ppqModal.step ? "var(--gold)" : "var(--cream2)" }} />
                ))}
              </div>
            )}

            {/* Close */}
            <button onClick={() => !ppqModal.drafting && !ppqModal.sending && setPpqModal(prev => ({ ...prev, open: false }))}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ink4)", padding: 4 }}>
              &times;
            </button>

            {/* STEP 1: Reference details */}
            {ppqModal.step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Send PPQ Request</h2>
                <p style={{ fontSize: 13.5, color: "var(--ink3)", marginBottom: 24, lineHeight: 1.5 }}>
                  Provide reference details and context. GovCert will draft a personalized email for you to review.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Reference Name *</label>
                    <input type="text" value={ppqModal.name}
                      onChange={e => setPpqModal(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Jane Smith" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Reference Email *</label>
                    <input type="email" value={ppqModal.email}
                      onChange={e => setPpqModal(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="jane.smith@agency.gov" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Title / Role</label>
                    <input type="text" value={ppqModal.title}
                      onChange={e => setPpqModal(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Program Manager" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Organization / Agency</label>
                    <input type="text" value={ppqModal.agency}
                      onChange={e => setPpqModal(prev => ({ ...prev, agency: e.target.value }))}
                      placeholder="Department of Navy" style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>How do you know this person? What was their role on this project?</label>
                  <textarea value={ppqModal.relationship}
                    onChange={e => setPpqModal(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="e.g. Jane was the COR on our IT modernization project at NAVAIR. She oversaw our team's delivery of a cloud migration platform for 18 months."
                    style={{ ...inputStyle, minHeight: 100, lineHeight: 1.6, resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setPpqModal(prev => ({ ...prev, open: false }))}
                    style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={draftPPQEmail}
                    disabled={!ppqModal.name.trim() || !ppqModal.email.trim() || ppqModal.drafting}
                    style={{
                      padding: "10px 28px",
                      background: (!ppqModal.name.trim() || !ppqModal.email.trim()) ? "var(--cream2)" : "var(--gold)",
                      border: "none", borderRadius: "var(--r)",
                      color: (!ppqModal.name.trim() || !ppqModal.email.trim()) ? "var(--ink4)" : "#fff",
                      fontSize: 13, fontWeight: 500,
                      cursor: (!ppqModal.name.trim() || !ppqModal.email.trim() || ppqModal.drafting) ? "not-allowed" : "pointer",
                      boxShadow: ppqModal.name.trim() && ppqModal.email.trim() ? "0 4px 16px rgba(200,155,60,.3)" : "none",
                    }}>
                    {ppqModal.drafting ? "Drafting Email..." : "Draft Email with AI \u2192"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Review email */}
            {ppqModal.step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 4 }}>Review & Send</h2>
                <p style={{ fontSize: 13.5, color: "var(--ink3)", marginBottom: 20, lineHeight: 1.5 }}>
                  Review the AI-drafted email below. Edit anything you&apos;d like, then send.
                </p>

                {/* Email envelope */}
                <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 22px", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, fontSize: 13, color: "var(--ink3)" }}>
                    <span style={{ fontWeight: 500, minWidth: 36 }}>To:</span>
                    <span style={{ color: "var(--navy)", fontWeight: 500 }}>{ppqModal.email}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, fontSize: 13, color: "var(--ink3)" }}>
                    <span style={{ fontWeight: 500, minWidth: 36 }}>From:</span>
                    <span style={{ color: "var(--navy)" }}>{user?.firstName} {user?.lastName} via GovCert</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 0, fontSize: 13, color: "var(--ink3)" }}>
                    <span style={{ fontWeight: 500, minWidth: 36 }}>Subj:</span>
                    <input type="text" value={ppqModal.emailSubject}
                      onChange={e => setPpqModal(prev => ({ ...prev, emailSubject: e.target.value }))}
                      style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#fff" }} />
                  </div>
                </div>

                {/* Email body */}
                <div style={{ marginBottom: 16 }}>
                  <textarea value={ppqModal.emailBody}
                    onChange={e => setPpqModal(prev => ({ ...prev, emailBody: e.target.value }))}
                    style={{ width: "100%", minHeight: 260, padding: "16px 18px", border: "1px solid var(--border2)", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box", color: "var(--ink)" }} />
                </div>

                {/* PPQ form link note */}
                <div style={{ padding: "12px 16px", background: "rgba(200,155,60,.06)", border: "1px solid rgba(200,155,60,.15)", borderRadius: 8, marginBottom: 20, fontSize: 12, color: "var(--ink3)" }}>
                  <span style={{ fontWeight: 500 }}>Included in email:</span> A gold &quot;Complete the PPQ&quot; button linking to the online questionnaire form, plus your sign-off ({user?.firstName} {user?.lastName}, {cert?.client?.businessName}).
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                  <button onClick={() => setPpqModal(prev => ({ ...prev, step: 1 }))}
                    style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>
                    &larr; Back
                  </button>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={draftPPQEmail} disabled={ppqModal.drafting}
                      style={{ padding: "10px 18px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 13, fontWeight: 500, cursor: ppqModal.drafting ? "not-allowed" : "pointer" }}>
                      {ppqModal.drafting ? "Regenerating..." : "Regenerate Email"}
                    </button>
                    <button onClick={sendPPQFromModal} disabled={ppqModal.sending || !ppqModal.emailBody.trim()}
                      style={{
                        padding: "10px 28px",
                        background: ppqModal.emailBody.trim() ? "var(--gold)" : "var(--cream2)",
                        border: "none", borderRadius: "var(--r)",
                        color: ppqModal.emailBody.trim() ? "#fff" : "var(--ink4)",
                        fontSize: 13, fontWeight: 500,
                        cursor: (ppqModal.sending || !ppqModal.emailBody.trim()) ? "not-allowed" : "pointer",
                        boxShadow: ppqModal.emailBody.trim() ? "0 4px 16px rgba(200,155,60,.3)" : "none",
                      }}>
                      {ppqModal.sending ? "Sending..." : "Send PPQ Request \u2192"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Confirmation */}
            {ppqModal.step === 3 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--green-bg)", border: "2px solid var(--green-b)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
                  &#10003;
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>PPQ Request Sent</h2>
                <p style={{ fontSize: 15, color: "var(--ink3)", marginBottom: 6, lineHeight: 1.6 }}>
                  PPQ request sent to <strong style={{ color: "var(--navy)" }}>{ppqModal.name}</strong> at <strong style={{ color: "var(--navy)" }}>{ppqModal.email}</strong>.
                </p>
                <div style={{ fontSize: 13, color: "var(--ink4)", lineHeight: 1.7, marginBottom: 28 }}>
                  <p>They&apos;ll receive a link to complete the questionnaire online.</p>
                  <p>You&apos;ll be notified when they respond.</p>
                </div>
                <button onClick={() => setPpqModal(prev => ({ ...prev, open: false }))}
                  style={{ padding: "12px 36px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
