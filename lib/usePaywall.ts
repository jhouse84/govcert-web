"use client";
import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";

interface PaywallState {
  loading: boolean;
  generationAccess: boolean;
  maintenanceAccess: boolean;
  betaMode: boolean;
  price: number;
  showPaywall: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  onUnlock: () => void;
}

export function usePaywall(certType: string): PaywallState {
  const [loading, setLoading] = useState(true);
  const [generationAccess, setGenerationAccess] = useState(false);
  const [maintenanceAccess, setMaintenanceAccess] = useState(false);
  const [betaMode, setBetaMode] = useState(true);
  const [price, setPrice] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const checkAccess = useCallback(async () => {
    try {
      const data = await apiRequest(`/api/pricing/check-access?certType=${certType}`);
      setGenerationAccess(data.generationAccess);
      setMaintenanceAccess(data.maintenanceAccess);
      setBetaMode(data.betaMode);
      setPrice(data.price || 0);
    } catch {
      // If check fails, default to allowing access (fail open during beta)
      setGenerationAccess(true);
      setBetaMode(true);
    } finally {
      setLoading(false);
    }
  }, [certType]);

  useEffect(() => { checkAccess(); }, [checkAccess]);

  return {
    loading,
    generationAccess,
    maintenanceAccess,
    betaMode,
    price,
    showPaywall,
    openPaywall: () => setShowPaywall(true),
    closePaywall: () => setShowPaywall(false),
    onUnlock: () => {
      setGenerationAccess(true);
      setShowPaywall(false);
    },
  };
}
