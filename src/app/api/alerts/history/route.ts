import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { listAlertEvents } from "@/lib/alerts/store";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim() || undefined;
  const channel = searchParams.get("channel")?.trim() || undefined;
  const from = searchParams.get("from")?.trim() || undefined;
  const to = searchParams.get("to")?.trim() || undefined;
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;

  const events = await listAlertEvents({
    userId,
    workspaceId,
    channel,
    from,
    to,
    limit,
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      workspaceId: e.workspace_id,
      domain: e.domain,
      channel: e.channel,
      eventType: e.event_type,
      title: e.title,
      description: e.description,
      prompt: e.prompt,
      platform: e.platform,
      metadata: JSON.parse(e.metadata || "{}"),
      createdAt: e.created_at,
    })),
  });
});
