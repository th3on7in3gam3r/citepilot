import { v4 as uuidv4 } from "uuid";
import { after } from "next/server";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { executeWorkspaceScan } from "@/lib/scans/execute-scan";
import {
  ESTIMATED_MINUTES_PER_WORKSPACE,
  SCAN_CONCURRENCY,
  type AuditTrigger,
  type ScanJobItemStatus,
  type ScanJobStatus,
} from "@/lib/scans/types";

type ScanJobRow = {
  id: string;
  user_id: string;
  trigger: AuditTrigger;
  status: ScanJobStatus;
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  created_at: string;
  updated_at: string;
};

type ScanJobItemRow = {
  id: string;
  job_id: string;
  workspace_id: string;
  status: ScanJobItemStatus;
  error: string | null;
  audit_id: string | null;
  duration_ms: number | null;
};

export type BulkScanStatus = {
  jobId: string | null;
  status: ScanJobStatus | "idle";
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  running: number;
  queued: number;
  estimatedMinutesRemaining: number;
};

export async function workspaceScanInProgress(
  workspaceId: string,
): Promise<boolean> {
  const row = await dbGet<{ c: number | string }>(
    `SELECT COUNT(*) as c FROM scan_job_items
     WHERE workspace_id = ? AND status IN ('queued', 'running')`,
    [workspaceId],
  );
  return Number(row?.c ?? 0) > 0;
}

export async function listActiveScanWorkspaceIds(
  workspaceIds: string[],
): Promise<Set<string>> {
  if (workspaceIds.length === 0) return new Set();
  const placeholders = workspaceIds.map(() => "?").join(", ");
  const rows = await dbAll<{ workspace_id: string }>(
    `SELECT DISTINCT workspace_id FROM scan_job_items
     WHERE workspace_id IN (${placeholders})
       AND status IN ('queued', 'running')`,
    workspaceIds,
  );
  return new Set(rows.map((r) => r.workspace_id));
}

