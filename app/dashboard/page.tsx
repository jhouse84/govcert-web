"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8" }}>
      <div style={{ background: "#0B1929", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#fff" }}>
          Gov<span style={{ color: "#C89B3C" }}>Cert</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "rgba(255,255,255,.6)", fontSize: 13 }}>{user.firstName} {user.lastName}</span>
          <button onClick={logout} style={{ padding: "6px 14px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 6, color: "rgba(255,255,255,.7)", fontSize: 13, cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, color: "#0B1929", fontWeight: 400, marginBottom: 8 }}>Welcome back, {user.firstName}</h1>
        <p style={{ color: "#5A7A96", fontSize: 15, marginBottom: 40 }}>Your certification management dashboard</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
          {[{ label: "Active Clients", value: "0", icon: "👥" }, { label: "Certifications", value: "0", icon: "📋" }, { label: "Pending Items", value: "0", icon: "⏳" }].map(stat => (
            <div key={stat.label} style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", boxShadow: "0 1px 3px rgba(11,25,41,.06)" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 32, color: "#0B1929", fontWeight: 400 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#5A7A96", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", boxShadow: "0 1px 3px rgba(11,25,41,.06)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#0B1929", marginBottom: 16 }}>Quick Actions</h2>
            {[{ label: "Add New Client", href: "/clients/new" }, { label: "Start Certification", href: "/certifications/new" }, { label: "View All Clients", href: "/clients" }].map(action => (
              <a key={action.label} href={action.href} style={{ display: "block", padding: "10px 0", borderBottom: "1px solid rgba(11,25,41,.06)", color: "#C89B3C", fontSize: 14, textDecoration: "none", fontWeight: 500 }}>{action.label} →</a>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", boxShadow: "0 1px 3px rgba(11,25,41,.06)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#0B1929", marginBottom: 16 }}>Recent Activity</h2>
            <p style={{ color: "#8BA0B4", fontSize: 13 }}>No recent activity yet. Add your first client to get started.</p>
          </div>
        </div>
      </div>
    </div>
  );
}