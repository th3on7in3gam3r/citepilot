import { v4 as uuidv4 } from "uuid";
import type { OnboardingAnswers } from "@/lib/onboarding";
import type {
  AuditPayload,
  AdminAuditRow,
  WaitlistEntry,
  WorkspacePayload,
  WorkspaceSnapshotResponse,
  WorkspaceUpdateInput,
} from "@/lib/api-types";
import { buildWorkspaceSnapshot } from "@/lib/dashboard";
import { getBacklinkMetricsForWorkspace } from "@/lib/backlinks/store";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import {
  getLatestAuditForWorkspace,
  getRecentAuditsForWorkspace,
} from "@/lib/audit/run-audit";
import {
  buildScanDeltaSummary,
  emptyScanDeltaSummary,
} from "@/lib/audit/scan-delta";
import { userHasPilotAccess } from "@/lib/billing/access";
import { requireWorkspaceAccess } from "@/lib/auth/workspace-access";
import { listWorkspaceIdsForMember } from "@/lib/server/workspace-members";
import { getContentStrategy } from "@/lib/content-strategy/store";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import {
  defaultWorkspacePreferences,
  mergePreferences,
  parsePreferences,
} from "@/lib/settings";
import { createDefaultNotificationPreferences } from "@/lib/notifications/preferences-store";
import { emitStudioOpsEvent } from "@/lib/studio-ops";

type WorkspaceRow = {
  id: string;
  domain: string;
  business_type: string | null;
  description: string | null;
  audiences: string;
  competitors: string;
  buyer_question: string | null;
  referral: string | null;
  preferences: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

function parseStringArray(raw: string | null, fallback: string[] = []): string[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : fallback;
  } catch {
    return fallback;
  }
}

async function canAccessWorkspace(
  row: WorkspaceRow,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return true;
  if (!row.user_id) return true;
  if (row.user_id === userId) return true;
  return (await requireWorkspaceAccess(userId, row.id, "viewer")) != null;
}