async function refreshJobCounts(jobId: string): Promise<ScanJobRow | undefined> {
  const counts = await dbGet<{
    completed: number | string;
    failed: number | string;
    skipped: number | string;
    running: number | string;
    queued: number | string;
  }>(
    `SELECT
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
       SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
       SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
       SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued
     FROM scan_job_items WHERE job_id = ?`,
    [jobId],
  );

  const completed = Number(counts?.completed ?? 0);
  const failed = Number(counts?.failed ?? 0);
  const skipped = Number(counts?.skipped ?? 0);
  const running = Number(counts?.running ?? 0);
  const queued = Number(counts?.queued ?? 0);
  const now = new Date().toISOString();

  let status: ScanJobStatus = "running";
  if (running === 0 && queued === 0) {
    status = failed > 0 && completed === 0 ? "failed" : "completed";
  }

  await dbRun(
    `UPDATE scan_jobs
     SET completed = ?, failed = ?, skipped = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [completed, failed, skipped, status, now, jobId],
  );

  return dbGet<ScanJobRow>(`SELECT * FROM scan_jobs WHERE id = ?`, [jobId]);
}

async function processOneItem(
  job: ScanJobRow,
  item: ScanJobItemRow,
): Promise<void> {
  const now = new Date().toISOString();
  await dbRun(
    `UPDATE scan_job_items SET status = 'running', started_at = ? WHERE id = ?`,
    [now, item.id],
  );

  try {
    const result = await executeWorkspaceScan({
      workspaceId: item.workspace_id,
      userId: job.user_id,
      trigger: job.trigger,
    });

    await dbRun(
      `UPDATE scan_job_items
       SET status = 'completed', audit_id = ?, duration_ms = ?, completed_at = ?
       WHERE id = ?`,
      [result.auditId, result.durationMs, new Date().toISOString(), item.id],
    );
  } catch (err) {
    await dbRun(
      `UPDATE scan_job_items
       SET status = 'failed', error = ?, completed_at = ?
       WHERE id = ?`,
      [
        err instanceof Error ? err.message : "scan_failed",
        new Date().toISOString(),
        item.id,
      ],
    );
  }
}

export async function processScanJob(jobId: string, userId: string): Promise<void> {
  const job = await dbGet<ScanJobRow>(
    `SELECT * FROM scan_jobs WHERE id = ? AND user_id = ?`,
    [jobId, userId],
  );
  if (!job || job.status === "completed" || job.status === "failed") return;

  await dbRun(
    `UPDATE scan_jobs SET status = 'running', updated_at = ? WHERE id = ?`,
    [new Date().toISOString(), jobId],
  );

  while (true) {
    const runningCount = await dbGet<{ c: number | string }>(
      `SELECT COUNT(*) as c FROM scan_job_items
       WHERE job_id = ? AND status = 'running'`,
      [jobId],
    );
    const slots = SCAN_CONCURRENCY - Number(runningCount?.c ?? 0);
    if (slots <= 0) break;

    const queued = await dbAll<ScanJobItemRow>(
      `SELECT * FROM scan_job_items
       WHERE job_id = ? AND status = 'queued'
       ORDER BY created_at ASC
       LIMIT ?`,
      [jobId, slots],
    );
    if (queued.length === 0) break;

    await Promise.all(queued.map((item) => processOneItem(job, item)));
  }

  await refreshJobCounts(jobId);
}

export async function createBulkScanJob(
  userId: string,
  workspaceIds: string[],
): Promise<{ jobId: string; queued: number; skipped: number; estimatedMinutes: number }> {
  const active = await listActiveScanWorkspaceIds(workspaceIds);
  const toQueue = workspaceIds.filter((id) => !active.has(id));
  const skipped = workspaceIds.length - toQueue.length;

  const jobId = uuidv4();
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO scan_jobs (
      id, user_id, trigger, status, total, completed, failed, skipped, created_at, updated_at
    ) VALUES (?, ?, 'bulk', 'queued', ?, 0, 0, ?, ?, ?)`,
    [jobId, userId, workspaceIds.length, skipped, now, now],
  );

  for (const workspaceId of workspaceIds) {
    const status: ScanJobItemStatus = active.has(workspaceId) ? "skipped" : "queued";
    await dbRun(
      `INSERT INTO scan_job_items (
        id, job_id, workspace_id, status, error, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        jobId,
        workspaceId,
        status,
        status === "skipped" ? "already_queued" : null,
        now,
      ],
    );
  }

  if (skipped > 0) {
    await refreshJobCounts(jobId);
  }

  const estimatedMinutes = Math.max(
    1,
    Math.ceil((toQueue.length / SCAN_CONCURRENCY) * ESTIMATED_MINUTES_PER_WORKSPACE),
  );

  after(async () => {
    try {
      await processScanJob(jobId, userId);
    } catch (err) {
      console.error("[scans] bulk job processing failed", jobId, err);
    }
  });

  return { jobId, queued: toQueue.length, skipped, estimatedMinutes };
}

export async function queueWorkspaceScan(input: {
  workspaceId: string;
  userId: string;
  trigger: "manual" | "scheduled";
}): Promise<
  | { ok: true; jobItemId: string }
  | { ok: false; reason: "already_queued" | "paused" }
> {
  if (await workspaceScanInProgress(input.workspaceId)) {
    return { ok: false, reason: "already_queued" };
  }

  const ws = await dbGet<{ status: string | null }>(
    `SELECT status FROM workspaces WHERE id = ?`,
    [input.workspaceId],
  );
  if (ws?.status === "paused") {
    return { ok: false, reason: "paused" };
  }

  const jobId = uuidv4();
  const itemId = uuidv4();
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO scan_jobs (
      id, user_id, trigger, status, total, completed, failed, skipped, created_at, updated_at
    ) VALUES (?, ?, ?, 'queued', 1, 0, 0, 0, ?, ?)`,
    [jobId, input.userId, input.trigger, now, now],
  );

  await dbRun(
    `INSERT INTO scan_job_items (
      id, job_id, workspace_id, status, created_at
    ) VALUES (?, ?, ?, 'queued', ?)`,
    [itemId, jobId, input.workspaceId, now],
  );

  after(async () => {
    try {
      await processScanJob(jobId, input.userId);
    } catch (err) {
      console.error("[scans] workspace scan failed", input.workspaceId, err);
    }
  });

  return { ok: true, jobItemId: itemId };
}

export async function getBulkScanStatus(
  userId: string,
  jobId?: string | null,
): Promise<BulkScanStatus> {
  const job = jobId
    ? await dbGet<ScanJobRow>(
        `SELECT * FROM scan_jobs WHERE id = ? AND user_id = ?`,
        [jobId, userId],
      )
    : await dbGet<ScanJobRow>(
        `SELECT * FROM scan_jobs
         WHERE user_id = ? AND status IN ('queued', 'running')
         ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );

  if (!job) {
    return {
      jobId: null,
      status: "idle",
      total: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      running: 0,
      queued: 0,
      estimatedMinutesRemaining: 0,
    };
  }

  if (job.status === "queued" || job.status === "running") {
    await processScanJob(job.id, userId);
    const refreshed = await refreshJobCounts(job.id);
    if (refreshed) Object.assign(job, refreshed);
  }

  const counts = await dbGet<{
    running: number | string;
    queued: number | string;
  }>(
    `SELECT
       SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
       SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued
     FROM scan_job_items WHERE job_id = ?`,
    [job.id],
  );

  const running = Number(counts?.running ?? 0);
  const queued = Number(counts?.queued ?? 0);
  const remaining = running + queued;
  const estimatedMinutesRemaining = Math.max(
    0,
    Math.ceil((remaining / SCAN_CONCURRENCY) * ESTIMATED_MINUTES_PER_WORKSPACE),
  );

  return {
    jobId: job.id,
    status: job.status,
    total: job.total,
    completed: job.completed,
    failed: job.failed,
    skipped: job.skipped,
    running,
    queued,
    estimatedMinutesRemaining,
  };
}
