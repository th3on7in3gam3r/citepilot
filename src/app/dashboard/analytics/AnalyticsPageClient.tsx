"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { effectInit } from "@/lib/react/effect-init";
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

export function AnalyticsPageClient() {
  const { workspace, ready } = useWorkspaceContext();
  const [gscBanner, setGscBanner] = useState<string | null>(null);

  useEffect(() => {
    effectInit(() => {
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
    });
  }, []);

  if (!ready) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-56 rounded-lg bg-surface" />
        <div className="h-64 rounded-2xl bg-surface" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="font-display text-lg font-bold text-ink">
          Sign in to open your analytics workspace
        </p>
        <p className="mt-2 text-sm text-muted">
          Connect a workspace to view LLM citation benchmarks, competitor share of
          model, and Google Search Console trends for your domain.
        </p>
        <Link
          href="/auth/sign-in?from=/dashboard/analytics"
          className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
        >
          Sign in →
        </Link>
      </div>
    );
  }

  const banner = gscBanner ? gscMessages[gscBanner] : null;

  return (
    <>
      <DashboardPageHeader
        headingLevel="h2"
        title="LLM & organic analytics"
        description={feature.description}
        action={
          <div className="flex flex-wrap gap-2">
            {workspace.id && (
              <Link
                href={`/api/workspaces/${workspace.id}/export?download=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
              >
                Export JSON
              </Link>
            )}
            <Link
              href="/report/proof"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
            >
              Open proof report
            </Link>
          </div>
        }
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
