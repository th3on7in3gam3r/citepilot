import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getCmsConnection, markCmsPublicationLive } from "@/lib/cms/store";
import type { SignalDeskCredentials } from "@/lib/cms/types";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

type SignalDeskWebhookPayload = {
  event?: string;
  post?: {
    id?: number | string;
    slug?: string;
    title?: string;
    url?: string;
    status?: string;
    publishedAt?: string | null;
  };
};

function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header || !secret) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const POST = withApiLogging(async function POST(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId query param required" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  let payload: SignalDeskWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SignalDeskWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const connection = await getCmsConnection(workspaceId, "signaldesk");
  if (!connection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const credentials = connection.credentials as SignalDeskCredentials;
  const secret = credentials.webhookSecret?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured for this connection" },
      { status: 401 },
    );
  }

  const signature = request.headers.get("x-signal-desk-signature");
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (payload.event !== "post.published") {
    return NextResponse.json({ ok: true, ignored: true, event: payload.event });
  }

  const remoteId = payload.post?.id != null ? String(payload.post.id) : "";
  if (!remoteId) {
    return NextResponse.json({ error: "Missing post.id" }, { status: 400 });
  }

  const updated = await markCmsPublicationLive({
    workspaceId,
    provider: "signaldesk",
    remoteId,
    remoteUrl: payload.post?.url ?? null,
    publishedAt: payload.post?.publishedAt || undefined,
  });

  // Idempotent: unknown remote ids still 200 (post may have been published outside CitePilot)
  return NextResponse.json({
    ok: true,
    matched: Boolean(updated),
    remoteId,
    remoteUrl: updated?.remoteUrl ?? payload.post?.url ?? null,
  });
});
