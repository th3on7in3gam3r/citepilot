import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/server";
import {
  buildProductTourStatus,
  markProductTourCompleted,
  restartProductTour,
} from "@/lib/server/onboarding-checklist";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await buildProductTourStatus(userId);
  return NextResponse.json(status);
});

export const PATCH = withApiLogging(async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { action?: string };
  if (body.action === "complete") {
    await markProductTourCompleted(userId);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "restart") {
    await restartProductTour(userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
