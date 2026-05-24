import { dbAll, dbRun } from "@/lib/db";

export type DedupeReport = {
  removed: number;
  kept: number;
  groups: { domain: string; userId: string | null; removedIds: string[]; keptId: string }[];
};

type WorkspaceRow = {
  id: string;
  domain: string;
  user_id: string | null;
  updated_at: string;
};

function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
}

export async function dedupeAllWorkspaces(): Promise<DedupeReport> {
  const rows = await dbAll<WorkspaceRow>(
    `SELECT id, domain, user_id, updated_at FROM workspaces ORDER BY updated_at DESC`,
  );

  const groups = new Map<string, WorkspaceRow[]>();
  for (const row of rows) {
    const key = `${row.user_id ?? "anon"}::${normalizeDomain(row.domain)}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const report: DedupeReport = { removed: 0, kept: 0, groups: [] };

  for (const [, list] of groups) {
    if (list.length <= 1) {
      report.kept += list.length;
      continue;
    }

    const [keep, ...dupes] = list.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    report.kept += 1;
    const removedIds: string[] = [];

    for (const dup of dupes) {
      await dbRun(`DELETE FROM citation_snapshots WHERE workspace_id = ?`, [
        dup.id,
      ]);
      await dbRun(`DELETE FROM audit_runs WHERE workspace_id = ?`, [dup.id]);
      await dbRun(`DELETE FROM blog_posts WHERE workspace_id = ?`, [dup.id]);
      await dbRun(`DELETE FROM backlink_profiles WHERE workspace_id = ?`, [
        dup.id,
      ]);
      await dbRun(`DELETE FROM backlink_sources WHERE workspace_id = ?`, [
        dup.id,
      ]);
      await dbRun(`DELETE FROM backlink_network WHERE workspace_id = ?`, [
        dup.id,
      ]);
      await dbRun(
        `DELETE FROM backlink_placements WHERE requester_workspace_id = ? OR partner_workspace_id = ?`,
        [dup.id, dup.id],
      );
      await dbRun(`DELETE FROM gsc_connections WHERE workspace_id = ?`, [
        dup.id,
      ]);
      await dbRun(`DELETE FROM audit_shares WHERE workspace_id = ?`, [dup.id]);
      await dbRun(`DELETE FROM workspaces WHERE id = ?`, [dup.id]);
      removedIds.push(dup.id);
      report.removed += 1;
    }

    report.groups.push({
      domain: keep.domain,
      userId: keep.user_id,
      keptId: keep.id,
      removedIds,
    });
  }

  return report;
}
