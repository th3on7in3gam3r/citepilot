import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/auth";
import { resolveUserEmail } from "@/lib/email/recipient";
import { sendEmail } from "@/lib/email/send";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ userId: string }> };

export const POST = withApiLogging(async function POST(request: Request, ctx: Ctx) {
  const admin = await requireAdminApi(request);
  if (admin instanceof Response) return admin;

  const { userId } = await ctx.params;
  const body = (await request.json()) as { subject?: string; body?: string };
  const subject = body.subject?.trim();
  const text = body.body?.trim();
  if (!subject || !text) {
    return NextResponse.json({ error: "subject and body required" }, { status: 400 });
  }

  const to = await resolveUserEmail(userId);
  if (!to) {
    return NextResponse.json({ error: "No email on file for user" }, { status: 400 });
  }

  const result = await sendEmail({
    to,
    subject,
    html: `<p>${text.replace(/\n/g, "<br/>")}</p>`,
    text,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 502 });
  }

  await logAdminAction({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "send_email",
    targetUserId: userId,
    metadata: { subject, to },
  });

  return NextResponse.json({ ok: true });
});
