"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { effectInit } from "@/lib/react/effect-init";
import { DashboardPageHeader, Panel } from "@/components/dashboard/DashboardUI";
import { CompetitorCard } from "@/components/dashboard/competitors/CompetitorCard";
import { QuickFixModal } from "@/components/dashboard/QuickFixModal";
import { FeatureGate } from "@/components/billing/FeatureGate";
import { useBilling } from "@/contexts/BillingContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { cleanDomainInput, domainFormatStatus } from "@/lib/onboarding/domain-validation";
import type { CompetitorIntelligence } from "@/lib/competitors/intelligence";
import type { CompetitorLimits } from "@/lib/competitors/limits";
import { competitorLimitMessage } from "@/lib/competitors/limits";
import { productFeatures } from "@/lib/features";

const feature = productFeatures.find((f) => f.id === "competitors") ?? {
  id: "competitors",
  title: "Competitor Intelligence",
  description:
    "Track rival domains, compare citation rates prompt-by-prompt, and get steal-their-citations actions.",
};

export function CompetitorsPageClient() {
  const { workspace, ready, refresh } = useWorkspaceContext();
  const { isPaid } = useBilling();
  const [intelligence, setIntelligence] = useState<CompetitorIntelligence | null>(null);
  const [limits, setLimits] = useState<CompetitorLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [competitorInput, setCompetitorInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [fixOpen, setFixOpen] = useState(false);

  const workspaceId = workspace?.workspaceId ?? workspace?.id;

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/competitors`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as {
        intelligence: CompetitorIntelligence;
        limits: CompetitorLimits;
      };
      setIntelligence(data.intelligence);
      setLimits(data.limits);
    } catch {
      setIntelligence(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    effectInit(() => {
      void load();
    });
  }, [load]);

  async function addCompetitor(domainOverride?: string) {
    if (!workspaceId) return;
    const domain = cleanDomainInput(domainOverride ?? competitorInput);
    if (domainFormatStatus(domain) !== "valid") {
      setAddError("Enter a valid domain (e.g. rival.com)");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/competitors`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        intelligence?: CompetitorIntelligence;
        limits?: CompetitorLimits;
      };
      if (!res.ok) {
        setAddError(data.error ?? "Could not add competitor");
        return;
      }
      setIntelligence(data.intelligence ?? null);
      setLimits(data.limits ?? null);
      setCompetitorInput("");
      await refresh();
    } catch {
      setAddError("Could not add competitor");
    } finally {
      setAdding(false);
    }
  }

  function handleFixGap(gap: string) {
    setSelectedGap(gap);
    setFixOpen(true);
  }

  if (!ready || !workspace) return null;

  const tracked = workspace.competitors;
  const canAdd = limits?.canAdd ?? false;

  return (
    <>
      <DashboardPageHeader
        headingLevel="h2"
        title="Competitor intelligence"
        description={feature.description}
      />

      <Panel title="Tracked competitors">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-muted">
              {limits
                ? competitorLimitMessage(limits)
                : "Compare citation rates and prompt gaps against tracked rivals."}
            </p>
            {tracked.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tracked.map((domain) => (
                  <span
                    key={domain}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-ink"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex w-full max-w-md flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                placeholder="rival.com"
                disabled={!canAdd || adding}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-ink disabled:opacity-50"
              />
              <button
                type="button"
                disabled={!canAdd || adding}
                onClick={() => void addCompetitor()}
                className="shrink-0 rounded-full bg-gradient-to-r from-[#7b93f0] to-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {adding ? "Adding…" : "Add competitor"}
              </button>
            </div>
            {addError && <p className="text-xs text-rose-600">{addError}</p>}
            {!canAdd && limits && (
              <p className="text-xs text-muted">
                Competitor limit reached —{" "}
                <Link href="/pricing" className="font-semibold text-accent hover:underline">
                  upgrade plan
                </Link>
              </p>
            )}
          </div>
        </div>
      </Panel>

      {!isPaid ? (
        <FeatureGate
          feature="competitor_alerts"
          plan="pilot"
          title="Competitor gain alerts"
          description="Pilot and Fleet include email alerts when rivals overtake you on money prompts, citation rate surges, or new competitors appear."
          highlights={[
            "Prompt loss alerts when a competitor gains your citation",
            "Week-over-week citation rate surge detection",
            "New entrant detection on money prompts",
          ]}
          className="mt-6"
        />
      ) : (
        <Panel className="mt-6" title="Competitive alerts">
          <p className="text-sm text-muted">
            Alerts fire when a competitor gains a citation you lost, citation rate surges
            &gt;10% week-over-week, or new domains appear on your money prompts. Manage in{" "}
            <Link href="/dashboard/settings" className="font-semibold text-accent hover:underline">
              Settings → Notifications
            </Link>
            .
          </p>
        </Panel>
      )}

      {loading && (
        <p className="mt-6 text-sm text-muted">Loading competitor intelligence…</p>
      )}

      {!loading && intelligence && !intelligence.available && (
        <Panel className="mt-6" title="Run your first audit">
          <p className="text-sm text-muted">
            {intelligence.unavailableReason ??
              "Run a citation audit to unlock competitor intelligence."}
          </p>
          <Link
            href="/dashboard/geo-audit"
            className="mt-4 inline-flex rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white"
          >
            Run GEO audit
          </Link>
        </Panel>
      )}

      {!loading && intelligence?.discovered && intelligence.discovered.length > 0 && (
        <Panel className="mt-6" title="Competitor discovery">
          <p className="mb-4 text-sm text-muted">
            We noticed these domains cited on your money prompts — track them to sharpen
            competitive alerts:
          </p>
          <ul className="space-y-3">
            {intelligence.discovered.map((candidate) => (
              <li
                key={candidate.domain}
                className="flex flex-col gap-3 rounded-xl border border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-ink">{candidate.domain}</p>
                  <p className="mt-1 text-xs text-muted">
                    {candidate.citationHits} signal{candidate.citationHits === 1 ? "" : "s"} from{" "}
                    {candidate.source}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canAdd || adding}
                  onClick={() => void addCompetitor(candidate.domain)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
                >
                  Track this competitor
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {!loading && intelligence?.competitors && intelligence.competitors.length > 0 && (
        <div className="mt-6 space-y-4">
          {intelligence.competitors.map((card) => (
            <CompetitorCard
              key={card.domain}
              data={card}
              expanded={expandedDomain === card.domain}
              onToggle={() =>
                setExpandedDomain((prev) => (prev === card.domain ? null : card.domain))
              }
              onFixGap={handleFixGap}
            />
          ))}
        </div>
      )}

      {!loading &&
        intelligence?.available &&
        intelligence.competitors.length === 0 &&
        tracked.length === 0 && (
          <Panel className="mt-6" title="Add your first competitor">
            <p className="text-sm text-muted">
              Enter a rival domain above to compare citation rates prompt-by-prompt and unlock
              steal-their-citations recommendations.
            </p>
          </Panel>
        )}

      <QuickFixModal
        isOpen={fixOpen}
        onClose={() => setFixOpen(false)}
        gap={selectedGap}
        workspace={workspace}
      />
    </>
  );
}
