import { NextResponse } from "next/server";
import { getAuditById } from "@/lib/audit/run-audit";
import { apiErrorResponse } from "@/lib/fleet/api-error";
import {
  requireFleetAccess,
  requireWorkspaceAccess,
  withFleetHeaders,
} from "@/lib/fleet/request-auth";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  try {
    const auth = await requireFleetAccess(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const audit = await getAuditById(id);
    if (!audit?.workspaceId) {
      return apiErrorResponse("Audit not found", "NOT_FOUND", 404);
    }

    const scopeError = requireWorkspaceAccess(auth, audit.workspaceId);
    if (scopeError) return scopeError;

    const workspace = await getWorkspaceById(audit.workspaceId, auth.userId);
    if (!workspace) {
      return apiErrorResponse("Audit not found", "NOT_FOUND", 404);
    }

    return withFleetHeaders(
      NextResponse.json({
        id: audit.id,
        workspaceId: audit.workspaceId,
        domain: audit.domain,
        createdAt: audit.createdAt,
        score: audit.score,
        cited: audit.cited,
        total: audit.total,
        platforms: audit.platforms,
        gaps: audit.gaps,
        promptResults: audit.promptResults,
        siteSignals: audit.siteSignals,
      }),
      auth,
    );
  } catch (error) {
    console.error("GET /api/v1/audits/[id]/results", error);
    return apiErrorResponse("Failed to load audit results", "INTERNAL_ERROR", 500);
  }
});
