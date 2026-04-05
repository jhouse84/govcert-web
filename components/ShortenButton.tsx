"use client";
import React, { useState } from "react";
import { apiRequest } from "@/lib/api";

/**
 * Shorten to Fit button — appears when text exceeds character limit.
 * Uses Opus to condense while preserving quality.
 */
export default function ShortenButton({
  text,
  charLimit,
  onShortened,
  style,
}: {
  text: string;
  charLimit: number;
  onShortened: (newText: string) => void;
  style?: React.CSSProperties;
}) {
  const [shortening, setShortening] = useState(false);

  if (!text || text.length <= charLimit) return null;

  const overBy = text.length - charLimit;

  return (
    <button
      onClick={async () => {
        setShortening(true);
        try {
          const data = await apiRequest("/api/applications/ai/condense-narrative", {
            method: "POST",
            body: JSON.stringify({ narrative: text, charLimit }),
          });
          if (data.narrative) {
            onShortened(data.narrative);
          }
        } catch (err) {
          console.error("Shorten failed:", err);
        } finally {
          setShortening(false);
        }
      }}
      disabled={shortening}
      style={{
        padding: "4px 14px",
        background: "var(--red)",
        border: "none",
        borderRadius: "var(--r)",
        fontSize: 11,
        fontWeight: 600,
        color: "#fff",
        cursor: shortening ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {shortening ? "Shortening..." : `Shorten to fit (${overBy.toLocaleString()} over)`}
    </button>
  );
}

/**
 * Character counter with integrated shorten button.
 * Drop-in replacement for manual char count displays.
 */
export function CharCountWithShorten({
  text,
  charLimit,
  onShortened,
}: {
  text: string;
  charLimit: number;
  onShortened: (newText: string) => void;
}) {
  const count = (text || "").length;
  const isOver = count > charLimit;
  const isClose = count > charLimit * 0.95;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
      <span
        style={{
          fontSize: 11,
          fontFamily: "monospace",
          color: isOver ? "var(--red)" : isClose ? "var(--amber)" : "var(--ink4)",
        }}
      >
        {count.toLocaleString()} / {charLimit.toLocaleString()} chars
        {isOver ? " — over limit!" : ""}
      </span>
      {isOver && (
        <ShortenButton text={text} charLimit={charLimit} onShortened={onShortened} />
      )}
    </div>
  );
}
