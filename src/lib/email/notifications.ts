import type { AuditPayload } from "@/lib/api-types";
import { dashboardUrl } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { getPreviousAuditScore } from "@/lib/audit/run-audit";
import { dbAll } from "@/lib/db";
import { parsePreferences, type WorkspacePreferences } from "@/lib/settings";
import { getWorkspaceById } from "@/lib/server/workspace";

const SCORE_DROP_THRESHOLD = 5;

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
<p style="margin-top:32px;font-size:12px;color:#666"><a href="${dashboardUrl()}">Open CitePilot dashboard</a></p>
</body></html>`;
}

export async function sendAuditCompleteEmail(input: {
  workspaceId: string;
  audit: AuditPayload;
  userEmail?: string | null;
}): Promise<void> {
  const ws = await getWorkspaceById(input.workspaceId, null);
  if (!ws) return;

  const prefs = ws.preferences;
  if (!prefs.auditCompleteEmail && !prefs.scoreDropAlerts) return;

  const to = recipientEmail(prefs, input.userEmail);
  if (!to) return;

  const previous = await getPreviousAuditScore(
    input.workspaceId,
    input.audit.id,
  );
  const delta =
    previous != null ? input.audit.score - previous : null;
  const dropped =
    delta != null && delta <= -SCORE_DROP_THRESHOLD;

  if (dropped && prefs.scoreDropAlerts) {
    await sendEmail({
      to,
      subject: `Citation score dropped for ${input.audit.domain} (${input.audit.score}/100)`,
      html: layout(
        `Score alert — ${input.audit.domain}`,
        `<p>Your citation score changed from <strong>${previous}</strong> to <strong>${input.audit.score}</strong> (${delta} points).</p>
<ul>${input.audit.gaps.slice(0, 4).map((g) => `<li>${g}</li>`).join("")}</ul>
<p>Competitors tracked: ${ws.competitors.length ? ws.competitors.join(", ") : "none yet"}</p>`,
      ),
      text: `Score dropped to ${input.audit.score} for ${input.audit.domain}`,
    });
    return;
  }

  if (!prefs.auditCompleteEmail) return;

  await sendEmail({
    to,
    subject: `GEO audit complete — ${input.audit.domain} scored ${input.audit.score}/100`,
    html: layout(
      `Audit complete — ${input.audit.domain}`,
      `<p>Score: <strong>${input.audit.score}/100</strong> · ${input.audit.cited}/${input.audit.total} prompts cited</p>
${delta != null ? `<p>Change since last audit: ${delta >= 0 ? "+" : ""}${delta}</p>` : ""}
<p>Top gaps:</p><ul>${input.audit.gaps.slice(0, 5).map((g) => `<li>${g}</li>`).join("")}</ul>`,
    ),
    text: `Audit complete: ${input.audit.score}/100 for ${input.audit.domain}`,
  });
}

export async function sendWeeklyDigestEmail(input: {
  domain: string;
  buyerQuestion: string;
  competitors: string[];
  score: number;
  previousScore: number | null;
  gaps: string[];
  to: string;
}): Promise<{ ok: boolean }> {
  const delta =
    input.previousScore != null
      ? input.score - input.previousScore
      : null;

  const result = await sendEmail({
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
  return { ok: result.ok };
}

type WorkspaceRow = {
  id: string;
  domain: string;
  buyer_question: string | null;
  competitors: string;
  preferences: string;
  user_id: string | null;
};

export async function runWeeklyDigestBatch(): Promise<{
  sent: number;
  skipped: number;
}> {
  const rows = await dbAll<WorkspaceRow>(`SELECT * FROM workspaces`);
  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    const prefs = parsePreferences(row.preferences);
    if (!prefs.weeklyDigest) {
      skipped++;
      continue;
    }

    const to = prefs.monitoringEmail?.trim();
    if (!to) {
      skipped++;
      continue;
    }

    const audits = await dbAll<{ score: number; created_at: string }>(
      `SELECT score, created_at FROM audit_runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 2`,
      [row.id],
    );
    if (audits.length === 0) {
      skipped++;
      continue;
    }

    const competitors = JSON.parse(row.competitors || "[]") as string[];
    const latest = await getWorkspaceById(row.id, row.user_id);
    const gaps = latest?.latestAudit?.gaps ?? [];

    const result = await sendWeeklyDigestEmail({
      domain: row.domain,
      buyerQuestion: row.buyer_question ?? "",
      competitors,
      score: audits[0]!.score,
      previousScore: audits[1]?.score ?? null,
      gaps,
      to,
    });
    if (result.ok) sent++;
    else skipped++;
  }

  return { sent, skipped };
}
