import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  buildImpersonationCookie,
  clearImpersonationCookie,
} from "@/lib/admin/impersonation";
import { resolveUserEmail } from "@/lib/email/recipient";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  const body = (await request.json()) as { userId?: string; email?: string };
  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const targetEmail =
    body.email?.trim() || (await resolveUserEmail(userId)) || "user";

  const cookie = buildImpersonationCookie({
    adminId: admin.id,
    adminEmail: admin.email,
    targetUserId: userId,
    targetEmail,
  });
  if (!cookie) {
    return NextResponse.json({ error: "Impersonation unavailable" }, { status: 503 });
  }

  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "impersonate_start",
    targetUserId: userId,
    metadata: { targetEmail },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: cookie.maxAge,
    path: "/",
  });
  return res;
});

export const DELETE = withApiLogging(async function DELETE(request: Request) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "impersonate_stop",
  });

  const cleared = clearImpersonationCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cleared.name, cleared.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: cleared.maxAge,
    path: "/",
  });
  return res;
});
