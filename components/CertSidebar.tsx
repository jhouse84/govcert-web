"use client";
import { useRouter } from "next/navigation";

interface CertSidebarProps {
  user: any;
  certId: string;
  activePage?: string;
  sidebarContent?: React.ReactNode;
}

export default function CertSidebar({ user, certId, activePage, sidebarContent }: CertSidebarProps) {
  const router = useRouter();
  const isCustomer = user?.role === "CUSTOMER";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  const navItems = isCustomer ? [
    { label: "My Application", href: `/certifications/${certId}`, icon: "📋", active: activePage === "dashboard" },
    { label: "Back to Portal", href: "/portal", icon: "🏠" },
  ] : [
    { label: "Dashboard", href: "/dashboard", icon: "⬛" },
    { label: "Clients", href: "/clients", icon: "👥" },
    { label: "Certifications", href: "/certifications", icon: "📋", active: activePage === "certifications" },
    { label: "Documents", href: "/documents", icon: "📄" },
    { label: "Calendar", href: "/calendar", icon: "📅" },
    { label: "Integrations", href: "/integrations", icon: "🔗" },
    { label: "Plan", href: "/plan", icon: "📊" },
  ];

  return (
    <div style={{ width: 240, background: "var(--navy)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
        <a href={isCustomer ? "/portal" : "/dashboard"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "var(--gold)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#fff", fontWeight: 500 }}>
            Gov<em style={{ color: "var(--gold2)", fontStyle: "normal" }}>Cert</em>
          </span>
        </a>
      </div>

      <div style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
        {/* Role label */}
        {isCustomer && (
          <div style={{ padding: "8px 9px", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "rgba(200,155,60,.6)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Client Portal</div>
          </div>
        )}

        {/* Nav items */}
        <div style={{ marginBottom: 16 }}>
          {navItems.map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r)",
              background: item.active ? "rgba(200,155,60,.15)" : "transparent",
              border: item.active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              color: item.active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: item.active ? 500 : 400, marginBottom: 2
            }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </div>

        {/* Section-specific content (passed in) */}
        {sidebarContent}
      </div>

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
  );
}