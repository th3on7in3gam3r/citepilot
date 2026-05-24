export const CHART_MONTHS = [
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
] as const;

export type ChartPoint = { month: string; value: number };

export type PlatformReach = {
  id: string;
  name: string;
  flag: string;
  audience: string;
};

export const PLATFORM_REACH: PlatformReach[] = [
  { id: "chatgpt", name: "ChatGPT", flag: "🤖", audience: "200M+ weekly users" },
  { id: "perplexity", name: "Perplexity", flag: "🔍", audience: "15M+ monthly users" },
  { id: "google", name: "Google AI", flag: "🌐", audience: "1B+ search users" },
  { id: "gemini", name: "Gemini", flag: "✨", audience: "350M+ users" },
];

export function buildCitationSeries(
  seed: number,
  optimizationLevel: number,
): { current: ChartPoint[]; projected: ChartPoint[] } {
  const base = 180 + (seed % 120);
  const current = CHART_MONTHS.map((month, i) => ({
    month,
    value: Math.round(base + i * 85 + ((seed + i * 17) % 60)),
  }));

  const boost = optimizationLevel * 95;
  const projected = CHART_MONTHS.map((month, i) => ({
    month,
    value: Math.round(current[i].value + boost + i * i * 28 + ((seed + i) % 40)),
  }));

  return { current, projected };
}

export function chartYMax(values: number[]): number {
  const max = Math.max(...values);
  return Math.ceil(max / 500) * 500 || 2500;
}

export function toSvgPoints(
  data: ChartPoint[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
  yMax: number,
): { x: number; y: number }[] {
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  return data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * innerW,
    y: padding.top + innerH - (d.value / yMax) * innerH,
  }));
}

export function pointsToPath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

export function areaPath(
  points: { x: number; y: number }[],
  baselineY: number,
): string {
  if (points.length === 0) return "";
  const line = pointsToPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}
