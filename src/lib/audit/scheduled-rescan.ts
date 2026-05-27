import { runCitationAudit } from "@/lib/audit/run-audit";
import { resolveMonitoredPrompts } from "@/lib/audit/resolve-prompts";
import { sendAuditCompleteEmail } from "@/lib/email/notifications";
import { cronPeriodKey, recordCronDispatch } from "@/lib/cron/dispatch-log";
import { RESCAN_BATCH_JOB } from "@/lib/email/ops-report";
import { planForUser } from "@/lib/billing/limits-server";
import { isPaidPlan } from "@/lib/billing/types";
import { getBillingByUserId } from "@/lib/billing/store";
import { dbAll, dbGet } from "@/lib/db";

const RESCAN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RESCANS_PER_RUN = 4;

type WorkspaceRow = {
  id: string;
  domain: string;
  user_id: string | null;
  buyer_question: string | null;
  competitors: string;
  preferences: string;
};

export async function runScheduledRescanBatch(): Promise<{
  scanned: number;
  skipped: number;
  errors: number;
}> {
  const rows = await dbAll<WorkspaceRow>(
    `SELECT w.id, w.domain, w.user_id, w.buyer_question, w.competitors, w.preferences
     FROM workspaces w
     WHERE w.user_id IS NOT NULL`,
  );

  let scanned = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    if (scanned >= MAX_RESCANS_PER_RUN) break;

    const billing = row.user_id
      ? await getBillingByUserId(row.user_id)
      : null;
    if (!isPaidPlan(billing)) {
      skipped++;
      continue;
    }

    const last = await dbGet<{ created_at: string; prompts: string }>(
      `SELECT created_at, prompts FROM audit_runs
       WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 1`,
      [row.id],
    );

    if (last?.created_at) {
      const age = Date.now() - new Date(last.created_at).getTime();
      if (age < RESCAN_INTERVAL_MS) {
        skipped++;
        continue;
      }
    }

    let monitoredPrompts: string[] | undefined;
    try {
      const prefs = JSON.parse(row.preferences || "{}") as {
        monitoredPrompts?: string[];
      };
      monitoredPrompts = prefs.monitoredPrompts;
    } catch {
      monitoredPrompts = undefined;
    }

    const auditPrompts = last?.prompts
      ? (JSON.parse(last.prompts) as string[])
      : undefined;
    const competitors = JSON.parse(row.competitors || "[]") as string[];
    const prompts = resolveMonitoredPrompts({
      monitoredPrompts,
      buyerQuestion: row.buyer_question ?? "",
      auditPrompts,
    });

    if (prompts.length === 0) {
      skipped++;
      continue;
    }

    const plan = planForUser(billing);

    try {
      const audit = await runCitationAudit({
        domain: row.domain,
        prompts,
        workspaceId: row.id,
        competitors,
        plan,
        trigger: "scheduled",
      });

      void sendAuditCompleteEmail({
        workspaceId: row.id,
        audit,
        userEmail: null,
      }).catch((err) => console.error("Scheduled rescan email failed", err));

      scanned++;
    } catch (err) {
      console.error("Scheduled rescan failed", row.id, err);
      errors++;
    }
  }

  const periodKey = cronPeriodKey(RESCAN_BATCH_JOB);
  await recordCronDispatch({
    jobName: RESCAN_BATCH_JOB,
    workspaceId: null,
    periodKey,
    status: errors > 0 ? "failed" : "sent",
    error: `scanned=${scanned};skipped=${skipped};errors=${errors}`,
  });

  return { scanned, skipped, errors };
}
