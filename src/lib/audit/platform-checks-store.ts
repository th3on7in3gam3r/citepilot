import { v4 as uuidv4 } from "uuid";
import type { PlatformProbeResult } from "@/lib/audit/platform-probes";
import { dbAll, dbRun } from "@/lib/db";
import { ensureBrowserScanUsageTable } from "@/lib/scanners/browser-scan-usage";

async function ensureProbeNotesColumn(): Promise<void> {
  await dbRun(
    `ALTER TABLE platform_citation_checks ADD COLUMN probe_notes TEXT`,
  ).catch(() => undefined);
  await dbRun(
    `ALTER TABLE platform_citation_checks ADD COLUMN scan_unavailable INTEGER NOT NULL DEFAULT 0`,
  ).catch(() => undefined);
}

export async function persistPlatformChecks(
  auditId: string,
  workspaceId: string | null,
  checks: PlatformProbeResult[],
  createdAt: string,
): Promise<void> {
  await ensureProbeNotesColumn();
  await ensureBrowserScanUsageTable();

  for (const check of checks) {
    await dbRun(
      `INSERT INTO platform_citation_checks (
        id, audit_id, workspace_id, platform, prompt_index, prompt, cited, check_mode, created_at, probe_notes, scan_unavailable
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        auditId,
        workspaceId,
        check.platform,
        check.promptIndex,
        check.prompt,
        check.cited ? 1 : 0,
        check.checkMode,
        createdAt,
        check.notes ?? null,
        check.scanUnavailable ? 1 : 0,
      ],
    );
  }
}

export type StoredPlatformCheck = {
  platform: string;
  promptIndex: number;
  prompt: string;
  cited: boolean;
  checkMode: "live" | "inferred";
  notes?: string | null;
  scanUnavailable?: boolean;
};

export async function getPlatformChecksForAudit(
  auditId: string,
): Promise<StoredPlatformCheck[]> {
  await ensureProbeNotesColumn();

  const rows = await dbAll<{
    platform: string;
    prompt_index: number;
    prompt: string;
    cited: number;
    check_mode: string;
    probe_notes: string | null;
    scan_unavailable: number | null;
  }>(
    `SELECT platform, prompt_index, prompt, cited, check_mode, probe_notes, scan_unavailable
     FROM platform_citation_checks
     WHERE audit_id = ?
     ORDER BY prompt_index ASC, platform ASC`,
    [auditId],
  );

  return rows.map((row) => ({
    platform: row.platform,
    promptIndex: row.prompt_index,
    prompt: row.prompt,
    cited: row.cited === 1,
    checkMode: row.check_mode === "live" ? "live" : "inferred",
    notes: row.probe_notes,
    scanUnavailable: row.scan_unavailable === 1,
  }));
}
