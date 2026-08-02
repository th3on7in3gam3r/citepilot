import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/server";
import { userHasFleetAccess } from "@/lib/billing/access";
import { emailFromMisconfigurationWarning, isEmailConfigured } from "@/lib/email/config";
import {
  sendScoreDropTestEmail,
  sendWeeklyDigestEmail,
} from "@/lib/email/notifications";
import { isValidRecipientEmail } from "@/lib/email/send";
import {
  formatValidationErrorMessage,
  parseTestDigestRequest,
} from "@/lib/notifications/test-digest-schema";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";
import { dbAll } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/notifications/test-digest
 * Body: { type: "weekly_digest" | "drop_alert", workspaceId: string }
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
    const details = parsed.error.flatten();
    return NextResponse.json(
      {
        error: formatValidationErrorMessage(details),
        details,
      },
      { status: 422 },
    );
  }

  const { workspaceId, type } = parsed.data;

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const sessionUser = await getSessionUser(request);
  const to =
    ws.preferences.monitoringEmail?.trim() || sessionUser?.email?.trim() || "";

  if (!to) {
    return NextResponse.json(
      {
        error:
          "No monitoring email configured. Add one in Settings → Notifications and save.",
        details: {
          fieldErrors: {
            email: [
              "No monitoring email configured. Add one in Settings → Notifications and save.",
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
        error: `Invalid email address: ${to}`,
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
  const score = audits[0]?.score ?? latest?.score ?? 72;
  const previousScore = audits[1]?.score ?? score + 8;
  const gaps = latest?.gaps?.length
    ? latest.gaps
    : ["Run a GEO audit to populate real gap data in digests."];

  try {
    const fleetBranding = userId ? await userHasFleetAccess(userId) : false;

    const result =
      type === "drop_alert"
        ? await sendScoreDropTestEmail({
            domain: ws.domain,
            to,
            currentScore: score,
            previousScore,
            gaps,
            whiteLabel: ws.preferences.whiteLabel,
            fleetBranding,
          })
        : await sendWeeklyDigestEmail({
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
            allowTestFromFallback: true,
          });

    if (!result.ok) {
      const hint =
        emailFromMisconfigurationWarning() ??
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

    const warning =
      emailFromMisconfigurationWarning() ??
      (result.usedTestFrom
        ? "Sent via Resend test sender (onboarding@resend.dev). Set EMAIL_FROM=CitePilot <alerts@getcitepilot.com> in Vercel for production sends."
        : undefined);

    return NextResponse.json({
      ok: true,
      sentTo: to,
      type,
      usedTestFrom: result.usedTestFrom ?? false,
      correctedFrom: result.correctedFrom ?? false,
      ...(warning ? { warning } : {}),
    });
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
