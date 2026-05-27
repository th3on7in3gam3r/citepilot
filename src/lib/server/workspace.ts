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
import { getLatestAuditForWorkspace } from "@/lib/audit/run-audit";
import { getContentStrategy } from "@/lib/content-strategy/store";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import {
  defaultWorkspacePreferences,
  mergePreferences,
  parsePreferences,
} from "@/lib/settings";

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

function canAccessWorkspace(row: WorkspaceRow, userId: string | null): boolean {
  if (!userId) return true;
  if (!row.user_id) return true;
  return row.user_id === userId;
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
    audiences: JSON.parse(row.audiences) as string[],
    competitors: JSON.parse(row.competitors) as string[],
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
    };
  }

  const citedPlatforms = audit.platforms.filter((p) => p.present).length;

  return {
    ...base,
    id: payload.id,
    preferences: payload.preferences,
    updatedAt: payload.updatedAt,
    citationScore: audit.score,
    citedPlatforms,
    totalPlatforms: audit.platforms.length,
    visibilityScore: audit.siteSignals.geoScore,
    domainRating: Math.min(99, Math.round(audit.siteSignals.geoScore * 0.7)),
    weeklyLift: "—",
    weeklyLiftAvailable: false,
    communityMentions: 0,
    sourceCount: 0,
    gaps: audit.gaps,
    auditId: audit.id,
    auditMode: audit.mode,
    siteSignals: audit.siteSignals,
    hasRealAudit: true,
    promptResults: audit.promptResults,
    platformPresence: audit.platforms,
    citationHistory: [],
    contentStrategy: [],
    contentStrategyGeneratedAt: null,
  };
}

export async function enrichSnapshotWithBacklinks(
  snapshot: WorkspaceSnapshotResponse,
  workspaceId: string,
): Promise<WorkspaceSnapshotResponse> {
  const [metrics, citationHistory, contentStrategy] = await Promise.all([
    getBacklinkMetricsForWorkspace(workspaceId),
    getCitationSnapshots(workspaceId),
    getContentStrategy(workspaceId),
  ]);

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
  if (!row || !canAccessWorkspace(row, userId)) return null;
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
  if (!row || !canAccessWorkspace(row, userId)) return null;
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
  const rows = await dbAll<WorkspaceRow>(
    `SELECT * FROM workspaces
     WHERE user_id = ?
     ORDER BY updated_at DESC
     LIMIT ?`,
    [userId, limit],
  );
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

export async function deleteWorkspace(
  id: string,
  userId: string | null = null,
): Promise<boolean> {
  const row = await dbGet<WorkspaceRow>(
    `SELECT * FROM workspaces WHERE id = ?`,
    [id],
  );
  if (!row || !canAccessWorkspace(row, userId)) return false;

  return adminDeleteWorkspace(id);
}

/** Admin-only — no ownership check */
export async function adminDeleteWorkspace(id: string): Promise<boolean> {
  const row = await dbGet<{ id: string }>(
    `SELECT id FROM workspaces WHERE id = ?`,
    [id],
  );
  if (!row) return false;

  await dbRun(`DELETE FROM cron_dispatch_log WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM platform_citation_checks WHERE workspace_id = ?`, [
    id,
  ]);
  await dbRun(`DELETE FROM citation_snapshots WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM workspace_content_strategies WHERE workspace_id = ?`, [
    id,
  ]);
  await dbRun(`DELETE FROM audit_runs WHERE workspace_id = ?`, [id]);
  await dbRun(`DELETE FROM blog_posts WHERE workspace_id = ?`, [id]);
  const result = await dbRun(`DELETE FROM workspaces WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function deleteWaitlistEntry(id: string): Promise<boolean> {
  const result = await dbRun(`DELETE FROM waitlist WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function deleteAuditRun(id: string): Promise<boolean> {
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
