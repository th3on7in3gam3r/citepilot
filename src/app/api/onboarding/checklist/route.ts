import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/server";
import {
  buildChecklistCompletion,
  dismissUserOnboarding,
  ensureUserOnboarding,
  markSharedProof,
} from "@/lib/server/onboarding-checklist";
import {
  gettingStartedCompletion,
  shouldShowChecklist,
} from "@/lib/getting-started";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const onboarding = await ensureUserOnboarding(userId);
  const completion = await buildChecklistCompletion(workspaceId, userId);
  const { allDone } = gettingStartedCompletion(completion);

  return NextResponse.json({
    startedAt: onboarding.created_at,
    dismissedAt: onboarding.dismissed_at,
    completion,
    allDone,
    shouldShow: shouldShowChecklist({
      startedAt: onboarding.created_at,
      dismissedAt: onboarding.dismissed_at,
      allDone,
    }),
  });
});

export const PATCH = withApiLogging(async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { action?: string };
  if (body.action === "dismiss") {
    await dismissUserOnboarding(userId);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "shared_proof") {
    await markSharedProof(userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
