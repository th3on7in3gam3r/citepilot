"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type {
  CitationHeatmapData,
  HeatmapCellDetail,
  HeatmapCellStatus,
  HeatmapRow,
} from "@/lib/citations/viz-data";
import {
  HEATMAP_PLATFORMS,
  heatmapCellColor,
} from "@/lib/citations/viz-data";
import { PlatformScanBadge } from "@/components/dashboard/PlatformScanBadge";
import { isBrowserScanPlatform } from "@/lib/scanners/platform-config";

type SortMode = "citation_rate" | "alphabetical" | "recent";
type StatusFilter = "all" | HeatmapCellStatus;

const STATUS_ICON: Record<HeatmapCellStatus, string> = {
  cited: "✓",
  missing: "✗",
  partial: "~",
  no_data: "—",
};

const PLATFORM_SHORT: Record<string, string> = {
  chatgpt: "GPT",
  perplexity: "Px",
  gemini: "Ge",
  "google-ai": "GAI",
  grok: "Gk",
  deepseek: "DS",
};

function truncatePrompt(text: string, max = 40): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function CitationDetailDrawer({
  detail,
  onClose,
}: {
  detail: HeatmapCellDetail | null;
  onClose: () => void;
}) {
  if (!detail) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px]"
        aria-label="Close detail"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-white shadow-2xl dark:border-[#333] dark:bg-[#111]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="heatmap-detail-title"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-[#333]">
          <h3 id="heatmap-detail-title" className="font-display text-lg font-bold text-ink dark:text-white">
            Citation detail
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface hover:text-ink"
          >
            Close
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Prompt</p>
            <p className="mt-1 text-sm font-medium text-ink dark:text-white">{detail.prompt}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Platform</p>
            <p className="mt-1 text-sm font-medium text-ink dark:text-white">{detail.platformLabel}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Status</p>
            <span
              className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-white"
              style={{ backgroundColor: heatmapCellColor(detail.status) }}
            >
              {STATUS_ICON[detail.status]} {detail.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted dark:text-white/65">{detail.detail}</p>
          {detail.checkMode && (
            <p className="text-xs text-muted">
              Check mode: <span className="font-semibold text-ink dark:text-white">{detail.checkMode}</span>
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

export function CitationHeatmap({
  data,
  plan = "free",
}: {
  data: CitationHeatmapData;
  plan?: "free" | "pilot" | "fleet";
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<SortMode>("citation_rate");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<HeatmapCellDetail | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setPlatformFilter(HEATMAP_PLATFORMS.map((p) => p.id));
  }, []);

  const visiblePlatforms = useMemo(
    () => HEATMAP_PLATFORMS.filter((p) => platformFilter.includes(p.id)),
    [platformFilter],
  );

  const filteredRows = useMemo(() => {
    let rows = [...data.rows];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) => row.prompt.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      rows = rows.filter((row) =>
        row.cells.some((cell) => cell.status === statusFilter),
      );
    }

    rows.sort((a, b) => {
      if (sort === "alphabetical") return a.prompt.localeCompare(b.prompt);
      if (sort === "recent") return b.promptIndex - a.promptIndex;
      return b.citationRate - a.citationRate;
    });

    return rows;
  }, [data.rows, search, sort, statusFilter]);

  const togglePlatform = (id: string) => {
    setPlatformFilter((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const openCell = (row: HeatmapRow, platformId: string) => {
    const cell = row.cells.find((c) => c.platformId === platformId);
    if (!cell) return;
    setDetail({
      prompt: row.prompt,
      platformLabel: cell.platformLabel,
      status: cell.status,
      detail: cell.detail,
      checkMode: cell.checkMode,
    });
  };

  const exportPng = useCallback(async () => {
    if (!gridRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(gridRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = "citepilot-citation-heatmap.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-full border border-border bg-white px-3 py-2 text-sm dark:border-[#333] dark:bg-[#111]"
            aria-label="Sort prompts"
          >
            <option value="citation_rate">Sort: Citation rate</option>
            <option value="alphabetical">Sort: Alphabetical</option>
            <option value="recent">Sort: Recently added</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-full border border-border bg-white px-3 py-2 text-sm dark:border-[#333] dark:bg-[#111]"
            aria-label="Filter by status"
          >
            <option value="all">Status: All</option>
            <option value="cited">Cited</option>
            <option value="missing">Missing</option>
            <option value="partial">Partial</option>
            <option value="no_data">No data</option>
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className="min-w-[12rem] rounded-full border border-border bg-white px-3 py-2 text-sm dark:border-[#333] dark:bg-[#111]"
          />
        </div>
        <button
          type="button"
          onClick={() => void exportPng()}
          disabled={exporting}
          className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-60 dark:border-[#333] dark:bg-[#111]"
        >
          {exporting ? "Exporting…" : "Download as PNG"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {HEATMAP_PLATFORMS.map((platform) => {
          const active = platformFilter.includes(platform.id);
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "bg-accent/15 text-accent"
                  : "bg-surface text-muted line-through opacity-60"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                {platform.label}
                {isBrowserScanPlatform(platform.dbName) && (
                  <PlatformScanBadge platformName={platform.dbName} plan={plan} compact />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {!data.hasAudit ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted">
          Run a citation audit to populate the prompt × platform heatmap.
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted">
          No prompts match your filters.
        </div>
      ) : (
        <div ref={gridRef} className="overflow-x-auto rounded-2xl border border-border bg-white p-4 dark:border-[#333] dark:bg-[#111]">
          <table className="w-full min-w-[640px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted dark:bg-[#111]">
                  Prompt
                </th>
                {visiblePlatforms.map((platform) => (
                  <th key={platform.id} className="px-1 py-2 text-center">
                    <div className="mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-surface text-[10px] font-bold text-ink dark:bg-[#1a1a1a] dark:text-white">
                      {PLATFORM_SHORT[platform.id]}
                    </div>
                    <span className="mt-1 block text-[10px] font-medium text-muted">
                      {platform.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={`${row.promptIndex}-${row.prompt}`}
                  className="group hover:bg-accent/[0.04]"
                >
                  <td
                    className="sticky left-0 z-10 max-w-[12rem] bg-white px-2 py-2 text-sm font-medium text-ink group-hover:bg-accent/[0.04] dark:bg-[#111] dark:text-white"
                    title={row.prompt}
                  >
                    {truncatePrompt(row.prompt)}
                  </td>
                  {visiblePlatforms.map((platform) => {
                    const cell = row.cells.find((c) => c.platformId === platform.id)!;
                    return (
                      <td key={platform.id} className="px-1 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => openCell(row, platform.id)}
                          className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white transition hover:scale-105 sm:h-12 sm:w-12"
                          style={{ backgroundColor: heatmapCellColor(cell.status) }}
                          title={`${platform.label}: ${cell.status}`}
                          aria-label={`${row.prompt} on ${platform.label}: ${cell.status}`}
                        >
                          {STATUS_ICON[cell.status]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 border-t border-border pt-4 dark:border-[#333]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Citation rate per platform
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.platformRates
                .filter((rate) => visiblePlatforms.some((p) => p.id === rate.platformId))
                .map((rate) => (
                  <div key={rate.platformId}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-ink dark:text-white">{rate.label}</span>
                      <span className="text-muted">{rate.rate}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface dark:bg-[#1a1a1a]">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${rate.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <CitationDetailDrawer detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
