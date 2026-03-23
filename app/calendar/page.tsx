"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "\u2B1B", href: "/dashboard" },
  { label: "Eligibility", icon: "\u2705", href: "/clients" },
  { label: "Clients", icon: "\uD83D\uDC65", href: "/clients" },
  { label: "Certifications", icon: "\uD83D\uDCCB", href: "/certifications" },
  { label: "Documents", icon: "\uD83D\uDCC4", href: "/documents" },
  { label: "Calendar", icon: "\uD83D\uDCC5", href: "/calendar", active: true },
  { label: "Integrations", icon: "\uD83D\uDD17", href: "/integrations" },
  { label: "Team & Users", icon: "\uD83D\uDC64", href: "/settings/team" },
  { label: "Usage & Costs", icon: "\uD83D\uDCCA", href: "/usage" },
];

const EVENT_TYPES = [
  { value: "SAM_RENEWAL", label: "SAM.gov Renewal", icon: "\uD83C\uDFDB\uFE0F" },
  { value: "CERT_EXPIRATION", label: "Certification Expiration", icon: "\uD83D\uDCDC" },
  { value: "APP_DEADLINE", label: "Application Deadline", icon: "\u23F0" },
  { value: "DOC_EXPIRATION", label: "Document Expiration", icon: "\uD83D\uDCC4" },
  { value: "COMPLIANCE_REVIEW", label: "Compliance Review Due", icon: "\uD83D\uDD0D" },
  { value: "ANNUAL_REVIEW", label: "Annual Review Due", icon: "\uD83D\uDDD3\uFE0F" },
];

