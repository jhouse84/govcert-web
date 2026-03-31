"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PHASES = [
  {
    id:1, title:"Frontend Prototype", subtitle:"All screens built as static HTML — COMPLETE",
    status:"done", color:"#1A6644",
    tasks:[
      {title:"Landing page — hero, features, certs, pricing, footer",status:"done"},
      {title:"Admin Panel — full sidebar, all page routing",status:"done"},
      {title:"Customer Portal — role-gated self-service view",status:"done"},
      {title:"8(a) Wizard — 5 steps, field pre-fill UI, AI narrative panel",status:"done"},
      {title:"GSA MAS Wizard — 6 steps, SIN selector, LCAT pricing",status:"done"},
      {title:"OAuth connection UI — all integrations, status badges",status:"done"},
      {title:"Compliance calendar — month grid, iCal export UI",status:"done"},
      {title:"Document vault — table view, upload UI",status:"done"},
    ]
  },
  {
    id:2, title:"Backend Foundation", subtitle:"Node.js · Express · Railway · PostgreSQL · Auth — COMPLETE",
    status:"done", color:"#1A6644",
    tasks:[
      {title:"VS Code, Node.js, Git installed on Windows",status:"done"},
      {title:"GitHub + Railway + govcert.ai domain configured",status:"done"},
      {title:"Prisma schema — 8 models",status:"done"},
      {title:"Initial migration — all tables in Postgres",status:"done"},
      {title:"authService.js — register/login/JWT/bcrypt",status:"done"},
      {title:"Auth middleware — protect routes with JWT",status:"done"},
      {title:"Client routes — full CRUD",status:"done"},
      {title:"Certification routes — full CRUD",status:"done"},
      {title:"CORS configured for Vercel frontend",status:"done"},
      {title:"All API keys registered (Anthropic, SAM.gov, QB, Gusto, SendGrid)",status:"done"},
    ]
  },
  {
    id:3, title:"Next.js Frontend", subtitle:"Vercel · Design system · Auth pages · Dashboard — COMPLETE",
    status:"done", color:"#1A6644",
    tasks:[
      {title:"Next.js app created with TypeScript",status:"done"},
      {title:"Deployed to Vercel — govcert.ai",status:"done"},
      {title:"lib/api.ts — API client with JWT auth headers",status:"done"},
      {title:"GovCert design system — navy/gold/Cormorant Garamond",status:"done"},
      {title:"Landing page — hero, features, certs, pricing",status:"done"},
      {title:"Login page — dark navy design, wired to backend",status:"done"},
      {title:"Register page — wired to backend",status:"done"},
      {title:"Dashboard — sidebar nav, stats, quick actions",status:"done"},
      {title:"Project plan page — this page",status:"done"},
    ]
  },
  {
    id:4, title:"Frontend Pages", subtitle:"Clients · Certifications · Register redesign",
    status:"active", color:"#8A5E10",
    tasks:[
      {title:"Register page — apply dark navy design to match login",status:"active"},
      {title:"Clients list page — show all clients, add new button",status:"planned"},
      {title:"Add New Client form — name, EIN, entity type, address",status:"planned"},
      {title:"Client detail page — overview, certifications, documents",status:"planned"},
      {title:"Certifications list page",status:"planned"},
      {title:"Connect govcert.ai domain to Vercel frontend",status:"planned"},
    ]
  },
  {
    id:5, title:"OAuth & Real Data", subtitle:"QuickBooks · Gusto · SAM.gov",
    status:"planned", color:"#8BA0B4",
    tasks:[
      {title:"Build OAuth proxy — /api/oauth/start/:provider",status:"planned"},
      {title:"Build OAuth proxy — /api/oauth/callback/:provider",status:"planned"},
      {title:"QuickBooks sandbox OAuth flow end-to-end",status:"planned"},
      {title:"QB data fetcher — P&L, Balance Sheet, Employees",status:"planned"},
      {title:"Gusto OAuth flow + employee/payroll data",status:"planned"},
      {title:"SAM.gov entity lookup by UEI",status:"planned"},
      {title:"Wire all data to wizard fields",status:"planned"},
    ]
  },
  {
    id:6, title:"Claude AI Drafting", subtitle:"Server-side AI with live client data",
    status:"planned", color:"#8BA0B4",
    tasks:[
      {title:"POST /api/ai/draft/business-description",status:"planned"},
      {title:"POST /api/ai/draft/quality-control-plan",status:"planned"},
      {title:"POST /api/ai/score-application — 0-100 gap analysis",status:"planned"},
      {title:"Wire AI draft buttons in frontend to real endpoints",status:"planned"},
    ]
  },
  {
    id:7, title:"Document Service", subtitle:"Upload · Cloudflare R2 · PDF Generation",
    status:"planned", color:"#8BA0B4",
    tasks:[
      {title:"Set up Cloudflare R2 bucket",status:"planned"},
      {title:"POST /api/docs/upload — secure file upload",status:"planned"},
      {title:"GET /api/docs/:id/download — pre-signed URL",status:"planned"},
      {title:"PDF generator — Financial Statements from QB data",status:"planned"},
      {title:"Wire Document Vault upload button",status:"planned"},
    ]
  },
  {
    id:8, title:"Customer Portal & Email", subtitle:"Invite flow · Approvals · SendGrid",
    status:"planned", color:"#8BA0B4",
    tasks:[
      {title:"Customer invite email via SendGrid",status:"planned"},
      {title:"Customer password setup page",status:"planned"},
      {title:"Narrative approval workflow",status:"planned"},
      {title:"Action item system — admin assigns, customer completes",status:"planned"},
    ]
  },
  {
    id:9, title:"Compliance Engine", subtitle:"SAM.gov alerts · Cron jobs · Reminders",
    status:"planned", color:"#8BA0B4",
    tasks:[
      {title:"Daily SAM.gov expiry check cron job",status:"planned"},
      {title:"SendGrid email templates — 4 compliance alert types",status:"planned"},
      {title:"Compliance calendar wired to real database events",status:"planned"},
    ]
  },
  {
    id:10, title:"QA, Security & Launch", subtitle:"Hardening · Testing · govcert.ai live",
    status:"planned", color:"#8BA0B4",
    tasks:[
      {title:"Input validation on all API endpoints",status:"planned"},
      {title:"Full end-to-end flow test — Admin path",status:"planned"},
      {title:"Full end-to-end flow test — Customer path",status:"planned"},
      {title:"Fix all critical bugs",status:"planned"},
      {title:"Connect govcert.ai to production frontend",status:"planned"},
      {title:"Onboard first real client end-to-end",status:"planned"},
      {title:"🚀 govcert.ai is live",status:"planned"},
    ]
  },
];

