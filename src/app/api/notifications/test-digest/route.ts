import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { getWorkspaceById } from "@/lib/server/workspace";
import { sendWeeklyDigestEmail } from "@/lib/email/notifications";
import { parsePreferences } from "@/lib/settings";
import { dbAll, dbGet } from "@/lib/db";

export const runtime = "nodejs";

type WorkspaceRow = {
  id: string;
  domain: string;
  buyer_question: string | null;
  competitors: string;
  preferences: string;
  user_id: string | null;
};

/**
 * POST /api/notifications/test-digest
 * Body: { workspaceId: string }
 *
 * Sends a one-off weekly digest email to the monitoring email configured for
 * the given workspace. Requires authentication.
 */
export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (auth instanceof NextResponse) return auth;

  let body: { workspaceId?: string };
  try {
    body = (await request.json()) as { workspaceId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { workspaceId } = body;
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 },
    );
  }

  const row = await dbGet<WorkspaceRow>(
    `SELECT id, domain, buyer_question, competitors, preferences, user_id FROM workspaces WHERE id = ?`,
    [workspaceId],
  );

  if (!row) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const prefs = parsePreferences(row.preferences);
  const to = prefs.monitoringEmail?.trim();

  if (!to) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No monitoring email configured. Add one in Settings → Notifications.",
      },
      { status: 422 },
    );
  }

  const audits = await dbAll<{ score: number; created_at: string }>(
    `SELECT score, created_at FROM audit_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 2`,
    [workspaceId],
  );

  if (audits.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No audits found for this workspace yet." },
      { status: 422 },
    );
  }

  const ws = await getWorkspaceById(workspaceId, row.user_id);
  const gaps = ws?.latestAudit?.gaps ?? [];
  const competitors = JSON.parse(row.competitors || "[]") as string[];

  const result = await sendWeeklyDigestEmail({
    domain: row.domain,
    buyerQuestion: row.buyer_question ?? "",
    competitors,
    score: audits[0]!.score,
    previousScore: audits[1]?.score ?? null,
    gaps,
    to,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Send failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, sentTo: to });
}
