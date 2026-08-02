import { randomUUID } from "crypto";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { parsePreferences } from "@/lib/settings";
import type { EmailSequenceName, SequenceEmailPayload } from "./types";

export type EmailSentRow = {
  id: string;
  user_id: string;
  sequence_name: string;
  email_number: number;
  resend_id: string | null;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
};

export type EmailQueueRow = {
  id: string;
  user_id: string;
  sequence_name: string;
  email_number: number;
  scheduled_at: string;
  payload: string;
  status: string;
  created_at: string;
};

export async function isEmailUnsubscribed(userId: string): Promise<boolean> {
  const row = await dbGet<{ user_id: string }>(
    `SELECT user_id FROM email_unsubscribes WHERE user_id = ?`,
    [userId],
  );
  return Boolean(row);
}

export async function recordUnsubscribe(userId: string, email: string): Promise<void> {
  await dbRun(
    `INSERT INTO email_unsubscribes (user_id, email, unsubscribed_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, unsubscribed_at = excluded.unsubscribed_at`,
    [userId, email, new Date().toISOString()],
  );
  await cancelPendingQueue(userId);
}

export async function hasEmailBeenSent(
  userId: string,
  sequence: EmailSequenceName,
  emailNumber: number,
): Promise<boolean> {
  const row = await dbGet<{ id: string }>(
    `SELECT id FROM email_sent
     WHERE user_id = ? AND sequence_name = ? AND email_number = ?`,
    [userId, sequence, emailNumber],
  );
  return Boolean(row);
}

export async function recordEmailSent(input: {
  userId: string;
  sequence: EmailSequenceName;
  emailNumber: number;
  resendId?: string | null;
}): Promise<string> {
  const id = randomUUID();
  await dbRun(
    `INSERT INTO email_sent (id, user_id, sequence_name, email_number, resend_id, sent_at, opened_at, clicked_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`,
    [
      id,
      input.userId,
      input.sequence,
      input.emailNumber,
      input.resendId ?? null,
      new Date().toISOString(),
    ],
  );
  return id;
}

export async function updateEmailEventByResendId(
  resendId: string,
  field: "opened_at" | "clicked_at",
): Promise<void> {
  const now = new Date().toISOString();
  await dbRun(
    `UPDATE email_sent SET ${field} = COALESCE(${field}, ?) WHERE resend_id = ?`,
    [now, resendId],
  );
}

export async function queueSequenceEmail(input: {
  userId: string;
  sequence: EmailSequenceName;
  emailNumber: number;
  scheduledAt: Date;
  payload: SequenceEmailPayload;
}): Promise<void> {
  const existing = await dbGet<{ id: string }>(
    `SELECT id FROM email_sequence_queue
     WHERE user_id = ? AND sequence_name = ? AND email_number = ? AND status = 'pending'`,
    [input.userId, input.sequence, input.emailNumber],
  );
  if (existing) return;

  await dbRun(
    `INSERT INTO email_sequence_queue (
      id, user_id, sequence_name, email_number, scheduled_at, payload, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      randomUUID(),
      input.userId,
      input.sequence,
      input.emailNumber,
      input.scheduledAt.toISOString(),
      JSON.stringify(input.payload),
      new Date().toISOString(),
    ],
  );
}

export async function cancelPendingQueue(
  userId: string,
  sequence?: EmailSequenceName,
): Promise<void> {
  const now = new Date().toISOString();
  if (sequence) {
    await dbRun(
      `UPDATE email_sequence_queue SET status = 'cancelled'
       WHERE user_id = ? AND sequence_name = ? AND status = 'pending'`,
      [userId, sequence],
    );
  } else {
    await dbRun(
      `UPDATE email_sequence_queue SET status = 'cancelled'
       WHERE user_id = ? AND status = 'pending'`,
      [userId],
    );
  }
  void now;
}

export async function markQueueSent(queueId: string): Promise<void> {
  await dbRun(
    `UPDATE email_sequence_queue SET status = 'sent' WHERE id = ?`,
    [queueId],
  );
}

export async function markQueueCancelled(queueId: string): Promise<void> {
  await dbRun(
    `UPDATE email_sequence_queue SET status = 'cancelled' WHERE id = ?`,
    [queueId],
  );
}

export async function listDueQueueItems(limit = 100): Promise<
  (EmailQueueRow & { payloadParsed: SequenceEmailPayload })[]
> {
  const rows = await dbAll<EmailQueueRow>(
    `SELECT id, user_id, sequence_name, email_number, scheduled_at, payload, status, created_at
     FROM email_sequence_queue
     WHERE status = 'pending' AND scheduled_at <= ?
     ORDER BY scheduled_at ASC
     LIMIT ?`,
    [new Date().toISOString(), limit],
  );
  return rows.map((row) => ({
    ...row,
    payloadParsed: JSON.parse(row.payload || "{}") as SequenceEmailPayload,
  }));
}

export async function userHasCompletedAudit(userId: string): Promise<boolean> {
  const row = await dbGet<{ n: number }>(
    `SELECT COUNT(*) AS n FROM audit_runs ar
     INNER JOIN workspaces w ON ar.workspace_id = w.id
     WHERE w.user_id = ?`,
    [userId],
  );
  return (row?.n ?? 0) > 0;
}

export async function getPrimaryWorkspaceId(userId: string): Promise<string | null> {
  const row = await dbGet<{ id: string }>(
    `SELECT id FROM workspaces WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
    [userId],
  );
  return row?.id ?? null;
}

export async function countUserAudits(userId: string): Promise<number> {
  const row = await dbGet<{ n: number }>(
    `SELECT COUNT(*) AS n FROM audit_runs ar
     INNER JOIN workspaces w ON ar.workspace_id = w.id
     WHERE w.user_id = ?`,
    [userId],
  );
  return row?.n ?? 0;
}

export async function getLatestAuditScore(userId: string): Promise<number | null> {
  const row = await dbGet<{ score: number }>(
    `SELECT ar.score FROM audit_runs ar
     INNER JOIN workspaces w ON ar.workspace_id = w.id
     WHERE w.user_id = ?
     ORDER BY ar.created_at DESC LIMIT 1`,
    [userId],
  );
  return row?.score ?? null;
}

export async function countMonitoredPrompts(userId: string): Promise<number> {
  const rows = await dbAll<{ preferences: string }>(
    `SELECT preferences FROM workspaces WHERE user_id = ?`,
    [userId],
  );
  let total = 0;
  for (const row of rows) {
    const prefs = parsePreferences(row.preferences);
    total += (prefs.monitoredPrompts ?? []).filter(Boolean).length;
  }
  return total;
}
