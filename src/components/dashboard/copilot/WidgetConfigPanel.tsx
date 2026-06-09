"use client";

import {
  CHART_TYPE_OPTIONS,
  WIDGET_SOURCES,
  type DashboardWidget,
} from "@/lib/copilot/widgets";

export function WidgetConfigPanel({
  widget,
  onChange,
  onDelete,
  onClose,
}: {
  widget: DashboardWidget;
  onChange: (patch: Partial<DashboardWidget>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e8edf3] bg-white shadow-lg">
      <header className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#0ea5e9]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-[#0f172a]">Widget</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-2 text-[#94a3b8] hover:bg-red-50 hover:text-red-600"
            aria-label="Delete widget"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#94a3b8] hover:bg-[#f8fafb] hover:text-[#0f172a]"
            aria-label="Close config"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <label className="block text-xs font-semibold text-[#0f172a]">
          Widget Name
          <input
            type="text"
            value={widget.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20"
          />
        </label>

        <label className="block text-xs font-semibold text-[#0f172a]">
          Source
          <select
            value={widget.source}
            onChange={(e) =>
              onChange({ source: e.target.value as DashboardWidget["source"] })
            }
            className="mt-1.5 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none focus:border-[#0ea5e9]"
          >
            {WIDGET_SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-[#0f172a]">
            Unit
            <select
              value={widget.unit}
              onChange={(e) =>
                onChange({ unit: e.target.value as DashboardWidget["unit"] })
              }
              className="mt-1.5 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none"
            >
              <option value="none">None</option>
              <option value="percent">Percent</option>
              <option value="currency">Currency</option>
              <option value="count">Count</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#0f172a]">
            Function
            <select
              value={widget.aggregate}
              onChange={(e) =>
                onChange({ aggregate: e.target.value as DashboardWidget["aggregate"] })
              }
              className="mt-1.5 w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm outline-none"
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="max">Max</option>
            </select>
          </label>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#0f172a]">Chart type</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {CHART_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ chartType: opt.id })}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] font-medium transition ${
                  widget.chartType === opt.id
                    ? "border-[#0ea5e9] bg-[#e0f2fe] text-[#0284c7]"
                    : "border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
                }`}
              >
                <ChartTypeIcon type={opt.id} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartTypeIcon({ type }: { type: DashboardWidget["chartType"] }) {
  const className = "h-5 w-5";
  switch (type) {
    case "pie":
    case "donut":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v9l6 4" />
        </svg>
      );
    case "bars":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="10" width="4" height="10" rx="1" />
          <rect x="10" y="6" width="4" height="14" rx="1" />
          <rect x="16" y="12" width="4" height="8" rx="1" />
        </svg>
      );
    case "line":
    case "area":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M4 18 L8 12 L12 14 L20 6" />
        </svg>
      );
    case "gauge":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M4 16a8 8 0 0116 0" />
          <path d="M12 16V10" />
        </svg>
      );
    case "table":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18M9 5v14" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="6" cy="18" r="2" />
          <circle cx="12" cy="8" r="2" />
          <circle cx="18" cy="14" r="2" />
        </svg>
      );
  }
}
