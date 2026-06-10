import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { completeCopilot } from "@/lib/copilot/complete";
import {
  createFilterId,
  parseFilterPrompt,
  type GridFilterCondition,
} from "@/lib/copilot/grid-filters";
import { captureServerException } from "@/lib/observability/sentry";
import { COPILOT_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import {
  checkHourlyRateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit/hourly";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";

const FILTER_SYSTEM = `You are CitePilot Copilot. Convert a natural language filter request into JSON only (no markdown):
{
  "filters": [
    { "logic": "where"|"and"|"or", "columnId": "domain"|"ndScore"|"cpc"|"pageViews"|"h1"|"keywordTargeted"|"trend", "operator": "equals"|"not_equals"|"contains"|"not_contains"|"larger_than"|"smaller_than"|"is_empty", "value": "string" }
  ]
}
Use multiple AND conditions for compound requests.`;

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    const body = (await request.json()) as {
      workspaceId?: string;
      prompt?: string;
      context?: { yourNdScore?: number; yourPageViews?: number };
    };

    const prompt = body.prompt?.trim();
    const workspaceId = body.workspaceId?.trim();
    if (!prompt || !workspaceId) {
      return NextResponse.json({ error: "prompt and workspaceId required" }, { status: 400 });
    }

    const workspace = await getWorkspaceById(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const rate = await checkHourlyRateLimit(
      `copilot-filters:${userId}`,
      COPILOT_RATE_LIMIT_PER_HOUR,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit reached", code: "RATE_LIMIT" },
        { status: 429, headers: rateLimitHeaders(rate) },
      );
    }

    const fallback = parseFilterPrompt(prompt, body.context);

    const llm = await completeCopilot(
      FILTER_SYSTEM,
      `Domain: ${workspace.domain}\nYour ND score: ${body.context?.yourNdScore ?? "unknown"}\nPrompt: ${prompt}`,
      400,
    );

    if ("error" in llm) {
      return NextResponse.json(
        { filters: fallback },
        { headers: rateLimitHeaders(rate) },
      );
    }

    const jsonMatch = llm.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ filters: fallback }, { headers: rateLimitHeaders(rate) });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        filters?: {
          logic?: string;
          columnId?: string;
          operator?: string;
          value?: string;
        }[];
      };
      const filters: GridFilterCondition[] = (parsed.filters ?? [])
        .filter((f) => f.columnId && f.operator)
        .map((f, i) => ({
          id: createFilterId(),
          logic: (i === 0 ? "where" : f.logic === "or" ? "or" : "and") as GridFilterCondition["logic"],
          columnId: f.columnId!,
          operator: f.operator as GridFilterCondition["operator"],
          value: String(f.value ?? ""),
        }));

      return NextResponse.json(
        { filters: filters.length ? filters : fallback },
        { headers: rateLimitHeaders(rate) },
      );
    } catch {
      return NextResponse.json({ filters: fallback }, { headers: rateLimitHeaders(rate) });
    }
  } catch (error) {
    captureServerException(error, { route: "POST /api/copilot/filters" });
    return NextResponse.json({ error: "Filter generation failed" }, { status: 500 });
  }
}
