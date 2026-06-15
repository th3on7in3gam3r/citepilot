import { dbAll, dbGet } from "@/lib/db";
import { cronPeriodKey } from "@/lib/cron/dispatch-log";
import { isEmailConfigured } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import {
  fetchMrrSummary,
  formatUsd,
  gatherSignupBreakdown,
} from "@/lib/ops/ops-metrics";
import { fetchSentryOpsStats } from "@/lib/observability/sentry-stats";
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
  signups: {
    free: number;
    pilot: number;
    fleet: number;
    total: number;
  };
  mrr: {
    configured: boolean;
    currentMrrCents: number;
    changeCents: number | null;
    activeSubscriptions: number;
    detail?: string;
  };
  sentry: Awaited<ReturnType<typeof fetchSentryOpsStats>>;
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
    signups: await gatherSignupBreakdown(since, until),
    mrr: await fetchMrrSummary(since, until),
    sentry: await fetchSentryOpsStats(7),
  };
}

function opsReportHtml(stats: OpsReportStats): string {
  const app = appBaseUrl();
  const failures =
    stats.cronFailureSamples.length === 0
      ? "<p style=\"color:#64748b;font-size:14px\">No cron failures in this period.</p>"
      : `<ul style="padding-left:18px;margin:0">${stats.cronFailureSamples
          .map(
            (f) =>
              `<li style="margin-bottom:10px"><strong>${f.jobName}</strong>${f.domain ? ` · ${f.domain}` : ""}<br/><span style="color:#64748b;font-size:13px">${f.error}</span></li>`,
          )
          .join("")}</ul>`;

  const mrrChange =
    stats.mrr.changeCents == null
      ? "—"
      : `${stats.mrr.changeCents >= 0 ? "+" : ""}${formatUsd(stats.mrr.changeCents)}`;

  const sentryBlock = !stats.sentry.configured
    ? `<p style="color:#64748b;font-size:14px">${stats.sentry.detail ?? "Sentry API not configured."}</p>`
    : `<ul style="margin:0;padding-left:18px">
        <li>Error rate (7d): <strong>${stats.sentry.errorRatePercent != null ? `${stats.sentry.errorRatePercent}%` : "—"}</strong></li>
        <li>Tracked error events: <strong>${stats.sentry.totalEvents ?? "—"}</strong></li>
      </ul>
      ${
        stats.sentry.topErrors.length === 0
          ? `<p style="color:#64748b;font-size:14px;margin-top:12px">No unresolved issues in the top slot this week.</p>`
          : `<ol style="margin:12px 0 0;padding-left:20px">${stats.sentry.topErrors
              .map(
                (e) =>
                  `<li style="margin-bottom:8px"><strong>${e.title}</strong> — ${e.count} events</li>`,
              )
              .join("")}</ol>`
      }`;

  return `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#0f172a;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc">
<div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px">
<h1 style="font-size:22px;margin:0 0 4px">CitePilot weekly ops digest</h1>
<p style="color:#64748b;font-size:13px;margin:0">${stats.periodStart.slice(0, 10)} → ${stats.periodEnd.slice(0, 10)} (UTC)</p>

<h2 style="font-size:15px;margin:28px 0 12px;color:#0284c7">New signups</h2>
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">Free</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right"><strong>${stats.signups.free}</strong></td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">Pilot</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right"><strong>${stats.signups.pilot}</strong></td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">Fleet</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right"><strong>${stats.signups.fleet}</strong></td></tr>
<tr><td style="padding:8px 0">Total</td><td style="padding:8px 0;text-align:right"><strong>${stats.signups.total}</strong></td></tr>
</table>

<h2 style="font-size:15px;margin:28px 0 12px;color:#0284c7">Revenue (Stripe)</h2>
<ul style="margin:0;padding-left:18px;font-size:14px">
<li>Current MRR: <strong>${stats.mrr.configured ? formatUsd(stats.mrr.currentMrrCents) : "—"}</strong></li>
<li>MRR change (est.): <strong>${stats.mrr.configured ? mrrChange : "—"}</strong></li>
<li>Active subscriptions: <strong>${stats.mrr.configured ? stats.mrr.activeSubscriptions : "—"}</strong></li>
</ul>
${stats.mrr.detail && !stats.mrr.configured ? `<p style="color:#64748b;font-size:13px;margin-top:8px">${stats.mrr.detail}</p>` : ""}

<h2 style="font-size:15px;margin:28px 0 12px;color:#0284c7">Audits</h2>
<ul style="margin:0;padding-left:18px;font-size:14px">
<li><strong>${stats.auditsTotal}</strong> audits this week</li>
<li>${stats.auditsManual} manual · ${stats.auditsScheduled} scheduled</li>
</ul>

<h2 style="font-size:15px;margin:28px 0 12px;color:#0284c7">Errors (Sentry)</h2>
${sentryBlock}

<h2 style="font-size:15px;margin:28px 0 12px;color:#0284c7">Cron</h2>
<ul style="margin:0;padding-left:18px;font-size:14px">
<li>Weekly digest: <strong>${stats.digestSent}</strong> sent, <strong>${stats.digestFailed}</strong> failed</li>
<li>Weekly rescan: <strong>${stats.rescanScanned}</strong> scanned, <strong>${stats.rescanErrors}</strong> errors</li>
<li>Dispatch failures: <strong>${stats.cronFailureCount}</strong></li>
</ul>
${failures}

<p style="margin-top:32px;font-size:12px;color:#94a3b8"><a href="${app}/admin" style="color:#0284c7">Admin</a> · <a href="${app}/status" style="color:#0284c7">Status</a></p>
</div>
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
    `Signups: Free ${stats.signups.free}, Pilot ${stats.signups.pilot}, Fleet ${stats.signups.fleet}`,
    `MRR: ${stats.mrr.configured ? formatUsd(stats.mrr.currentMrrCents) : "n/a"} (change est. ${stats.mrr.changeCents != null ? formatUsd(stats.mrr.changeCents) : "n/a"})`,
    `Audits: ${stats.auditsTotal} (${stats.auditsManual} manual, ${stats.auditsScheduled} scheduled)`,
    `Sentry: ${stats.sentry.configured ? `${stats.sentry.errorRatePercent ?? "n/a"}% error rate` : "not configured"}`,
    `Digest: ${stats.digestSent} sent, ${stats.digestFailed} failed`,
    `Rescan: ${stats.rescanScanned} scanned, ${stats.rescanErrors} errors`,
    `Cron failures: ${stats.cronFailureCount}`,
  ].join("\n");

  const result = await sendEmail({
    to,
    subject: `CitePilot ops — ${stats.signups.total} signups, ${stats.auditsTotal} audits`,
    html: opsReportHtml(stats),
    text,
  });

  return result.ok ? { ok: true, stats } : { ok: false, error: result.error, stats };
}

export { OPS_REPORT_JOB, RESCAN_BATCH_JOB, DIGEST_BATCH_JOB };
