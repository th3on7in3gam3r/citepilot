import { dbAll, dbRun } from "@/lib/db";
import { advanceNextScanAt } from "@/lib/scans/schedule";
import { queueWorkspaceScan } from "@/lib/scans/queue";
import { parsePreferences } from "@/lib/settings";
import { isPaidPlan } from "@/lib/billing/types";
import { getBillingByUserId } from "@/lib/billing/store";

type DueWorkspaceRow = {
  id: string;
  user_id: string | null;
  preferences: string;
  next_scan_at: string | null;
  status: string | null;
};

export async function runScheduledScansBatch(): Promise<{
  queued: number;
  skipped: number;
  errors: number;
}> {
  const now = new Date().toISOString();
  const rows = await dbAll<DueWorkspaceRow>(
    `SELECT id, user_id, preferences, next_scan_at, status
     FROM workspaces
     WHERE archived_at IS NULL
       AND user_id IS NOT NULL
       AND status != 'paused'
       AND next_scan_at IS NOT NULL
       AND next_scan_at <= ?`,
    [now],
  );

  let queued = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    if (!row.user_id) {
      skipped++;
      continue;
    }

    const billing = await getBillingByUserId(row.user_id);
    if (!isPaidPlan(billing)) {
      skipped++;
      continue;
    }

    const prefs = parsePreferences(row.preferences);
    try {
      const result = await queueWorkspaceScan({
        workspaceId: row.id,
        userId: row.user_id,
        trigger: "scheduled",
      });

      const nextAt = advanceNextScanAt(
        prefs.scanSchedule,
        row.next_scan_at ?? now,
      );

      await dbRun(
        `UPDATE workspaces SET next_scan_at = ?, updated_at = ? WHERE id = ?`,
        [nextAt, new Date().toISOString(), row.id],
      );

      if (result.ok) {
        queued++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error("[cron] scheduled scan failed", row.id, err);
      errors++;
    }
  }

  return { queued, skipped, errors };
}
