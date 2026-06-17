import { userHasFleetAccess } from "@/lib/billing/access";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { parsePreferences } from "@/lib/settings";
import {
  enrichSnapshotWithBacklinks,
  getWorkspaceById,
  toSnapshot,
} from "@/lib/server/workspace";
import { listWorkspaceIdsForMember } from "@/lib/server/workspace-members";

export type WorkspaceStatus = "active" | "paused";

export type WorkspaceListMeta = {
  id: string;
  domain: string;
  displayName: string | null;
  buyerQuestion: string;
  businessType: string;
  updatedAt: string;
  citationScore: number;
  hasRealAudit: boolean;
  promptCount: number;
  lastScanAt: string | null;
  status: WorkspaceStatus;
  archivedAt: string | null;
  scoreDeltaWeek: number | null;
};

export type AgencyOverview = {
  workspaceCount: number;
  weightedCitationScore: number;
  totalPrompts: number;
  activeCount: number;
  pausedCount: number;
  auditedCount: number;
  workspaces: WorkspaceListMeta[];
  needsAttention: {
    id: string;
    domain: string;
    displayName: string | null;
    citationScore: number;
    scoreDeltaWeek: number;
  }[];
  recentActivity: {
    id: string;
    workspaceId: string;
    domain: string;
    score: number;
    createdAt: string;
  }[];
};

type WorkspaceRow = {
  id: string;
  domain: string;
  business_type: string | null;
  buyer_question: string | null;
  preferences: string;
  user_id: string | null;
  display_name: string | null;
  status: string | null;
  archived_at: string | null;
  updated_at: string;
};

function normalizeStatus(raw: string | null | undefined): WorkspaceStatus {
  return raw === "paused" ? "paused" : "active";
}

export async function workspaceDomainTaken(
  userId: string,
  domain: string,
  excludeId?: string,
): Promise<boolean> {
  const normalized = normalizeDomain(domain);
  const rows = await dbAll<{ id: string }>(
    `SELECT id FROM workspaces
     WHERE user_id = ? AND domain = ? AND archived_at IS NULL`,
    [userId, normalized],
  );
  return rows.some((r) => r.id !== excludeId);
}

export async function buildWorkspaceListMeta(
  row: WorkspaceRow,
): Promise<WorkspaceListMeta> {
  const latestAudit = await dbGet<{
    score: number;
    created_at: string;
    total_prompts: number;
  }>(
    `SELECT score, created_at, total_prompts FROM audit_runs
     WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 1`,
    [row.id],
  );

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const audits = await dbAll<{ score: number; created_at: string }>(
    `SELECT score, created_at FROM audit_runs
     WHERE workspace_id = ? AND created_at >= ?
     ORDER BY created_at ASC`,
    [row.id, weekAgo],
  );

  let scoreDeltaWeek: number | null = null;
  if (audits.length >= 2) {
    scoreDeltaWeek = audits[audits.length - 1]!.score - audits[0]!.score;
  } else if (latestAudit && audits.length === 1) {
    scoreDeltaWeek = 0;
  }

  const prefs = parsePreferences(row.preferences);
  const promptCount =
    prefs.monitoredPrompts.length > 0
      ? prefs.monitoredPrompts.length
      : row.buyer_question?.trim()
        ? 1
        : 0;

  const workspace = await getWorkspaceById(row.id, row.user_id);
  const snapshot = workspace
    ? await enrichSnapshotWithBacklinks(toSnapshot(workspace), row.id)
    : null;

  return {
    id: row.id,
    domain: row.domain,
    displayName: row.display_name?.trim() || null,
    buyerQuestion: row.buyer_question ?? "",
    businessType: row.business_type ?? "",
    updatedAt: row.updated_at,
    citationScore: snapshot?.citationScore ?? latestAudit?.score ?? 0,
    hasRealAudit: Boolean(snapshot?.hasRealAudit ?? latestAudit),
    promptCount,
    lastScanAt: latestAudit?.created_at ?? null,
    status: normalizeStatus(row.status),
    archivedAt: row.archived_at,
    scoreDeltaWeek,
  };
}

export async function listWorkspaceMetaForUser(
  userId: string,
  options: { includeArchived?: boolean } = {},
): Promise<WorkspaceListMeta[]> {
  const memberIds = await listWorkspaceIdsForMember(userId);
  const archivedClause = options.includeArchived
    ? ""
    : "AND archived_at IS NULL";

  const ownedRows = await dbAll<WorkspaceRow>(
    `SELECT id, domain, business_type, buyer_question, preferences, user_id,
            display_name, status, archived_at, updated_at
     FROM workspaces WHERE user_id = ? ${archivedClause}
     ORDER BY updated_at DESC
     LIMIT 200`,
    [userId],
  );

  let memberRows: WorkspaceRow[] = [];
  if (memberIds.length > 0) {
    const placeholders = memberIds.map(() => "?").join(", ");
    memberRows = await dbAll<WorkspaceRow>(
      `SELECT id, domain, business_type, buyer_question, preferences, user_id,
              display_name, status, archived_at, updated_at
       FROM workspaces WHERE id IN (${placeholders}) ${archivedClause}
       ORDER BY updated_at DESC`,
      memberIds,
    );
  }

  const seen = new Set<string>();
  const rows: WorkspaceRow[] = [];
  for (const row of [...ownedRows, ...memberRows]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    rows.push(row);
  }

  return Promise.all(rows.map((row) => buildWorkspaceListMeta(row)));
}

