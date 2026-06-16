import { NextResponse } from "next/server";
import { getRealSessionUser } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/admin/emails";
import { readImpersonationCookie } from "@/lib/admin/impersonation";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const real = await getRealSessionUser(request);
  if (!real || !isAdminEmail(real.email)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const impersonation = await readImpersonationCookie(request);
  if (
    !impersonation ||
    impersonation.adminId !== real.id ||
    !isAdminEmail(real.email)
  ) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({
    active: true,
    targetUserId: impersonation.targetUserId,
    targetEmail: impersonation.targetEmail,
    expiresAt: new Date(impersonation.exp).toISOString(),
  });
});
