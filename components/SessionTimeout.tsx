"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_DURATION = 60; // 60 seconds countdown

const PUBLIC_PAGES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/invite", "/nda", "/terms", "/privacy"];

export default function SessionTimeout() {
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_DURATION);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPublicPage = PUBLIC_PAGES.some(p => pathname === p || pathname?.startsWith(p + "/"));
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("token");

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (showWarning) return; // Don't reset if warning is showing
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(WARNING_DURATION);
    }, IDLE_TIMEOUT);
  }, [showWarning]);

  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
    setCountdown(WARNING_DURATION);
    if (countdownRef.current) clearInterval(countdownRef.current);
    resetIdleTimer();
  }, [resetIdleTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (isPublicPage || !isLoggedIn) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(evt => window.addEventListener(evt, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isPublicPage, isLoggedIn, resetIdleTimer]);

  // Countdown when warning is shown
  useEffect(() => {
    if (!showWarning) return;
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showWarning, logout]);

  if (!showWarning || isPublicPage) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(11,25,41,.65)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "40px 36px",
        maxWidth: 420, width: "90%", textAlign: "center" as const,
        boxShadow: "0 20px 60px rgba(11,25,41,.25)",
        border: "1px solid rgba(200,155,60,.2)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#9203;</div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 26,
          color: "var(--navy)", fontWeight: 500, marginBottom: 8,
        }}>
          Your session is about to expire
        </h2>
        <p style={{ fontSize: 14, color: "rgba(11,25,41,.55)", lineHeight: 1.6, marginBottom: 24 }}>
          You will be logged out in <strong style={{ color: "var(--navy)", fontWeight: 600 }}>{countdown} second{countdown !== 1 ? "s" : ""}</strong> due to inactivity.
        </p>

        {/* Countdown bar */}
        <div style={{
          width: "100%", height: 6, background: "rgba(11,25,41,.08)",
          borderRadius: 3, marginBottom: 28, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: countdown > 30 ? "var(--gold)" : countdown > 10 ? "var(--amber, #E8A838)" : "var(--red, #E74C3C)",
            width: `${(countdown / WARNING_DURATION) * 100}%`,
            transition: "width 1s linear, background .3s",
          }} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={logout} style={{
            flex: 1, padding: "12px 20px", fontSize: 14, fontWeight: 500,
            background: "transparent", border: "1px solid rgba(11,25,41,.15)",
            borderRadius: 8, color: "rgba(11,25,41,.6)", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Log Out Now
          </button>
          <button onClick={stayLoggedIn} style={{
            flex: 1, padding: "12px 20px", fontSize: 14, fontWeight: 600,
            background: "linear-gradient(135deg, #C89B3C 0%, #E8B84B 100%)",
            border: "none", borderRadius: 8, color: "#fff", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(200,155,60,.3)",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
