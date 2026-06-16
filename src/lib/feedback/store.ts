import { v4 as uuidv4 } from "uuid";
import { dbAll, dbGet, dbRun } from "@/lib/db";

export type FeatureRequestStatus =
  | "under_review"
  | "planned"
  | "in_progress"
  | "shipped";

export type FeatureRequestRow = {
  id: string;
  title: string;
  description: string;
  submitted_by: string | null;
  submitter_email: string | null;
  vote_count: number;
  status: FeatureRequestStatus;
  created_at: string;
  updated_at: string;
};

export type FeatureRequest = {
  id: string;
  title: string;
  description: string;
  submittedBy: string | null;
  submitterEmail: string | null;
  voteCount: number;
  status: FeatureRequestStatus;
  createdAt: string;
  updatedAt: string;
  userVoted?: boolean;
};

export type CancelSurveyReason =
  | "too_expensive"
  | "not_enough_value"
  | "switching_competitor"
  | "just_testing"
  | "missing_feature"
  | "technical_issues";

function rowToFeatureRequest(
  row: FeatureRequestRow,
  userVoted = false,
): FeatureRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    submittedBy: row.submitted_by,
    submitterEmail: row.submitter_email,
    voteCount: row.vote_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userVoted,
  };
}

export async function listFeatureRequests(
  userId: string | null,
): Promise<FeatureRequest[]> {
  const rows = await dbAll<FeatureRequestRow>(
    `SELECT * FROM feature_requests ORDER BY vote_count DESC, created_at DESC`,
  );

  if (!userId || rows.length === 0) {
    return rows.map((row) => rowToFeatureRequest(row));
  }

  const votes = await dbAll<{ request_id: string }>(
    `SELECT request_id FROM feature_request_votes WHERE user_id = ?`,
    [userId],
  );
  const voted = new Set(votes.map((v) => v.request_id));

  return rows.map((row) => rowToFeatureRequest(row, voted.has(row.id)));
}

export async function createFeatureRequest(input: {
  title: string;
  description: string;
  userId: string | null;
  submitterEmail: string | null;
}): Promise<FeatureRequest> {
  const id = uuidv4();
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO feature_requests (
      id, title, description, submitted_by, submitter_email,
      vote_count, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 0, 'under_review', ?, ?)`,
    [
      id,
      input.title.trim(),
      input.description.trim(),
      input.userId,
      input.submitterEmail,
      now,
      now,
    ],
  );

  const row = await dbGet<FeatureRequestRow>(
    `SELECT * FROM feature_requests WHERE id = ?`,
    [id],
  );
  if (!row) throw new Error("Failed to create feature request");
  return rowToFeatureRequest(row);
}

export async function toggleFeatureRequestVote(
  requestId: string,
  userId: string,
): Promise<{ voteCount: number; userVoted: boolean }> {
  const existing = await dbGet<{ id: string }>(
    `SELECT id FROM feature_request_votes WHERE request_id = ? AND user_id = ?`,
    [requestId, userId],
  );

  if (existing) {
    await dbRun(
      `DELETE FROM feature_request_votes WHERE request_id = ? AND user_id = ?`,
      [requestId, userId],
    );
    const current = await dbGet<{ vote_count: number }>(
      `SELECT vote_count FROM feature_requests WHERE id = ?`,
      [requestId],
    );
    await dbRun(
      `UPDATE feature_requests SET vote_count = ?, updated_at = ? WHERE id = ?`,
      [Math.max(0, (current?.vote_count ?? 1) - 1), new Date().toISOString(), requestId],
    );
  } else {
    await dbRun(
      `INSERT INTO feature_request_votes (id, request_id, user_id, created_at) VALUES (?, ?, ?, ?)`,
      [uuidv4(), requestId, userId, new Date().toISOString()],
    );
    await dbRun(
      `UPDATE feature_requests SET vote_count = vote_count + 1, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), requestId],
    );
  }

  const row = await dbGet<{ vote_count: number }>(
    `SELECT vote_count FROM feature_requests WHERE id = ?`,
    [requestId],
  );
  const voted = await dbGet<{ id: string }>(
    `SELECT id FROM feature_request_votes WHERE request_id = ? AND user_id = ?`,
    [requestId, userId],
  );

  return {
    voteCount: row?.vote_count ?? 0,
    userVoted: Boolean(voted),
  };
}

export async function updateFeatureRequestStatus(
  requestId: string,
  status: FeatureRequestStatus,
): Promise<FeatureRequest | null> {
  const now = new Date().toISOString();
  await dbRun(
    `UPDATE feature_requests SET status = ?, updated_at = ? WHERE id = ?`,
    [status, now, requestId],
  );
  const row = await dbGet<FeatureRequestRow>(
    `SELECT * FROM feature_requests WHERE id = ?`,
    [requestId],
  );
  return row ? rowToFeatureRequest(row) : null;
}

export async function getFeatureRequestById(
  id: string,
): Promise<FeatureRequest | null> {
  const row = await dbGet<FeatureRequestRow>(
    `SELECT * FROM feature_requests WHERE id = ?`,
    [id],
  );
  return row ? rowToFeatureRequest(row) : null;
}

export async function saveAuditFeedback(input: {
  auditId?: string | null;
  workspaceId?: string | null;
  userId?: string | null;
  domain: string;
  score?: number | null;
  useful: boolean;
  comment?: string | null;
  source?: string;
}): Promise<void> {
  await dbRun(
    `INSERT INTO audit_feedback (
      id, audit_id, workspace_id, user_id, domain, score, useful, comment, source, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      input.auditId ?? null,
      input.workspaceId ?? null,
      input.userId ?? null,
      input.domain,
      input.score ?? null,
      input.useful ? 1 : 0,
      input.comment?.trim() || null,
      input.source ?? "dashboard",
      new Date().toISOString(),
    ],
  );
}

export async function saveCancelSurveyResponse(input: {
  userId: string;
  reason: CancelSurveyReason;
  competitor?: string | null;
  missingFeature?: string | null;
  details?: string | null;
  plan?: string | null;
}): Promise<void> {
  await dbRun(
    `INSERT INTO cancel_survey_responses (
      id, user_id, reason, competitor, missing_feature, details, plan, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      input.userId,
      input.reason,
      input.competitor?.trim() || null,
      input.missingFeature?.trim() || null,
      input.details?.trim() || null,
      input.plan ?? null,
      new Date().toISOString(),
    ],
  );
}

export async function hasCancelSurveyResponse(userId: string): Promise<boolean> {
  const row = await dbGet<{ id: string }>(
    `SELECT id FROM cancel_survey_responses WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return Boolean(row);
}

export async function getUserDaysActive(userId: string): Promise<number> {
  const row = await dbGet<{ first_at: string | null }>(
    `SELECT MIN(created_at) AS first_at FROM workspaces WHERE user_id = ?`,
    [userId],
  );
  if (!row?.first_at) return 0;
  const ms = Date.now() - new Date(row.first_at).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
