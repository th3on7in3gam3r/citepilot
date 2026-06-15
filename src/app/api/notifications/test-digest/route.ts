import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { userHasFleetAccess } from "@/lib/billing/access";
import { isEmailConfigured } from "@/lib/email/config";
import { sendWeeklyDigestEmail } from "@/lib/email/notifications";
import { isValidRecipientEmail } from "@/lib/email/send";
import { parseTestDigestRequest } from "@/lib/notifications/test-digest-schema";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseTestDigestRequest(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { workspaceId, email: bodyEmail } = parsed.data;

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const to = bodyEmail || ws.preferences.monitoringEmail?.trim() || "";

  if (!to) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: {
          fieldErrors: {
            email: [
              "No monitoring email configured. Add one in Settings → Alerts and save, or enter an address first.",
            ],
          },
          formErrors: [],
        },
      },
      { status: 422 },
    );
  }

  if (!isValidRecipientEmail(to)) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: {
          fieldErrors: { email: [`Invalid email address: ${to}`] },
          formErrors: [],
        },
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

  try {
    const fleetBranding = userId ? await userHasFleetAccess(userId) : false;
    const result = await sendWeeklyDigestEmail({
      domain: ws.domain,
      buyerQuestion: ws.buyerQuestion ?? "",
      competitors: ws.competitors ?? [],
      score,
      previousScore,
      gaps,
      to,
      whiteLabel: ws.preferences.whiteLabel,
      workspaceId,
      fleetBranding,
    });

    if (!result.ok) {
      const hint =
        "If you just updated .env.local, restart the dev server. On getcitepilot.com, set RESEND_API_KEY and EMAIL_FROM in Vercel → Environment Variables, then redeploy.";
      return NextResponse.json(
        {
          ok: false,
          error: result.error ?? "Send failed",
          hint,
        },
        { status: result.error === "Email not configured" ? 503 : 422 },
      );
    }

    return NextResponse.json({ ok: true, sentTo: to });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected send error";
    console.error("[test-digest]", err);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint:
          "Restart the dev server after changing .env.local, or redeploy Vercel after updating production env vars.",
      },
      { status: 500 },
    );
  }
});
