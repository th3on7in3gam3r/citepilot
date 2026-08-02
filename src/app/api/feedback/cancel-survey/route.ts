import { NextResponse } from "next/server";
import { requireApiUser, apiUserId } from "@/lib/auth/api";
import { getSessionUser } from "@/lib/auth/server";
import { getBillingByUserId } from "@/lib/billing/store";
import { isPaidPlan } from "@/lib/billing/types";
import {
  hasCancelSurveyResponse,
  saveCancelSurveyResponse,
  type CancelSurveyReason,
} from "@/lib/feedback/store";
import { notifyOpsCancelSurvey } from "@/lib/feedback/notifications";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

const VALID_REASONS = new Set<CancelSurveyReason>([
  "too_expensive",
  "not_enough_value",
  "switching_competitor",
  "just_testing",
  "missing_feature",
  "technical_issues",
]);

export const GET = withApiLogging(async function GET(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const submitted = await hasCancelSurveyResponse(userId);
  const billing = await getBillingByUserId(userId);

  return NextResponse.json({
    submitted,
    status: billing?.status ?? "inactive",
    plan: billing?.plan ?? "free",
    isPaid: isPaidPlan(billing),
  });
});

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (await hasCancelSurveyResponse(userId)) {
    return NextResponse.json({ ok: true, alreadySubmitted: true });
  }

  const body = (await request.json()) as {
    reason?: CancelSurveyReason;
    competitor?: string;
    missingFeature?: string;
    details?: string;
  };

  if (!body.reason || !VALID_REASONS.has(body.reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const billing = await getBillingByUserId(userId);
  const sessionUser = await getSessionUser(request);

  await saveCancelSurveyResponse({
    userId,
    reason: body.reason,
    competitor: body.competitor ?? null,
    missingFeature: body.missingFeature ?? null,
    details: body.details ?? null,
    plan: billing?.plan ?? null,
  });

  await trackServerEvent("cancel_survey_submitted", {
    distinctId: userId,
    reason: body.reason,
    plan: billing?.plan ?? "free",
  });

  await notifyOpsCancelSurvey({
    userId,
    userEmail: sessionUser?.email,
    reason: body.reason,
    competitor: body.competitor,
    missingFeature: body.missingFeature,
    details: body.details,
    plan: billing?.plan ?? null,
  });

  return NextResponse.json({ ok: true });
});
