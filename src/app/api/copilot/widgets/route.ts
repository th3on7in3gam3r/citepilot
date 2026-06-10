import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { completeCopilot } from "@/lib/copilot/complete";
import {
  buildWidgetUserMessage,
  parseWidgetJson,
  WIDGET_GENERATION_SYSTEM,
} from "@/lib/copilot/widget-prompts";
import {
  parseWidgetPrompt,
  widgetFromPartial,
  type DashboardWidget,
  type WidgetAggregate,
  type WidgetChartType,
  type WidgetDataSource,
  type WidgetUnit,
} from "@/lib/copilot/widgets";
import { captureServerException } from "@/lib/observability/sentry";
import { COPILOT_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import {
  checkHourlyRateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit/hourly";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_SOURCES = new Set<WidgetDataSource>([
  "google-analytics",
  "search-console",
  "citations",
  "platforms",
  "keywords",
  "competitors",
  "traffic",
  "visibility",
  "backlinks",
]);

const VALID_CHARTS = new Set<WidgetChartType>([
  "pie",
  "donut",
  "bars",
  "line",
  "area",
  "gauge",
  "table",
  "scatter",
]);

function coerceWidget(partial: Record<string, unknown>, fallbackName: string): DashboardWidget {
  const base = parseWidgetPrompt(fallbackName);
  const name =
    typeof partial.name === "string" && partial.name.trim()
      ? partial.name.trim()
      : base.name;
  const source = VALID_SOURCES.has(partial.source as WidgetDataSource)
    ? (partial.source as WidgetDataSource)
    : base.source;
  const chartType = VALID_CHARTS.has(partial.chartType as WidgetChartType)
    ? (partial.chartType as WidgetChartType)
    : base.chartType;
  const unit = (["none", "percent", "currency", "count"] as WidgetUnit[]).includes(
    partial.unit as WidgetUnit,
  )
    ? (partial.unit as WidgetUnit)
    : base.unit;
  const aggregate = (["sum", "avg", "max"] as WidgetAggregate[]).includes(
    partial.aggregate as WidgetAggregate,
  )
    ? (partial.aggregate as WidgetAggregate)
    : base.aggregate;

  return widgetFromPartial({
    name,
    source,
    chartType,
    unit,
    aggregate,
    highlighted: true,
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const body = (await request.json()) as {
      workspaceId?: string;
      prompt?: string;
    };

    const prompt = body.prompt?.trim();
    const workspaceId = body.workspaceId?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const workspace = await getWorkspaceById(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const rate = await checkHourlyRateLimit(
      `copilot-widgets:${userId}`,
      COPILOT_RATE_LIMIT_PER_HOUR,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Copilot limit reached (${rate.limit}/hour). Try again after ${rate.resetAt}.`,
          code: "RATE_LIMIT",
        },
        { status: 429, headers: rateLimitHeaders(rate) },
      );
    }

    const steps = [
      `Analyzing prompt for ${workspace.domain}…`,
      `Matching data sources…`,
      `Building ${parseWidgetPrompt(prompt).chartType} visualization…`,
    ];

    let widget: DashboardWidget = widgetFromPartial({
      ...parseWidgetPrompt(prompt),
      highlighted: true,
    });

    const llm = await completeCopilot(
      WIDGET_GENERATION_SYSTEM,
      buildWidgetUserMessage(prompt, workspace.domain),
      300,
    );

    if (!("error" in llm)) {
      const parsed = parseWidgetJson(llm.text);
      if (parsed) {
        widget = coerceWidget(parsed, prompt);
      }
    }

    return NextResponse.json(
      { widget, steps },
      { headers: rateLimitHeaders(rate) },
    );
  } catch (error) {
    captureServerException(error, { route: "POST /api/copilot/widgets" });
    console.error("POST /api/copilot/widgets", error);
    return NextResponse.json(
      { error: "Widget generation failed" },
      { status: 500 },
    );
  }
}
