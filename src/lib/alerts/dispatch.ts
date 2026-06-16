import type { AuditPayload } from "@/lib/api-types";
import {
  buildCompetitorMoveDelta,
  buildDeltaFromAudits,
} from "@/lib/audit/competitor-delta";
import { userHasFleetAccess, userHasPilotAccess } from "@/lib/billing/access";
import {
  getSlackConnection,
  listWebhookEndpoints,
  recordAlertEvent,
} from "@/lib/alerts/store";
import {
  buildCitationChangeBlocks,
  buildWeeklyDigestBlocks,
  estLiftLabel,
  topFixFromAudit,
} from "@/lib/alerts/slack-blocks";
import { postSlackMessage } from "@/lib/alerts/slack-client";
import {
  buildCitationChangePayload,
  deliverWebhook,
} from "@/lib/alerts/webhook";
import { type ScoreDropThresholdPercent } from "@/lib/settings";
import {
  getNotificationPreferences,
  isDigestDueNow,
  webhookEventEnabled,
} from "@/lib/notifications/preferences-store";
import { getWorkspaceById } from "@/lib/server/workspace";

function citationRate(audit: AuditPayload): number {
  if (!audit.total) return audit.score / 100;
  return audit.cited / audit.total;
}

function dominantPlatform(audit: AuditPayload): string {
  const platforms = Array.isArray(audit.platforms) ? audit.platforms : [];
  const present = platforms.filter((p) => p.present);
  if (present.length === 0) return "aggregate";
  const top = [...present].sort((a, b) => b.share - a.share)[0];
  return top?.name?.toLowerCase().replace(/\s+/g, "") ?? "aggregate";
}

export function scoreDropExceeded(
  previousScore: number,
  currentScore: number,
  threshold: ScoreDropThresholdPercent,
): boolean {
  return previousScore - currentScore >= threshold;
}

export async function dispatchCitationChangeAlerts(input: {
  workspaceId: string;
  userId: string | null;
  audit: AuditPayload;
  previousAudit: AuditPayload | null;
}): Promise<void> {
  if (!input.userId || !input.previousAudit) return;

  const paid =
    (await userHasPilotAccess(input.userId)) ||
    (await userHasFleetAccess(input.userId));
  if (!paid) return;

  const ws = await getWorkspaceById(input.workspaceId, input.userId);
  if (!ws) return;

  const notifPrefs = await getNotificationPreferences(
    input.workspaceId,
    input.userId,
  );

  const delta = buildDeltaFromAudits(
    input.audit,
    input.previousAudit,
    ws.competitors,
  );
  if (!delta.hasChanges) return;

  const rateBefore = citationRate(input.previousAudit);
  const rateAfter = citationRate(input.audit);
  const platform = dominantPlatform(input.audit);

  const slack = await getSlackConnection(input.workspaceId, input.userId);
  const webhooks = (await userHasFleetAccess(input.userId))
    ? await listWebhookEndpoints(input.workspaceId, input.userId)
    : [];

  const changes: { prompt: string; change: "gained" | "lost" }[] = [
    ...delta.promptsWon.map((p) => ({
      prompt: p.prompt,
      change: "gained" as const,
    })),
    ...delta.promptsLost.map((p) => ({
      prompt: p.prompt,
      change: "lost" as const,
    })),
  ];

  for (const item of changes) {
    if (slack?.slack_channel_id && notifPrefs.slackDropAlerts) {
      const { blocks, text } = buildCitationChangeBlocks({
        domain: input.audit.domain,
        prompt: item.prompt,
        change: item.change,
        platform,
        rateBefore,
        rateAfter,
      });
      const result = await postSlackMessage({ connection: slack, blocks, text });
      if (result.ok) {
        await recordAlertEvent({
          userId: input.userId,
          workspaceId: input.workspaceId,
          channel: "slack",
          eventType: "citation.change_detected",
          title:
            item.change === "gained"
              ? `New citation: "${item.prompt}"`
              : `Lost citation: "${item.prompt}"`,
          description: `${platform} · ${input.audit.domain}`,
          prompt: item.prompt,
          platform,
        });
      }
    }

    for (const endpoint of webhooks) {
      if (!webhookEventEnabled(notifPrefs, "citation.change_detected")) continue;
      const payload = buildCitationChangePayload({
        domain: input.audit.domain,
        prompt: item.prompt,
        platform,
        change: item.change,
        rateBefore,
        rateAfter,
      });
      await deliverWebhook({
        endpoint,
        payload,
        userId: input.userId,
        workspaceId: input.workspaceId,
      });
    }
  }
}

export async function dispatchWeeklySlackDigest(input: {
  workspaceId: string;
  userId: string;
  audit: AuditPayload;
  previousAudit: AuditPayload | null;
}): Promise<{ ok: boolean; error?: string }> {
  const notifPrefs = await getNotificationPreferences(
    input.workspaceId,
    input.userId,
  );
  if (!notifPrefs.slackWeekly) {
    return { ok: false, error: "slack_weekly_disabled" };
  }

  const slack = await getSlackConnection(input.workspaceId, input.userId);
  if (!slack?.slack_channel_id) {
    return { ok: false, error: "not_connected" };
  }

  const delta = buildCompetitorMoveDelta({
    current: input.audit,
    previous: input.previousAudit,
    trackedCompetitors: [],
  });
  const previousScore = input.previousAudit?.score ?? null;
  const scoreDelta =
    previousScore != null ? input.audit.score - previousScore : null;

  const { blocks, text } = buildWeeklyDigestBlocks({
    domain: input.audit.domain,
    score: input.audit.score,
    previousScore,
    delta,
    topFix: topFixFromAudit(input.audit),
    estLift: estLiftLabel(scoreDelta),
  });

  const result = await postSlackMessage({ connection: slack, blocks, text });
  if (result.ok) {
    await recordAlertEvent({
      userId: input.userId,
      workspaceId: input.workspaceId,
      channel: "slack",
      eventType: "weekly.digest",
      title: `Weekly digest — ${input.audit.domain}`,
      description: `Citation rate ${input.audit.score}%`,
    });
  }
  return result;
}

export async function recordEmailAlertEvent(input: {
  userId: string;
  workspaceId: string;
  eventType: string;
  title: string;
  description?: string;
  prompt?: string;
  platform?: string;
}): Promise<void> {
  await recordAlertEvent({
    userId: input.userId,
    workspaceId: input.workspaceId,
    channel: "email",
    eventType: input.eventType,
    title: input.title,
    description: input.description,
    prompt: input.prompt,
    platform: input.platform,
  });
}

export function isWeeklyDigestDay(prefsDay: number, now = new Date()): boolean {
  return now.getUTCDay() === prefsDay;
}

export async function workspaceOwnerUserId(
  workspaceId: string,
): Promise<string | null> {
  const ws = await getWorkspaceById(workspaceId, null);
  if (!ws) return null;
  const row = await import("@/lib/db").then(({ dbGet }) =>
    dbGet<{ user_id: string | null }>(
      `SELECT user_id FROM workspaces WHERE id = ?`,
      [workspaceId],
    ),
  );
  return row?.user_id ?? null;
}
