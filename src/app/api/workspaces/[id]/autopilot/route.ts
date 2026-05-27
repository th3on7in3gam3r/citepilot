import { NextResponse } from "next/server";
import { runAutopilotForWorkspace } from "@/lib/autopilot/run";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import {
  getLatestAuditForWorkspace,
  runCitationAudit,
} from "@/lib/audit/run-audit";
import { resolveMonitoredPrompts } from "@/lib/audit/resolve-prompts";
import { planForUser } from "@/lib/billing/limits-server";
import { getBillingByUserId } from "@/lib/billing/store";
import { captureServerException } from "@/lib/observability/sentry";
import { AUTOPILOT_MANUAL_LIMIT_PER_HOUR } from "@/lib/rate-limit/constants";
import {
  checkHourlyRateLimit,
  rateLimitHeaders,
} from "@/lib/rate-limit/hourly";
import { getWorkspaceById } from "@/lib/server/workspace";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";

export const runtime = "nodejs";
export const maxDuration = 120;

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    if (!(await userHasPilotAccess(userId))) {
      return NextResponse.json(
        {
          error: PILOT_UPGRADE_MESSAGE,
          code: "PILOT_REQUIRED",
          upgradeUrl: "/pricing",
        },
        { status: 402 },
      );
    }

    const { id: workspaceId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      runAudit?: boolean;
    };

    const workspace = await getWorkspaceById(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    let rate:
      | Awaited<ReturnType<typeof checkHourlyRateLimit>>
      | null = null;
    try {
      rate = await checkHourlyRateLimit(
        `autopilot-manual:${userId}`,
        AUTOPILOT_MANUAL_LIMIT_PER_HOUR,
      );
    } catch (err) {
      console.error("[autopilot] rate limit check failed", err);
      // Fail open: bookkeeping should not crash a paid feature.
      rate = null;
    }

    if (rate && !rate.allowed) {
      return NextResponse.json(
        {
          error: `Autopilot manual limit reached (${rate.limit}/hour). Try again after ${rate.resetAt}.`,
          code: "RATE_LIMIT",
        },
        { status: 429, headers: rateLimitHeaders(rate) },
      );
    }

    let audit = await getLatestAuditForWorkspace(workspaceId);
    const runFreshAudit = body.runAudit === true || !audit;

    if (runFreshAudit) {
      const billing = await getBillingByUserId(userId);
      const plan = planForUser(billing);
      const prompts = resolveMonitoredPrompts({
        monitoredPrompts: promptsFromPreferences(
          workspace.preferences,
          workspace.buyerQuestion,
        ),
        buyerQuestion: workspace.buyerQuestion,
        auditPrompts: undefined,
      });
      if (prompts.length === 0) {
        return NextResponse.json(
          {
            error:
              "Add a buyer question or monitored prompts before running Autopilot.",
          },
          { status: 400 },
        );
      }
      audit = await runCitationAudit({
        domain: workspace.domain,
        prompts,
        workspaceId,
        competitors: workspace.competitors,
        plan,
        trigger: "manual",
      });
    }

    if (!audit) {
      return NextResponse.json(
        { error: "Run a citation audit first." },
        { status: 400 },
      );
    }

    const result = await runAutopilotForWorkspace({
      workspaceId,
      userId,
      audit,
      trigger: "manual",
      competitors: workspace.competitors,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Autopilot failed" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        workspaceId,
        auditId: audit.id,
        insightGenerated: result.insightGenerated,
        emailSent: result.emailSent,
        skipped: result.skipped,
      },
      { headers: rate ? rateLimitHeaders(rate) : {} },
    );
  } catch (error) {
    captureServerException(error, {
      route: "POST /api/workspaces/[id]/autopilot",
    });
    console.error("POST /api/workspaces/[id]/autopilot", error);
    return NextResponse.json(
      { error: "Autopilot run failed" },
      { status: 500 },
    );
  }
}
