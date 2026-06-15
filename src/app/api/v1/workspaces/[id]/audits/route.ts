import { NextResponse } from "next/server";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";
import { resolveMonitoredPrompts } from "@/lib/audit/resolve-prompts";
import {
  getRecentAuditsForWorkspace,
  runCitationAudit,
} from "@/lib/audit/run-audit";
import { applyPromptLimit } from "@/lib/billing/prompt-limits";
import { getBillingByUserId } from "@/lib/billing/store";
import { planForUser } from "@/lib/billing/limits-server";
import { apiErrorResponse } from "@/lib/fleet/api-error";
import { FLEET_AUDIT_TRIGGER_LIMIT_PER_HOUR } from "@/lib/fleet/constants";
import {
  requireFleetAccess,
  requireWorkspaceAccess,
  withFleetHeaders,
} from "@/lib/fleet/request-auth";
import { checkFleetRateLimit } from "@/lib/fleet/rate-limit";
import { rateLimitHeaders } from "@/lib/rate-limit/hourly";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 120;

type Params = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  try {
    const auth = await requireFleetAccess(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const scopeError = requireWorkspaceAccess(auth, id);
    if (scopeError) return scopeError;

    const workspace = await getWorkspaceById(id, auth.userId);
    if (!workspace) {
      return apiErrorResponse("Workspace not found", "NOT_FOUND", 404);
    }

    const limit = Math.min(
      Number(new URL(request.url).searchParams.get("limit") ?? "20"),
      50,
    );
    const audits = await getRecentAuditsForWorkspace(id, limit);

    return withFleetHeaders(
      NextResponse.json({
        workspaceId: id,
        audits: audits.map((a) => ({
          id: a.id,
          createdAt: a.createdAt,
          score: a.score,
          cited: a.cited,
          total: a.total,
          trigger: "manual",
        })),
      }),
      auth,
    );
  } catch (error) {
    console.error("GET /api/v1/workspaces/[id]/audits", error);
    return apiErrorResponse("Failed to list audits", "INTERNAL_ERROR", 500);
  }
});

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requireFleetAccess(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const scopeError = requireWorkspaceAccess(auth, id);
    if (scopeError) return scopeError;

    const workspace = await getWorkspaceById(id, auth.userId);
    if (!workspace) {
      return apiErrorResponse("Workspace not found", "NOT_FOUND", 404);
    }

    const auditSubject = auth.apiKeyId
      ? `audit-trigger:key:${auth.apiKeyId}`
      : `audit-trigger:user:${auth.userId}`;
    const auditRate = await checkFleetRateLimit(
      auditSubject,
      FLEET_AUDIT_TRIGGER_LIMIT_PER_HOUR,
    );
    if (!auditRate.allowed) {
      return NextResponse.json(
        {
          error: "Audit trigger limit exceeded (10/hour)",
          code: "AUDIT_LIMIT",
          status: 429,
          resetAt: auditRate.resetAt,
        },
        { status: 429, headers: rateLimitHeaders(auditRate) },
      );
    }

    const billing = await getBillingByUserId(auth.userId);
    const plan = planForUser(billing);
    const prompts = resolveMonitoredPrompts({
      monitoredPrompts: promptsFromPreferences(
        workspace.preferences,
        workspace.buyerQuestion,
      ),
      buyerQuestion: workspace.buyerQuestion,
    });

    if (prompts.length === 0) {
      return apiErrorResponse(
        "Add monitored prompts before triggering an audit",
        "VALIDATION_ERROR",
        400,
      );
    }

    const { prompts: limited } = applyPromptLimit(prompts, plan);
    const audit = await runCitationAudit({
      domain: workspace.domain,
      prompts: limited,
      workspaceId: id,
      competitors: workspace.competitors,
      plan,
      trigger: "manual",
    });

    return withFleetHeaders(
      NextResponse.json({
        ok: true,
        audit: {
          id: audit.id,
          workspaceId: id,
          score: audit.score,
          cited: audit.cited,
          total: audit.total,
          createdAt: audit.createdAt,
        },
      }),
      auth,
    );
  } catch (error) {
    console.error("POST /api/v1/workspaces/[id]/audits", error);
    return apiErrorResponse("Failed to trigger audit", "INTERNAL_ERROR", 500);
  }
});
