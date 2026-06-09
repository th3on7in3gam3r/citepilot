/** CitePilot dashboard palette — aligned with sky blue accent. */
export const CHART_COLORS = {
  primary: "#0ea5e9",
  primaryDeep: "#0284c7",
  secondary: "#38bdf8",
  violet: "#a78bfa",
  pink: "#f472b6",
  amber: "#fbbf24",
  teal: "#14b8a6",
  muted: "#94a3b8",
  grid: "#eef2f6",
  ink: "#0f172a",
  label: "#64748b",
} as const;

/** Default series colors — blues and neutrals, no orange/red. */
export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.violet,
  CHART_COLORS.teal,
  CHART_COLORS.amber,
  CHART_COLORS.muted,
] as const;

/** Line/area chart roles */
export const CHART_SERIES = {
  current: CHART_COLORS.primary,
  projected: CHART_COLORS.teal,
  comparison: CHART_COLORS.muted,
  highlight: CHART_COLORS.secondary,
} as const;

export const chartFontFamily =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Semi-transparent fill for area charts */
export function chartFill(color: string, alpha = 0.22): string {
  return `${color}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
}
