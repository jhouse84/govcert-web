"use client";
import React from "react";

/**
 * Small gold dot + "Updated via Review" tooltip badge.
 * Shows on wizard sections and submit page items that were modified
 * through the AI Review guided fix process.
 */
export function ReviewFixBadge({ fixes }: { fixes?: { fixedAt: string; findingSummary?: string }[] }) {
  if (!fixes || fixes.length === 0) return null;

  const latest = fixes[0]; // Already sorted most recent first
  const date = new Date(latest.fixedAt).toLocaleDateString();

  return (
    <span
      title={`Updated via Review on ${date}${latest.findingSummary ? `\nAddressed: ${latest.findingSummary}` : ''}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 100,
        background: "rgba(200, 155, 60, 0.08)",
        border: "1px solid rgba(200, 155, 60, 0.2)",
        fontSize: 10,
        fontWeight: 600,
        color: "#C89B3C",
        cursor: "help",
        whiteSpace: "nowrap" as const,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C89B3C", flexShrink: 0 }} />
      Updated via Review
    </span>
  );
}

/**
 * Hook to fetch fix history for a certification.
 * Returns a map of sectionId → fix array for badge display.
 */
export function useFixHistory(certId: string, refreshKey?: number) {
  const [fixHistory, setFixHistory] = React.useState<Record<string, any[]>>({});

  React.useEffect(() => {
    if (!certId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/applications/${certId}/fix-history`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then(r => r.json())
      .then(data => {
        if (data.bySection) setFixHistory(data.bySection);
      })
      .catch(() => {});
  }, [certId, refreshKey]);

  return fixHistory;
}
