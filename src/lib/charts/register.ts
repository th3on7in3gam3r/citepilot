import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { CHART_COLORS, chartFontFamily } from "./theme";

let registered = false;

/** Register Chart.js modules once and apply CitePilot defaults. */
export function registerCharts(): void {
  if (registered) return;
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Legend,
    Tooltip,
  );

  ChartJS.defaults.color = CHART_COLORS.muted;
  ChartJS.defaults.borderColor = CHART_COLORS.grid;
  ChartJS.defaults.backgroundColor = `${CHART_COLORS.primary}33`;
  ChartJS.defaults.font.family = chartFontFamily;

  ChartJS.defaults.elements.line.borderWidth = 2;
  ChartJS.defaults.elements.line.tension = 0.35;
  ChartJS.defaults.elements.line.fill = false;
  ChartJS.defaults.elements.point.radius = 0;
  ChartJS.defaults.elements.point.hoverRadius = 4;
  ChartJS.defaults.elements.bar.borderRadius = 4;
  ChartJS.defaults.elements.bar.borderSkipped = false;

  ChartJS.defaults.plugins.legend.labels.color = CHART_COLORS.label;
  ChartJS.defaults.plugins.legend.labels.boxWidth = 10;
  ChartJS.defaults.plugins.legend.labels.boxHeight = 10;
  ChartJS.defaults.plugins.tooltip.backgroundColor = CHART_COLORS.ink;
  ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
  ChartJS.defaults.plugins.tooltip.padding = 10;

  ChartJS.defaults.scale.grid.color = CHART_COLORS.grid;
  ChartJS.defaults.scale.ticks.color = CHART_COLORS.muted;

  registered = true;
}
