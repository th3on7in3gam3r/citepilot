import { dbAll, dbGet } from "@/lib/db";
import { cronPeriodKey } from "@/lib/cron/dispatch-log";
import { isEmailConfigured } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { appBaseUrl } from "@/lib/stripe/config";
import { site } from "@/lib/site";

const OPS_REPORT_JOB = "weekly-ops-report";
const RESCAN_BATCH_JOB = "weekly-rescan-batch";
const DIGEST_BATCH_JOB = "weekly-digest-batch";

export type OpsReportStats = {
  periodStart: string;
  periodEnd: string;
  newWorkspaces: number;
  newWorkspacesWithUser: number;
  auditsTotal: number;
  auditsManual: number;
  auditsScheduled: number;
  digestSent: number;
  digestFailed: number;
  rescanScanned: number;
  rescanErrors: number;
  cronFailureCount: number;
  cronFailureSamples: {
    jobName: string;
    domain: string | null;
    error: string;
    createdAt: string;
  }[];
};

export function opsReportRecipient(): string | null {
  return (
    process.env.OPS_REPORT_EMAIL?.trim() ||
    process.env.ADMIN_OPS_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1]?.trim() ||
    site.supportEmail
  );
}

export async function gatherOpsReportStats(days = 7): Promise<OpsReportStats> {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setUTCDate(periodStart.getUTCDate() - days);
  const since = periodStart.toISOString();
  const until = periodEnd.toISOString();

  const newWs = await dbGet<{ total: number; with_user: number }>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN user_id IS NOT NULL AND user_id != '' THEN 1 ELSE 0 END) AS with_user
     FROM workspaces
     WHERE created_at >= ? AND created_at < ?`,
    [since, until],
  );

  const auditRows = await dbAll<{ trigger: string; count: number }>(
    `SELECT trigger, COUNT(*) AS count FROM audit_runs
     WHERE created_at >= ? AND created_at < ?
     GROUP BY trigger`,
    [since, until],
  );

  let auditsManual = 0;
  let auditsScheduled = 0;
  let auditsTotal = 0;
  for (const row of auditRows) {
    const n = Number(row.count);
    auditsTotal += n;
    if (row.trigger === "scheduled") auditsScheduled += n;
    else auditsManual += n;
  }

  const cronFailures = await dbGet<{ count: number }>(
    `SELECT COUNT(*) AS count FROM cron_dispatch_log
     WHERE status = 'failed' AND created_at >= ? AND created_at < ?`,
    [since, until],
  );

  const cronFailureSamples = await dbAll<{
    job_name: string;
    error: string | null;
    created_at: string;
    domain: string | null;
  }>(
    `SELECT c.job_name, c.error, c.created_at, w.domain
     FROM cron_dispatch_log c
     LEFT JOIN workspaces w ON w.id = c.workspace_id
     WHERE c.status = 'failed' AND c.created_at >= ? AND c.created_at < ?
     ORDER BY c.created_at DESC
     LIMIT 12`,
    [since, until],
  );

  const digestPeriod = cronPeriodKey("weekly-digest");
  const digestStats = await dbAll<{ status: string; count: number }>(
    `SELECT status, COUNT(*) AS count FROM cron_dispatch_log
     WHERE job_name = 'weekly-digest' AND period_key = ?
     GROUP BY status`,
    [digestPeriod],
  );

  let digestSent = 0;
  let digestFailed = 0;
  for (const row of digestStats) {
    if (row.status === "sent") digestSent += Number(row.count);
    if (row.status === "failed") digestFailed += Number(row.count);
  }

  const rescanBatch = await dbGet<{ status: string; error: string | null }>(
    `SELECT status, error FROM cron_dispatch_log
     WHERE job_name = ? AND period_key = ?
     ORDER BY created_at DESC LIMIT 1`,
    [RESCAN_BATCH_JOB, cronPeriodKey(RESCAN_BATCH_JOB)],
  );

  let rescanScanned = 0;
  let rescanErrors = 0;
  if (rescanBatch?.error) {
    const match = /scanned=(\d+).*errors=(\d+)/.exec(rescanBatch.error);
    if (match) {
      rescanScanned = Number(match[1]);
      rescanErrors = Number(match[2]);
    }
  }

  return {
    periodStart: since,
    periodEnd: until,
    newWorkspaces: Number(newWs?.total ?? 0),
    newWorkspacesWithUser: Number(newWs?.with_user ?? 0),
    auditsTotal,
    auditsManual,
    auditsScheduled,
    digestSent,
    digestFailed,
    rescanScanned,
    rescanErrors,
    cronFailureCount: Number(cronFailures?.count ?? 0),
    cronFailureSamples: cronFailureSamples.map((r) => ({
      jobName: r.job_name,
      domain: r.domain,
      error: r.error ?? "unknown",
      createdAt: r.created_at,
    })),
  };
}

function opsReportHtml(stats: OpsReportStats): string {
  const app = appBaseUrl();
  const failures =
    stats.cronFailureSamples.length === 0
      ? "<p>No cron failures in this period.</p>"
      : `<ul>${stats.cronFailureSamples
          .map(
            (f) =>
              `<li><strong>${f.jobName}</strong>${f.domain ? ` · ${f.domain}` : ""} — ${f.error}<br/><span style="color:#666;font-size:12px">${f.createdAt}</span></li>`,
          )
          .join("")}</ul>`;

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:20px">CitePilot weekly ops report</h1>
<p style="color:#666;font-size:13px">${stats.periodStart.slice(0, 10)} → ${stats.periodEnd.slice(0, 10)} (UTC)</p>
<h2 style="font-size:16px;margin-top:24px">Growth</h2>
<ul>
<li><strong>${stats.newWorkspaces}</strong> new workspaces</li>
<li><strong>${stats.newWorkspacesWithUser}</strong> with signed-in owner</li>
</ul>
<h2 style="font-size:16px;margin-top:24px">Audits</h2>
<ul>
<li><strong>${stats.auditsTotal}</strong> total runs</li>
<li>${stats.auditsManual} manual · ${stats.auditsScheduled} scheduled</li>
</ul>
<h2 style="font-size:16px;margin-top:24px">Cron (this week)</h2>
<ul>
<li>Weekly digest: <strong>${stats.digestSent}</strong> sent, <strong>${stats.digestFailed}</strong> failed</li>
<li>Weekly rescan batch: <strong>${stats.rescanScanned}</strong> scanned, <strong>${stats.rescanErrors}</strong> errors</li>
<li>Cron dispatch failures: <strong>${stats.cronFailureCount}</strong></li>
</ul>
${failures}
<p style="margin-top:32px;font-size:12px;color:#666"><a href="${app}/admin">Admin</a> · <a href="${app}/api/health">Health</a></p>
</body></html>`;
}

