/**
 * RosenBarChart — Rosen Charts-inspired horizontal bar chart.
 * Uses divs instead of SVG rects to avoid stretched rounded corners on wide containers.
 * Zero external dependencies. RSC compatible (no "use client" needed unless you add hover).
 * Inspired by: https://rosencharts.com/docs/bar-charts
 */

const DEFAULT_BAR_COLORS = [
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#60a5fa", // blue-400
  "#34d399", // emerald-400
  "#fb7185", // rose-400
  "#f472b6", // pink-400
  "#fbbf24", // amber-400
  "#38bdf8", // sky-400
];

interface BarDataItem {
  label: string;
  value: number;
  color?: string;
  note?: string;
}

export function RosenHorizontalBarChart({
  data,
  height = 200,
  maxValue,
  formatValue,
  className = "",
}: {
  data: BarDataItem[];
  height?: number;
  maxValue?: number;
  formatValue?: (v: number) => string;
  className?: string;
}) {
  if (!data.length) return null;

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const fmt = formatValue ?? ((v: number) => String(v));

  const marginLeft = 72;
  const barHeight = Math.min(18, Math.floor((height - data.length * 6) / data.length));
  const totalH = data.length * (barHeight + 10);

  return (
    <div className={`relative w-full ${className}`} style={{ minHeight: totalH }}>
      {data.map((item, i) => {
        const pct = Math.min(100, (item.value / max) * 100);
        const color = item.color ?? DEFAULT_BAR_COLORS[i % DEFAULT_BAR_COLORS.length];

        return (
          <div
            key={item.label}
            className="flex items-center gap-2"
            style={{ marginBottom: 10 }}
          >
            {/* Label */}
            <span
              className="shrink-0 text-right text-[10px] text-slate-400 tabular-nums"
              style={{ width: marginLeft - 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={item.label}
            >
              {item.label}
            </span>

            {/* Bar track */}
            <div className="relative flex-1 overflow-hidden rounded-r-lg" style={{ height: barHeight, background: "#f1f5f9" }}>
              {/* Bar fill */}
              <div
                className="absolute left-0 top-0 h-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}cc, ${color})`,
                  borderRadius: "0 6px 6px 0",
                }}
              />
              {/* Subtle shine overlay */}
              <div
                className="pointer-events-none absolute left-0 top-0 h-1/2 w-full"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(255,255,255,0))",
                  borderRadius: "0 6px 0 0",
                }}
              />
            </div>

            {/* Value label */}
            <span
              className="shrink-0 text-right text-[10px] font-semibold tabular-nums text-slate-600"
              style={{ width: 36 }}
            >
              {fmt(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * RosenVerticalBarChart — vertical grouped or single-series bar chart.
 */
export function RosenVerticalBarChart({
  labels,
  values,
  color = "#818cf8",
  height = 160,
  className = "",
}: {
  labels: readonly string[];
  values: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  if (!values.length) return null;

  const max = Math.max(...values, 1);
  const n = values.length;

  return (
    <div className={`flex items-end gap-1 w-full ${className}`} style={{ height }}>
      {values.map((v, i) => {
        const pct = (v / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1" style={{ minWidth: 0 }}>
            <div className="relative w-full" style={{ height: height - 20 }}>
              <div
                className="absolute bottom-0 w-full rounded-t transition-all duration-700 ease-out"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(to top, ${color}, ${color}99)`,
                }}
              />
            </div>
            <span className="truncate text-[9px] text-slate-400">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}
