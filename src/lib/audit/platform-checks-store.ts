import { v4 as uuidv4 } from "uuid";
import type { PlatformProbeResult } from "@/lib/audit/platform-probes";
import { dbRun } from "@/lib/db";

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
