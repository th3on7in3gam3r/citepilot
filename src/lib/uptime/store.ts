import { randomUUID } from "crypto";
import { encryptCmsSecret, decryptCmsSecret } from "@/lib/cms/crypto";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import type {
  CreateMonitorInput,
  MonitorStatus,
  UptimeAuthConfig,
  UptimeCheckResult,
  UptimeMonitor,
  UpdateMonitorInput,
} from "@/lib/uptime/types";

type MonitorRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  monitor_type: string;
  url: string;
  method: string;
  interval_seconds: number;
  timeout_ms: number;
  expected_status_min: number;
  expected_status_max: number;
  keyword: string | null;
  keyword_present: number;
  port: number | null;
  cron_job_name: string | null;
  ssl_warn_days: number;
  auth_type: string;
  auth_config_encrypted: string | null;
  headers_json: string;
  enabled: number;
  last_status: string;
  last_checked_at: string | null;
  last_latency_ms: number | null;
  last_error: string | null;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
};

type ResultRow = {
  id: string;
  monitor_id: string;
  status: string;
  latency_ms: number | null;
  status_code: number | null;
  message: string | null;
  metadata: string;
  checked_at: string;
};

function mapRow(row: MonitorRow): UptimeMonitor {
  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    name: row.name,
    monitorType: row.monitor_type as UptimeMonitor["monitorType"],
    url: row.url,
    method: row.method,
    intervalSeconds: row.interval_seconds,
    timeoutMs: row.timeout_ms,
    expectedStatusMin: row.expected_status_min,
    expectedStatusMax: row.expected_status_max,
    keyword: row.keyword,
    keywordPresent: row.keyword_present === 1,
    port: row.port,
    cronJobName: row.cron_job_name,
    sslWarnDays: row.ssl_warn_days,
    authType: row.auth_type as UptimeMonitor["authType"],
    headers: JSON.parse(row.headers_json || "{}") as Record<string, string>,
    enabled: row.enabled === 1,
    lastStatus: row.last_status as MonitorStatus,
    lastCheckedAt: row.last_checked_at,
    lastLatencyMs: row.last_latency_ms,
    lastError: row.last_error,
    consecutiveFailures: row.consecutive_failures,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapResult(row: ResultRow): UptimeCheckResult {
  return {
    id: row.id,
    monitorId: row.monitor_id,
    status: row.status as MonitorStatus,
    latencyMs: row.latency_ms,
    statusCode: row.status_code,
    message: row.message,
    metadata: JSON.parse(row.metadata || "{}") as Record<string, unknown>,
    checkedAt: row.checked_at,
  };
}

export function decryptMonitorAuth(
  encrypted: string | null,
): UptimeAuthConfig | null {
  if (!encrypted?.trim()) return null;
  try {
    return JSON.parse(decryptCmsSecret(encrypted)) as UptimeAuthConfig;
  } catch {
    return null;
  }
}

function encryptAuth(auth: UptimeAuthConfig | undefined): string | null {
  if (!auth) return null;
  const hasSecret =
    auth.password?.trim() || auth.token?.trim() || auth.username?.trim();
  if (!hasSecret) return null;
  return encryptCmsSecret(JSON.stringify(auth));
}

export async function countMonitorsForUser(userId: string): Promise<number> {
  const row = await dbGet<{ count: number }>(
    `SELECT COUNT(*) AS count FROM uptime_monitors WHERE user_id = ?`,
    [userId],
  );
  return Number(row?.count ?? 0);
}

export async function listMonitors(input: {
  userId: string;
  workspaceId?: string;
}): Promise<UptimeMonitor[]> {
  const rows = input.workspaceId
    ? await dbAll<MonitorRow>(
        `SELECT * FROM uptime_monitors WHERE user_id = ? AND workspace_id = ? ORDER BY name ASC`,
        [input.userId, input.workspaceId],
      )
    : await dbAll<MonitorRow>(
        `SELECT * FROM uptime_monitors WHERE user_id = ? ORDER BY updated_at DESC`,
        [input.userId],
      );
  return rows.map(mapRow);
}

export async function getMonitorById(
  id: string,
  userId: string,
): Promise<UptimeMonitor | null> {
  const row = await dbGet<MonitorRow>(
    `SELECT * FROM uptime_monitors WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  return row ? mapRow(row) : null;
}

export async function createMonitor(
  userId: string,
  input: CreateMonitorInput,
): Promise<UptimeMonitor> {
  const now = new Date().toISOString();
  const id = randomUUID();
  await dbRun(
    `INSERT INTO uptime_monitors (
      id, user_id, workspace_id, name, monitor_type, url, method,
      interval_seconds, timeout_ms, expected_status_min, expected_status_max,
      keyword, keyword_present, port, cron_job_name, ssl_warn_days,
      auth_type, auth_config_encrypted, headers_json, enabled,
      last_status, consecutive_failures, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      input.workspaceId,
      input.name.trim(),
      input.monitorType,
      input.url.trim(),
      (input.method ?? "GET").toUpperCase(),
      input.intervalSeconds ?? 300,
      input.timeoutMs ?? 10_000,
      input.expectedStatusMin ?? 200,
      input.expectedStatusMax ?? 399,
      input.keyword?.trim() || null,
      input.keywordPresent !== false ? 1 : 0,
      input.port ?? null,
      input.cronJobName?.trim() || null,
      input.sslWarnDays ?? 14,
      input.authType ?? "none",
      encryptAuth(input.auth),
      JSON.stringify(input.headers ?? {}),
      input.enabled !== false ? 1 : 0,
      "unknown",
      0,
      now,
      now,
    ],
  );
  return (await getMonitorById(id, userId))!;
}

export async function updateMonitor(
  id: string,
  userId: string,
  patch: UpdateMonitorInput,
): Promise<UptimeMonitor | null> {
  const existing = await getMonitorById(id, userId);
  if (!existing) return null;

  const now = new Date().toISOString();
  let authEncrypted: string | null | undefined;
  if (patch.auth !== undefined) {
    authEncrypted = encryptAuth(patch.auth);
  }

  await dbRun(
    `UPDATE uptime_monitors SET
      name = ?, monitor_type = ?, url = ?, method = ?,
      interval_seconds = ?, timeout_ms = ?,
      expected_status_min = ?, expected_status_max = ?,
      keyword = ?, keyword_present = ?, port = ?, cron_job_name = ?,
      ssl_warn_days = ?, auth_type = ?,
      auth_config_encrypted = COALESCE(?, auth_config_encrypted),
      headers_json = ?, enabled = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      patch.name?.trim() ?? existing.name,
      patch.monitorType ?? existing.monitorType,
      patch.url?.trim() ?? existing.url,
      (patch.method ?? existing.method).toUpperCase(),
      patch.intervalSeconds ?? existing.intervalSeconds,
      patch.timeoutMs ?? existing.timeoutMs,
      patch.expectedStatusMin ?? existing.expectedStatusMin,
      patch.expectedStatusMax ?? existing.expectedStatusMax,
      patch.keyword !== undefined
        ? patch.keyword.trim() || null
        : existing.keyword,
      patch.keywordPresent !== undefined
        ? patch.keywordPresent
          ? 1
          : 0
        : existing.keywordPresent
          ? 1
          : 0,
      patch.port !== undefined ? patch.port : existing.port,
      patch.cronJobName !== undefined
        ? patch.cronJobName.trim() || null
        : existing.cronJobName,
      patch.sslWarnDays ?? existing.sslWarnDays,
      patch.authType ?? existing.authType,
      authEncrypted ?? null,
      JSON.stringify(patch.headers ?? existing.headers),
      patch.enabled !== undefined
        ? patch.enabled
          ? 1
          : 0
        : existing.enabled
          ? 1
          : 0,
      now,
      id,
      userId,
    ],
  );

  return getMonitorById(id, userId);
}

export async function deleteMonitor(
  id: string,
  userId: string,
): Promise<boolean> {
  await dbRun(`DELETE FROM uptime_check_results WHERE monitor_id = ?`, [id]);
  const result = await dbRun(
    `DELETE FROM uptime_monitors WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  return (result.changes ?? 0) > 0;
}

export async function listDueMonitors(limit = 50): Promise<
  (UptimeMonitor & { auth: UptimeAuthConfig | null })[]
> {
  const rows = await dbAll<MonitorRow>(
    `SELECT * FROM uptime_monitors
     WHERE enabled = 1
     ORDER BY last_checked_at IS NULL DESC, last_checked_at ASC
     LIMIT ?`,
    [limit * 4],
  );

  const now = Date.now();
  const due = rows
    .filter((row) => {
      if (!row.last_checked_at) return true;
      const ageMs = now - new Date(row.last_checked_at).getTime();
      return ageMs >= row.interval_seconds * 1000;
    })
    .slice(0, limit);

  return due.map((row) => ({
    ...mapRow(row),
    auth: decryptMonitorAuth(row.auth_config_encrypted),
  }));
}

export async function recordCheckResult(input: {
  monitorId: string;
  status: MonitorStatus;
  latencyMs: number | null;
  statusCode: number | null;
  message: string | null;
  metadata?: Record<string, unknown>;
}): Promise<UptimeCheckResult> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const isUp = input.status === "up" || input.status === "degraded";

  await dbRun(
    `INSERT INTO uptime_check_results
     (id, monitor_id, status, latency_ms, status_code, message, metadata, checked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.monitorId,
      input.status,
      input.latencyMs,
      input.statusCode,
      input.message,
      JSON.stringify(input.metadata ?? {}),
      now,
    ],
  );

  const monitor = await dbGet<{ consecutive_failures: number }>(
    `SELECT consecutive_failures FROM uptime_monitors WHERE id = ?`,
    [input.monitorId],
  );
  const failures = isUp
    ? 0
    : (monitor?.consecutive_failures ?? 0) + 1;

  await dbRun(
    `UPDATE uptime_monitors SET
      last_status = ?, last_checked_at = ?, last_latency_ms = ?,
      last_error = ?, consecutive_failures = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.status,
      now,
      input.latencyMs,
      isUp ? null : input.message,
      failures,
      now,
      input.monitorId,
    ],
  );

  return {
    id,
    monitorId: input.monitorId,
    status: input.status,
    latencyMs: input.latencyMs,
    statusCode: input.statusCode,
    message: input.message,
    metadata: input.metadata ?? {},
    checkedAt: now,
  };
}

export async function listCheckHistory(
  monitorId: string,
  userId: string,
  limit = 50,
): Promise<UptimeCheckResult[]> {
  const monitor = await getMonitorById(monitorId, userId);
  if (!monitor) return [];

  const rows = await dbAll<ResultRow>(
    `SELECT * FROM uptime_check_results
     WHERE monitor_id = ?
     ORDER BY checked_at DESC
     LIMIT ?`,
    [monitorId, limit],
  );
  return rows.map(mapResult);
}

export async function getMonitorAuthForRun(
  monitor: UptimeMonitor,
): Promise<UptimeAuthConfig | null> {
  const row = await dbGet<{ auth_config_encrypted: string | null }>(
    `SELECT auth_config_encrypted FROM uptime_monitors WHERE id = ?`,
    [monitor.id],
  );
  return decryptMonitorAuth(row?.auth_config_encrypted ?? null);
}