export async function sendWeeklyOpsReport(): Promise<{
  ok: boolean;
  error?: string;
  stats?: OpsReportStats;
}> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const to = opsReportRecipient();
  if (!to) {
    return { ok: false, error: "OPS_REPORT_EMAIL not configured" };
  }

  const stats = await gatherOpsReportStats(7);
  const text = [
    `CitePilot ops (${stats.periodStart.slice(0, 10)} – ${stats.periodEnd.slice(0, 10)})`,
    `Workspaces: ${stats.newWorkspaces} (${stats.newWorkspacesWithUser} with user)`,
    `Audits: ${stats.auditsTotal} (${stats.auditsManual} manual, ${stats.auditsScheduled} scheduled)`,
    `Digest: ${stats.digestSent} sent, ${stats.digestFailed} failed`,
    `Rescan: ${stats.rescanScanned} scanned, ${stats.rescanErrors} errors`,
    `Cron failures: ${stats.cronFailureCount}`,
  ].join("\n");

  const result = await sendEmail({
    to,
    subject: `CitePilot ops — ${stats.newWorkspaces} workspaces, ${stats.auditsTotal} audits`,
    html: opsReportHtml(stats),
    text,
  });

  return result.ok ? { ok: true, stats } : { ok: false, error: result.error, stats };
}

export { OPS_REPORT_JOB, RESCAN_BATCH_JOB, DIGEST_BATCH_JOB };
