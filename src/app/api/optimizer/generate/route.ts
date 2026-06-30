import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { buildOptimizerContext } from "@/lib/optimizer/build-context";
import { completeOptimizer } from "@/lib/optimizer/complete";
import {
  buildBaselinePlan,
  mergeOptimizerPlans,
  parseClaudeOptimizerPlan,
} from "@/lib/optimizer/parse-plan";
import {
  OPTIMIZER_SYSTEM_PROMPT,
  buildOptimizerUserMessage,
} from "@/lib/optimizer/prompts";
import { captureServerException } from "@/lib/observability/sentry";
import { withApiLogging } from "@/lib/observability/api-log";
import { OPTIMIZER_RATE_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import {
  checkHourlyRateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit/hourly";
import {
  enrichSnapshotWithBacklinks,
  getWorkspaceById,
  toSnapshot,
} from "@/lib/server/workspace";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    if (!(await userHasPilotAccess(userId))) {
      return NextResponse.json(
        { error: PILOT_UPGRADE_MESSAGE, upgradeUrl: "/pricing", code: "PILOT_REQUIRED" },
        { status: 402 },
      );
    }

    const body = (await request.json()) as { workspaceId?: string };
    const workspaceId = body.workspaceId?.trim();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const workspace = await getWorkspaceById(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const rate = await checkHourlyRateLimit(
      `optimizer:${userId}`,
      OPTIMIZER_RATE_LIMIT_PER_HOUR,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Site Optimizer limit reached (${rate.limit}/hour). Try again after ${rate.resetAt}.`,
          code: "RATE_LIMIT",
        },
        { status: 429, headers: rateLimitHeaders(rate) },
      );
    }

    const snapshot = await enrichSnapshotWithBacklinks(
      toSnapshot(workspace),
      workspace.id,
    );

    const baseline = buildBaselinePlan({
      domain: snapshot.domain,
      gaps: snapshot.gaps ?? [],
    });

    if (!snapshot.hasRealAudit) {
      return NextResponse.json(
        {
          ...baseline,
          warning:
            "Run a GEO audit first for AI-optimized fixes. Showing template actions from common gaps.",
        },
        { headers: rateLimitHeaders(rate) },
      );
    }

    const contextJson = buildOptimizerContext(snapshot);
    const claudeResult = await completeOptimizer(
      OPTIMIZER_SYSTEM_PROMPT,
      buildOptimizerUserMessage(contextJson),
    );

    let plan = baseline;
    let warning: string | undefined;

    if ("error" in claudeResult) {
      warning = claudeResult.error;
    } else {
      const claudePlan = parseClaudeOptimizerPlan(claudeResult.text, baseline);
      plan = mergeOptimizerPlans(claudePlan, baseline);
    }

    void trackServerEvent("optimizer_generated", {
      distinctId: userId ?? workspaceId,
      workspaceId,
      fixCount: plan.fixes.length,
      aiGenerated: plan.aiGenerated,
    });

    return NextResponse.json(
      { ...plan, warning },
      { headers: rateLimitHeaders(rate) },
    );
  } catch (error) {
    captureServerException(error, { route: "POST /api/optimizer/generate" });
    console.error("POST /api/optimizer/generate", error);
    return NextResponse.json({ error: "Optimization plan failed" }, { status: 500 });
  }
});
