import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/api";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import {
  PILOT_UPGRADE_MESSAGE,
  userHasPilotAccess,
} from "@/lib/billing/access";
import { withApiLogging } from "@/lib/observability/api-log";
import { listCitationGaps } from "@/lib/money-prompts/store";

export const runtime = "nodejs";

const querySchema = z.object({
  workspaceId: z.string().min(1),
  status: z.enum(["open", "in-progress", "fixed", "ignored"]).optional(),
});

export const GET = withApiLogging(async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json({ error: PILOT_UPGRADE_MESSAGE }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    workspaceId: url.searchParams.get("workspaceId"),
    status: url.searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const access = await requireWorkspaceAccess(
    userId,
    parsed.data.workspaceId,
    "viewer",
  );
  if (!access) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const gaps = await listCitationGaps(
    parsed.data.workspaceId,
    parsed.data.status ?? "open",
  );
  return NextResponse.json({ data: { gaps } });
});
