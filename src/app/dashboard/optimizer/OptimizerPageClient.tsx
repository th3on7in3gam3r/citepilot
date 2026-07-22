"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { GeoAuditSiteSignals } from "@/components/dashboard/geo-audit/GeoAuditSiteSignals";
import { OptimizerFixCard } from "@/components/dashboard/optimizer/OptimizerFixCard";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { DashboardNoWorkspaceEmpty } from "@/components/dashboard/layout/DashboardNoWorkspaceEmpty";
import { useBilling } from "@/contexts/BillingContext";
import { getStoredWorkspaceId } from "@/lib/client/api";
import type { OptimizerFix, OptimizerPlan } from "@/lib/optimizer/types";
import { useToast } from "@/components/notifications/ToastProvider";

const CATEGORY_FILTERS: { id: "all" | OptimizerFix["category"]; label: string }[] = [
  { id: "all", label: "All fixes" },
  { id: "prompt", label: "Money prompts" },
  { id: "aeo", label: "AEO / schema" },
  { id: "seo", label: "SEO" },
  { id: "robots", label: "robots.txt" },
  { id: "llm", label: "LLM citations" },
];

export function OptimizerPageClient() {
  const { workspace, ready } = useWorkspaceContext();
  const { isPaid, ready: billingReady } = useBilling();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<OptimizerPlan | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | OptimizerFix["category"]>("all");

  const workspaceId =
    workspace?.workspaceId ?? workspace?.id ?? getStoredWorkspaceId() ?? undefined;

  const filteredFixes = useMemo(() => {
    if (!plan) return [];
    if (categoryFilter === "all") return plan.fixes;
    return plan.fixes.filter((f) => f.category === categoryFilter);
  }, [plan, categoryFilter]);

  async function handleGenerate() {
    if (!workspaceId) {
      toast.error("No workspace found. Complete onboarding first.");
      return;
    }
    setLoading(true);
    setWarning(null);

    try {
      const res = await fetch("/api/optimizer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = (await res.json()) as OptimizerPlan & {
        error?: string;
        warning?: string;
      };

      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate optimization plan");
        return;
      }

      setPlan(data);
      if (data.warning) setWarning(data.warning);
      toast.success(
        data.aiGenerated ? "Optimization plan ready" : "Baseline plan ready",
      );
    } catch {
      toast.error("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <div className="h-96 animate-pulse rounded-2xl bg-white/5" />;
  }

  if (!workspace) {
    return (
      <DashboardNoWorkspaceEmpty description="Create a workspace and run an audit before generating Site Optimizer fixes." />
    );
  }

  if (!billingReady) {
    return <div className="h-96 animate-pulse rounded-2xl bg-white/5" />;
  }

  if (!isPaid) {
    return (
      <>
        <DashboardPageHeader
          title="Site Optimizer"
          description="AI-powered fixes for SEO, AEO, LLM citations, robots.txt, and your money prompts."
        />
        <FeatureGate
          feature="site_optimizer"
          title="Site Optimizer"
          description="Generate copy-paste code and Cursor prompts tailored to your audit gaps — schema, robots.txt, answer capsules, and money-prompt content."
          cta="Upgrade to Pilot →"
          highlights={[
            "AI-generated fixes from your latest GEO audit",
            "Code + exact file placement for technical changes",
            "Writer/dev prompts for uncited money prompts",
          ]}
        />
      </>
    );
  }

  const gaps = workspace.gaps.length;
  const uncited =
    workspace.promptResults?.filter((p) => !p.cited).length ?? 0;

  return (
    <>
      <DashboardPageHeader
        title="Site Optimizer"
        description="Analyzes your audit and generates fixes — copy-paste code with file locations, or prompts for content gaps on money prompts."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted">Audit gaps</p>
          <p className="mt-1 text-2xl font-bold text-ink">{gaps}</p>
        </div>
        <div className="rounded-xl border border-border bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted">Uncited money prompts</p>
          <p className="mt-1 text-2xl font-bold text-ink">{uncited}</p>
        </div>
        <div className="rounded-xl border border-border bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted">GEO score</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {workspace.siteSignals?.geoScore ?? "—"}
          </p>
        </div>
      </div>

      {!workspace.hasRealAudit && (
        <Panel title="Run an audit first" className="mt-6">
          <p className="text-sm text-muted">
            Site Optimizer works best after a GEO audit.{" "}
            <Link href="/dashboard/geo-audit" className="font-semibold text-accent hover:underline">
              Run audit →
            </Link>
          </p>
        </Panel>
      )}

      {workspace.siteSignals && <GeoAuditSiteSignals signals={workspace.siteSignals} />}

      <Panel title="Generate optimization plan" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          Reviews your gaps, money prompts, robots.txt status, schema, and platform
          presence — then returns prioritized fixes with{" "}
          <strong className="font-medium text-ink">code + placement</strong> or{" "}
          <strong className="font-medium text-ink">prompts</strong> for content work.
          Generation takes 15–45 seconds.
        </p>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing your site…" : "Generate fixes"}
        </button>

        {warning && (
          <p className="mt-3 text-sm text-amber-400/90">{warning}</p>
        )}
      </Panel>

      {plan && (
        <Panel title="Your optimization plan" className="mt-6">
          <p className="mb-4 text-sm text-muted">{plan.summary}</p>

          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoryFilter(f.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  categoryFilter === f.id
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted hover:border-accent/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredFixes.length === 0 ? (
              <p className="text-sm text-muted">No fixes in this category.</p>
            ) : (
              filteredFixes.map((fix) => (
                <OptimizerFixCard key={fix.id} fix={fix} />
              ))
            )}
          </div>

          <p className="mt-4 text-xs text-muted">
            After applying fixes,{" "}
            <Link href="/dashboard/geo-audit" className="text-accent hover:underline">
              re-run your GEO audit
            </Link>{" "}
            within 7 days to measure citation lift.
          </p>
        </Panel>
      )}
    </>
  );
}
