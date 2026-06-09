"use client";

import { useMemo } from "react";
import { useGridFilter } from "@/components/dashboard/copilot/GridFilterProvider";
import { FilterChips } from "@/components/dashboard/filters/FilterChips";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-[#0f172a]">
            Competitor Analysis{" "}
            <span className="text-base font-semibold text-[#64748b]">
              {filteredRows.length}
            </span>
          </h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Ask Copilot to filter this table with natural language — e.g. ND Score larger
            than 90 and H1 contains marketing.
          </p>
        </div>
      </div>

      <FilterChips
        filters={filters}
        onRemove={removeFilter}
        onAdd={() => {
          addFilter();
          setFilterModalOpen(true);
        }}
      />

      <div className="overflow-hidden rounded-2xl border border-[#e8edf3] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#eef2f6] bg-[#f8fafb] text-xs font-semibold text-[#64748b]">
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">ND Score</th>
                <th className="px-4 py-3">Page Views</th>
                <th className="px-4 py-3">Trend</th>
                <th className="px-4 py-3">CPC</th>
                <th className="px-4 py-3">Keyword Targeted</th>
                <th className="px-4 py-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafb]">
              {filteredRows.map((row) => (
                <CompetitorRow key={row.id} row={row} />
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#64748b]">
                    No rows match your filters. Adjust conditions or clear filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompetitorRow({ row }: { row: CompetitorGridRow }) {
  const trendPositive = row.trend >= 0;
  return (
    <tr className={row.isYou ? "bg-[#e0f2fe]/40" : "hover:bg-[#f8fafb]/80"}>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: faviconColor(row.domain) }}
          >
            {domainInitial(row.domain)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-[#0f172a]">
              {row.domain}
              {row.isYou && (
                <span className="ml-2 rounded-full bg-[#0ea5e9] px-2 py-0.5 text-[10px] font-bold text-white">
                  You
                </span>
              )}
            </p>
            <p className="truncate text-xs text-[#94a3b8]">{row.h1}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 font-semibold text-[#0f172a]">{row.ndScore}</td>
      <td className="px-4 py-3.5 text-[#334155]">{formatPageViews(row.pageViews)}</td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
            trendPositive
              ? "bg-[#e0f2fe] text-[#0284c7]"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {trendPositive ? "+" : ""}
          {row.trend}
        </span>
      </td>
      <td className="px-4 py-3.5 text-[#334155]">${row.cpc.toFixed(2)}</td>
      <td className="max-w-[180px] truncate px-4 py-3.5 text-[#64748b]">
        {row.keywordTargeted}
      </td>
      <td className="px-4 py-3.5 text-xs text-[#94a3b8]">{row.lastUpdated}</td>
    </tr>
  );
}
