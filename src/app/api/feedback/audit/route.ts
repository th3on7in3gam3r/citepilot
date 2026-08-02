import { NextResponse } from "next/server";
import { optionalApiUser, requireApiUser, apiUserId } from "@/lib/auth/api";
import { saveAuditFeedback } from "@/lib/feedback/store";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const { userId } = await optionalApiUser(request);
  const body = (await request.json()) as {
    auditId?: string;
    workspaceId?: string;
    domain?: string;
    score?: number;
    useful?: boolean;
    comment?: string;
    source?: string;
  };

  const domain = body.domain?.trim();
  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }
  if (typeof body.useful !== "boolean") {
    return NextResponse.json({ error: "useful is required" }, { status: 400 });
  }

  await saveAuditFeedback({
    auditId: body.auditId ?? null,
    workspaceId: body.workspaceId ?? null,
    userId,
    domain,
    score: body.score ?? null,
    useful: body.useful,
    comment: body.comment ?? null,
    source: body.source ?? "dashboard",
  });

  await trackServerEvent("audit_feedback_submitted", {
    distinctId: userId ?? domain,
    domain,
    useful: body.useful,
    score: body.score,
    source: body.source ?? "dashboard",
  });

  return NextResponse.json({ ok: true });
});
