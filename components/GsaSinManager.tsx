"use client";
import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type CatalogSin = {
  sin: string;
  title: string;
  naicsCodes: string[];
  maxOrderLimit: number | null;
  description?: string;
  tdr?: boolean;
  olm?: boolean;
};

type Hierarchy = Record<string, Record<string, CatalogSin[]>>;

export type ApplicationSin = {
  id: string;
  applicationId: string;
  largeCategory: string;
  subcategory: string;
  sinNumber: string;
  sinTitle: string;
  naicsCode: string;
  scope: string;
  estimatedSales: string;
  maxOrderLimit: string;
  isPreponderance: boolean;
  aiRationale: string | null;
};

const SCOPE_OPTIONS = [
  { value: "domestic", label: "Domestic delivery only" },
  { value: "overseas", label: "Overseas delivery only" },
  { value: "domestic_and_overseas", label: "Contractor will provide domestic and overseas delivery" },
];

function fmtMoney(n: number | string): string {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (!isFinite(v)) return "$0";
  return "$" + Math.round(v).toLocaleString();
}

export default function GsaSinManager({ applicationId }: { applicationId: string }) {
  const [hierarchy, setHierarchy] = useState<Hierarchy>({});
  const [sins, setSins] = useState<ApplicationSin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [selLC, setSelLC] = useState("");
  const [selSub, setSelSub] = useState("");
  const [selSin, setSelSin] = useState("");
  const [scope, setScope] = useState("domestic_and_overseas");
  const [estSales, setEstSales] = useState("");
  const [maxOrder, setMaxOrder] = useState("");
  const [isPrep, setIsPrep] = useState(false);
  const [adding, setAdding] = useState(false);

  // Per-row edit state
  const [editingSin, setEditingSin] = useState<string | null>(null);
  const [editScope, setEditScope] = useState("");
  const [editSales, setEditSales] = useState("");
  const [editMax, setEditMax] = useState("");
  const [estimating, setEstimating] = useState<string | null>(null);
  const [aiRationale, setAiRationale] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [catalogRes, sinsRes] = await Promise.all([
          apiRequest("/api/sins/catalog"),
          apiRequest(`/api/sins/applications/${applicationId}`),
        ]);
        const catalog = await catalogRes.json();
        const mySins = await sinsRes.json();
        setHierarchy(catalog.hierarchy || {});
        setSins(Array.isArray(mySins) ? mySins : []);
      } catch (e: any) {
        setError(e?.message || "Failed to load SIN data");
      } finally {
        setLoading(false);
      }
    })();
  }, [applicationId]);

  // Auto-fill Max Order when SIN is selected from catalog defaults
  useEffect(() => {
    if (selLC && selSub && selSin) {
      const entry = hierarchy[selLC]?.[selSub]?.find((s) => s.sin === selSin);
      if (entry?.maxOrderLimit && !maxOrder) setMaxOrder(String(entry.maxOrderLimit));
    }
  }, [selSin, selLC, selSub, hierarchy, maxOrder]);

  const largeCats = Object.keys(hierarchy).sort();
  const subcats = selLC ? Object.keys(hierarchy[selLC] || {}).sort() : [];
  const sinOptions = selLC && selSub ? hierarchy[selLC]?.[selSub] || [] : [];

  async function addSin() {
    if (!selSin) return;
    setAdding(true);
    try {
      const res = await apiRequest(`/api/sins/applications/${applicationId}`, {
        method: "POST",
        body: JSON.stringify({
          sinNumber: selSin,
          scope,
          estimatedSales: parseFloat(estSales) || 0,
          maxOrderLimit: parseFloat(maxOrder) || 0,
          isPreponderance: isPrep,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add SIN");
      }
      // Reload full list so preponderance flag changes propagate correctly
      const refresh = await apiRequest(`/api/sins/applications/${applicationId}`);
      setSins(await refresh.json());
      setShowAdd(false);
      setSelLC(""); setSelSub(""); setSelSin("");
      setEstSales(""); setMaxOrder(""); setIsPrep(false);
      setScope("domestic_and_overseas");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function removeSin(sinNumber: string) {
    if (!confirm(`Remove SIN ${sinNumber} from this offer?`)) return;
    const res = await apiRequest(`/api/sins/applications/${applicationId}/${sinNumber}`, {
      method: "DELETE",
    });
    if (!res.ok) { alert("Failed to remove"); return; }
    setSins((s) => s.filter((x) => x.sinNumber !== sinNumber));
  }

  function startEdit(sin: ApplicationSin) {
    setEditingSin(sin.sinNumber);
    setEditScope(sin.scope);
    setEditSales(String(sin.estimatedSales));
    setEditMax(String(sin.maxOrderLimit));
  }

  async function saveEdit(sinNumber: string) {
    const res = await apiRequest(`/api/sins/applications/${applicationId}/${sinNumber}`, {
      method: "PATCH",
      body: JSON.stringify({
        scope: editScope,
        estimatedSales: parseFloat(editSales) || 0,
        maxOrderLimit: parseFloat(editMax) || 0,
      }),
    });
    if (!res.ok) { alert("Failed to save"); return; }
    const updated = await res.json();
    setSins((s) => s.map((x) => (x.sinNumber === sinNumber ? updated : x)));
    setEditingSin(null);
  }

  async function setPreponderance(sinNumber: string) {
    const res = await apiRequest(`/api/sins/applications/${applicationId}/${sinNumber}`, {
      method: "PATCH",
      body: JSON.stringify({ isPreponderance: true }),
    });
    if (!res.ok) { alert("Failed to set preponderance"); return; }
    const refresh = await apiRequest(`/api/sins/applications/${applicationId}`);
    setSins(await refresh.json());
  }

  async function estimateSales(sinNumber: string) {
    setEstimating(sinNumber);
    try {
      const res = await apiRequest(`/api/sins/applications/${applicationId}/${sinNumber}/estimate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI estimator unavailable");
      }
      const data = await res.json();
      // Apply the suggestion into the edit field for user to confirm
      if (editingSin === sinNumber) {
        setEditSales(String(data.estimatedSales));
      } else {
        // Save immediately with the AI rationale
        await apiRequest(`/api/sins/applications/${applicationId}/${sinNumber}`, {
          method: "PATCH",
          body: JSON.stringify({
            estimatedSales: data.estimatedSales,
            aiRationale: `${data.rationale} (confidence: ${data.confidence})`,
          }),
        });
        const refresh = await apiRequest(`/api/sins/applications/${applicationId}`);
        setSins(await refresh.json());
      }
      setAiRationale((r) => ({ ...r, [sinNumber]: `${data.rationale} (confidence: ${data.confidence})` }));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEstimating(null);
    }
  }

  const totalEstSales = sins.reduce((sum, s) => sum + (parseFloat(s.estimatedSales) || 0), 0);

  if (loading) return <div style={{ padding: 16, color: "#7a7566" }}>Loading SIN catalog...</div>;
  if (error) return <div style={{ padding: 16, color: "#a83232" }}>Error: {error}</div>;

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e2d0", borderRadius: 8, padding: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#0B1929", margin: 0 }}>
          GSA MAS SINs ({sins.length})
        </h3>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#7a7566" }}>
          Total est. sales (5-yr base): <strong style={{ color: "#0B1929" }}>{fmtMoney(totalEstSales)}</strong>
        </div>
      </div>

      {/* SIN list */}
      {sins.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#7a7566", fontFamily: "'DM Sans', sans-serif" }}>
          No SINs added yet. Click <strong>Add SIN</strong> to select from GSA&apos;s 333-SIN catalog.
        </div>
      )}

      {sins.map((sin) => {
        const isEditing = editingSin === sin.sinNumber;
        const rationale = aiRationale[sin.sinNumber] || sin.aiRationale;
        return (
          <div key={sin.id} style={{
            border: "1px solid #e8e2d0", borderLeft: sin.isPreponderance ? "4px solid #C89B3C" : "1px solid #e8e2d0",
            borderRadius: 6, padding: 14, marginBottom: 10, background: sin.isPreponderance ? "#fdfaf0" : "#fafaf7",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: 14, color: "#0B1929" }}>
                  {sin.sinNumber}
                  {sin.isPreponderance && (
                    <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", background: "#C89B3C", color: "#fff", borderRadius: 10, fontFamily: "'DM Sans', sans-serif" }}>
                      PREPONDERANCE
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#404040", marginTop: 2 }}>
                  {sin.sinTitle}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#7a7566", marginTop: 4 }}>
                  {sin.largeCategory} &rsaquo; {sin.subcategory} &middot; NAICS {sin.naicsCode}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {!isEditing && (
                  <>
                    <button onClick={() => startEdit(sin)} style={btnSm}>Edit</button>
                    {!sin.isPreponderance && (
                      <button onClick={() => setPreponderance(sin.sinNumber)} style={btnSm} title="Mark as primary SIN">
                        Set primary
                      </button>
                    )}
                    <button onClick={() => removeSin(sin.sinNumber)} style={{ ...btnSm, color: "#a83232", borderColor: "#e8c8c8" }}>
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Details / edit row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              <div>
                <div style={labelStyle}>Scope</div>
                {isEditing ? (
                  <select value={editScope} onChange={(e) => setEditScope(e.target.value)} style={inputStyle}>
                    {SCOPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <div style={valueStyle}>{SCOPE_OPTIONS.find((o) => o.value === sin.scope)?.label || sin.scope}</div>
                )}
              </div>
              <div>
                <div style={{ ...labelStyle, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span>Estimated Sales (5-yr base)</span>
                  <button
                    onClick={() => estimateSales(sin.sinNumber)}
                    disabled={estimating === sin.sinNumber}
                    style={{ ...btnSm, fontSize: 10, padding: "2px 8px", background: "#0B1929", color: "#C89B3C", borderColor: "#0B1929" }}
                  >
                    {estimating === sin.sinNumber ? "Estimating..." : "✦ AI estimate"}
                  </button>
                </div>
                {isEditing ? (
                  <input type="number" value={editSales} onChange={(e) => setEditSales(e.target.value)} style={inputStyle} placeholder="0" />
                ) : (
                  <div style={valueStyle}>{fmtMoney(sin.estimatedSales)}</div>
                )}
              </div>
              <div>
                <div style={labelStyle}>Max Order Limit</div>
                {isEditing ? (
                  <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} style={inputStyle} placeholder="0" />
                ) : (
                  <div style={valueStyle}>{fmtMoney(sin.maxOrderLimit)}</div>
                )}
              </div>
            </div>

            {rationale && (
              <div style={{ marginTop: 10, padding: 10, background: "#fff8e1", border: "1px solid #E8B84B", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#5a4a1f" }}>
                <strong>✦ AI rationale:</strong> {rationale}
              </div>
            )}

            {isEditing && (
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button onClick={() => saveEdit(sin.sinNumber)} style={btnPrimary}>Save</button>
                <button onClick={() => setEditingSin(null)} style={btnSm}>Cancel</button>
              </div>
            )}
          </div>
        );
      })}

      {/* Add SIN button / form */}
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)} style={{ ...btnPrimary, marginTop: 8 }}>
          + Add SIN
        </button>
      ) : (
        <div style={{ border: "1px dashed #C89B3C", borderRadius: 6, padding: 16, marginTop: 8, background: "#fdfaf0" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#0B1929", marginBottom: 10 }}>
            Add SIN
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 10 }}>
            <div>
              <div style={labelStyle}>Large Category *</div>
              <select value={selLC} onChange={(e) => { setSelLC(e.target.value); setSelSub(""); setSelSin(""); setMaxOrder(""); }} style={inputStyle}>
                <option value="">-- Select --</option>
                {largeCats.map((lc) => <option key={lc} value={lc}>{lc}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>Subcategory *</div>
              <select value={selSub} onChange={(e) => { setSelSub(e.target.value); setSelSin(""); setMaxOrder(""); }} disabled={!selLC} style={inputStyle}>
                <option value="">-- Select --</option>
                {subcats.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
              </select>
            </div>
            <div>
              <div style={labelStyle}>SIN *</div>
              <select value={selSin} onChange={(e) => setSelSin(e.target.value)} disabled={!selSub} style={inputStyle}>
                <option value="">-- Select --</option>
                {sinOptions.map((s) => <option key={s.sin} value={s.sin}>{s.sin} — {s.title.slice(0, 60)}</option>)}
              </select>
            </div>
          </div>

          {selSin && (
            <>
              <div style={{ padding: 10, background: "#fff", border: "1px solid #e8e2d0", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#404040", marginBottom: 10 }}>
                <strong>NAICS:</strong> {sinOptions.find((s) => s.sin === selSin)?.naicsCodes?.join(", ")} &nbsp;
                <strong>GSA default Max Order:</strong> {fmtMoney(sinOptions.find((s) => s.sin === selSin)?.maxOrderLimit || 0)}
                {sinOptions.find((s) => s.sin === selSin)?.description && (
                  <div style={{ marginTop: 6, color: "#7a7566" }}>{sinOptions.find((s) => s.sin === selSin)?.description?.slice(0, 300)}</div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={labelStyle}>Scope</div>
                  <select value={scope} onChange={(e) => setScope(e.target.value)} style={inputStyle}>
                    {SCOPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Estimated Sales (5-yr) *</div>
                  <input type="number" value={estSales} onChange={(e) => setEstSales(e.target.value)} style={inputStyle} placeholder="0" />
                </div>
                <div>
                  <div style={labelStyle}>Max Order Limit</div>
                  <input type="number" value={maxOrder} onChange={(e) => setMaxOrder(e.target.value)} style={inputStyle} placeholder="From catalog" />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#404040", marginBottom: 10 }}>
                <input type="checkbox" checked={isPrep} onChange={(e) => setIsPrep(e.target.checked)} />
                Set as preponderance-of-work SIN (only one per offer)
              </label>
            </>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addSin} disabled={!selSin || adding} style={btnPrimary}>
              {adding ? "Adding..." : "Add SIN"}
            </button>
            <button onClick={() => { setShowAdd(false); setSelLC(""); setSelSub(""); setSelSin(""); }} style={btnSm}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#7a7566", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4,
};
const valueStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#0B1929", fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 8px", border: "1px solid #e8e2d0", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 13, background: "#fff", color: "#0B1929",
};
const btnSm: React.CSSProperties = {
  padding: "4px 10px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", background: "#fff", border: "1px solid #e8e2d0", borderRadius: 4, cursor: "pointer", color: "#0B1929",
};
const btnPrimary: React.CSSProperties = {
  padding: "8px 16px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#0B1929", color: "#C89B3C", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 500,
};
