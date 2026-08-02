import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/auth";
import { getPlatformChecksForAudit } from "@/lib/audit/platform-checks-store";
import { getAuditById, runCitationAudit } from "@/lib/audit/run-audit";
import { dbGet } from "@/lib/db";
import { deleteAuditRun } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(request: Request, ctx: Ctx) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const audit = await getAuditById(id);
  if (!audit) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const platformChecks = await getPlatformChecksForAudit(id);

  return NextResponse.json({
    audit,
    platformChecks,
    errors: audit.promptResults
      .filter((p) => !p.cited && p.reason)
      .map((p) => ({ prompt: p.prompt, reason: p.reason })),
  });
});

export const POST = withApiLogging(async function POST(request: Request, ctx: Ctx) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const audit = await getAuditById(id);
  if (!audit) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const row = await dbGet<{ workspace_id: string | null }>(
    `SELECT workspace_id FROM audit_runs WHERE id = ?`,
    [id],
  );

  const prompts = audit.promptResults.map((p) => p.prompt);

  const rerun = await runCitationAudit({
    domain: audit.domain,
    prompts,
    workspaceId: row?.workspace_id ?? undefined,
    trigger: "manual",
  });

  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "audit_rerun",
    metadata: { sourceAuditId: id, newAuditId: rerun.id },
  });

  return NextResponse.json({ audit: rerun });
});

export const DELETE = withApiLogging(async function DELETE(request: Request, ctx: Ctx) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const ok = await deleteAuditRun(id);
  if (!ok) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "delete_audit",
    metadata: { auditId: id },
  });

  return NextResponse.json({ ok: true });
});
