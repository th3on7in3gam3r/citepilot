"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CitationVolumeChart } from "@/components/dashboard/CitationVolumeChart";
import {
  DashboardPageHeader,
  Panel,
  StatCard,
} from "@/components/dashboard/DashboardUI";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { PLATFORMS, dashboardNav } from "@/lib/dashboard";
import { platformRowsFromWorkspace } from "@/lib/dashboard-data";

export function DashboardOverview() {
  const { workspace, ready, refresh } = useWorkspaceContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return;
    const first = setTimeout(() => refresh(), 4000);
    const second = setTimeout(() => refresh(), 10000);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [searchParams, refresh]);

  if (!ready || !workspace) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-surface" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS);
  const seed = workspace.domain.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const gaps =
    workspace.gaps.length > 0
      ? workspace.gaps.slice(0, 3)
      : [
          `Add answer capsule for "${workspace.buyerQuestion}"`,
          "Publish comparison page vs top competitor",
          "Engage buyer threads on Hacker News or Stack Overflow",
        ];

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        description={
          workspace.hasRealAudit
            ? `Citation health for ${workspace.domain}. Scores from your latest GEO audit (${workspace.auditMode ?? "technical"}).`
            : `Citation health for ${workspace.domain}. Run an audit to populate live scores.`
        }
        action={
          <Link
            href="/audit"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(107,140,255,0.3)]"
          >
            Run citation audit
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Citation score"
          value={String(workspace.citationScore)}
          sub="/100"
          trend={workspace.weeklyLift + " this week"}
        />
        <StatCard
          label="Platforms cited"
          value={`${workspace.citedPlatforms}`}
          sub={`/${workspace.totalPlatforms}`}
        />
        <StatCard
          label="Prompts tracked"
          value={String(workspace.promptsTracked)}
        />
        <StatCard
          label="Community signals"
          value={String(workspace.communityMentions)}
          sub="mentions"
        />
      </div>

      <div className="mt-6">
        <CitationVolumeChart
          seed={seed}
          compact
          citationScore={workspace.citationScore}
          hasRealAudit={workspace.hasRealAudit}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Platform presence">
          <ul className="space-y-2">
            {platformRows.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm"
              >
                <span className="font-medium text-ink">{p.name}</span>
                <span
                  className={p.cited ? "font-semibold text-mint" : "text-muted"}
                >
                  {p.cited
                    ? "share" in p && p.share
                      ? `${p.share}% cited`
                      : "Cited"
                    : "Missing"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="This week's actions">
          <ol className="space-y-3 text-sm text-muted">
            {gaps.map((g, i) => (
              <li key={g} className="flex gap-3">
                <span className="font-bold text-accent">{i + 1}</span>
                {g}
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <nav className="mt-8 grid grid-cols-2 gap-2 lg:hidden">
        {dashboardNav
          .filter((n) => n.id !== "overview")
          .map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "border-accent/40 bg-accent/5 text-accent"
                  : "border-border bg-white text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
      </nav>
    </>
  );
}
