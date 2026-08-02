"use client";

import { useEffect, useState } from "react";
import { CitationHeatmap } from "@/components/dashboard/visualizations/CitationHeatmap";
import { CompetitorSOV } from "@/components/dashboard/visualizations/CompetitorSOV";
import { PremiumVisualizationGate } from "@/components/dashboard/visualizations/PremiumVisualizationGate";
import { Panel } from "@/components/dashboard/DashboardUI";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import type {
  CitationHeatmapData,
  CompetitorSovData,
} from "@/lib/citations/viz-data";
import {
  buildCitationHeatmapData,
  buildCompetitorSovData,
} from "@/lib/citations/viz-data";

type VizPayload = {
  heatmap: CitationHeatmapData;
  sov: CompetitorSovData;
};

export function CitationVisualizations({
  workspace,
}: {
  workspace: WorkspaceSnapshot;
}) {
  const workspaceId = workspace.workspaceId ?? workspace.id;
  const [payload, setPayload] = useState<VizPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<"free" | "pilot" | "fleet">("free");

  useEffect(() => {
    void fetch("/api/billing/limits", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { prompts?: { plan?: "free" | "pilot" | "fleet" } } | null) => {
        if (data?.prompts?.plan) setUserPlan(data.prompts.plan);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!workspaceId) {
      setPayload({
        heatmap: buildCitationHeatmapData({ workspace, checks: [] }),
        sov: buildCompetitorSovData(workspace),
      });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/citations/visualization`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Could not load citation visualizations");
        }
        return res.json() as Promise<VizPayload>;
      })
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setPayload({
            heatmap: buildCitationHeatmapData({ workspace, checks: [] }),
            sov: buildCompetitorSovData(workspace),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspace, workspaceId]);

  if (loading) {
    return (
      <Panel title="Citations" className="mt-6">
        <p className="text-sm text-muted">Loading citation intelligence…</p>
      </Panel>
    );
  }

  if (!payload) return null;

  return (
    <>
      <Panel title="Citation heatmap" className="mt-6" id="citation-heatmap">
        <p className="mb-4 max-w-3xl text-sm text-muted">
          Money prompts × AI platforms — the fastest way to see where you are cited, where
          competitors win, and which surfaces need attention.
        </p>
        {error ? (
          <p className="mb-3 text-xs text-amber-700">{error} Showing cached workspace data.</p>
        ) : null}
        <PremiumVisualizationGate feature="citation_heatmap">
          <CitationHeatmap data={payload.heatmap} plan={userPlan} />
        </PremiumVisualizationGate>
      </Panel>

      <Panel title="Competitor share of voice" className="mt-6" id="competitor-sov">
        <p className="mb-4 max-w-3xl text-sm text-muted">
          Stacked share-of-voice by prompt — your domain vs tracked competitors across buyer
          questions that drive revenue.
        </p>
        <PremiumVisualizationGate feature="competitor_sov">
          <CompetitorSOV data={payload.sov} />
        </PremiumVisualizationGate>
      </Panel>
    </>
  );
}
