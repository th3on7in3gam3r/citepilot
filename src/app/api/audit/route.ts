import { NextResponse } from "next/server";
import { requireApiUser, requireApiUserId } from "@/lib/auth/api";
import { getSessionUser, getSessionUserId } from "@/lib/auth/server";
import {
  applyPromptLimit,
  promptLimitUpgradeError,
  promptMaxForPlan,
} from "@/lib/billing/prompt-limits";
import {
  getPromptLimitsForUser,
  planForUser,
} from "@/lib/billing/limits-server";
import { getBillingByUserId } from "@/lib/billing/store";
import { getRecentAuditsForWorkspace, runCitationAudit } from "@/lib/audit/run-audit";
import { createAuditShare } from "@/lib/audit/share";
import { sendAuditCompleteEmail } from "@/lib/email/notifications";
import { triggerPostAuditSequence } from "@/lib/email/sequences/engine";
import { publicScorePageUrl } from "@/lib/score/public-score-url";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { captureServerException } from "@/lib/observability/sentry";
import {
  AUDIT_AUTH_RATE_LIMIT_PER_HOUR,
  auditPublicRateLimitPerHour,
} from "@/lib/rate-limit/constants";
import { isLaunchMode, PH_PROMO_CODE } from "@/lib/launch/config";
import {
  clientIpFromRequest,
  enforceHourlyRateLimit,
} from "@/lib/rate-limit/request";
import { rateLimitHeaders } from "@/lib/rate-limit/hourly";
import { getWorkspaceById } from "@/lib/server/workspace";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const sessionUserId = await getSessionUserId();
    const auditRate = await enforceHourlyRateLimit(
      sessionUserId
        ? `audit:user:${sessionUserId}`
        : `audit:ip:${clientIpFromRequest(request)}`,
      sessionUserId
        ? AUDIT_AUTH_RATE_LIMIT_PER_HOUR
        : auditPublicRateLimitPerHour(),
      sessionUserId
        ? `Audit limit reached (${AUDIT_AUTH_RATE_LIMIT_PER_HOUR}/hour). Try again later.`
        : `Free audit limit reached (${auditPublicRateLimitPerHour()}/hour per IP). Sign in or try again later.`,
    );
    if (auditRate instanceof NextResponse) return auditRate;

    const body = (await request.json()) as {
      domain?: string;
      prompts?: string[];
      workspaceId?: string;
    };

    const domain = body.domain?.trim();
    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const rawPrompts =
      body.prompts?.map((p) => p.trim()).filter(Boolean) ?? [];
    if (rawPrompts.length === 0) {
      return NextResponse.json(
        { error: "At least one prompt is required" },
        { status: 400 },
      );
    }

    let competitors: string[] = [];
    let userId: string | null = sessionUserId;

    if (body.workspaceId) {
      const user = await requireApiUser(request);
      const uid = requireApiUserId(user);
      if (uid instanceof NextResponse) return uid;
      userId = uid;
      const access = await requireWorkspaceAccess(userId, body.workspaceId, "editor");
      if (!access) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const ws = await getWorkspaceById(body.workspaceId, userId);
      if (!ws) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      competitors = ws.competitors;
    }

    const billing = userId ? await getBillingByUserId(userId) : null;
    const plan = planForUser(billing);
    const maxPrompts = promptMaxForPlan(plan);
    if (maxPrompts !== null && rawPrompts.length > maxPrompts) {
      const limits = await getPromptLimitsForUser(userId, rawPrompts.length);
      return NextResponse.json(
        {
          error: promptLimitUpgradeError(limits),
          code: "PROMPT_LIMIT",
          limits,
          allowed: maxPrompts,
        },
        { status: 403 },
      );
    }
    const { prompts, trimmed } = applyPromptLimit(rawPrompts, plan);

    const audit = await runCitationAudit({
      domain,
      prompts,
      workspaceId: body.workspaceId ?? null,
      competitors,
      plan,
      trigger: "manual",
    });

    if (body.workspaceId) {
      const sessionUser = await getSessionUser(request);
      void sendAuditCompleteEmail({
        workspaceId: body.workspaceId,
        audit,
        userEmail: sessionUser?.email,
      }).catch((err) => console.error("Audit email failed", err));

      if (userId) {
        void (async () => {
          const share = await createAuditShare({
            auditId: audit.id,
            workspaceId: body.workspaceId!,
            userId,
          });
          await triggerPostAuditSequence({
            userId,
            email: sessionUser?.email,
            domain: audit.domain,
            workspaceId: body.workspaceId!,
            auditId: audit.id,
            score: audit.score,
            cited: audit.cited,
            total: audit.total,
            gaps: audit.gaps,
            shareUrl: "url" in share ? share.url : undefined,
            scorePageUrl: publicScorePageUrl(audit.domain),
          });
        })().catch((err) => console.error("Post-audit sequence failed", err));
      }

      const recent = await getRecentAuditsForWorkspace(body.workspaceId, 2);
      const isSecond =
        recent.filter((row) => row.id !== audit.id).length > 0;
      void trackServerEvent(
        isSecond ? "second_audit_completed" : "audit_completed",
        {
          distinctId: body.workspaceId,
          workspaceId: body.workspaceId,
          source: "api",
        },
      );
    } else {
      void trackServerEvent("audit_completed", {
        distinctId: domain,
        domain,
        source: "public_audit",
      });
    }

    const response = NextResponse.json({
      ...audit,
      promptLimit: await getPromptLimitsForUser(userId, prompts.length),
      promptsTrimmed: trimmed,
      ...(isLaunchMode()
        ? { special_offer: `Use ${PH_PROMO_CODE} for 30% off Pilot` }
        : {}),
    });
    if (trimmed) {
      response.headers.set("X-CitePilot-Prompts-Trimmed", "1");
    }
    for (const [key, value] of Object.entries(rateLimitHeaders(auditRate))) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    captureServerException(error, { route: "POST /api/audit" });
    console.error("POST /api/audit", error);
    const message =
      error instanceof Error ? error.message : "Audit failed";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Audit failed. Try again in a minute or run a shorter prompt list.",
        code: "AUDIT_FAILED",
      },
      { status: 500 },
    );
  }
});
