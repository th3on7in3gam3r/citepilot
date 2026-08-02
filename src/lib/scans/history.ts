import { dbAll } from "@/lib/db";
import type { AuditTrigger } from "@/lib/scans/types";

export type ScanHistoryEntry = {
  id: string;
  createdAt: string;
  trigger: AuditTrigger;
  durationMs: number | null;
  promptsScanned: number;
  citationRate: number;
  scoreDelta: number | null;
};

function triggerLabel(trigger: string): AuditTrigger {
  if (
    trigger === "manual" ||
    trigger === "scheduled" ||
    trigger === "bulk" ||
    trigger === "api"
  ) {
    return trigger;
  }
  return "manual";
}

export async function getScanHistory(
  workspaceId: string,
  limit = 50,
): Promise<ScanHistoryEntry[]> {
  const rows = await dbAll<{
    id: string;
    created_at: string;
    trigger: string;
    duration_ms: number | null;
    total_prompts: number;
    cited_count: number;
    score: number;
  }>(
    `SELECT id, created_at, trigger, duration_ms, total_prompts, cited_count, score
     FROM audit_runs
     WHERE workspace_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [workspaceId, limit],
  );

  return rows.map((row, index) => {
    const previous = rows[index + 1];
    const total = Math.max(row.total_prompts, 1);
    return {
      id: row.id,
      createdAt: row.created_at,
      trigger: triggerLabel(row.trigger),
      durationMs: row.duration_ms,
      promptsScanned: row.total_prompts,
      citationRate: Math.round((row.cited_count / total) * 100),
      scoreDelta: previous ? row.score - previous.score : null,
    };
  });
}
