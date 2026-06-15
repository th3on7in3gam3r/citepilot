import { createHmac } from "crypto";
import {
  decryptWebhookSecret,
  recordAlertEvent,
  type WebhookEndpointRow,
} from "@/lib/alerts/store";

export type CitationChangeWebhookPayload = {
  event: "citation.change_detected";
  workspace: string;
  timestamp: string;
  data: {
    prompt: string;
    platform: string;
    change: "gained" | "lost";
    citation_rate_before: number;
    citation_rate_after: number;
  };
};

export function signWebhookBody(secret: string, body: string): string {
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  return `sha256=${digest}`;
}

export function buildCitationChangePayload(input: {
  domain: string;
  prompt: string;
  platform: string;
  change: "gained" | "lost";
  rateBefore: number;
  rateAfter: number;
}): CitationChangeWebhookPayload {
  return {
    event: "citation.change_detected",
    workspace: input.domain,
    timestamp: new Date().toISOString(),
    data: {
      prompt: input.prompt,
      platform: input.platform,
      change: input.change,
      citation_rate_before: input.rateBefore,
      citation_rate_after: input.rateAfter,
    },
  };
}

export function sampleWebhookPayload(domain: string): CitationChangeWebhookPayload {
  return buildCitationChangePayload({
    domain,
    prompt: "best CRM for agencies",
    platform: "chatgpt",
    change: "gained",
    rateBefore: 0.5,
    rateAfter: 0.58,
  });
}

export async function deliverWebhook(input: {
  endpoint: WebhookEndpointRow;
  payload: CitationChangeWebhookPayload;
  userId: string;
  workspaceId: string;
}): Promise<{ ok: boolean; status?: number; error?: string }> {
  const secret = decryptWebhookSecret(input.endpoint);
  const body = JSON.stringify(input.payload);
  const signature = signWebhookBody(secret, body);

  try {
    const res = await fetch(input.endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CitePilot-Signature": signature,
        "User-Agent": "CitePilot-Webhooks/1.0",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }

    await recordAlertEvent({
      userId: input.userId,
      workspaceId: input.workspaceId,
      channel: "webhook",
      eventType: input.payload.event,
      title: `Webhook: ${input.payload.data.change} citation`,
      description: `"${input.payload.data.prompt}" on ${input.payload.data.platform}`,
      prompt: input.payload.data.prompt,
      platform: input.payload.data.platform,
      metadata: { url: input.endpoint.url, status: res.status },
    });

    return { ok: true, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "delivery failed";
    return { ok: false, error: message };
  }
}
