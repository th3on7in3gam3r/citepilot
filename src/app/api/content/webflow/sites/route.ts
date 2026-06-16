import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { listWebflowCollections, listWebflowSites } from "@/lib/cms/webflow";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);
    if (!(await userHasPilotAccess(userId))) {
      return NextResponse.json({ error: PILOT_UPGRADE_MESSAGE }, { status: 402 });
    }

    const body = (await request.json()) as { apiKey?: string };
    const apiKey = body.apiKey?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
    }

    const sites = await listWebflowSites(apiKey);
    return NextResponse.json({ sites });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load Webflow sites";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
