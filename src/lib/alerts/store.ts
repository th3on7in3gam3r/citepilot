import { randomUUID } from "crypto";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import {
  decryptAlertSecret,
  encryptAlertSecret,
} from "@/lib/alerts/crypto";

export type SlackConnectionRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  slack_team_id: string;
  slack_team_name: string | null;
  slack_channel_id: string | null;
  slack_channel_name: string | null;
  encrypted_token: string;
  created_at: string;
  updated_at: string;
};

export type WebhookEndpointRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  url: string;
  encrypted_secret: string;
  created_at: string;
};

export type AlertEventRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  channel: "email" | "slack" | "webhook";
  event_type: string;
  title: string;
  description: string | null;
  prompt: string | null;
  platform: string | null;
  metadata: string;
  created_at: string;
};

export async function getSlackConnection(
  workspaceId: string,
  userId: string,
): Promise<SlackConnectionRow | null> {
  const row = await dbGet<SlackConnectionRow>(
    `SELECT * FROM slack_connections WHERE workspace_id = ? AND user_id = ?`,
    [workspaceId, userId],
  );
  return row ?? null;
}

export async function upsertSlackConnection(input: {
  userId: string;
  workspaceId: string;
  slackTeamId: string;
  slackTeamName?: string;
  botToken: string;
}): Promise<SlackConnectionRow> {
  const now = new Date().toISOString();
  const existing = await getSlackConnection(input.workspaceId, input.userId);
  const encrypted = encryptAlertSecret(input.botToken);

  if (existing) {
    await dbRun(
      `UPDATE slack_connections
       SET slack_team_id = ?, slack_team_name = ?, encrypted_token = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.slackTeamId,
        input.slackTeamName ?? existing.slack_team_name,
        encrypted,
        now,
        existing.id,
      ],
    );
    return (await getSlackConnection(input.workspaceId, input.userId))!;
  }

  const id = randomUUID();
  await dbRun(
    `INSERT INTO slack_connections
     (id, user_id, workspace_id, slack_team_id, slack_team_name, encrypted_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.workspaceId,
      input.slackTeamId,
      input.slackTeamName ?? null,
      encrypted,
      now,
      now,
    ],
  );
  return (await getSlackConnection(input.workspaceId, input.userId))!;
}

export async function updateSlackChannel(input: {
  workspaceId: string;
  userId: string;
  channelId: string;
  channelName: string;
}): Promise<void> {
  const now = new Date().toISOString();
  await dbRun(
    `UPDATE slack_connections
     SET slack_channel_id = ?, slack_channel_name = ?, updated_at = ?
     WHERE workspace_id = ? AND user_id = ?`,
    [
      input.channelId,
      input.channelName,
      now,
      input.workspaceId,
      input.userId,
    ],
  );
}

export async function deleteSlackConnection(
  workspaceId: string,
  userId: string,
): Promise<void> {
  await dbRun(
    `DELETE FROM slack_connections WHERE workspace_id = ? AND user_id = ?`,
    [workspaceId, userId],
  );
}

export function decryptSlackToken(row: SlackConnectionRow): string {
  return decryptAlertSecret(row.encrypted_token);
}

export async function listWebhookEndpoints(
  workspaceId: string,
  userId: string,
): Promise<WebhookEndpointRow[]> {
  return dbAll<WebhookEndpointRow>(
    `SELECT * FROM webhook_endpoints WHERE workspace_id = ? AND user_id = ? ORDER BY created_at ASC`,
    [workspaceId, userId],
  );
}

export async function createWebhookEndpoint(input: {
  userId: string;
  workspaceId: string;
  url: string;
  secret: string;
}): Promise<WebhookEndpointRow> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO webhook_endpoints (id, user_id, workspace_id, url, encrypted_secret, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.workspaceId,
      input.url,
      encryptAlertSecret(input.secret),
      now,
    ],
  );
  return (await dbGet<WebhookEndpointRow>(
    `SELECT * FROM webhook_endpoints WHERE id = ?`,
    [id],
  ))!;
}

export async function deleteWebhookEndpoint(
  id: string,
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const result = await dbRun(
    `DELETE FROM webhook_endpoints WHERE id = ? AND workspace_id = ? AND user_id = ?`,
    [id, workspaceId, userId],
  );
  return (result.changes ?? 0) > 0;
}

export function decryptWebhookSecret(row: WebhookEndpointRow): string {
  return decryptAlertSecret(row.encrypted_secret);
}

export async function recordAlertEvent(input: {
  userId: string;
  workspaceId: string;
  channel: AlertEventRow["channel"];
  eventType: string;
  title: string;
  description?: string;
  prompt?: string;
  platform?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO alert_events
     (id, user_id, workspace_id, channel, event_type, title, description, prompt, platform, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.userId,
      input.workspaceId,
      input.channel,
      input.eventType,
      input.title,
      input.description ?? null,
      input.prompt ?? null,
      input.platform ?? null,
      JSON.stringify(input.metadata ?? {}),
      now,
    ],
  );
  return id;
}

export async function listAlertEvents(input: {
  userId: string;
  workspaceId?: string;
  channel?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<(AlertEventRow & { domain?: string })[]> {
  const clauses = ["ae.user_id = ?"];
  const params: unknown[] = [input.userId];

  if (input.workspaceId) {
    clauses.push("ae.workspace_id = ?");
    params.push(input.workspaceId);
  }
  if (input.channel) {
    clauses.push("ae.channel = ?");
    params.push(input.channel);
  }
  if (input.from) {
    clauses.push("ae.created_at >= ?");
    params.push(input.from);
  }
  if (input.to) {
    clauses.push("ae.created_at <= ?");
    params.push(input.to);
  }

  const limit = Math.min(input.limit ?? 100, 200);
  params.push(limit);

  return dbAll<AlertEventRow & { domain?: string }>(
    `SELECT ae.*, w.domain
     FROM alert_events ae
     LEFT JOIN workspaces w ON w.id = ae.workspace_id
     WHERE ${clauses.join(" AND ")}
     ORDER BY ae.created_at DESC
     LIMIT ?`,
    params,
  );
}
