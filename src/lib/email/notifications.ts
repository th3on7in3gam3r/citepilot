import type { AuditPayload } from "@/lib/api-types";
import {
  buildDeltaFromAudits,
  type CompetitorMoveDelta,
} from "@/lib/audit/competitor-delta";
import { createAuditShare } from "@/lib/audit/share";
import {
  buildScanDeltaSummary,
  type ScanDeltaSummary,
} from "@/lib/audit/scan-delta";
import {
  getPreviousAuditScore,
  getRecentAuditsForWorkspace,
} from "@/lib/audit/run-audit";
import { userHasPilotAccess } from "@/lib/billing/access";
import {
  cronPeriodKey,
  recordCronDispatch,
  wasCronDispatched,
} from "@/lib/cron/dispatch-log";
import { appBaseUrl } from "@/lib/stripe/config";
import { dashboardUrl } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { dbAll, dbGet } from "@/lib/db";
import { parsePreferences, type WorkspacePreferences } from "@/lib/settings";
import { getWorkspaceById } from "@/lib/server/workspace";

const SCORE_DROP_THRESHOLD = 5;
const DIGEST_JOB = "weekly-digest";

function recipientEmail(
  preferences: WorkspacePreferences,
  fallbackEmail?: string | null,
): string | null {
  const monitoring = preferences.monitoringEmail?.trim();
  if (monitoring) return monitoring;
  return fallbackEmail?.trim() || null;
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
${body}
<p style="margin-top:32px;font-size:12px;color:#666"><a href="${dashboardUrl("/dashboard/analytics")}">Open CitePilot analytics</a></p>
</body></html>`;
}

function competitorMoveHtml(
  domain: string,
  delta: CompetitorMoveDelta,
  competitors: string[],
): string {
  const parts: string[] = [
    `<p>Competitive movement detected for <strong>${domain}</strong> since your last audit.</p>`,
  ];

  if (delta.scoreDelta != null) {
    parts.push(
      `<p>Citation score: <strong>${delta.scoreDelta >= 0 ? "+" : ""}${delta.scoreDelta}</strong> points</p>`,
    );
  }

  if (delta.promptsLost.length > 0) {
    parts.push(
      `<p><strong>Prompts you lost</strong> (no longer cited):</p><ul>${delta.promptsLost
        .slice(0, 5)
        .map((p) => `<li>${p.prompt}</li>`)
        .join("")}</ul>`,
    );
  }

  if (delta.promptsWon.length > 0) {
    parts.push(
      `<p><strong>Prompts you gained</strong>:</p><ul>${delta.promptsWon
        .slice(0, 5)
        .map((p) => `<li>${p.prompt}</li>`)
        .join("")}</ul>`,
    );
  }

  if (delta.platformLosses.length > 0) {
    parts.push(
      `<p><strong>Platform visibility slipped</strong>:</p><ul>${delta.platformLosses
        .map(
          (p) =>
            `<li>${p.platform}: ${p.previousShare}% → ${p.currentShare}%</li>`,
        )
        .join("")}</ul>`,
    );
  }

  if (delta.newCompetitorGaps.length > 0) {
    parts.push(
      `<p><strong>New competitor-related gaps</strong>:</p><ul>${delta.newCompetitorGaps
        .slice(0, 5)
        .map((g) => `<li>${g}</li>`)
        .join("")}</ul>`,
    );
  }

  if (competitors.length > 0) {
    parts.push(
      `<p>Tracked competitors: ${competitors.slice(0, 6).join(", ")}</p>`,
    );
  }

  return parts.join("");
}

function scanDeltaSummaryHtml(delta: ScanDeltaSummary): string {
  if (!delta.available || delta.chips.length === 0) {
    return "<p>No major prompt or gap changes vs your prior scan.</p>";
  }
  return `<p><strong>Since last scan:</strong> ${delta.chips.join(" · ")}</p>`;
}

export async function sendProofReportEmail(input: {
  domain: string;
  to: string;
  auditId: string;
  workspaceId: string;
  userId: string | null;
  audit: AuditPayload;
  previousAudit: AuditPayload | null;
  competitors: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const delta = buildScanDeltaSummary({
    current: input.audit,
    previous: input.previousAudit,
    trackedCompetitors: input.competitors,
  });

  const proofUrl = `${appBaseUrl()}/report/proof`;
  const share = await createAuditShare({
    auditId: input.auditId,
    workspaceId: input.workspaceId,
    userId: input.userId,
  });
  const shareBlock =
    "url" in share
      ? `<p><strong>Client share link</strong> (read-only audit view):<br/><a href="${share.url}">${share.url}</a></p>`
      : "";

  return sendEmail({
    to: input.to,
    subject: `Weekly scan — ${input.domain} (${input.audit.score}/100)`,
    html: layout(
      `Weekly scan — ${input.domain}`,
      `${scanDeltaSummaryHtml(delta)}
<p>Score: <strong>${input.audit.score}/100</strong> · ${input.audit.cited}/${input.audit.total} prompts cited</p>
<p>Top gaps:</p><ul>${input.audit.gaps.slice(0, 5).map((g) => `<li>${g}</li>`).join("")}</ul>
<p><a href="${proofUrl}"><strong>Open proof report</strong></a> — print or save as PDF for stakeholders.</p>
${shareBlock}`,
    ),
    text: `Weekly scan for ${input.domain}: ${input.audit.score}/100. Proof report: ${proofUrl}`,
  });
}

export async function sendCompetitorMoveEmail(input: {
  domain: string;
  to: string;
  delta: CompetitorMoveDelta;
  competitors: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const subject =
    input.delta.promptsLost.length > 0
      ? `Competitor alert — you lost citations on ${input.domain}`
      : `Competitor alert — movement detected for ${input.domain}`;

  return sendEmail({
    to: input.to,
    subject,
    html: layout(`Competitor alert — ${input.domain}`, competitorMoveHtml(
      input.domain,
      input.delta,
      input.competitors,
    )),
    text: `Competitor movement on ${input.domain}`,
  });
}

export async function sendAuditCompleteEmail(input: {
  workspaceId: string;
  audit: AuditPayload;
  userEmail?: string | null;
}): Promise<void> {
  const ws = await getWorkspaceById(input.workspaceId, null);
  if (!ws) return;

  const prefs = ws.preferences;
  const to = recipientEmail(prefs, input.userEmail);
  if (!to) return;

  const previousScore = await getPreviousAuditScore(
    input.workspaceId,
    input.audit.id,
  );
  const deltaScore =
    previousScore != null ? input.audit.score - previousScore : null;
  const dropped =
    deltaScore != null && deltaScore <= -SCORE_DROP_THRESHOLD;

  if (dropped && prefs.scoreDropAlerts) {
    await sendEmail({
      to,
      subject: `Citation score dropped for ${input.audit.domain} (${input.audit.score}/100)`,
      html: layout(
        `Score alert — ${input.audit.domain}`,
        `<p>Your citation score changed from <strong>${previousScore}</strong> to <strong>${input.audit.score}</strong> (${deltaScore} points).</p>
<ul>${input.audit.gaps.slice(0, 4).map((g) => `<li>${g}</li>`).join("")}</ul>
<p>Competitors tracked: ${ws.competitors.length ? ws.competitors.join(", ") : "none yet"}</p>`,
      ),
      text: `Score dropped to ${input.audit.score} for ${input.audit.domain}`,
    });
  } else if (prefs.auditCompleteEmail) {
    await sendEmail({
      to,
      subject: `GEO audit complete — ${input.audit.domain} scored ${input.audit.score}/100`,
      html: layout(
        `Audit complete — ${input.audit.domain}`,
        `<p>Score: <strong>${input.audit.score}/100</strong> · ${input.audit.cited}/${input.audit.total} prompts cited</p>
${deltaScore != null ? `<p>Change since last audit: ${deltaScore >= 0 ? "+" : ""}${deltaScore}</p>` : ""}
<p>Top gaps:</p><ul>${input.audit.gaps.slice(0, 5).map((g) => `<li>${g}</li>`).join("")}</ul>`,
      ),
      text: `Audit complete: ${input.audit.score}/100 for ${input.audit.domain}`,
    });
  }

  if (!prefs.competitorMoveAlerts) return;

  const owner = await dbGet<{ user_id: string | null }>(
    `SELECT user_id FROM workspaces WHERE id = ?`,
    [input.workspaceId],
  );
  const paid = owner?.user_id
    ? await userHasPilotAccess(owner.user_id)
    : false;
  if (!paid) return;

  const audits = await getRecentAuditsForWorkspace(input.workspaceId, 2);
  const previous =
    audits.find((a) => a.id !== input.audit.id) ?? audits[1] ?? null;
  const moveDelta = buildDeltaFromAudits(
    input.audit,
    previous,
    ws.competitors,
  );

  if (!moveDelta.hasChanges) return;

  await sendCompetitorMoveEmail({
    domain: input.audit.domain,
    to,
    delta: moveDelta,
    competitors: ws.competitors,
  }).then((result) => {
    if (!result.ok) {
      console.error(
        `[email] Competitor move alert failed for workspace ${input.workspaceId}:`,
        result.error,
      );
    }
  });
}

/** After a scheduled weekly re-scan — proof report + optional share link (Pilot+). */
export async function sendScheduledProofReportEmail(input: {
  workspaceId: string;
  audit: AuditPayload;
  userId: string | null;
  userEmail?: string | null;
}): Promise<void> {
  const ws = await getWorkspaceById(input.workspaceId, input.userId);
  if (!ws) return;

  if (!ws.preferences.proofReportEmail) return;

  const paid = input.userId
    ? await userHasPilotAccess(input.userId)
    : false;
  if (!paid) return;

  const to = recipientEmail(ws.preferences, input.userEmail);
  if (!to) return;

  const audits = await getRecentAuditsForWorkspace(input.workspaceId, 2);
  const previous =
    audits.find((a) => a.id !== input.audit.id) ?? audits[1] ?? null;

  const result = await sendProofReportEmail({
    domain: input.audit.domain,
    to,
    auditId: input.audit.id,
    workspaceId: input.workspaceId,
    userId: input.userId,
    audit: input.audit,
    previousAudit: previous,
    competitors: ws.competitors,
  });

  if (!result.ok) {
    console.error(
      `[email] Proof report email failed for workspace ${input.workspaceId}:`,
      result.error,
    );
  }
}

export async function sendWeeklyDigestEmail(input: {
  domain: string;
  buyerQuestion: string;
  competitors: string[];
  score: number;
  previousScore: number | null;
  gaps: string[];
  to: string;
}): Promise<{ ok: boolean; error?: string }> {
  const delta =
    input.previousScore != null
      ? input.score - input.previousScore
      : null;

  return sendEmail({
    to: input.to,
    subject: `Weekly citation digest — ${input.domain}`,
    html: layout(
      `Weekly digest — ${input.domain}`,
      `<p>Citation score: <strong>${input.score}/100</strong>${
        delta != null
          ? ` (${delta >= 0 ? "+" : ""}${delta} vs last week)`
          : ""
      }</p>
<p>Money prompt: <em>${input.buyerQuestion || "—"}</em></p>
<p>Priority gaps:</p><ul>${input.gaps.slice(0, 5).map((g) => `<li>${g}</li>`).join("")}</ul>
${
  input.competitors.length
    ? `<p>Competitors on your radar: ${input.competitors.slice(0, 5).join(", ")}</p>`
    : ""
}`,
    ),
    text: `Weekly digest for ${input.domain}: score ${input.score}/100`,
  });
}

type WorkspaceRow = {
  id: string;
  domain: string;
  buyer_question: string | null;
  competitors: string;
  preferences: string;
  user_id: string | null;
};

export type WeeklyDigestBatchResult = {
  sent: number;
  skipped: number;
  failed: number;
  alreadySent: number;
  errors: { workspaceId: string; domain: string; error: string }[];
};

export async function runWeeklyDigestBatch(): Promise<WeeklyDigestBatchResult> {
  const rows = await dbAll<WorkspaceRow>(`SELECT * FROM workspaces`);
  const periodKey = cronPeriodKey(DIGEST_JOB);
  const result: WeeklyDigestBatchResult = {
    sent: 0,
    skipped: 0,
    failed: 0,
    alreadySent: 0,
    errors: [],
  };

  console.info(`[cron] ${DIGEST_JOB} started period=${periodKey} workspaces=${rows.length}`);

  for (const row of rows) {
    const prefs = parsePreferences(row.preferences);
    if (!prefs.weeklyDigest) {
      result.skipped++;
      continue;
    }

    const to = prefs.monitoringEmail?.trim();
    if (!to) {
      result.skipped++;
      await recordCronDispatch({
        jobName: DIGEST_JOB,
        workspaceId: row.id,
        periodKey,
        status: "skipped",
        error: "no monitoring email",
      });
      continue;
    }

    if (await wasCronDispatched(DIGEST_JOB, row.id, periodKey)) {
      result.alreadySent++;
      result.skipped++;
      continue;
    }

    const audits = await dbAll<{ score: number; created_at: string }>(
      `SELECT score, created_at FROM audit_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 2`,
      [row.id],
    );
    if (audits.length === 0) {
      result.skipped++;
      await recordCronDispatch({
        jobName: DIGEST_JOB,
        workspaceId: row.id,
        periodKey,
        status: "skipped",
        error: "no audits",
      });
      continue;
    }

    const competitors = JSON.parse(row.competitors || "[]") as string[];
    const latest = await getWorkspaceById(row.id, row.user_id);
    const gaps = latest?.latestAudit?.gaps ?? [];

    try {
      const sendResult = await sendWeeklyDigestEmail({
        domain: row.domain,
        buyerQuestion: row.buyer_question ?? "",
        competitors,
        score: audits[0]!.score,
        previousScore: audits[1]?.score ?? null,
        gaps,
        to,
      });

      if (sendResult.ok) {
        result.sent++;
        await recordCronDispatch({
          jobName: DIGEST_JOB,
          workspaceId: row.id,
          periodKey,
          status: "sent",
        });
      } else {
        result.failed++;
        const err = sendResult.error ?? "send failed";
        result.errors.push({ workspaceId: row.id, domain: row.domain, error: err });
        console.error(`[cron] ${DIGEST_JOB} failed`, row.domain, err);
        await recordCronDispatch({
          jobName: DIGEST_JOB,
          workspaceId: row.id,
          periodKey,
          status: "failed",
          error: err,
        });
      }
    } catch (err) {
      result.failed++;
      const message = err instanceof Error ? err.message : "unknown error";
      result.errors.push({ workspaceId: row.id, domain: row.domain, error: message });
      console.error(`[cron] ${DIGEST_JOB} exception`, row.domain, err);
      await recordCronDispatch({
        jobName: DIGEST_JOB,
        workspaceId: row.id,
        periodKey,
        status: "failed",
        error: message,
      });
    }
  }

  console.info(
    `[cron] ${DIGEST_JOB} finished sent=${result.sent} skipped=${result.skipped} failed=${result.failed} alreadySent=${result.alreadySent}`,
  );

  return result;
}
