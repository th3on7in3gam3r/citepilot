import { userHasFleetAccess } from "@/lib/billing/access";
import { dbGet } from "@/lib/db";

const MANUAL_LIMIT_PILOT = 1;
const MANUAL_LIMIT_FLEET = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export type ManualScanQuota = {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string | null;
};

export async function getManualScanQuota(
  workspaceId: string,
  userId: string,
): Promise<ManualScanQuota> {
  const isFleet = await userHasFleetAccess(userId);
  const limit = isFleet ? MANUAL_LIMIT_FLEET : MANUAL_LIMIT_PILOT;
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const row = await dbGet<{ c: number | string; oldest: string | null }>(
    `SELECT COUNT(*) as c, MIN(created_at) as oldest
     FROM audit_runs
     WHERE workspace_id = ? AND trigger = 'manual' AND created_at >= ?`,
    [workspaceId, since],
  );

  const used = Number(row?.c ?? 0);
  const remaining = Math.max(0, limit - used);
  let resetsAt: string | null = null;
  if (row?.oldest && used >= limit) {
    resetsAt = new Date(new Date(row.oldest).getTime() + WINDOW_MS).toISOString();
  }

  return { limit, used, remaining, resetsAt };
}

export async function assertManualScanAllowed(
  workspaceId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string; quota: ManualScanQuota }> {
  const quota = await getManualScanQuota(workspaceId, userId);
  if (quota.remaining <= 0) {
    return {
      ok: false,
      message: `Manual scan limit reached (${quota.limit} per workspace per 24 hours).`,
      quota,
    };
  }
  return { ok: true };
}
