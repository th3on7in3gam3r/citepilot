"use client";

import { useMemo } from "react";
import { useGridFilter } from "@/components/dashboard/copilot/GridFilterProvider";
import { CompetitorOverlapChart } from "@/components/dashboard/competitors/CompetitorOverlapChart";
import { FilterChips } from "@/components/dashboard/filters/FilterChips";
import {
  DashboardTable,
  DashboardTableBody,
  DashboardTableHead,
  DashboardTableRow,
  DashboardTableTd,
  DashboardTableTh,
} from "@/components/dashboard/layout/DashboardTable";
import { DashboardToolbar } from "@/components/dashboard/layout/DashboardToolbar";
import {
  applyGridFilters,
  COMPETITOR_FILTER_COLUMNS,
} from "@/lib/copilot/grid-filters";
import {
  buildCompetitorGridRows,
  formatPageViews,
  type CompetitorGridRow,
} from "@/lib/copilot/competitor-grid-data";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { buildKeywordOverlapSegments } from "@/lib/dashboard/overview-filters";

function domainInitial(domain: string): string {
  const host = domain.replace(/^www\./, "").split(".")[0] ?? "?";
  return host.charAt(0).toUpperCase();
}

function faviconColor(domain: string): string {
  const colors = ["#0ea5e9", "#38bdf8", "#a78bfa", "#f472b6", "#fbbf24"];
  let h = 0;
  for (let i = 0; i < domain.length; i++) h += domain.charCodeAt(i);
  return colors[h % colors.length];
}

export function CompetitorAnalysisGrid({ workspace }: { workspace: WorkspaceSnapshot }) {
  const { filters, setFilterModalOpen, addFilter, removeFilter } = useGridFilter();

  const allRows = useMemo(() => buildCompetitorGridRows(workspace), [workspace]);

  const filteredRows = useMemo(
    () => applyGridFilters(allRows, filters, COMPETITOR_FILTER_COLUMNS),
    [allRows, filters],
  );

  const overlapSegments = useMemo(
    () => buildKeywordOverlapSegments(workspace),
    [workspace],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <CompetitorOverlapChart segments={overlapSegments} />
        <div className="dash-content-card flex flex-col justify-center p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Quick read
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {overlapSegments.length === 0
              ? "Add competitors and run an audit to compare prompt overlap."
              : "Use the grid below to compare ND score, traffic signals, and targeted keywords across rivals."}
          </p>
          <p className="mt-4 font-display text-3xl font-bold text-ink">
            {filteredRows.length}
            <span className="ml-2 text-sm font-semibold text-muted">sites tracked</span>
          </p>
        </div>
      </div>
      <DashboardToolbar
        title="Competitor analysis"
        count={filteredRows.length}
        description="Compare citation signals across rivals. Use Copilot to filter — e.g. ND Score larger than 90."
      />

      <FilterChips
        filters={filters}
        onRemove={removeFilter}
        onAdd={() => {
          addFilter();
          setFilterModalOpen(true);
        }}
      />

      <DashboardTable minWidth="880px">
        <DashboardTableHead>
          <DashboardTableRow header>
            <DashboardTableTh>Site</DashboardTableTh>
            <DashboardTableTh>ND Score</DashboardTableTh>
            <DashboardTableTh>Page views</DashboardTableTh>
            <DashboardTableTh>Trend</DashboardTableTh>
            <DashboardTableTh>CPC</DashboardTableTh>
            <DashboardTableTh>Keyword targeted</DashboardTableTh>
            <DashboardTableTh>Last updated</DashboardTableTh>
          </DashboardTableRow>
        </DashboardTableHead>
        <DashboardTableBody>
          {filteredRows.map((row) => (
            <CompetitorRow key={row.id} row={row} />
          ))}
          {filteredRows.length === 0 && (
            <DashboardTableRow>
              <DashboardTableTd colSpan={7} className="py-12 text-center text-muted">
                No rows match your filters. Adjust conditions or clear filters.
              </DashboardTableTd>
            </DashboardTableRow>
          )}
        </DashboardTableBody>
      </DashboardTable>
    </div>
  );
}

function CompetitorRow({ row }: { row: CompetitorGridRow }) {
  const trendPositive = row.trend >= 0;
  return (
    <DashboardTableRow highlight={row.isYou}>
      <DashboardTableTd>
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: faviconColor(row.domain) }}
          >
            {domainInitial(row.domain)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">
              {row.domain}
              {row.isYou && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                  You
                </span>
              )}
            </p>
            <p className="truncate text-xs text-muted">{row.h1}</p>
          </div>
        </div>
      </DashboardTableTd>
      <DashboardTableTd className="font-semibold text-ink">{row.ndScore}</DashboardTableTd>
      <DashboardTableTd className="text-muted">{formatPageViews(row.pageViews)}</DashboardTableTd>
      <DashboardTableTd>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
            trendPositive
              ? "bg-accent/10 text-accent-deep"
              : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
          }`}
        >
          {trendPositive ? "+" : ""}
          {row.trend}
        </span>
      </DashboardTableTd>
      <DashboardTableTd className="text-muted">${row.cpc.toFixed(2)}</DashboardTableTd>
      <DashboardTableTd className="max-w-[200px] truncate text-ink">{row.keywordTargeted}</DashboardTableTd>
      <DashboardTableTd className="text-muted">{row.lastUpdated}</DashboardTableTd>
    </DashboardTableRow>
  );
}
