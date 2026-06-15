"use client";

import { useEffect, useState } from "react";
import { WorkspaceProvider, useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { PLATFORMS } from "@/lib/dashboard";
import {
  buildCompetitorBenchmark,
  platformRowsFromWorkspace,
  promptRowsForWorkspace,
} from "@/lib/dashboard-data";
import {
  ReportBrandingHeader,
  ReportPoweredByFooter,
} from "@/components/report/ReportBrandingHeader";
import { defaultWorkspacePreferences } from "@/lib/settings";
import { site } from "@/lib/site";

export function ProofReportPage() {
  return (
    <WorkspaceProvider>
      <ProofReportInner />
    </WorkspaceProvider>
  );
}

function ProofReportInner() {
  const { workspace, ready } = useWorkspaceContext();
  const [copied, setCopied] = useState(false);
  const pdfTitle = workspace
    ? `${workspace.domain} — citation proof report`
    : "Citation proof report";

  useEffect(() => {
    if (!workspace) return;
    const previous = document.title;
    document.title = pdfTitle;
    return () => {
      document.title = previous;
    };
  }, [pdfTitle, workspace]);

  useEffect(() => {
    if (!workspace) return;
    void fetch("/api/onboarding/checklist", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "shared_proof" }),
    }).catch(() => undefined);
  }, [workspace]);

  if (!ready || !workspace) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream">
        <p className="text-muted">Loading proof report…</p>
      </div>
    );
  }

  const rows = promptRowsForWorkspace(workspace);
  const benchmark = buildCompetitorBenchmark(workspace, rows);
  const platformRows = platformRowsFromWorkspace(workspace, PLATFORMS);
  const topActions =
    workspace.gaps.length > 0
      ? workspace.gaps.slice(0, 4)
      : [
          `Publish a direct answer page for "${workspace.buyerQuestion}"`,
          "Create a comparison page against your top competitor",
          "Improve structured data and on-page answer formatting",
          "Turn buyer discussion insights into citation-ready content",
        ];
  const generatedAt = new Date().toLocaleString();
  const whiteLabel =
    workspace.preferences?.whiteLabel ?? defaultWorkspacePreferences.whiteLabel;

  function exportPdf() {
    document.title = pdfTitle;
    window.print();
  }

  async function copyLink() {
    const url = `${window.location.origin}/report/proof`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-cream print:bg-white citepilot-print-report">
      <header className="border-b border-border bg-white px-6 py-6 print:border-0">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <ReportBrandingHeader
              whiteLabel={whiteLabel}
              domain={workspace.domain}
              subtitle={`Proof report · ${workspace.domain} · generated ${generatedAt}`}
            />
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Share current AI visibility, benchmark position, and next actions with
              clients or internal teams.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 citepilot-no-print">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Export as PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 print:py-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportStat label="Citation score" value={`${workspace.citationScore}/100`} />
          <ReportStat label="Visibility score" value={`${workspace.visibilityScore}%`} />
          <ReportStat
            label="Platforms cited"
            value={`${workspace.citedPlatforms}/${workspace.totalPlatforms}`}
          />
          <ReportStat label="Prompts tracked" value={String(workspace.promptsTracked)} />
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm print:shadow-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Executive summary
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                {workspace.hasRealAudit
                  ? `${workspace.domain} currently shows measurable citation visibility across tracked AI platforms, with the latest audit feeding this report.`
                  : `${workspace.domain} needs a citation audit before this report can show measured prompt and platform results.`}
              </p>
            </div>
            <div className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">
              Buyer question:{" "}
              <span className="font-semibold text-ink">{workspace.buyerQuestion}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Platform presence
              </h3>
              <ul className="mt-3 space-y-2">
                {platformRows.map((platform) => (
                  <li
                    key={platform.name}
                    className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-ink">{platform.name}</span>
                    <span className={platform.cited ? "font-semibold text-mint" : "text-muted"}>
                      {platform.cited
                        ? "share" in platform && platform.share
                          ? `${platform.share}% cited`
                          : "Cited"
                        : "Missing"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Priority actions
              </h3>
              <ol className="mt-3 space-y-2">
                {topActions.map((action, index) => (
                  <li
                    key={action}
                    className="flex gap-3 rounded-xl bg-surface px-4 py-3 text-sm text-muted"
                  >
                    <span className="font-semibold text-accent">{index + 1}</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {benchmark.available && benchmark.brands.length > 0 && (
          <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm print:shadow-none">
            <h2 className="font-display text-xl font-bold text-ink">
              Competitor benchmark
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
              {benchmark.unavailableReason ??
                "Your cite status per audited prompt is shown below. Competitor visibility scores require dedicated competitor scans."}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {benchmark.brands.map((brand) => (
                <div
                  key={brand.brand}
                  className="rounded-xl border border-border bg-surface px-5 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {brand.deltaVsYou === 0 ? "Your brand" : "Tracked competitor"}
                  </p>
                  <p className="mt-1 font-semibold text-ink">{brand.brand}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Avg visibility
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold text-ink">
                        {brand.avgVisibility ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Prompts led
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold text-ink">
                        {brand.promptsLed}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="pb-3 pr-4">Prompt</th>
                    {benchmark.brands.map((brand) => (
                      <th key={brand.brand} className="pb-3 pr-4">
                        {brand.brand}
                      </th>
                    ))}
                    <th className="pb-3 pr-4">Leader</th>
                    <th className="pb-3">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmark.prompts.map((prompt) => (
                    <tr key={prompt.prompt} className="border-b border-border last:border-0">
                      <td className="max-w-xs py-4 pr-4 font-medium text-ink">
                        {prompt.prompt}
                      </td>
                      {benchmark.brands.map((brand) => (
                        <td key={brand.brand} className="py-4 pr-4 text-ink">
                          {(() => {
                            const score = prompt.scores.find(
                              (s) => s.brand === brand.brand,
                            )?.score;
                            return score === null || score === undefined ? "—" : score;
                          })()}
                        </td>
                      ))}
                      <td className="py-4 pr-4 text-muted">{prompt.leader}</td>
                      <td className="py-4 text-muted">
                        {prompt.youCited
                          ? "Cited"
                          : prompt.gapToLeader !== null && prompt.gapToLeader > 0
                            ? `${prompt.gapToLeader} pts`
                            : "Not cited"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm print:shadow-none">
          <h2 className="font-display text-xl font-bold text-ink">
            Prompt-level proof
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Audited prompts and cite status from your latest workspace audit.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-3 pr-4">Prompt</th>
                  <th className="pb-3 pr-4">Visibility</th>
                  <th className="pb-3 pr-4">Visible in</th>
                  <th className="pb-3">Leader</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.prompt} className="border-b border-border last:border-0">
                    <td className="max-w-xs py-4 pr-4 font-medium text-ink">{row.prompt}</td>
                    <td className="py-4 pr-4 text-ink">
                      {row.fromAudit
                        ? row.cited
                          ? "Cited"
                          : "Not cited"
                        : row.visibility === null
                          ? "—"
                          : `${row.visibility}%`}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {row.models.map((model) => (
                          <span
                            key={model}
                            className="rounded-md bg-surface px-1.5 py-0.5 text-xs font-bold text-muted"
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 text-muted">{row.leader}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <div className="mx-auto max-w-5xl px-6 pb-10">
        <ReportPoweredByFooter hidePoweredBy={whiteLabel.hidePoweredBy} />
      </div>

      {!whiteLabel.hidePoweredBy && (
        <div
          className="pointer-events-none fixed bottom-4 right-4 z-10 rounded-lg border border-border/60 bg-white/90 px-3 py-2 text-[10px] font-semibold text-muted shadow-sm backdrop-blur print:fixed print:bottom-6 print:right-6"
          aria-hidden
        >
          {site.name}
        </div>
      )}
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm print:shadow-none">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
