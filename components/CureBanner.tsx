"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Returns the cure text from URL query params.
 * Safe to call — returns empty string if useSearchParams fails.
 */
export function useCure(): string {
  try {
    const searchParams = useSearchParams();
    return searchParams?.get("cure") || "";
  } catch {
    return "";
  }
}

function CureBannerInner() {
  const cure = useCure();
  if (!cure) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(200,155,60,.08) 0%, rgba(200,155,60,.03) 100%)",
      border: "1px solid rgba(200,155,60,.25)",
      borderLeft: "4px solid var(--gold)",
      borderRadius: "var(--r)",
      padding: "14px 18px",
      marginBottom: 20,
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, color: "#fff", fontWeight: 700 }}>
        {"\uD83D\uDD27"}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--gold)", marginBottom: 4 }}>
          GovCert Analysis — Action Item
        </div>
        <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.6 }}>
          {cure}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 6 }}>
          Regenerate the relevant section below — the AI will incorporate this guidance automatically.
        </div>
      </div>
    </div>
  );
}

export default function CureBanner() {
  return (
    <Suspense fallback={null}>
      <CureBannerInner />
    </Suspense>
  );
}
