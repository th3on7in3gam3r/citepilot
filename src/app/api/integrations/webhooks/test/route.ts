import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  listWebhookEndpoints,
  recordAlertEvent,
} from "@/lib/alerts/store";
import {
  deliverWebhook,
  sampleWebhookPayload,
  signWebhookBody,
} from "@/lib/alerts/webhook";
import { userHasFleetAccess } from "@/lib/billing/access";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const POST = withApiLogging(async function POST(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!(await userHasFleetAccess(userId))) {
    return NextResponse.json({ error: "Fleet plan required" }, { status: 403 });
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    url?: string;
    secret?: string;
    endpointId?: string;
  };

  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const ws = await getWorkspaceById(workspaceId, userId);
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const payload = sampleWebhookPayload({
    workspaceId,
    domain: ws.domain,
  });

  if (body.endpointId) {
    const endpoints = await listWebhookEndpoints(workspaceId, userId);
    const endpoint = endpoints.find((e) => e.id === body.endpointId);
    if (!endpoint) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }
    const result = await deliverWebhook({
      endpoint,
      payload,
      userId,
      workspaceId,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Delivery failed", status: result.status },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, status: result.status });
  }

  const url = body.url?.trim();
  const secret = body.secret?.trim();
  if (!url || !secret) {
    return NextResponse.json(
      { error: "url and secret required (or endpointId)" },
      { status: 400 },
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const bodyStr = JSON.stringify(payload);
  const signature = signWebhookBody(secret, bodyStr);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CitePilot-Signature": signature,
        "User-Agent": "CitePilot-Webhooks/1.0 (Zapier-compatible)",
      },
      body: bodyStr,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `HTTP ${res.status}`, status: res.status },
        { status: 502 },
      );
    }

    await recordAlertEvent({
      userId,
      workspaceId,
      channel: "webhook",
      eventType: "webhook.test",
      title: "Webhook test delivery",
      description: url,
      metadata: { status: res.status },
    });

    return NextResponse.json({ ok: true, status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delivery failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
