import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { FLEET_UPGRADE_MESSAGE, userHasFleetAccess } from "@/lib/billing/access";
import {
  createFleetApiKey,
  listFleetApiKeys,
} from "@/lib/fleet/api-keys";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json(
      { error: FLEET_UPGRADE_MESSAGE, code: "FLEET_REQUIRED" },
      { status: 403 },
    );
  }

  const keys = await listFleetApiKeys(userId);
  return NextResponse.json({ keys });
});

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json(
      { error: FLEET_UPGRADE_MESSAGE, code: "FLEET_REQUIRED" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const created = await createFleetApiKey(userId, body.name ?? "API key");
  if ("error" in created) {
    return NextResponse.json(
      { error: "Maximum API keys reached", code: "KEY_LIMIT" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    key: created,
    message: "Copy this key now — it will not be shown again.",
  });
});
