"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const CERT_LABELS: Record<string, string> = {
  GSA_MAS: "GSA Multiple Award Schedule",
  EIGHT_A: "8(a) Business Development",
  WOSB: "Women-Owned Small Business",
  HUBZONE: "HUBZone",
  MBE: "Minority Business Enterprise",
  SDVOSB: "Service-Disabled Veteran-Owned",
  VOSB: "Veteran-Owned Small Business",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  NOT_STARTED: { bg: "var(--cream2)", color: "var(--ink3)", label: "Not Started" },
  IN_PROGRESS: { bg: "var(--amber-bg)", color: "var(--amber)", label: "In Progress" },
  SUBMITTED: { bg: "var(--blue-bg,#E8EEF8)", color: "var(--blue,#1A3F7A)", label: "Submitted" },
  APPROVED: { bg: "var(--green-bg)", color: "var(--green)", label: "Approved" },
  EXPIRED: { bg: "var(--red-bg)", color: "var(--red)", label: "Expired" },
  REJECTED: { bg: "var(--red-bg)", color: "var(--red)", label: "Rejected" },
};

const SIN_LABELS: Record<string, string> = {
  "541511": "Custom Computer Programming",
  "541512": "Computer Systems Design",
  "541519": "Other Computer Related Services",
  "541611": "Management Consulting",
  "541613": "Marketing Consulting",
  "541618": "Other Management Consulting",
  "541690": "Scientific & Technical Consulting",
  "561110": "Office Administrative Services",
  "561210": "Facilities Support Services",
  "611430": "Professional & Management Training",
};

