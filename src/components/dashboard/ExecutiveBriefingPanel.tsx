"use client";

import Link from "next/link";
import { CitationGradeRing } from "@/components/dashboard/CitationGradeRing";
import { ExecutiveBriefingStatCards } from "@/components/dashboard/ExecutiveBriefingStatCards";
import { buildExecutiveBriefingMetrics } from "@/lib/citation-grade";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { site } from "@/lib/site";

export function ExecutiveBriefingPanel({
  workspace,
}: {
  workspace: WorkspaceSnapshot;
}) {
  const metrics = buildExecutiveBriefingMetrics(workspace);
  const brandLabel = workspace.domain.replace(/^www\./, "");
  const thesis =
    workspace.description.trim() ||
    `"Citation intelligence for AI search — track money prompts, close gaps, and prove lift."`;
  const strategicFocus = workspace.hasRealAudit
    ? "Money-prompt citation share & weekly rescans"
    : "Baseline GEO audit & money-prompt tracking";

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800/80 bg-[#070b14] text-white shadow-[0_20px_60px_rgba(7,11,20,0.35)]">
      <div className="grid gap-0 lg:grid-cols-[1fr_minmax(280px,340px)]">
        <div className="p-6 sm:p-8 lg:p-10">
          <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Executive briefing
          </span>

          <h2 className="font-display mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {brandLabel}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            {thesis}
          </p>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/75">
            {workspace.hasRealAudit ? (
              <>
                Latest {workspace.auditMode ?? "GEO"} audit for{" "}
                <span className="font-medium text-white">{brandLabel}</span>.
                Prioritize fixes that move{" "}
                <span className="font-medium text-emerald-300">money prompts</span>{" "}
                — high-intent buyer questions in ChatGPT, Perplexity, and AI
                Overviews — not vanity keywords.
              </>
            ) : (
              <>
                Set up tracking for{" "}
                <span className="font-medium text-white">{brandLabel}</span> with
                buyer-intent prompts like &ldquo;{workspace.buyerQuestion}&rdquo;.
                Your executive view fills in after the first citation audit.
              </>
            )}
          </p>

          <ul className="mt-6 space-y-2 text-sm text-white/65">
            <li className="flex gap-2">
              <span className="text-emerald-400" aria-hidden>
                ◎
              </span>
              <span>
                Strategic focus:{" "}
                <span className="font-medium text-white">{strategicFocus}</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400" aria-hidden>
                ◎
              </span>
              <span>
                Primary buyer question:{" "}
                <span className="font-medium text-white">
                  {workspace.buyerQuestion}
                </span>
              </span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
            >
              {workspace.hasRealAudit ? "Re-run audit" : "Run citation audit"}
            </Link>
            {workspace.hasRealAudit && (
              <Link
                href="/report/proof"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Export proof report
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col border-t border-white/10 bg-white/[0.02] p-6 sm:p-8 lg:border-t-0 lg:border-l">
          <CitationGradeRing
            letterGrade={metrics.letterGrade}
            citationScore={metrics.citationScore}
            promptsCited={metrics.promptsCited}
            promptsTotal={metrics.promptsTotal}
            promptCitationPct={metrics.promptCitationPct}
            hasPromptBreakdown={metrics.hasPromptBreakdown}
            hasRealAudit={workspace.hasRealAudit}
          />

          <ExecutiveBriefingStatCards metrics={metrics} />

          <p className="mt-4 text-center text-[11px] text-white/40">
            {site.name}
            {workspace.auditMode
              ? ` · ${workspace.auditMode} audit`
              : workspace.businessType
                ? ` · ${workspace.businessType}`
                : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
