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
  { id: "claude", name: "Claude", flag: "🧠", audience: "AI assistant + workspace users" },
  { id: "copilot", name: "Copilot", flag: "💼", audience: "Windows + Microsoft 365 users" },
  { id: "grok", name: "Grok", flag: "⚡", audience: "X + assistant answer seekers" },
  { id: "deepseek", name: "DeepSeek", flag: "🌊", audience: "Technical AI users" },
];

export function buildCitationSeries(
  seed: number,
  optimizationLevel: number,
): { current: ChartPoint[]; projected: ChartPoint[] } {
  const base = 28 + (seed % 18);
  const current = CHART_MONTHS.map((month, i) => ({
    month,
    value: Math.min(100, Math.round(base + i * 4 + ((seed + i * 17) % 7))),
  }));

  const boost = 6 + optimizationLevel * 1.6;
  const projected = CHART_MONTHS.map((month, i) => ({
    month,
    value: Math.min(
      100,
      Math.round(current[i].value + boost + i * 1.5 + ((seed + i) % 3)),
    ),
  }));

  return { current, projected };
}

export function buildProjectedCitationSeries(
  current: ChartPoint[],
  optimizationLevel: number,
): ChartPoint[] {
  const lastValue = current[current.length - 1]?.value ?? 40;
  const firstValue = current[0]?.value ?? lastValue;
  const trailingLift =
    current.length > 1
      ? Math.max(2, (lastValue - firstValue) / (current.length - 1))
      : 3;

  return current.map((point, i) => ({
    ...point,
    value: Math.min(
      100,
      Math.max(
        point.value,
        Math.round(point.value + optimizationLevel * 1.6 + i * trailingLift * 0.6),
      ),
    ),
  }));
}

export function chartYMax(values: number[]): number {
  const max = Math.max(...values, 0);
  if (max <= 100) return Math.max(20, Math.ceil(max / 10) * 10);
  if (max <= 250) return Math.ceil(max / 25) * 25;
  if (max <= 1000) return Math.ceil(max / 100) * 100;
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
  const denominator = Math.max(data.length - 1, 1);

  return data.map((d, i) => ({
    x:
      data.length === 1
        ? padding.left + innerW / 2
        : padding.left + (i / denominator) * innerW,
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