export default function CertificationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchCert();
  }, []);

  async function fetchCert() {
    try {
      const data = await apiRequest(`/api/certifications/${params.id}`);
      setCert(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    if (!newNote.trim() || !cert?.application?.id) return;
    setSavingNote(true);
    try {
      await apiRequest(`/api/applications/${cert.application.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ section: "general", note: newNote })
      });
      setNewNote("");
      fetchCert();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "⬛" },
    { label: "Clients", href: "/clients", icon: "👥" },
    { label: "Certifications", href: "/certifications", icon: "📋", active: true },
    { label: "Documents", href: "/documents", icon: "📄" },
    { label: "Calendar", href: "/calendar", icon: "📅" },
    { label: "Integrations", href: "/integrations", icon: "🔗" },
    { label: "Plan", href: "/plan", icon: "📊" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>Loading...</div>
  );

  const app = cert?.application;
  const statusStyle = STATUS_STYLES[cert?.status] || STATUS_STYLES.NOT_STARTED;
  const selectedSINs = app?.selectedSINs ? app.selectedSINs.split(",").map((s: string) => s.trim()) : [];

  const tabStyle = (tab: string) => ({
    padding: "10px 20px", cursor: "pointer", fontSize: 13.5, fontWeight: activeTab === tab ? 500 : 400,
    color: activeTab === tab ? "var(--navy)" : "var(--ink3)",
    borderBottom: activeTab === tab ? "2px solid var(--gold)" : "2px solid transparent",
    background: "transparent", border: "none", transition: "all .15s"
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {navItems.map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: (item as any).active ? "rgba(200,155,60,.15)" : "transparent",
              border: (item as any).active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: (item as any).active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: (item as any).active ? 500 : 400, marginBottom: 2
            }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
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
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px" }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <a href="/certifications" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>← Back to Certifications</a>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>
                  {CERT_LABELS[cert?.type] || cert?.type}
                </div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
                  {cert?.client?.businessName}
                </h1>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: statusStyle.bg, color: statusStyle.color }}>
                    {statusStyle.label}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink3)" }}>
                    Started {new Date(cert?.createdAt).toLocaleDateString()}
                  </span>
                  {app?.currentStep && (
                    <span style={{ fontSize: 13, color: "var(--ink3)" }}>
                      Step {app.currentStep} of 5
                    </span>
                  )}
                </div>
              </div>
              <a href={`/certifications/new`} style={{ padding: "10px 20px", background: "var(--gold)", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none", boxShadow: "0 4px 16px rgba(200,155,60,.3)" }}>
                Continue Application →
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 28, background: "#fff", borderRadius: "var(--rl) var(--rl) 0 0", padding: "0 8px" }}>
            {["overview", "application", "past-performance", "notes", "changelog"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(tab)}>
                {tab === "past-performance" ? "Past Performance" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Application</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 18 }}>Application Data</h2>
                {app ? (
                  [
                    { label: "Years in Business", value: app.yearsInBusiness },
                    { label: "Annual Revenue", value: app.annualRevenue },
                    { label: "Primary Contact", value: app.ownerName },
                    { label: "Title", value: app.ownerTitle },
                    { label: "Employees", value: app.employeeCount },
                    { label: "NAICS Code", value: app.naicsCode },
                    { label: "Waiver Requested", value: app.waiverRequested ? "Yes" : "No" },
                  ].map(row => row.value ? (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 12, color: "var(--ink4)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 500 }}>{row.label}</span>
                      <span style={{ fontSize: 13, color: "var(--ink)" }}>{row.value}</span>
                    </div>
                  ) : null)
                ) : (
                  <p style={{ color: "var(--ink4)", fontSize: 13 }}>No application data yet.</p>
                )}
              </div>

              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>SINs Selected</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 18 }}>Special Item Numbers</h2>
                {selectedSINs.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedSINs.map((sin: string) => (
                      <div key={sin} style={{ display: "flex", gap: 10, padding: "8px 12px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--ink3)", flexShrink: 0 }}>{sin}</span>
                        <span style={{ fontSize: 13, color: "var(--ink)" }}>{SIN_LABELS[sin] || sin}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--ink4)", fontSize: 13 }}>No SINs selected yet.</p>
                )}
              </div>

              {/* Waiver Alert */}
              {app?.waiverRequested && (
                <div style={{ gridColumn: "1 / -1", background: "var(--amber-bg)", border: "1px solid var(--amber-b)", borderRadius: "var(--rl)", padding: "20px 24px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--amber)", marginBottom: 6 }}>⚠ Eligibility Waiver Required</div>
                  <p style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 }}>
                    This client has been in business for less than 2 years. A waiver request must be submitted with the application demonstrating relevant experience of responsible officials or unique/innovative offerings. An advisor must confirm this waiver path before submission.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Application Tab */}
          {activeTab === "application" && (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Narratives</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>AI-Generated Narratives</h2>
              {[
                { label: "Quality Control Plan", key: "narrativeQCP", placeholder: "Click 'Generate with AI' to draft your Quality Control Plan narrative." },
                { label: "Relevant Experience", key: "narrativeExp", placeholder: "Click 'Generate with AI' to draft your Relevant Experience narrative." },
                { label: "Corporate Overview", key: "narrativeCorp", placeholder: "Click 'Generate with AI' to draft your Corporate Overview narrative." },
              ].map(section => (
                <div key={section.key} style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)" }}>{section.label}</h3>
                    <button style={{ padding: "7px 16px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      ✦ Generate with AI
                    </button>
                  </div>
                  <textarea
                    defaultValue={app?.[section.key] || ""}
                    placeholder={section.placeholder}
                    style={{ width: "100%", minHeight: 140, padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, color: "var(--ink)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Past Performance Tab */}
          {activeTab === "past-performance" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--navy)", fontWeight: 400 }}>Past Performance</h2>
                  <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 4 }}>Add contracts and send PPQs to references</p>
                </div>
                <button style={{ padding: "10px 20px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  + Add Contract
                </button>
              </div>
              {app?.pastPerformance?.length === 0 || !app?.pastPerformance ? (
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "60px 40px", textAlign: "center", boxShadow: "var(--shadow)" }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>📋</div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 8 }}>No past performance yet</h3>
                  <p style={{ fontSize: 13, color: "var(--ink3)", maxWidth: 400, margin: "0 auto 20px" }}>Add contracts to demonstrate your experience. GSA MAS requires at least 2 relevant past performance references.</p>
                </div>
              ) : (
                app.pastPerformance.map((pp: any) => (
                  <div key={pp.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "20px 24px", marginBottom: 12, boxShadow: "var(--shadow)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--navy)", marginBottom: 4 }}>{pp.agencyName}</div>
                        <div style={{ fontSize: 12, color: "var(--ink3)" }}>
                          {pp.contractNumber && `Contract: ${pp.contractNumber} · `}
                          {pp.contractValue && `Value: ${pp.contractValue} · `}
                          {pp.periodStart && `${pp.periodStart} – ${pp.periodEnd}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 500, background: pp.ppqs?.length > 0 ? "var(--green-bg)" : "var(--cream2)", color: pp.ppqs?.length > 0 ? "var(--green)" : "var(--ink3)" }}>
                          {pp.ppqs?.length || 0} PPQ{pp.ppqs?.length !== 1 ? "s" : ""}
                        </span>
                        <button style={{ padding: "6px 14px", background: "var(--navy)", border: "none", borderRadius: "var(--r)", color: "var(--gold2)", fontSize: 12, cursor: "pointer" }}>
                          Send PPQ
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div>
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 16 }}>Add Advisor Note</h2>
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Leave guidance or a note for this application..."
                  style={{ width: "100%", minHeight: 100, padding: "12px 14px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" as const, marginBottom: 12 }}
                />
                <button onClick={addNote} disabled={savingNote}
                  style={{ padding: "10px 24px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  {savingNote ? "Saving..." : "Add Note"}
                </button>
              </div>
              {app?.advisorNotes?.length > 0 ? (
                app.advisorNotes.map((note: any) => (
                  <div key={note.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "18px 24px", boxShadow: "var(--shadow)", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{note.user?.firstName} {note.user?.lastName}</span>
                      <span style={{ fontSize: 11, color: "var(--ink4)", fontFamily: "monospace" }}>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6 }}>{note.note}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--ink4)", fontSize: 13 }}>No notes yet.</div>
              )}
            </div>
          )}

          {/* Changelog Tab */}
          {activeTab === "changelog" && (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--rl)", padding: "24px 28px", boxShadow: "var(--shadow)" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 20 }}>Change Log</h2>
              {app?.changeLogs?.length > 0 ? (
                app.changeLogs.map((log: any) => (
                  <div key={log.id} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, color: "var(--ink4)", fontFamily: "monospace", flexShrink: 0, paddingTop: 2 }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)" }}>{log.user?.firstName} {log.user?.lastName}</span>
                      <span style={{ fontSize: 13, color: "var(--ink3)" }}> updated </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{log.field}</span>
                      {log.oldValue && <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 2 }}>From: {log.oldValue} → {log.newValue}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--ink4)", fontSize: 13 }}>No changes recorded yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}