interface CalendarEvent {
  id: string;
  type: string;
  description: string;
  clientName: string;
  clientId?: string;
  date: Date;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function daysBetween(a: Date, b: Date) {
  const msPerDay = 86400000;
  return Math.ceil((b.getTime() - a.getTime()) / msPerDay);
}

function urgencyColor(daysUntil: number): { bg: string; color: string; border: string } {
  if (daysUntil < 7) return { bg: "rgba(220,50,50,.08)", color: "#C03030", border: "rgba(220,50,50,.2)" };
  if (daysUntil < 30) return { bg: "rgba(217,169,56,.1)", color: "#B8860B", border: "rgba(217,169,56,.25)" };
  return { bg: "rgba(34,139,34,.08)", color: "#228B22", border: "rgba(34,139,34,.2)" };
}

function eventTypeInfo(type: string) {
  return EVENT_TYPES.find(e => e.value === type) || { value: type, label: type, icon: "\uD83D\uDCC5" };
}

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ type: "SAM_RENEWAL", clientId: "", date: "", description: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "CUSTOMER") { router.push("/portal"); return; }
      setUser(parsed);
    }
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [certsData, clientsData] = await Promise.all([
        apiRequest("/api/certifications"),
        apiRequest("/api/clients"),
      ]);
      setCertifications(Array.isArray(certsData) ? certsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      generateEvents(
        Array.isArray(certsData) ? certsData : [],
        Array.isArray(clientsData) ? clientsData : []
      );
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
    } finally {
      setLoading(false);
    }
  }

  function generateEvents(certs: any[], clientsList: any[]) {
    const generated: CalendarEvent[] = [];
    const clientMap: Record<string, any> = {};
    clientsList.forEach(c => { clientMap[c.id] = c; });

    // For each active certification, create "Annual Review Due" 1 year from creation
    certs.forEach(cert => {
      if (cert.status === "APPROVED" || cert.status === "IN_PROGRESS" || cert.status === "SUBMITTED") {
        const createdAt = new Date(cert.createdAt);
        const reviewDate = new Date(createdAt);
        reviewDate.setFullYear(reviewDate.getFullYear() + 1);

        // If the review date has passed, roll it forward
        const now = new Date();
        while (reviewDate < now) {
          reviewDate.setFullYear(reviewDate.getFullYear() + 1);
        }

        const clientName = cert.client?.businessName || clientMap[cert.clientId]?.businessName || "Unknown Client";
        generated.push({
          id: `cert-review-${cert.id}`,
          type: "ANNUAL_REVIEW",
          description: `Annual Review Due for ${cert.certType || "Certification"}`,
          clientName,
          clientId: cert.clientId,
          date: reviewDate,
        });
      }
    });

    // For each client, create "SAM.gov Renewal" (annual from client creation)
    clientsList.forEach(client => {
      const createdAt = new Date(client.createdAt);
      const renewalDate = new Date(createdAt);
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);

      const now = new Date();
      while (renewalDate < now) {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      }

      generated.push({
        id: `sam-renewal-${client.id}`,
        type: "SAM_RENEWAL",
        description: "SAM.gov Registration Renewal",
        clientName: client.businessName || "Unknown Client",
        clientId: client.id,
        date: renewalDate,
      });
    });

    setEvents(generated);
  }

  function allEvents(): CalendarEvent[] {
    return [...events, ...localEvents];
  }

  function eventsForDay(day: number): CalendarEvent[] {
    return allEvents().filter(e => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }

  function upcomingEvents(): CalendarEvent[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 90);

    return allEvents()
      .filter(e => {
        const d = new Date(e.date);
        return d >= now && d <= cutoff;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  function handleAddEvent() {
    if (!addForm.date || !addForm.clientId) return;
    const client = clients.find(c => c.id === addForm.clientId);
    const newEvent: CalendarEvent = {
      id: `local-${Date.now()}`,
      type: addForm.type,
      description: addForm.description || eventTypeInfo(addForm.type).label,
      clientName: client?.businessName || "Unknown Client",
      clientId: addForm.clientId,
      date: new Date(addForm.date),
    };
    setLocalEvents(prev => [...prev, newEvent]);
    setAddForm({ type: "SAM_RENEWAL", clientId: "", date: "", description: "" });
    setShowAddModal(false);
  }

  function prevMonth() {
    setSelectedDay(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  }

  function nextMonth() {
    setSelectedDay(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!user) return null;

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const upcoming = upcomingEvents();

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
          {NAV_ITEMS.map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: item.active ? "rgba(200,155,60,.15)" : "transparent",
              border: item.active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: item.active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: item.active ? 500 : 400,
              marginBottom: 2, transition: "all .15s",
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
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

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
          {/* Header */}
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Administration</div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
                Compliance Calendar
              </h1>
              <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300 }}>Track certification deadlines, renewals, and upcoming events</p>
            </div>
            <button onClick={() => setShowAddModal(true)}
              style={{ padding: "12px 22px", background: "var(--gold)", border: "none", borderRadius: "var(--r)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 16px rgba(200,155,60,.3)", flexShrink: 0 }}>
              + Add Event
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "var(--ink4)" }}>
              <div style={{ textAlign: "center" as const }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                <div style={{ fontSize: 14, color: "var(--ink3)" }}>Loading calendar data...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {/* Calendar Grid */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)", marginBottom: 24 }}>
                {/* Month navigation */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <button onClick={prevMonth} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    &larr; Previous
                  </button>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400 }}>
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h2>
                  <button onClick={nextMonth} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    Next &rarr;
                  </button>
                </div>

                {/* Day headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 4 }}>
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} style={{ padding: "8px 4px", textAlign: "center" as const, fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink3)" }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
                  {/* Empty cells for days before the 1st */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ padding: "10px 4px", minHeight: 64 }} />
                  ))}

                  {/* Actual days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = isCurrentMonth && today.getDate() === day;
                    const isSelected = selectedDay === day;
                    const dayEvents = eventsForDay(day);
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        style={{
                          padding: "8px 6px",
                          minHeight: 64,
                          borderRadius: 8,
                          border: isToday ? "2px solid var(--gold)" : isSelected ? "2px solid var(--navy)" : "1px solid var(--border)",
                          background: isSelected ? "rgba(11,25,41,.03)" : isToday ? "rgba(200,155,60,.05)" : "transparent",
                          cursor: "pointer",
                          transition: "all .15s",
                        }}
                      >
                        <div style={{
                          fontSize: 13,
                          fontWeight: isToday ? 700 : 500,
                          color: isToday ? "var(--gold)" : "var(--navy)",
                          marginBottom: 4,
                        }}>
                          {day}
                        </div>
                        {hasEvents && (
                          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" as const }}>
                            {dayEvents.slice(0, 3).map(evt => {
                              const daysUntil = daysBetween(new Date(), new Date(evt.date));
                              const urg = urgencyColor(daysUntil);
                              return (
                                <div key={evt.id} style={{
                                  width: 8, height: 8, borderRadius: "50%", background: urg.color,
                                }} />
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <span style={{ fontSize: 9, color: "var(--ink4)", lineHeight: "8px" }}>+{dayEvents.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected day detail panel */}
                {selectedDay !== null && (
                  <div style={{ marginTop: 20, padding: "20px", background: "var(--cream)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--navy)", fontWeight: 400, marginBottom: 12 }}>
                      {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
                    </h3>
                    {eventsForDay(selectedDay).length === 0 ? (
                      <div style={{ fontSize: 13, color: "var(--ink4)" }}>No events on this day.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {eventsForDay(selectedDay).map(evt => {
                          const info = eventTypeInfo(evt.type);
                          const daysUntil = daysBetween(new Date(), new Date(evt.date));
                          const urg = urgencyColor(daysUntil);
                          return (
                            <div key={evt.id} style={{
                              padding: "12px 16px", background: "#fff", borderRadius: 8,
                              border: `1px solid ${urg.border}`, display: "flex", alignItems: "center", gap: 12,
                            }}>
                              <span style={{ fontSize: 20 }}>{info.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--navy)" }}>{evt.description}</div>
                                <div style={{ fontSize: 12, color: "var(--ink3)" }}>{evt.clientName}</div>
                              </div>
                              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: urg.bg, color: urg.color }}>
                                {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div style={{ background: "#fff", borderRadius: "var(--rl)", padding: "28px", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", marginBottom: 4 }}>Deadlines</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--navy)", fontWeight: 400, marginBottom: 24 }}>
                  Upcoming Events (Next 90 Days)
                </h2>

                {upcoming.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", color: "var(--ink4)", textAlign: "center" as const }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{"\uD83D\uDCC5"}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink3)", marginBottom: 4 }}>No upcoming events</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink4)", maxWidth: 380, lineHeight: 1.6 }}>
                      Certification deadlines will appear here as you create applications.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {upcoming.map(evt => {
                      const info = eventTypeInfo(evt.type);
                      const daysUntil = daysBetween(new Date(), new Date(evt.date));
                      const urg = urgencyColor(daysUntil);
                      const dateStr = new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

                      return (
                        <div key={evt.id} style={{
                          padding: "16px 20px", borderRadius: 10, border: `1px solid ${urg.border}`,
                          background: urg.bg, display: "flex", alignItems: "center", gap: 14,
                        }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 10, background: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20, flexShrink: 0, border: `1px solid ${urg.border}`,
                          }}>
                            {info.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--navy)", marginBottom: 3 }}>
                              {evt.description}
                            </div>
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
                              <span style={{ fontSize: 12, color: "var(--ink3)" }}>{evt.clientName}</span>
                              <span style={{ fontSize: 12, color: "var(--ink4)" }}>{dateStr}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                            <div style={{ fontSize: 22, fontWeight: 600, color: urg.color, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>
                              {daysUntil}
                            </div>
                            <div style={{ fontSize: 11, color: urg.color, fontWeight: 500 }}>
                              {daysUntil === 1 ? "day" : "days"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Add Event Modal */}
          {showAddModal && (
            <>
              <div onClick={() => setShowAddModal(false)}
                style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(11,25,41,.6)", zIndex: 999 }} />
              <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, background: "#fff", borderRadius: "var(--rl)", padding: "32px", boxShadow: "0 24px 80px rgba(0,0,0,.3)", zIndex: 1000, border: "2px solid var(--gold)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400 }}>Add Event</h3>
                  <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--ink3)" }}>{"\u2715"}</button>
                </div>

                <div style={{ padding: "10px 14px", background: "rgba(200,155,60,.08)", border: "1px solid rgba(200,155,60,.2)", borderRadius: "var(--r)", marginBottom: 20, fontSize: 12, color: "var(--gold)", lineHeight: 1.5 }}>
                  Coming soon: events will be saved to your calendar. For now, events are stored locally in this session.
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Event Type *</label>
                  <select value={addForm.type} onChange={e => setAddForm(prev => ({ ...prev, type: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", background: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Client *</label>
                  <select value={addForm.clientId} onChange={e => setAddForm(prev => ({ ...prev, clientId: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", background: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
                    <option value="">Select a client...</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Date *</label>
                  <input type="date" value={addForm.date} onChange={e => setAddForm(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const }} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Description (optional)</label>
                  <input type="text" value={addForm.description} onChange={e => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. 8(a) annual review"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const }} />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowAddModal(false)}
                    style={{ padding: "10px 20px", background: "transparent", border: "1px solid var(--border2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink3)", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={handleAddEvent} disabled={!addForm.clientId || !addForm.date}
                    style={{ padding: "10px 28px", background: (addForm.clientId && addForm.date) ? "var(--gold)" : "var(--cream2)", border: "none", borderRadius: "var(--r)", color: (addForm.clientId && addForm.date) ? "#fff" : "var(--ink4)", fontSize: 13, fontWeight: 500, cursor: (!addForm.clientId || !addForm.date) ? "not-allowed" : "pointer" }}>
                    Add Event
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
