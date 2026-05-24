"use client";

import { useEffect, useState } from "react";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { DashboardPageHeader } from "@/components/dashboard/DashboardUI";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { productFeatures } from "@/lib/features";

const feature = productFeatures.find((f) => f.id === "llm-tracking")!;

const gscMessages: Record<string, { tone: "ok" | "warn" | "err"; text: string }> = {
  connected: {
    tone: "ok",
    text: "Google Search Console connected — organic metrics will appear below.",
  },
  no_site: {
    tone: "warn",
    text: "Connected to Google, but no Search Console property matched this workspace domain.",
  },
  error: {
    tone: "err",
    text: "Google Search Console connection failed. Try again from the Google tab.",
  },
};

export default function AnalyticsPage() {
  const { workspace, ready } = useWorkspaceContext();
  const [gscBanner, setGscBanner] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gsc = params.get("gsc");
    if (gsc && gscMessages[gsc]) {
      setGscBanner(gsc);
      params.delete("gsc");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      );
    }
  }, []);

  if (!ready || !workspace) return null;

  const banner = gscBanner ? gscMessages[gscBanner] : null;

  return (
    <>
      <DashboardPageHeader
        title="Analytics"
        description={feature.description}
      />
      {banner && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            banner.tone === "ok"
              ? "border-mint/30 bg-mint/10 text-ink"
              : banner.tone === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.text}
        </div>
      )}
      <AnalyticsDashboard workspace={workspace} />
    </>
  );
}
