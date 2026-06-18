import { createHmac } from "crypto";
import { site } from "@/lib/site";
import {
  decryptWebhookSecret,
  recordAlertEvent,
  type WebhookEndpointRow,
} from "@/lib/alerts/store";

/** Flat, Zapier/Make-friendly webhook body — no nested objects. */
export type CitationChangeWebhookPayload = {
  event: "citation.change_detected";
  workspace_domain: string;
  workspace_id: string;
  prompt: string;
  platform: string;
  change: "gained" | "lost";
  citation_rate_before: number;
  citation_rate_after: number;
  delta: string;
  timestamp: string;
  report_url: string;
};

export type AuditCompletedWebhookPayload = {
  event: "audit.completed";
  workspace_domain: string;
  workspace_id: string;
  audit_id: string;
  citation_score: number;
  prompts_cited: number;
  prompts_total: number;
  citation_rate: number;
  score_delta: number | null;
  timestamp: string;
  report_url: string;
};

export type WebhookPayload =
  | CitationChangeWebhookPayload
  | AuditCompletedWebhookPayload;

/**
 * OPTION B (native Zapier app): register at https://developer.zapier.com
 * - Triggers: New Citation Result, Citation Drop Alert, Audit Completed
 * - Actions: Add Prompt, Trigger Scan
 * - OAuth 2.0 against Neon Auth
 * See /docs/zapier for current Catch Hook setup (Option A).
 */

export function signWebhookBody(secret: string, body: string): string {
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  return `sha256=${digest}`;
}

export function formatCitationRateDelta(
  rateBefore: number,
  rateAfter: number,
): string {
  const pts = Math.round((rateAfter - rateBefore) * 100);
  return pts >= 0 ? `+${pts}%` : `${pts}%`;
}

export function workspaceReportUrl(workspaceId: string): string {
  return `${site.url}/dashboard/geo-audit?workspace=${encodeURIComponent(workspaceId)}`;
}

export function buildCitationChangePayload(input: {
  workspaceId: string;
  domain: string;
  prompt: string;
  platform: string;
  change: "gained" | "lost";
  rateBefore: number;
  rateAfter: number;
  timestamp?: string;
}): CitationChangeWebhookPayload {
  return {
    event: "citation.change_detected",
    workspace_domain: input.domain,
    workspace_id: input.workspaceId,
    prompt: input.prompt,
    platform: input.platform,
    change: input.change,
    citation_rate_before: input.rateBefore,
    citation_rate_after: input.rateAfter,
    delta: formatCitationRateDelta(input.rateBefore, input.rateAfter),
    timestamp: input.timestamp ?? new Date().toISOString(),
    report_url: workspaceReportUrl(input.workspaceId),
  };
}

export function buildAuditCompletedPayload(input: {
  workspaceId: string;
  domain: string;
  auditId: string;
  score: number;
  cited: number;
  total: number;
  previousScore: number | null;
  timestamp?: string;
}): AuditCompletedWebhookPayload {
  const total = Math.max(input.total, 1);
  return {
    event: "audit.completed",
    workspace_domain: input.domain,
    workspace_id: input.workspaceId,
    audit_id: input.auditId,
    citation_score: input.score,
    prompts_cited: input.cited,
    prompts_total: input.total,
    citation_rate: Math.round((input.cited / total) * 100),
    score_delta:
      input.previousScore != null ? input.score - input.previousScore : null,
    timestamp: input.timestamp ?? new Date().toISOString(),
    report_url: workspaceReportUrl(input.workspaceId),
  };
}

export function sampleWebhookPayload(input: {
  workspaceId: string;
  domain: string;
}): CitationChangeWebhookPayload {
  return buildCitationChangePayload({
    workspaceId: input.workspaceId,
    domain: input.domain,
    prompt: "best CRM for agencies",
    platform: "chatgpt",
    change: "gained",
    rateBefore: 0.5,
    rateAfter: 0.58,
    timestamp: "2026-06-14T08:00:00Z",
  });
}

export async function deliverWebhook(input: {
  endpoint: WebhookEndpointRow;
  payload: WebhookPayload;
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
        "User-Agent": "CitePilot-Webhooks/1.0 (Zapier-compatible)",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }

    const title =
      input.payload.event === "citation.change_detected"
        ? `Webhook: ${input.payload.change} citation`
        : `Webhook: audit completed (${input.payload.citation_score}/100)`;

    const description =
      input.payload.event === "citation.change_detected"
        ? `"${input.payload.prompt}" on ${input.payload.platform}`
        : `${input.payload.workspace_domain} · ${input.payload.prompts_cited}/${input.payload.prompts_total} cited`;

    await recordAlertEvent({
      userId: input.userId,
      workspaceId: input.workspaceId,
      channel: "webhook",
      eventType: input.payload.event,
      title,
      description,
      prompt:
        input.payload.event === "citation.change_detected"
          ? input.payload.prompt
          : undefined,
      platform:
        input.payload.event === "citation.change_detected"
          ? input.payload.platform
          : undefined,
      metadata: { url: input.endpoint.url, status: res.status },
    });

    return { ok: true, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "delivery failed";
    return { ok: false, error: message };
  }
}
