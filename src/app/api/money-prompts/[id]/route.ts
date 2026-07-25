import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import {
  PILOT_UPGRADE_MESSAGE,
  userHasPilotAccess,
} from "@/lib/billing/access";
import { getBillingByUserId } from "@/lib/billing/store";
import { applyPromptLimit } from "@/lib/billing/prompt-limits";
import { withApiLogging } from "@/lib/observability/api-log";
import {
  getMoneyPromptById,
  updateMoneyPromptStatus,
} from "@/lib/money-prompts/store";
import { getWorkspaceById, updateWorkspace } from "@/lib/server/workspace";
import type { BillingPlan } from "@/lib/billing/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  status: z.enum(["draft", "active", "cited", "archived"]),
  addToMonitored: z.boolean().optional(),
});

export const PATCH = withApiLogging(async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: PILOT_UPGRADE_MESSAGE }, { status: 403 });
  }

  const { id } = await ctx.params;
  const prompt = await getMoneyPromptById(id);
  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const access = await requireWorkspaceAccess(
    userId,
    prompt.workspaceId,
    "editor",
  );
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const updated = await updateMoneyPromptStatus(id, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  let monitoredTrimmed = false;
  if (
    parsed.data.status === "active" &&
    parsed.data.addToMonitored !== false
  ) {
    const workspace = await getWorkspaceById(prompt.workspaceId, userId);
    if (workspace) {
      const billing = await getBillingByUserId(userId);
      const plan = (billing?.plan ?? "free") as BillingPlan;
      const next = [
        ...(workspace.preferences.monitoredPrompts ?? []),
        updated.promptText,
      ];
      const unique = [...new Set(next.map((p) => p.trim()).filter(Boolean))];
      const limited = applyPromptLimit(unique, plan);
      monitoredTrimmed = limited.trimmed;
      await updateWorkspace(
        prompt.workspaceId,
        { preferences: { monitoredPrompts: limited.prompts } },
        userId,
      );
    }
  }

  return NextResponse.json({
    data: { prompt: updated, monitoredTrimmed },
  });
});
