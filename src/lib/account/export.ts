import { strToU8, zipSync } from "fflate";
import { randomUUID } from "crypto";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { getBillingByUserId } from "@/lib/billing/store";
import { listWorkspacesForUser, toSnapshot } from "@/lib/server/workspace";
import { buildPromptExportRecords } from "@/lib/prompts/export-data";

export type ExportJobRow = {
  id: string;
  user_id: string;
  status: string;
  export_data: string | null;
  error_message: string | null;
  expires_at: string;
  created_at: string;
  completed_at: string | null;
};

async function buildUserExportZip(userId: string): Promise<Buffer> {
  const billing = await getBillingByUserId(userId);
  const accountRow = await dbGet<{ email: string | null; created_at: string }>(
    `SELECT email, created_at FROM user_accounts WHERE user_id = ?`,
    [userId],
  );
  const referral = await dbGet<{ email: string | null; created_at: string }>(
    `SELECT email, created_at FROM user_referrals WHERE user_id = ?`,
    [userId],
  );

  const workspaces = await listWorkspacesForUser(userId, 500);
  const workspaceSnapshots = workspaces.map((ws) => toSnapshot(ws));

  const audits = await dbAll<Record<string, unknown>>(
    `SELECT ar.* FROM audit_runs ar
     JOIN workspaces w ON w.id = ar.workspace_id
     WHERE w.user_id = ?
     ORDER BY ar.created_at DESC`,
    [userId],
  );

  const auditShares = await dbAll<Record<string, unknown>>(
    `SELECT ash.* FROM audit_shares ash
     JOIN workspaces w ON w.id = ash.workspace_id
     WHERE w.user_id = ?`,
    [userId],
  );

  const prompts = workspaceSnapshots.flatMap((ws) =>
    buildPromptExportRecords(ws),
  );

  const account = {
    userId,
    email: accountRow?.email ?? referral?.email ?? null,
    plan: billing?.plan ?? "free",
    billingStatus: billing?.status ?? "inactive",
    memberSince: referral?.created_at ?? accountRow?.created_at ?? null,
    exportedAt: new Date().toISOString(),
  };

  const files: Record<string, Uint8Array> = {
    "account.json": strToU8(JSON.stringify(account, null, 2)),
    "workspaces.json": strToU8(JSON.stringify(workspaceSnapshots, null, 2)),
    "audits.json": strToU8(JSON.stringify(audits, null, 2)),
    "prompts.json": strToU8(JSON.stringify(prompts, null, 2)),
  };

  for (const report of auditShares) {
    const token = String(report.token ?? report.id ?? "report");
    files[`reports/${token}.json`] = strToU8(JSON.stringify(report, null, 2));
  }

  const zipped = zipSync(files);
  return Buffer.from(zipped);
}

export async function createExportJob(userId: string): Promise<{ jobId: string }> {
  const jobId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  await dbRun(
    `INSERT INTO account_export_jobs (id, user_id, status, expires_at, created_at)
     VALUES (?, ?, 'processing', ?, ?)`,
    [jobId, userId, expiresAt, now.toISOString()],
  );

  try {
    const zip = await buildUserExportZip(userId);
    await dbRun(
      `UPDATE account_export_jobs
       SET status = 'ready', export_data = ?, completed_at = ?
       WHERE id = ? AND user_id = ?`,
      [zip.toString("base64"), new Date().toISOString(), jobId, userId],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    await dbRun(
      `UPDATE account_export_jobs SET status = 'failed', error_message = ? WHERE id = ?`,
      [message, jobId],
    );
  }

  return { jobId };
}

export async function getExportJob(
  jobId: string,
  userId: string,
): Promise<ExportJobRow | undefined> {
  return dbGet<ExportJobRow>(
    `SELECT * FROM account_export_jobs WHERE id = ? AND user_id = ?`,
    [jobId, userId],
  );
}

export function exportJobZipBuffer(job: ExportJobRow): Buffer | null {
  if (!job.export_data) return null;
  return Buffer.from(job.export_data, "base64");
}
