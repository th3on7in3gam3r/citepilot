import { v4 as uuidv4 } from "uuid";
import { dbGet, dbRun } from "@/lib/db";

export type CronDispatchStatus = "sent" | "failed" | "skipped";

function weekPeriodKey(date = new Date()): string {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

export function cronPeriodKey(jobName: string, date = new Date()): string {
  return `${jobName}:${weekPeriodKey(date)}`;
}

/** Daily dedupe key — one run per workspace per UTC day. */
export function cronDailyPeriodKey(jobName: string, date = new Date()): string {
  return `${jobName}:${date.toISOString().slice(0, 10)}`;
}

export async function wasCronDispatched(
  jobName: string,
  workspaceId: string | null,
  periodKey: string,
): Promise<boolean> {
  const row = await dbGet<{ status: string }>(
    `SELECT status FROM cron_dispatch_log
     WHERE job_name = ? AND workspace_id IS ? AND period_key = ? AND status = 'sent'`,
    [jobName, workspaceId, periodKey],
  );
  return Boolean(row);
}

export async function recordCronDispatch(input: {
  jobName: string;
  workspaceId: string | null;
  periodKey: string;
  status: CronDispatchStatus;
  error?: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO cron_dispatch_log (
      id, job_name, workspace_id, period_key, status, error, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      input.jobName,
      input.workspaceId,
      input.periodKey,
      input.status,
      input.error ?? null,
      now,
    ],
  );
}
