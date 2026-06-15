import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/fleet/api-error";
import {
  requireFleetAccess,
  requireWorkspaceAccess,
  withFleetHeaders,
} from "@/lib/fleet/request-auth";
import { buildWorkspaceExportPayload } from "@/lib/fleet/workspace-export";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Proof report JSON — `id` is the workspace ID. */
export const GET = withApiLogging(async function GET(request: Request, { params }: Params) {
  try {
    const auth = await requireFleetAccess(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const scopeError = requireWorkspaceAccess(auth, id);
    if (scopeError) return scopeError;

    const payload = await buildWorkspaceExportPayload(id, auth.userId);
    if (!payload) {
      return apiErrorResponse("Report not found", "NOT_FOUND", 404);
    }

    return withFleetHeaders(NextResponse.json(payload), auth);
  } catch (error) {
    console.error("GET /api/v1/reports/[id]", error);
    return apiErrorResponse("Failed to load report", "INTERNAL_ERROR", 500);
  }
});
