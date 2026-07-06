import { dbAll } from "@/lib/db";
import { isPaidPlan } from "@/lib/billing/types";
import { getBillingByUserId } from "@/lib/billing/store";
import { parsePreferences } from "@/lib/settings";
import { runGrowthLoopForWorkspace } from "@/lib/growth-loop/run";

type GrowthLoopWorkspaceRow = {
  id: string;
  user_id: string | null;
  preferences: string;
  status: string | null;
};

const MAX_PER_RUN = 5;

export async function runGrowthLoopBatch(): Promise<{
  ran: number;
  skipped: number;
  errors: number;
  results: { workspaceId: string; ok: boolean; skipped?: string; error?: string }[];
}> {
  const rows = await dbAll<GrowthLoopWorkspaceRow>(
    `SELECT id, user_id, preferences, status
     FROM workspaces
     WHERE archived_at IS NULL
       AND user_id IS NOT NULL
       AND status != 'paused'`,
  );

  let ran = 0;
  let skipped = 0;
  let errors = 0;
  const results: {
    workspaceId: string;
    ok: boolean;
    skipped?: string;
    error?: string;
  }[] = [];

  for (const row of rows) {
    if (ran >= MAX_PER_RUN) break;

    const prefs = parsePreferences(row.preferences);
    if (!prefs.growthLoop.enabled || !prefs.growthLoop.dailyArticles) {
      continue;
    }

    if (!row.user_id) {
      skipped++;
      continue;
    }

    const billing = await getBillingByUserId(row.user_id);
    if (!isPaidPlan(billing)) {
      skipped++;
      continue;
    }

    try {
      const result = await runGrowthLoopForWorkspace({
        workspaceId: row.id,
        userId: row.user_id,
        trigger: "scheduled",
      });

      results.push({
        workspaceId: row.id,
        ok: result.ok,
        skipped: result.skipped,
        error: result.error,
      });

      if (result.skipped) {
        skipped++;
      } else if (result.ok) {
        ran++;
      } else {
        errors++;
      }
    } catch (err) {
      console.error("[cron] growth loop failed", row.id, err);
      errors++;
      results.push({
        workspaceId: row.id,
        ok: false,
        error: err instanceof Error ? err.message : "Growth Loop failed",
      });
    }
  }

  return { ran, skipped, errors, results };
}
