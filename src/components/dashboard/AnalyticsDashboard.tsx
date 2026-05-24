"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CitationVolumeChart } from "@/components/dashboard/CitationVolumeChart";
import { GoogleAnalyticsPanel } from "@/components/dashboard/GoogleAnalyticsPanel";
import { Panel } from "@/components/dashboard/DashboardUI";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { domainSeed } from "@/lib/dashboard";
import type { PromptRow } from "@/lib/features";
import { promptRowsForWorkspace } from "@/lib/dashboard-data";

type Tab = "google" | "llms";

const sentimentStyle = {
  Positive: "bg-emerald-50 text-emerald-700",
  Neutral: "bg-amber-50 text-amber-700",
  Negative: "bg-orange-50 text-orange-700",
};

export function AnalyticsDashboard({ workspace }: { workspace: WorkspaceSnapshot }) {
  const [tab, setTab] = useState<Tab>("llms");
  const rows = useMemo(
    () => promptRowsForWorkspace(workspace),
    [workspace],
  );

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-border bg-white p-1">
          <TabButton active={tab === "google"} onClick={() => setTab("google")}>
            Google
          </TabButton>
          <TabButton active={tab === "llms"} onClick={() => setTab("llms")}>
            LLMs
          </TabButton>
        </div>
        <select className="rounded-full border border-border bg-white px-4 py-2 text-sm text-muted">
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>

      {tab === "llms" ? (
        <LLMPanel workspace={workspace} rows={rows} />
      ) : (
        <GoogleAnalyticsPanel workspace={workspace} />
      )}
      {!workspace.hasRealAudit && (
        <p className="mt-4 text-center text-xs text-muted">
          Run a citation audit from Settings or Overview to replace estimates with
          live prompt results.
        </p>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-ink text-white" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function LLMPanel({
  workspace,
  rows,
}: {
  workspace: WorkspaceSnapshot;
  rows: PromptRow[];
}) {
  return (
    <>
      <Panel title="Brand presence" className="mt-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Visibility score
            </p>
            <p className="font-display mt-1 text-3xl font-bold text-ink">
              {workspace.visibilityScore}%
            </p>
          </div>
          <PromptsCard workspace={workspace} />
        </div>
        <PromptTable rows={rows} />
      </Panel>
      <div className="mt-6">
        <CitationVolumeChart
          seed={domainSeed(workspace.domain)}
          citationScore={workspace.citationScore}
          hasRealAudit={workspace.hasRealAudit}
        />
      </div>
    </>
  );
}

function PromptsCard({ workspace }: { workspace: WorkspaceSnapshot }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Prompts tracked
      </p>
      <p className="font-display mt-1 text-3xl font-bold text-ink">
        {workspace.promptsTracked}/5
      </p>
    </div>
  );
}

function PromptTable({ rows }: { rows: PromptRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
            <th className="pb-3 pr-4">Prompts</th>
            <th className="pb-3 pr-4">Visibility</th>
            <th className="pb-3 pr-4">Visible in</th>
            <th className="pb-3 pr-4">Sentiment</th>
            <th className="pb-3">Leader</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.prompt} className="border-b border-border last:border-0">
              <td className="max-w-xs py-4 pr-4 font-medium text-ink">{row.prompt}</td>
              <td className="py-4 pr-4">{row.visibility}%</td>
              <td className="py-4 pr-4">
                <div className="flex gap-1">
                  {row.models.map((m) => (
                    <span
                      key={m}
                      className="rounded-md bg-surface px-1.5 py-0.5 text-xs font-bold text-muted"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-4 pr-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sentimentStyle[row.sentiment]}`}
                >
                  {row.sentiment}
                </span>
              </td>
              <td className="py-4 text-muted">{row.leader}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

