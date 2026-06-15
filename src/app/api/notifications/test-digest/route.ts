import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { isEmailConfigured } from "@/lib/email/config";
import { sendWeeklyDigestEmail } from "@/lib/email/notifications";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";
import { dbAll } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/notifications/test-digest
 * Body: { workspaceId: string; email?: string }
 *
 * Sends a one-off weekly digest email. Uses `email` from the body when
 * provided (e.g. unsaved Settings form value), otherwise the saved monitoring email.
 */
export const POST = withApiLogging(async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;
  const userId = apiUserId(auth);

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Email is not configured on the server (RESEND_API_KEY). Add it in production env vars.",
      },
      { status: 503 },
    );
  }

  let body: { workspaceId?: string; email?: string };
  try {
    body = (await request.json()) as { workspaceId?: string; email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 },
    );
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const to =
    body.email?.trim() || ws.preferences.monitoringEmail?.trim() || "";

  if (!to) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No monitoring email configured. Add one in Settings → Alerts and save, or enter an address first.",
      },
      { status: 422 },
    );
  }

  const audits = await dbAll<{ score: number; created_at: string }>(
    `SELECT score, created_at FROM audit_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 2`,
    [workspaceId],
  );

  const latest = ws.latestAudit;
  const score = audits[0]?.score ?? latest?.score ?? 0;
  const previousScore = audits[1]?.score ?? null;
  const gaps = latest?.gaps?.length
    ? latest.gaps
    : ["Run a GEO audit to populate real gap data in digests."];

  const result = await sendWeeklyDigestEmail({
    domain: ws.domain,
    buyerQuestion: ws.buyerQuestion ?? "",
    competitors: ws.competitors,
    score,
    previousScore,
    gaps,
    to,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error ?? "Send failed",
      },
      { status: result.error === "Email not configured" ? 503 : 502 },
    );
  }

  return NextResponse.json({ ok: true, sentTo: to });
});
