"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { ADMIN_NAV } from "@/lib/admin-nav";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number; // cents
  currency: string;
  interval: string | null;
  features: string | null;
  active: boolean;
  sortOrder: number;
  maxCerts: number | null;
}

export default function PricingManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: "", slug: "", description: "", price: 0, interval: "", features: "", maxCerts: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== "ADMIN") { router.push("/dashboard"); return; }
      setUser(parsed);
    }
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [plansData, ordersData] = await Promise.all([
        apiRequest("/api/payments/plans/all"),
        apiRequest("/api/payments/orders"),
      ]);
      setPlans(plansData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function savePlan(planId: string) {
    setSaving(planId);
    try {
      await apiRequest(`/api/payments/plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...editForm,
          price: parseFloat(editForm.price),
          maxCerts: editForm.maxCerts ? parseInt(editForm.maxCerts) : null,
          features: editForm.features ? (typeof editForm.features === "string" ? editForm.features.split("\n").filter((f: string) => f.trim()) : editForm.features) : [],
        }),
      });
      setEditingPlan(null);
      await fetchData();
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  }

  async function createPlan() {
    setSaving("new");
    try {
      await apiRequest("/api/payments/plans", {
        method: "POST",
        body: JSON.stringify({
          ...newPlan,
          price: parseFloat(newPlan.price as any),
          interval: newPlan.interval || null,
          maxCerts: newPlan.maxCerts ? parseInt(newPlan.maxCerts) : null,
          features: newPlan.features ? newPlan.features.split("\n").filter(f => f.trim()) : [],
        }),
      });
      setShowNewPlan(false);
      setNewPlan({ name: "", slug: "", description: "", price: 0, interval: "", features: "", maxCerts: "" });
      await fetchData();
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  }

  async function togglePlanActive(plan: Plan) {
    await apiRequest(`/api/payments/plans/${plan.id}`, {
      method: "PUT",
      body: JSON.stringify({ active: !plan.active }),
    });
    await fetchData();
  }

  function startEditing(plan: Plan) {
    setEditingPlan(plan.id);
    setEditForm({
      name: plan.name,
      description: plan.description || "",
      price: (plan.price / 100).toFixed(2),
      interval: plan.interval || "",
      maxCerts: plan.maxCerts || "",
      features: plan.features ? JSON.parse(plan.features).join("\n") : "",
    });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (!user || loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading...
    </div>
  );

  const totalRevenue = orders.filter(o => o.status === "COMPLETED").reduce((sum: number, o: any) => sum + o.amount, 0);
  const activeSubscriptions = orders.filter(o => o.subscriptionStatus === "active").length;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top right, rgba(200,155,60,.03) 0%, transparent 50%), var(--cream)", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: "linear-gradient(180deg, #0B1929 0%, #0D1F35 100%)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", flexShrink: 0 }} />
        <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
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
          {ADMIN_NAV.map(item => {
            const active = pathname === item.href;
            return (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
              background: active ? "rgba(200,155,60,.15)" : "transparent",
              border: active ? "1px solid rgba(200,155,60,.25)" : "1px solid transparent",
              borderLeft: active ? "3px solid var(--gold)" : "3px solid transparent",
              color: active ? "var(--gold2)" : "rgba(255,255,255,.5)",
              textDecoration: "none", fontSize: 13.5, fontWeight: active ? 500 : 400,
              marginBottom: 2, transition: "all .15s",
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </a>
            );
          })}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{user.email}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--r)", color: "rgba(255,255,255,.5)", fontSize: 13, cursor: "pointer", textAlign: "left" as const }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "40px 48px", maxWidth: 960 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".12em", color: "var(--gold)", marginBottom: 8 }}>Settings</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--navy)", fontWeight: 400, lineHeight: 1.1, marginBottom: 4 }}>
              Pricing & Payments
            </h1>
            <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #C89B3C, #E8B84B)", borderRadius: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 15, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.6 }}>
              Manage pricing plans, view orders, and configure payment settings
            </p>
          </div>

          {/* Revenue Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Revenue", value: `$${(totalRevenue / 100).toLocaleString()}`, icon: "\uD83D\uDCB0" },
              { label: "Total Orders", value: orders.filter(o => o.status === "COMPLETED").length.toString(), icon: "\uD83D\uDCC4" },
              { label: "Active Subscriptions", value: activeSubscriptions.toString(), icon: "\uD83D\uDD04" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: "20px 24px", background: "#fff", borderRadius: 12, border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink4)", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 28, fontWeight: 300, color: "var(--navy)", fontFamily: "'Cormorant Garamond', serif" }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Pricing Plans */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400 }}>Pricing Plans</h2>
              <button onClick={() => setShowNewPlan(true)} style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: "var(--gold)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>
                + Add Plan
              </button>
            </div>

            {/* New Plan Form */}
            {showNewPlan && (
              <div style={{ padding: 24, background: "#fff", borderRadius: 12, border: "2px solid var(--gold)", marginBottom: 16, boxShadow: "var(--shadow)" }}>
                <h3 style={{ fontSize: 16, color: "var(--navy)", marginBottom: 16 }}>New Plan</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Name</label>
                    <input value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Slug</label>
                    <input value={newPlan.slug} onChange={e => setNewPlan({ ...newPlan, slug: e.target.value })} placeholder="e.g. single, bundle" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Price ($)</label>
                    <input type="number" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Billing</label>
                    <select value={newPlan.interval} onChange={e => setNewPlan({ ...newPlan, interval: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, marginTop: 4 }}>
                      <option value="">One-time</option>
                      <option value="month">Monthly</option>
                      <option value="year">Annual</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Description</label>
                    <input value={newPlan.description} onChange={e => setNewPlan({ ...newPlan, description: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, marginTop: 4 }} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Features (one per line)</label>
                    <textarea value={newPlan.features} onChange={e => setNewPlan({ ...newPlan, features: e.target.value })} rows={4} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, marginTop: 4, resize: "vertical" as const }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button onClick={createPlan} disabled={saving === "new"} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: saving === "new" ? .6 : 1 }}>
                    {saving === "new" ? "Creating..." : "Create Plan"}
                  </button>
                  <button onClick={() => setShowNewPlan(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Plan Cards */}
            {plans.map(plan => {
              const isEditing = editingPlan === plan.id;
              const features = plan.features ? JSON.parse(plan.features) : [];
              return (
                <div key={plan.id} style={{
                  padding: 24, background: "#fff", borderRadius: 12, marginBottom: 12,
                  border: `1px solid ${plan.active ? "var(--border)" : "rgba(200,60,60,.2)"}`,
                  opacity: plan.active ? 1 : .6, boxShadow: "var(--shadow)",
                }}>
                  {isEditing ? (
                    /* Edit mode */
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Name</label>
                          <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, marginTop: 4 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Price ($)</label>
                          <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, marginTop: 4 }} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Description</label>
                          <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, marginTop: 4 }} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--ink4)" }}>Features (one per line)</label>
                          <textarea value={editForm.features} onChange={e => setEditForm({ ...editForm, features: e.target.value })} rows={4} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, marginTop: 4, resize: "vertical" as const }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <button onClick={() => savePlan(plan.id)} disabled={saving === plan.id} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                          {saving === plan.id ? "Saving..." : "Save Changes"}
                        </button>
                        <button onClick={() => setEditingPlan(null)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                          <h3 style={{ fontSize: 18, color: "var(--navy)", fontWeight: 500, margin: 0 }}>{plan.name}</h3>
                          <span style={{
                            padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                            background: plan.active ? "rgba(34,197,94,.1)" : "rgba(200,60,60,.1)",
                            color: plan.active ? "#16a34a" : "#C83C3C",
                          }}>
                            {plan.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                          {plan.interval && (
                            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: "rgba(59,130,246,.1)", color: "#3b82f6" }}>
                              RECURRING
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 300, color: "var(--navy)", fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>
                          ${(plan.price / 100).toLocaleString()}{plan.interval ? `/${plan.interval}` : ""}
                        </div>
                        {plan.description && <p style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 8 }}>{plan.description}</p>}
                        {features.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                            {features.slice(0, 4).map((f: string, i: number) => (
                              <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "rgba(200,155,60,.06)", color: "var(--ink3)", border: "1px solid rgba(200,155,60,.1)" }}>
                                {f}
                              </span>
                            ))}
                            {features.length > 4 && <span style={{ fontSize: 11, color: "var(--ink4)" }}>+{features.length - 4} more</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => startEditing(plan)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "#fff", fontSize: 12, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => togglePlanActive(plan)} style={{
                          padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, cursor: "pointer",
                          background: plan.active ? "rgba(200,60,60,.08)" : "rgba(34,197,94,.08)",
                          color: plan.active ? "#C83C3C" : "#16a34a",
                        }}>
                          {plan.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Orders */}
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "var(--navy)", fontWeight: 400, marginBottom: 16 }}>Recent Orders</h2>
            {orders.length === 0 ? (
              <div style={{ padding: 32, background: "#fff", borderRadius: 12, border: "1px solid var(--border)", textAlign: "center" as const, color: "var(--ink4)" }}>
                No orders yet
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid rgba(200,155,60,.12)" }}>
                      {["Customer", "Plan", "Amount", "Provider", "Status", "Date"].map(h => (
                        <th key={h} style={{ textAlign: "left" as const, padding: "10px 14px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--ink4)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 20).map((order: any) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid rgba(0,0,0,.04)" }}>
                        <td style={{ padding: "10px 14px" }}>{order.user?.firstName} {order.user?.lastName}</td>
                        <td style={{ padding: "10px 14px" }}>{order.plan?.name}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 500 }}>${(order.amount / 100).toFixed(2)}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: order.paymentProvider === "stripe" ? "rgba(99,91,255,.1)" : "rgba(0,112,243,.1)", color: order.paymentProvider === "stripe" ? "#635BFF" : "#0070F3" }}>
                            {(order.paymentProvider || "—").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                            background: order.status === "COMPLETED" ? "rgba(34,197,94,.1)" : order.status === "PENDING" ? "rgba(234,179,8,.1)" : "rgba(200,60,60,.1)",
                            color: order.status === "COMPLETED" ? "#16a34a" : order.status === "PENDING" ? "#ca8a04" : "#C83C3C",
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--ink4)" }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
