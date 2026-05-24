import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { userHasFleetAccess } from "@/lib/billing/access";
import { createAuditShare } from "@/lib/audit/share";
import { getLatestAuditForWorkspace } from "@/lib/audit/run-audit";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json(
      { error: "Fleet plan required for white-label audit shares" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    auditId?: string;
  };
  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const auditId =
    body.auditId?.trim() ?? ws.latestAudit?.id ?? null;
  if (!auditId) {
    return NextResponse.json(
      { error: "Run an audit first before sharing" },
      { status: 400 },
    );
  }

  const result = await createAuditShare({
    auditId,
    workspaceId,
    userId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const audit = ws.latestAudit ?? (await getLatestAuditForWorkspace(workspaceId));
  return NextResponse.json({
    auditId: audit?.id ?? null,
    hasAudit: Boolean(audit),
    canShare: await userHasFleetAccess(userId),
  });
}
