"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function ExperienceLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const certId = String(id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    async function redirect() {
      try {
        const cert = await apiRequest(`/api/certifications/${certId}`);
        const sins = cert?.application?.selectedSINs
          ? cert.application.selectedSINs.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];
        if (sins.length > 0) {
          router.replace(`/certifications/${certId}/experience/${sins[0]}`);
        } else {
          // No SINs selected — go to dashboard to select them
          router.replace(`/certifications/${certId}`);
        }
      } catch {
        router.replace(`/certifications/${certId}`);
      } finally {
        setLoading(false);
      }
    }
    redirect();
  }, [certId, router]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)" }}>
      Loading Project Experience...
    </div>
  );

  return null;
}
