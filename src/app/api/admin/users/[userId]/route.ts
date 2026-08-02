import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/auth";
import { getAdminUserDetail, hardDeleteUser } from "@/lib/admin/users";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ userId: string }> };

export const GET = withApiLogging(async function GET(request: Request, ctx: Ctx) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;
  const { userId } = await ctx.params;
  const detail = await getAdminUserDetail(userId);
  if (!detail.workspaces.length && !detail.billing) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  return NextResponse.json(detail);
});

export const DELETE = withApiLogging(async function DELETE(request: Request, ctx: Ctx) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;
  const { userId } = await ctx.params;
  await hardDeleteUser(userId);
  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "delete_user",
    targetUserId: userId,
  });
  return NextResponse.json({ ok: true });
});
