import type { ContentCalendarItem } from "@/lib/dashboard-data";
import { buildContentCalendar } from "@/lib/dashboard-data";
import type { WorkspaceSnapshotResponse } from "@/lib/api-types";
import { dbGet, dbRun } from "@/lib/db";

export type WorkspaceContentStrategy = {
  workspaceId: string;
  auditId: string | null;
  items: ContentCalendarItem[];
  generatedAt: string;
};

export async function upsertContentStrategy(
  workspaceId: string,
  auditId: string | null,
  snapshot: WorkspaceSnapshotResponse,
): Promise<WorkspaceContentStrategy> {
  const items = buildContentCalendar(snapshot);
  const generatedAt = new Date().toISOString();

  await dbRun(
    `INSERT INTO workspace_content_strategies (workspace_id, audit_id, items, generated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(workspace_id) DO UPDATE SET
       audit_id = excluded.audit_id,
       items = excluded.items,
       generated_at = excluded.generated_at`,
    [workspaceId, auditId, JSON.stringify(items), generatedAt],
  );

  return { workspaceId, auditId, items, generatedAt };
}

export async function getContentStrategy(
  workspaceId: string,
): Promise<WorkspaceContentStrategy | null> {
  const row = await dbGet<{
    workspace_id: string;
    audit_id: string | null;
    items: string;
    generated_at: string;
  }>(
    `SELECT workspace_id, audit_id, items, generated_at
     FROM workspace_content_strategies WHERE workspace_id = ?`,
    [workspaceId],
  );
  if (!row) return null;
  let items: ContentCalendarItem[] = [];
  try {
    const parsed = JSON.parse(row.items) as unknown;
    items = Array.isArray(parsed) ? (parsed as ContentCalendarItem[]) : [];
  } catch {
    items = [];
  }
  return {
    workspaceId: row.workspace_id,
    auditId: row.audit_id,
    items,
    generatedAt: row.generated_at,
  };
}