function rowToPayload(
  row: WorkspaceRow,
  latestAudit: AuditPayload | null,
): WorkspacePayload {
  return {
    id: row.id,
    domain: row.domain,
    businessType: row.business_type ?? "",
    description: row.description ?? "",
    audiences: parseStringArray(row.audiences),
    competitors: parseStringArray(row.competitors),
    buyerQuestion: row.buyer_question ?? "",
    referral: row.referral ?? "",
    preferences: parsePreferences(row.preferences ?? "{}"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latestAudit,
  };
}

export function toSnapshot(
  payload: WorkspacePayload,
): WorkspaceSnapshotResponse {
  const base = buildWorkspaceSnapshot({
    domain: payload.domain,
    businessType: payload.businessType,
    description: payload.description,
    audiences: payload.audiences,
    competitors: payload.competitors,
    buyerQuestion: payload.buyerQuestion,
  });

  const audit = payload.latestAudit;
  if (!audit) {
    return {
      ...base,
      id: payload.id,
      preferences: payload.preferences,
      updatedAt: payload.updatedAt,
      gaps: [],
      auditId: null,
      auditMode: null,
      siteSignals: null,
      hasRealAudit: false,
      promptResults: [],
      platformPresence: [],
      citationHistory: [],
      contentStrategy: [],
      contentStrategyGeneratedAt: null,
      weeklyLiftAvailable: false,
      scanDelta: emptyScanDeltaSummary,
      freeExplainGapTeaserAvailable: false,
    };
  }

  const platforms = audit.platforms ?? [];
  const citedPlatforms = platforms.filter((p) => p.present).length;
  const geoScore = audit.siteSignals?.geoScore ?? audit.score;

  return {
    ...base,
    id: payload.id,
    preferences: payload.preferences,
    updatedAt: payload.updatedAt,
    citationScore: audit.score,
    citedPlatforms,
    totalPlatforms: platforms.length,
    visibilityScore: geoScore,
    domainRating: Math.min(99, Math.round(geoScore * 0.7)),
    weeklyLift: "—",
    weeklyLiftAvailable: false,
    communityMentions: 0,
    sourceCount: 0,
    gaps: audit.gaps,
    auditId: audit.id,
    auditMode: audit.mode,
    siteSignals: audit.siteSignals ?? null,
    hasRealAudit: true,
    promptResults: audit.promptResults ?? [],
    platformPresence: platforms,
    citationHistory: [],
    contentStrategy: [],
    contentStrategyGeneratedAt: null,
    scanDelta: buildScanDeltaSummary({ current: audit, previous: null }),
    freeExplainGapTeaserAvailable: false,
  };
}

export async function enrichSnapshotWithBacklinks(
  snapshot: WorkspaceSnapshotResponse,
  workspaceId: string,
): Promise<WorkspaceSnapshotResponse> {
  const [
    metricsResult,
    citationHistoryResult,
    contentStrategyResult,
    recentAuditsResult,
    ownerRowResult,
  ] = await Promise.allSettled([
    getBacklinkMetricsForWorkspace(workspaceId),
    getCitationSnapshots(workspaceId),
    getContentStrategy(workspaceId),
    snapshot.hasRealAudit
      ? getRecentAuditsForWorkspace(workspaceId, 2)
      : Promise.resolve([]),
    dbGet<{ user_id: string | null }>(
      `SELECT user_id FROM workspaces WHERE id = ?`,
      [workspaceId],
    ),
  ]);

  if (metricsResult.status === "rejected") {
    console.error("enrichSnapshot: backlink metrics failed", metricsResult.reason);
  }
  if (citationHistoryResult.status === "rejected") {
    console.error("enrichSnapshot: citation history failed", citationHistoryResult.reason);
  }
  if (contentStrategyResult.status === "rejected") {
    console.error("enrichSnapshot: content strategy failed", contentStrategyResult.reason);
  }
  if (recentAuditsResult.status === "rejected") {
    console.error("enrichSnapshot: recent audits failed", recentAuditsResult.reason);
  }
  if (ownerRowResult.status === "rejected") {
    console.error("enrichSnapshot: owner lookup failed", ownerRowResult.reason);
  }

  const metrics =
    metricsResult.status === "fulfilled" ? metricsResult.value : null;
  const citationHistory =
    citationHistoryResult.status === "fulfilled"
      ? citationHistoryResult.value
      : [];
  const contentStrategy =
    contentStrategyResult.status === "fulfilled"
      ? contentStrategyResult.value
      : null;
  const recentAudits =
    recentAuditsResult.status === "fulfilled" ? recentAuditsResult.value : [];
  const ownerRow =
    ownerRowResult.status === "fulfilled" ? ownerRowResult.value : null;

  let scanDelta = emptyScanDeltaSummary;
  try {
    if (recentAudits.length >= 2) {
      scanDelta = buildScanDeltaSummary({
        current: recentAudits[0]!,
        previous: recentAudits[1]!,
        trackedCompetitors: snapshot.competitors,
      });
    } else if (recentAudits.length === 1) {
      scanDelta = buildScanDeltaSummary({
        current: recentAudits[0]!,
        previous: null,
      });
    }
  } catch (error) {
    console.error("enrichSnapshot: scan delta failed", workspaceId, error);
  }

  let paid = false;
  if (ownerRow?.user_id) {
    try {
      paid = await userHasPilotAccess(ownerRow.user_id);
    } catch (error) {
      console.error("enrichSnapshot: pilot access check failed", error);
    }
  }
  const freeExplainGapTeaserAvailable =
    snapshot.hasRealAudit &&
    !snapshot.preferences.freeExplainGapUsed &&
    !paid;

  let weeklyLift = snapshot.weeklyLift;
  let weeklyLiftAvailable = snapshot.weeklyLiftAvailable;
  if (citationHistory.length >= 2) {
    const previous = citationHistory[citationHistory.length - 2]!;
    const latest = citationHistory[citationHistory.length - 1]!;
    const delta = latest.visibilityIndex - previous.visibilityIndex;
    weeklyLift =
      delta === 0
        ? "0 pts"
        : `${delta > 0 ? "+" : ""}${delta} pts`;
    weeklyLiftAvailable = true;
  }

  return {
    ...snapshot,
    domainRating: metrics?.domainRating ?? snapshot.domainRating,
    sourceCount: metrics?.sourceCount ?? snapshot.sourceCount,
    citationHistory,
    contentStrategy: contentStrategy?.items ?? snapshot.contentStrategy,
    contentStrategyGeneratedAt:
      contentStrategy?.generatedAt ?? snapshot.contentStrategyGeneratedAt,
    weeklyLift,
    weeklyLiftAvailable,
    scanDelta,
    freeExplainGapTeaserAvailable,
  };
}

export async function toSnapshotAsync(
  payload: WorkspacePayload,
): Promise<WorkspaceSnapshotResponse> {
  const snapshot = toSnapshot(payload);
  return enrichSnapshotWithBacklinks(snapshot, payload.id);
}

export async function createWorkspace(
  answers: OnboardingAnswers,
  userId: string | null = null,
): Promise<WorkspacePayload> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const domain = normalizeDomain(answers.domain);

  await dbRun(
    `INSERT INTO workspaces (
      id, domain, business_type, description, audiences, competitors,
      buyer_question, referral, preferences, user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      domain,
      answers.businessType,
      answers.description,
      JSON.stringify(answers.audiences),
      JSON.stringify(answers.competitors),
      answers.buyerQuestion,
      answers.referral,
      JSON.stringify(defaultWorkspacePreferences),
      userId,
      now,
      now,
    ],
  );

  if (userId) {
    await createDefaultNotificationPreferences({ workspaceId: id, userId });
  }

  emitStudioOpsEvent("workspace.created", {
    workspaceId: id,
    userId,
    domain,
    businessType: answers.businessType,
  });

  const row = await dbGet<WorkspaceRow>(
    `SELECT * FROM workspaces WHERE id = ?`,
    [id],
  );
  return rowToPayload(row!, null);
}

export async function getWorkspaceById(
  id: string,
  userId: string | null = null,
): Promise<WorkspacePayload | null> {
  const row = await dbGet<WorkspaceRow>(
    `SELECT * FROM workspaces WHERE id = ?`,
    [id],
  );
  if (!row || !(await canAccessWorkspace(row, userId))) return null;
  const latestAudit = await getLatestAuditForWorkspace(id);
  return rowToPayload(row, latestAudit);
}

export async function updateWorkspace(
  id: string,
  updates: WorkspaceUpdateInput,
  userId: string | null = null,
): Promise<WorkspacePayload | null> {
  const row = await dbGet<WorkspaceRow>(
    `SELECT * FROM workspaces WHERE id = ?`,
    [id],
  );
  if (!row) return null;
  if (!(await requireWorkspaceAccess(userId, id, "editor"))) return null;
  const existing = rowToPayload(
    row,
    await getLatestAuditForWorkspace(id),
  );

  const now = new Date().toISOString();
  const merged: OnboardingAnswers = {
    domain: updates.domain ?? existing.domain,
    businessType: updates.businessType ?? existing.businessType,
    description: updates.description ?? existing.description,
    audiences: updates.audiences ?? existing.audiences,
    competitors: updates.competitors ?? existing.competitors,
    buyerQuestion: updates.buyerQuestion ?? existing.buyerQuestion,
    referral: updates.referral ?? existing.referral,
  };
  const preferences = updates.preferences
    ? mergePreferences(existing.preferences, updates.preferences)
    : existing.preferences;

  const ownerId = row.user_id ?? userId;

  await dbRun(
    `UPDATE workspaces SET
      domain = ?, business_type = ?, description = ?, audiences = ?,
      competitors = ?, buyer_question = ?, referral = ?, preferences = ?,
      user_id = ?, updated_at = ?
     WHERE id = ?`,
    [
      normalizeDomain(merged.domain),
      merged.businessType,
      merged.description,
      JSON.stringify(merged.audiences),
      JSON.stringify(merged.competitors),
      merged.buyerQuestion,
      merged.referral,
      JSON.stringify(preferences),
      ownerId,
      now,
      id,
    ],
  );

  return getWorkspaceById(id, userId);
}

export async function listRecentWorkspaces(
  limit = 10,
): Promise<WorkspacePayload[]> {
  const rows = await dbAll<WorkspaceRow>(
    `SELECT * FROM workspaces ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  return Promise.all(
    rows.map(async (row) => {
      const latestAudit = await getLatestAuditForWorkspace(row.id);
      return rowToPayload(row, latestAudit);
    }),
  );
}

export async function listWorkspacesForUser(
  userId: string,
  limit = 100,
): Promise<WorkspacePayload[]> {
  const memberIds = await listWorkspaceIdsForMember(userId);
  const ownedRows = await dbAll<WorkspaceRow>(
    `SELECT * FROM workspaces
     WHERE user_id = ? AND archived_at IS NULL
     ORDER BY updated_at DESC
     LIMIT ?`,
    [userId, limit],
  );

  let memberRows: WorkspaceRow[] = [];
  if (memberIds.length > 0) {
    const placeholders = memberIds.map(() => "?").join(", ");
    memberRows = await dbAll<WorkspaceRow>(
      `SELECT * FROM workspaces
       WHERE id IN (${placeholders}) AND archived_at IS NULL
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
    if (rows.length >= limit) break;
  }

  return Promise.all(
    rows.map(async (row) => {
      const latestAudit = await getLatestAuditForWorkspace(row.id);
      return rowToPayload(row, latestAudit);
    }),
  );
}

export async function countWorkspacesForUser(userId: string): Promise<number> {
  const row = await dbGet<{ c: number | string }>(
    `SELECT COUNT(*) as c FROM workspaces WHERE user_id = ?`,
    [userId],
  );
  return Number(row?.c ?? 0);
}

export async function getAdminStats(): Promise<{
  workspaces: number;
  auditsThisWeek: number;
  activePrompts: number;
  waitlistCount: number;
}> {
  const workspaces = Number(
    (await dbGet<{ c: number | string }>(`SELECT COUNT(*) as c FROM workspaces`))
      ?.c ?? 0,
  );
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const auditsThisWeek = Number(
    (
      await dbGet<{ c: number | string }>(
        `SELECT COUNT(*) as c FROM audit_runs WHERE created_at >= ?`,
        [weekAgo],
      )
    )?.c ?? 0,
  );
  const activePrompts = Number(
    (
      await dbGet<{ c: number | string }>(
        `SELECT COALESCE(SUM(total_prompts), 0) as c FROM audit_runs WHERE created_at >= ?`,
        [weekAgo],
      )
    )?.c ?? 0,
  );
  const waitlistCount = Number(
    (await dbGet<{ c: number | string }>(`SELECT COUNT(*) as c FROM waitlist`))
      ?.c ?? 0,
  );

  return { workspaces, auditsThisWeek, activePrompts, waitlistCount };
}

export async function addWaitlistEmail(
  email: string,
): Promise<{ ok: true; id: string }> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await dbRun(`INSERT INTO waitlist (id, email, created_at) VALUES (?, ?, ?)`, [
    id,
    email.toLowerCase().trim(),
    now,
  ]);
  return { ok: true, id };
}

export async function getCitationSnapshots(
  workspaceId: string,
): Promise<{ recordedAt: string; visibilityIndex: number }[]> {
  const rows = await dbAll<{
    recorded_at: string;
    visibility_index: number;
  }>(
    `SELECT recorded_at, visibility_index FROM citation_snapshots
     WHERE workspace_id = ? ORDER BY recorded_at ASC LIMIT 12`,
    [workspaceId],
  );
  return rows.map((r) => ({
    recordedAt: r.recorded_at,
    visibilityIndex: r.visibility_index,
  }));
}

/** Delete all rows that reference a workspace, in FK-safe order. */
export async function deleteWorkspaceDependents(id: string): Promise<void> {
  await dbRun(`DELETE FROM notification_preferences WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM workspace_members WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM cron_dispatch_log WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM cms_publications WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM cms_connections WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM gsc_connections WHERE workspace_id = ?`, [id]);
  await dbRun(
    `DELETE FROM backlink_placements WHERE requester_workspace_id = ? OR partner_workspace_id = ?`,
    [id, id],
  );
  await dbRun(`DELETE FROM backlink_sources WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM backlink_network WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM backlink_profiles WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM platform_citation_checks WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM browser_scan_usage WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM audit_shares WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM citation_snapshots WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM workspace_content_strategies WHERE workspace_id = ?`, [
    id,
  ]);
  await dbRun(`DELETE FROM audit_runs WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM blog_posts WHERE workspace_id = ?`, [id]);
}

export async function deleteWorkspace(
  id: string,
  userId: string | null = null,
): Promise<boolean> {
  const row = await dbGet<WorkspaceRow>(
    `SELECT * FROM workspaces WHERE id = ?`,
    [id],
  );
  if (!row) return false;
  if (!(await requireWorkspaceAccess(userId, id, "owner"))) return false;

  return adminDeleteWorkspace(id);
}

/** Admin-only — no ownership check */
export async function adminDeleteWorkspace(id: string): Promise<boolean> {
  const row = await dbGet<{ id: string }>(
    `SELECT id FROM workspaces WHERE id = ?`,
    [id],
  );
  if (!row) return false;

  await deleteWorkspaceDependents(id);
  const result = await dbRun(`DELETE FROM workspaces WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function deleteWaitlistEntry(id: string): Promise<boolean> {
  const result = await dbRun(`DELETE FROM waitlist WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function deleteAuditRun(id: string): Promise<boolean> {
  await dbRun(`DELETE FROM platform_citation_checks WHERE audit_id = ?`, [id]);
  await dbRun(`DELETE FROM audit_shares WHERE audit_id = ?`, [id]);
  const result = await dbRun(`DELETE FROM audit_runs WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function listWaitlist(limit = 50): Promise<WaitlistEntry[]> {
  const rows = await dbAll<{
    id: string;
    email: string;
    created_at: string;
  }>(
    `SELECT id, email, created_at FROM waitlist ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    createdAt: r.created_at,
  }));
}

export async function listRecentAudits(
  limit = 20,
): Promise<AdminAuditRow[]> {
  const rows = await dbAll<{
    id: string;
    domain: string;
    workspace_id: string | null;
    score: number;
    cited_count: number;
    total_prompts: number;
    mode: string;
    created_at: string;
  }>(
    `SELECT id, domain, workspace_id, score, cited_count, total_prompts, mode, created_at
     FROM audit_runs ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );

  return rows.map((r) => ({
    id: r.id,
    domain: r.domain,
    workspaceId: r.workspace_id,
    score: r.score,
    cited: r.cited_count,
    total: r.total_prompts,
    mode: r.mode,
    createdAt: r.created_at,
  }));
}
