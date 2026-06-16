import { v4 as uuidv4 } from "uuid";
import type { PlatformProbeResult } from "@/lib/audit/platform-probes";
import { dbAll, dbRun } from "@/lib/db";

export async function persistPlatformChecks(
  auditId: string,
  workspaceId: string | null,
  checks: PlatformProbeResult[],
  createdAt: string,
): Promise<void> {
  for (const check of checks) {
    await dbRun(
      `INSERT INTO platform_citation_checks (
        id, audit_id, workspace_id, platform, prompt_index, prompt, cited, check_mode, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
};

export async function getPlatformChecksForAudit(
  auditId: string,
): Promise<StoredPlatformCheck[]> {
  const rows = await dbAll<{
    platform: string;
    prompt_index: number;
    prompt: string;
    cited: number;
    check_mode: string;
  }>(
    `SELECT platform, prompt_index, prompt, cited, check_mode
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
  }));
}
