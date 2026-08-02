import { NextResponse } from "next/server";
import { mergePreferences } from "@/lib/settings";
import { verifyDigestUnsubscribeToken } from "@/lib/email/unsubscribe";
import { patchNotificationPreferences } from "@/lib/notifications/preferences-store";
import { getWorkspaceById, updateWorkspace } from "@/lib/server/workspace";
import { dbGet } from "@/lib/db";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("ws")?.trim();
  const token = searchParams.get("token")?.trim();

  if (!workspaceId || !token || !verifyDigestUnsubscribeToken(workspaceId, token)) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px;text-align:center"><h1>Invalid link</h1><p>This unsubscribe link is invalid or expired.</p></body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const ws = await getWorkspaceById(workspaceId, null);
  if (!ws) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px;text-align:center"><h1>Workspace not found</h1><p>This digest subscription is no longer active.</p></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  await updateWorkspace(
    workspaceId,
    {
      preferences: mergePreferences(ws.preferences, { weeklyDigest: false }),
    },
    null,
  );

  const owner = await dbGet<{ user_id: string | null }>(
    `SELECT user_id FROM workspaces WHERE id = ?`,
    [workspaceId],
  );
  if (owner?.user_id) {
    await patchNotificationPreferences({
      workspaceId,
      userId: owner.user_id,
      section: "email",
      patch: { emailWeeklyDigest: false },
    }).catch(() => undefined);
  }

  const domain = ws.domain;
  const safeDomain = domain.replace(/[<>&"]/g, "");
  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px;text-align:center;max-width:480px;margin:0 auto"><h1>Weekly digest turned off</h1><p>You will no longer receive weekly citation digests for <strong>${safeDomain}</strong>.</p><p style="color:#64748b;font-size:14px;margin-top:24px">The workspace owner can re-enable digests anytime in CitePilot Settings → Notifications.</p></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
});
