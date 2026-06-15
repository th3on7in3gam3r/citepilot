import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { userHasFleetAccess, userHasPilotAccess } from "@/lib/billing/access";
import type { ShareExpiry } from "@/lib/audit/share-social";
import {
  createAuditShare,
} from "@/lib/audit/share";
import { getLatestAuditForWorkspace } from "@/lib/audit/run-audit";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  if (!(await userHasPilotAccess(userId))) {
    return NextResponse.json(
      { error: "Pilot or Fleet plan required to share audit reports" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    auditId?: string;
    password?: string;
    expiry?: ShareExpiry;
  };
  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const auditId = body.auditId?.trim() ?? ws.latestAudit?.id ?? null;
  if (!auditId) {
    return NextResponse.json(
      { error: "Run an audit first before sharing" },
      { status: 400 },
    );
  }

  const isFleet = await userHasFleetAccess(userId);
  const password = isFleet ? body.password?.trim() : undefined;
  const expiry = isFleet ? body.expiry : ("never" as ShareExpiry);

  if (body.password?.trim() && !isFleet) {
    return NextResponse.json(
      { error: "Password protection requires Fleet plan" },
      { status: 403 },
    );
  }

  const result = await createAuditShare({
    auditId,
    workspaceId,
    userId,
    password: password || null,
    expiry: expiry ?? "never",
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
});

export const GET = withApiLogging(async function GET(request: Request) {
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
  const isPilot = await userHasPilotAccess(userId);
  const isFleet = await userHasFleetAccess(userId);

  return NextResponse.json({
    auditId: audit?.id ?? null,
    hasAudit: Boolean(audit),
    canShare: isPilot,
    canProtect: isFleet,
    score: audit?.score ?? null,
    cited: audit?.cited ?? null,
    total: audit?.total ?? null,
    domain: ws.domain,
  });
});
