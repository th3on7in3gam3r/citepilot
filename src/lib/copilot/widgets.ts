export type WidgetChartType =
  | "pie"
  | "donut"
  | "bars"
  | "line"
  | "area"
  | "gauge"
  | "table"
  | "scatter";

export type WidgetDataSource =
  | "google-analytics"
  | "search-console"
  | "citations"
  | "platforms"
  | "keywords"
  | "competitors"
  | "traffic"
  | "visibility"
  | "backlinks";

export type WidgetUnit = "none" | "percent" | "currency" | "count";
export type WidgetAggregate = "sum" | "avg" | "max";

export type DashboardWidget = {
  id: string;
  name: string;
  source: WidgetDataSource;
  chartType: WidgetChartType;
  unit: WidgetUnit;
  aggregate: WidgetAggregate;
  highlighted?: boolean;
  createdAt: string;
};

export const WIDGET_SOURCES: { id: WidgetDataSource; label: string }[] = [
  { id: "google-analytics", label: "Google Analytics" },
  { id: "search-console", label: "Google Search Console" },
  { id: "citations", label: "Citation audit" },
  { id: "platforms", label: "AI platforms" },
  { id: "keywords", label: "Money prompts" },
  { id: "competitors", label: "Competitors" },
  { id: "traffic", label: "Traffic mix" },
  { id: "visibility", label: "AI visibility" },
  { id: "backlinks", label: "Backlinks" },
];

export const CHART_TYPE_OPTIONS: { id: WidgetChartType; label: string }[] = [
  { id: "pie", label: "Pie" },
  { id: "donut", label: "Donut" },
  { id: "bars", label: "Bars" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
  { id: "gauge", label: "Gauge" },
  { id: "scatter", label: "Scatter" },
  { id: "table", label: "Table" },
];

export const COPILOT_SUGGESTIONS = [
  "Traffic Widget",
  "Performance Widget",
  "Keyword Dashboard",
  "Competitor rankings",
  "Visibility trend",
];

const STORAGE_PREFIX = "citepilot-dashboard-widgets:";

export function widgetsStorageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}${workspaceId}`;
}

export function loadStoredWidgets(workspaceId: string): DashboardWidget[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(widgetsStorageKey(workspaceId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DashboardWidget[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredWidgets(workspaceId: string, widgets: DashboardWidget[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(widgetsStorageKey(workspaceId), JSON.stringify(widgets));
}

export function createWidgetId(): string {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Rule-based prompt → widget spec (works offline / without OpenAI). */
export function parseWidgetPrompt(prompt: string): Omit<DashboardWidget, "id" | "createdAt"> {
  const p = prompt.toLowerCase();

  let name = "Custom widget";
  let source: WidgetDataSource = "traffic";
  let chartType: WidgetChartType = "bars";

  if (/organic.*paid|paid.*organic|traffic mix/.test(p)) {
    name = "Organic vs Paid Traffic";
    source = "traffic";
    chartType = /bar|column|vertical/.test(p) ? "bars" : "line";
  } else if (/keyword|prompt|money prompt/.test(p)) {
    name = /related/.test(p) ? "Related Keywords" : "Keyword Performance";
    source = "keywords";
    chartType = /table|list/.test(p) ? "table" : "bars";
  } else if (/competitor|backlink attribute|rival/.test(p)) {
    name = /table|list|rank/.test(p) ? "Competitor Rankings" : "Competitor Insights";
    source = "competitors";
    chartType = /bar/.test(p) ? "bars" : "table";
  } else if (/platform|device|breakdown|donut|pie/.test(p)) {
    name = /device/.test(p) ? "Search Traffic — Device Breakdown" : "Platform Overview";
    source = /device/.test(p) ? "traffic" : "platforms";
    chartType = /pie|donut/.test(p) ? "donut" : /bar/.test(p) ? "bars" : "donut";
  } else if (/visibility|citation score|ai visibility/.test(p)) {
    name = "Visibility";
    source = "visibility";
    chartType = /gauge|meter/.test(p) ? "gauge" : /area/.test(p) ? "area" : "line";
  } else if (/impression|click|ctr|gsc|search console/.test(p)) {
    name = "Impressions & CPC";
    source = "search-console";
    chartType = /table/.test(p) ? "table" : "bars";
  } else if (/backlink|referring domain/.test(p)) {
    name = "Backlink Attributes";
    source = "backlinks";
    chartType = /bar|horizontal/.test(p) ? "bars" : "table";
  } else if (/citation|geo audit/.test(p)) {
    name = "Citation Trend";
    source = "citations";
    chartType = /line|trend/.test(p) ? "line" : "area";
  }

  if (/pie chart|as a pie/.test(p)) chartType = "pie";
  if (/donut/.test(p)) chartType = "donut";
  if (/line chart|as a line|trend line/.test(p)) chartType = "line";
  if (/area chart|as an area/.test(p)) chartType = "area";
  if (/gauge|speedometer/.test(p)) chartType = "gauge";
  if (/table|as a table|data table/.test(p)) chartType = "table";
  if (/bar chart|vertical bar|horizontal bar|as bar/.test(p)) chartType = "bars";
  if (/scatter/.test(p)) chartType = "scatter";

  const quoted = prompt.match(/["“](.+?)["”]/);
  if (quoted?.[1]) name = quoted[1].trim();

  return {
    name,
    source,
    chartType,
    unit: /percent|%|ctr/.test(p) ? "percent" : /cpc|\$|revenue/.test(p) ? "currency" : "count",
    aggregate: /average|avg|mean/.test(p) ? "avg" : /max|peak/.test(p) ? "max" : "sum",
    highlighted: true,
  };
}

export function widgetFromPartial(
  partial: Partial<DashboardWidget> & Pick<DashboardWidget, "name">,
): DashboardWidget {
  return {
    id: partial.id ?? createWidgetId(),
    name: partial.name,
    source: partial.source ?? "traffic",
    chartType: partial.chartType ?? "bars",
    unit: partial.unit ?? "none",
    aggregate: partial.aggregate ?? "sum",
    highlighted: partial.highlighted ?? false,
    createdAt: partial.createdAt ?? new Date().toISOString(),
  };
}
