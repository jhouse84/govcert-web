/**
 * Lightweight page activity tracking for GovCert analytics.
 * Uses sendBeacon for reliability — fires even on page close.
 * Never blocks or fails — all tracking is best-effort.
 */

const API = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "https://govcert-production.up.railway.app")
  : "";

export function trackPageView(page: string) {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    fetch(`${API}/api/usage/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ page, action: `page_view:${page}`, timestamp: Date.now() }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function trackAction(action: string, metadata?: Record<string, any>) {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    fetch(`${API}/api/usage/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ page: action, action, timestamp: Date.now(), ...metadata }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
