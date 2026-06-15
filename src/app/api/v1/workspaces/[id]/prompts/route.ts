import { NextResponse } from "next/server";
import { promptsFromPreferences } from "@/lib/audit/resolve-prompts";
import { applyPromptLimit } from "@/lib/billing/prompt-limits";
import { getBillingByUserId } from "@/lib/billing/store";
import { planForUser } from "@/lib/billing/limits-server";
import { apiErrorResponse } from "@/lib/fleet/api-error";
import {
  requireFleetAccess,
  requireWorkspaceAccess,
  withFleetHeaders,
} from "@/lib/fleet/request-auth";
import { mergePreferences } from "@/lib/settings";
import { getWorkspaceById, updateWorkspace } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

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

    const prompts = promptsFromPreferences(
      workspace.preferences,
      workspace.buyerQuestion,
    );

    return withFleetHeaders(
      NextResponse.json({
        workspaceId: id,
        prompts: prompts.map((text, index) => ({ id: String(index + 1), text })),
      }),
      auth,
    );
  } catch (error) {
    console.error("GET /api/v1/workspaces/[id]/prompts", error);
    return apiErrorResponse("Failed to list prompts", "INTERNAL_ERROR", 500);
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

    const body = (await request.json()) as {
      prompt?: string;
      prompts?: string[];
    };
    const incoming = [
      ...(body.prompts ?? []).map((p) => p.trim()).filter(Boolean),
      ...(body.prompt ? [body.prompt.trim()] : []),
    ].filter(Boolean);

    if (incoming.length === 0) {
      return apiErrorResponse("Provide prompt or prompts", "VALIDATION_ERROR", 400);
    }

    const existing = promptsFromPreferences(
      workspace.preferences,
      workspace.buyerQuestion,
    );
    const mergedList = [...new Set([...existing, ...incoming])];

    const billing = await getBillingByUserId(auth.userId);
    const plan = planForUser(billing);
    const { prompts, trimmed, max } = applyPromptLimit(mergedList, plan);

    if (trimmed && prompts.length === existing.length) {
      return apiErrorResponse(
        "Prompt limit exceeded for your plan",
        "PROMPT_LIMIT_EXCEEDED",
        429,
        { limit: max },
      );
    }

    const merged = mergePreferences(workspace.preferences, {
      monitoredPrompts: prompts,
    });
    await updateWorkspace(id, { preferences: merged }, auth.userId);

    return withFleetHeaders(
      NextResponse.json({
        ok: true,
        added: prompts.length - existing.length,
        prompts: prompts.map((text, index) => ({ id: String(index + 1), text })),
        trimmed,
        limit: max,
      }),
      auth,
    );
  } catch (error) {
    console.error("POST /api/v1/workspaces/[id]/prompts", error);
    return apiErrorResponse("Failed to add prompts", "INTERNAL_ERROR", 500);
  }
});
