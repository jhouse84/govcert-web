"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import PaywallModal from "@/components/PaywallModal";

/**
 * Paywall layout for ALL certification application pages.
 * Wraps every page under /certifications/[id]/*
 *
 * Checks payment access on mount:
 * - Beta mode ON → renders children immediately (free access)
 * - Paid + has access → renders children
 * - Not paid → shows PaywallModal, blocks content
 *
 * This single layout covers all 26+ application wizard pages.
 */
export default function CertificationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: certId } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [betaMode, setBetaMode] = useState(false);
  const [price, setPrice] = useState(0);
  const [certType, setCertType] = useState<string>("EIGHT_A");
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    checkAccess();
  }, [certId]);

  async function checkAccess() {
    try {
      // First, get the certification to know its type
      const cert = await apiRequest(`/api/certifications/${certId}`);
      const type = cert.type || "EIGHT_A";
      setCertType(type);

      // Map cert type to the pricing check type
      const pricingType = type === "OASIS_PLUS" ? "OASIS_PLUS" : type === "EIGHT_A" ? "EIGHT_A" : "GSA_MAS";

      // Check payment access
      const access = await apiRequest(`/api/pricing/check-access?certType=${pricingType}`);

      if (access.betaMode) {
        // Beta mode — everything free
        setBetaMode(true);
        setHasAccess(true);
      } else if (access.generationAccess) {
        // User has paid
        setHasAccess(true);
      } else {
        // Not paid — show paywall
        setHasAccess(false);
        setPrice(access.price || 0);
        setShowPaywall(true);
      }
    } catch (err) {
      // Fail closed — block access
      setHasAccess(false);
      setShowPaywall(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--ink4)", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  // Paid or beta — render the page normally
  if (hasAccess) {
    return <>{children}</>;
  }

  // Not paid — show paywall over blurred content
  return (
    <>
      {showPaywall && (
        <PaywallModal
          certType={certType}
          price={price}
          betaMode={betaMode}
          onUnlock={() => {
            setHasAccess(true);
            setShowPaywall(false);
          }}
          onClose={() => {
            // Send them back to eligibility results instead of showing blocked content
            router.push("/portal/eligibility/results");
          }}
        />
      )}
      <div style={{ filter: "blur(8px)", pointerEvents: "none", opacity: 0.4, minHeight: "100vh" }}>
        {children}
      </div>
    </>
  );
}