export async function countActiveWorkspacesForUser(userId: string): Promise<number> {
  const row = await dbGet<{ c: number | string }>(
    `SELECT COUNT(*) as c FROM workspaces WHERE user_id = ? AND archived_at IS NULL`,
    [userId],
  );
  return Number(row?.c ?? 0);
}

export async function archiveWorkspaces(
  userId: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const now = new Date().toISOString();
  const placeholders = ids.map(() => "?").join(", ");
  const result = await dbRun(
    `UPDATE workspaces SET archived_at = ?, updated_at = ?
     WHERE user_id = ? AND id IN (${placeholders}) AND archived_at IS NULL`,
    [now, now, userId, ...ids],
  );
  return result.changes ?? 0;
}

export async function updateWorkspaceManagement(
  id: string,
  userId: string,
  patch: {
    displayName?: string;
    status?: WorkspaceStatus;
    archived?: boolean;
    restore?: boolean;
  },
): Promise<boolean> {
  const access = await requireWorkspaceAccess(userId, id, "owner");
  if (!access) return false;

  const row = await dbGet<WorkspaceRow>(
    `SELECT id FROM workspaces WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  if (!row) return false;

  const sets: string[] = [];
  const params: unknown[] = [];
  const now = new Date().toISOString();

  if (patch.displayName !== undefined) {
    sets.push("display_name = ?");
    params.push(patch.displayName.trim() || null);
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    params.push(patch.status);
  }
  if (patch.archived === true) {
    sets.push("archived_at = ?");
    params.push(now);
  }
  if (patch.restore === true) {
    sets.push("archived_at = ?");
    params.push(null);
  }
  if (sets.length === 0) return true;

  sets.push("updated_at = ?");
  params.push(now);
  params.push(id, userId);

  const result = await dbRun(
    `UPDATE workspaces SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
    params,
  );
  return (result.changes ?? 0) > 0;
}


export async function transferWorkspace(
  workspaceId: string,
  fromUserId: string,
  toEmail: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const fleet = await userHasFleetAccess(fromUserId);
  if (!fleet) {
    return { ok: false, error: "Fleet plan required to transfer workspaces" };
  }

  const email = toEmail.trim().toLowerCase();
  const referralUser = await dbGet<{ user_id: string }>(
    `SELECT user_id FROM user_referrals WHERE LOWER(email) = ? LIMIT 1`,
    [email],
  );
  const memberUser = await dbGet<{ user_id: string }>(
    `SELECT user_id FROM workspace_members
     WHERE LOWER(email) = ? AND user_id IS NOT NULL AND status = 'accepted'
     LIMIT 1`,
    [email],
  );

  const newOwner = referralUser?.user_id ?? memberUser?.user_id;
  if (!newOwner) {
    return {
      ok: false,
      error:
        "Recipient must have a CitePilot account. Invite them as a collaborator first, or use their account email.",
    };
  }

  const ws = await dbGet<{ id: string }>(
    `SELECT id FROM workspaces WHERE id = ? AND user_id = ?`,
    [workspaceId, fromUserId],
  );
  if (!ws) return { ok: false, error: "Workspace not found" };

  const now = new Date().toISOString();
  await dbRun(
    `UPDATE workspaces SET user_id = ?, updated_at = ? WHERE id = ?`,
    [newOwner, now, workspaceId],
  );
  await dbRun(`DELETE FROM workspace_members WHERE workspace_id = ?`, [
    workspaceId,
  ]);
  return { ok: true };
}

export async function getAgencyOverview(userId: string): Promise<AgencyOverview> {
  const items = await listWorkspaceMetaForUser(userId);
  const scored = items.filter((w) => w.hasRealAudit);
  const weightedCitationScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, w) => sum + w.citationScore, 0) / scored.length,
        )
      : 0;

  const needsAttention = items
    .filter(
      (w) =>
        w.hasRealAudit &&
        w.scoreDeltaWeek != null &&
        w.scoreDeltaWeek <= -10,
    )
    .map((w) => ({
      id: w.id,
      domain: w.domain,
      displayName: w.displayName,
      citationScore: w.citationScore,
      scoreDeltaWeek: w.scoreDeltaWeek ?? 0,
    }));

  const recentActivity = await dbAll<{
    id: string;
    workspace_id: string;
    domain: string;
    score: number;
    created_at: string;
  }>(
    `SELECT ar.id, ar.workspace_id, w.domain, ar.score, ar.created_at
     FROM audit_runs ar
     JOIN workspaces w ON w.id = ar.workspace_id
     WHERE w.user_id = ? AND w.archived_at IS NULL
     ORDER BY ar.created_at DESC
     LIMIT 20`,
    [userId],
  );

  return {
    workspaceCount: items.length,
    weightedCitationScore,
    totalPrompts: items.reduce((sum, w) => sum + w.promptCount, 0),
    activeCount: items.filter((w) => w.status === "active").length,
    pausedCount: items.filter((w) => w.status === "paused").length,
    auditedCount: scored.length,
    workspaces: items,
    needsAttention,
    recentActivity: recentActivity.map((r) => ({
      id: r.id,
      workspaceId: r.workspace_id,
      domain: r.domain,
      score: r.score,
      createdAt: r.created_at,
    })),
  };
}

export async function purgeArchivedWorkspaces(): Promise<number> {
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
  const rows = await dbAll<{ id: string }>(
    `SELECT id FROM workspaces WHERE archived_at IS NOT NULL AND archived_at < ?`,
    [cutoff],
  );
  if (rows.length === 0) return 0;
  const { adminDeleteWorkspace } = await import("@/lib/server/workspace");
  let removed = 0;
  for (const row of rows) {
    if (await adminDeleteWorkspace(row.id)) removed += 1;
  }
  return removed;
}