export default function PlanPage() {
  const router = useRouter();
  const [open, setOpen] = useState<number[]>([4]);
  const [phases, setPhases] = useState(PHASES);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, []);

  const toggle = (id: number) =>
    setOpen(o => o.includes(id) ? o.filter(x => x !== id) : [...o, id]);

  const cycle = (phaseId: number, taskTitle: string) => {
    const order = ["planned","active","done"];
    setPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        tasks: p.tasks.map(t => {
          if (t.title !== taskTitle) return t;
          const next = order[(order.indexOf(t.status) + 1) % order.length];
          return { ...t, status: next };
        })
      };
    }));
  };

  const totalTasks = phases.flatMap(p => p.tasks).length;
  const doneTasks = phases.flatMap(p => p.tasks).filter(t => t.status === "done").length;
  const pct = Math.round(doneTasks / totalTasks * 100);

  const statusBg = (s: string) => s === "done" ? "#E6F4EE" : s === "active" ? "#FBF0DC" : "#F5F1E8";
  const statusColor = (s: string) => s === "done" ? "#1A6644" : s === "active" ? "#8A5E10" : "#8BA0B4";
  const statusLabel = (s: string) => s === "done" ? "✓ Done" : s === "active" ? "→ Active" : "◦ Planned";

  return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "#0B1929", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: "#C89B3C", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
              Gov<em style={{ color: "#E8B84B", fontStyle: "normal" }}>Cert</em>
            </span>
          </a>
          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 6, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em" }}>Progress</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#E8B84B" }}>{pct}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,.08)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#C89B3C", borderRadius: 100, transition: "width .5s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>{doneTasks} done</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>{totalTasks} total</span>
            </div>
          </div>
        </div>
        <nav style={{ padding: "12px 8px", flex: 1 }}>
          {phases.map(p => {
            const done = p.tasks.filter(t => t.status === "done").length;
            const phasePct = Math.round(done / p.tasks.length * 100);
            return (
              <div key={p.id} onClick={() => { toggle(p.id); document.getElementById(`phase-${p.id}`)?.scrollIntoView({ behavior: "smooth" }); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, cursor: "pointer", marginBottom: 2, color: p.status === "active" ? "#E8B84B" : "rgba(255,255,255,.42)", background: p.status === "active" ? "rgba(200,155,60,.15)" : "transparent" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1 }}>P{p.id}: {p.title.split(" ").slice(0,3).join(" ")}</span>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,.3)" }}>{phasePct}%</span>
              </div>
            );
          })}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.07)", fontSize: 10.5, color: "rgba(255,255,255,.28)", lineHeight: 1.6 }}>
          govcert.ai · govcert.ai<br/>
          Click tasks to update status
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>
        <div style={{ background: "linear-gradient(135deg,#112238,#0B1929)", borderRadius: 10, padding: "28px 32px", marginBottom: 28, color: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "#C89B3C", marginBottom: 8 }}>Development Tracker</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 400, marginBottom: 6 }}>GovCert Project Plan</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 20 }}>
            Backend: govcert.ai (Railway) · Frontend: govcert.ai (Vercel) · Click any task to cycle its status
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Overall", value: pct + "%" },
              { label: "Tasks Done", value: doneTasks },
              { label: "Total Tasks", value: totalTasks },
              { label: "Current Phase", value: "P" + (phases.find(p => p.status === "active")?.id || 4) },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".07em", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {phases.map(p => {
          const done = p.tasks.filter(t => t.status === "done").length;
          const phasePct = Math.round(done / p.tasks.length * 100);
          const isOpen = open.includes(p.id);
          return (
            <div key={p.id} id={`phase-${p.id}`} style={{ background: "#fff", border: "1px solid rgba(11,25,41,.09)", borderRadius: 10, marginBottom: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(11,25,41,.06)" }}>
              <div onClick={() => toggle(p.id)} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: isOpen ? "#F5F1E8" : "#fff", transition: "background .12s" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: statusBg(p.status), color: statusColor(p.status), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {p.status === "done" ? "✓" : p.status === "active" ? "→" : "◦"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: "#0B1929" }}>Phase {p.id}: {p.title}</span>
                    <span style={{ display: "inline-flex", padding: "2px 7px", borderRadius: 100, fontSize: 10, fontWeight: 500, background: statusBg(p.status), color: statusColor(p.status) }}>{statusLabel(p.status)}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#5A7A96" }}>{p.subtitle} · {done}/{p.tasks.length} tasks</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: p.color, lineHeight: 1 }}>{phasePct}%</div>
                  <div style={{ height: 3, background: "#EDE8DB", borderRadius: 100, marginTop: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${phasePct}%`, background: p.color, borderRadius: 100 }} />
                  </div>
                </div>
              </div>
              {isOpen && (
                <div style={{ borderTop: "1px solid rgba(11,25,41,.09)", padding: "12px 18px" }}>
                  {p.tasks.map(t => (
                    <div key={t.title} onClick={() => cycle(p.id, t.title)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, cursor: "pointer", transition: "background .1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F5F1E8")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: `1.5px solid ${statusColor(t.status)}`, background: t.status === "done" ? "#1A6644" : t.status === "active" ? "#FBF0DC" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {t.status === "done" && <span style={{ fontSize: 8, color: "#fff", fontWeight: 800 }}>✓</span>}
                        {t.status === "active" && <span style={{ fontSize: 8, color: "#8A5E10", fontWeight: 700 }}>→</span>}
                      </div>
                      <span style={{ fontSize: 12.5, color: t.status === "done" ? "#8BA0B4" : "#0B1929", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}