import { randomBytes, randomUUID } from "crypto";
import {
  getMemberLimitsForWorkspace,
  memberLimitMessage,
} from "@/lib/billing/member-limits";
import { sendWorkspaceInviteEmail } from "@/lib/email/workspace-invite";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import type { WorkspaceMemberRole } from "@/lib/auth/workspace-access";

export const INVITE_EXPIRY_DAYS = 7;

export type WorkspaceMemberStatus = "pending" | "accepted" | "revoked";

export type WorkspaceMemberRecord = {
  id: string;
  workspace_id: string;
  email: string;
  user_id: string | null;
  role: string;
  status: string;
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  token: string | null;
};

export type WorkspaceMemberView = {
  id: string;
  email: string;
  role: WorkspaceMemberRole;
  status: WorkspaceMemberStatus;
  invitedAt: string;
  acceptedAt: string | null;
  name: string | null;
};

function generateInviteToken(): string {
  return randomBytes(24).toString("base64url").slice(0, 32);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isInviteRole(role: string): role is "viewer" | "editor" {
  return role === "viewer" || role === "editor";
}

function inviteExpired(invitedAt: string): boolean {
  const expires = new Date(invitedAt).getTime() + INVITE_EXPIRY_DAYS * 86400000;
  return Date.now() > expires;
}

export function memberStatusFromRow(row: {
  status: string | null;
  accepted_at: string | null;
}): WorkspaceMemberStatus {
  if (row.status === "revoked") return "revoked";
  if (row.status === "accepted" || row.accepted_at) return "accepted";
  if (row.status === "pending") return "pending";
  return row.accepted_at ? "accepted" : "pending";
}

async function countActiveMembers(workspaceId: string): Promise<number> {
  const row = await dbGet<{ c: number | string }>(
    `SELECT COUNT(*) as c FROM workspace_members
     WHERE workspace_id = ? AND status IN ('pending', 'accepted')`,
    [workspaceId],
  );
  return Number(row?.c ?? 0);
}

async function getWorkspaceOwnerRow(workspaceId: string, ownerUserId: string) {
  return dbGet<{ id: string; domain: string; user_id: string }>(
    `SELECT id, domain, user_id FROM workspaces
     WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
    [workspaceId, ownerUserId],
  );
}

async function lookupMemberName(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const row = await dbGet<{ email: string }>(
    `SELECT email FROM user_referrals WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return row?.email?.split("@")[0] ?? null;
}

function toMemberView(row: WorkspaceMemberRecord): WorkspaceMemberView {
  return {
    id: row.id,
    email: row.email,
    role: row.role as WorkspaceMemberRole,
    status: memberStatusFromRow(row),
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
    name: null,
  };
}

export async function listWorkspaceMembersForOwner(
  workspaceId: string,
  ownerUserId: string,
): Promise<WorkspaceMemberView[]> {
  const ws = await getWorkspaceOwnerRow(workspaceId, ownerUserId);
  if (!ws) return [];

  const rows = await dbAll<WorkspaceMemberRecord>(
    `SELECT id, workspace_id, email, user_id, role, status, invited_by,
            invited_at, accepted_at, token
     FROM workspace_members
     WHERE workspace_id = ? AND status != 'revoked'
     ORDER BY invited_at DESC`,
    [workspaceId],
  );

  const views = await Promise.all(
    rows.map(async (row) => {
      const view = toMemberView(row);
      if (row.user_id) {
        view.name = await lookupMemberName(row.user_id);
      }
      return view;
    }),
  );
  return views;
}

export async function getMemberLimitsForOwner(
  workspaceId: string,
  ownerUserId: string,
) {
  const ws = await getWorkspaceOwnerRow(workspaceId, ownerUserId);
  if (!ws) return null;
  const count = await countActiveMembers(workspaceId);
  const limits = await getMemberLimitsForWorkspace(ownerUserId, count);
  return { ...limits, message: memberLimitMessage(limits) };
}

export async function inviteWorkspaceMember(input: {
  workspaceId: string;
  ownerUserId: string;
  email: string;
  role: "viewer" | "editor";
  inviterName: string;
}): Promise<
  | { ok: true; id: string }
  | { ok: false; error: string; code?: string }
> {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email address" };
  }
  if (!isInviteRole(input.role)) {
    return { ok: false, error: "Invalid role" };
  }

  const ws = await getWorkspaceOwnerRow(input.workspaceId, input.ownerUserId);
  if (!ws) return { ok: false, error: "Workspace not found" };

  const count = await countActiveMembers(input.workspaceId);
  const limits = await getMemberLimitsForWorkspace(input.ownerUserId, count);
  if (!limits.canInvite) {
    return {
      ok: false,
      error:
        limits.plan === "free"
          ? "Upgrade to Pilot or Fleet to invite team members."
          : `Pilot is limited to ${limits.max} members per workspace.`,
      code: "MEMBER_LIMIT",
    };
  }

  const existing = await dbGet<WorkspaceMemberRecord>(
    `SELECT id, status FROM workspace_members WHERE workspace_id = ? AND email = ?`,
    [input.workspaceId, email],
  );
  if (existing && existing.status !== "revoked") {
    return { ok: false, error: "Invite already sent for this email" };
  }

  const id = randomUUID();
  const token = generateInviteToken();
  const now = new Date().toISOString();

  if (existing?.status === "revoked") {
    await dbRun(
      `UPDATE workspace_members
       SET user_id = NULL, role = ?, status = 'pending', invited_by = ?,
           invited_at = ?, accepted_at = NULL, token = ?
       WHERE id = ?`,
      [input.role, input.ownerUserId, now, token, existing.id],
    );
    await sendWorkspaceInviteEmail({
      to: email,
      inviterName: input.inviterName,
      workspaceDomain: ws.domain,
      token,
    });
    return { ok: true, id: existing.id };
  }

  await dbRun(
    `INSERT INTO workspace_members
     (id, workspace_id, email, user_id, role, status, invited_by, invited_at, accepted_at, token)
     VALUES (?, ?, ?, NULL, ?, 'pending', ?, ?, NULL, ?)`,
    [id, input.workspaceId, email, input.role, input.ownerUserId, now, token],
  );

  await sendWorkspaceInviteEmail({
    to: email,
    inviterName: input.inviterName,
    workspaceDomain: ws.domain,
    token,
  });

  return { ok: true, id };
}

export async function resendWorkspaceInvite(input: {
  workspaceId: string;
  ownerUserId: string;
  memberId: string;
  inviterName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ws = await getWorkspaceOwnerRow(input.workspaceId, input.ownerUserId);
  if (!ws) return { ok: false, error: "Workspace not found" };

  const member = await dbGet<WorkspaceMemberRecord>(
    `SELECT * FROM workspace_members WHERE id = ? AND workspace_id = ?`,
    [input.memberId, input.workspaceId],
  );
  if (!member || member.status !== "pending") {
    return { ok: false, error: "Pending invite not found" };
  }

  const token = generateInviteToken();
  const now = new Date().toISOString();
  await dbRun(
    `UPDATE workspace_members SET token = ?, invited_at = ? WHERE id = ?`,
    [token, now, member.id],
  );

  await sendWorkspaceInviteEmail({
    to: member.email,
    inviterName: input.inviterName,
    workspaceDomain: ws.domain,
    token,
  });

  return { ok: true };
}

export async function updateWorkspaceMemberRole(input: {
  workspaceId: string;
  ownerUserId: string;
  memberId: string;
  role: "viewer" | "editor";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isInviteRole(input.role)) {
    return { ok: false, error: "Invalid role" };
  }

  const ws = await getWorkspaceOwnerRow(input.workspaceId, input.ownerUserId);
  if (!ws) return { ok: false, error: "Workspace not found" };

  const result = await dbRun(
    `UPDATE workspace_members SET role = ?
     WHERE id = ? AND workspace_id = ? AND status = 'accepted'`,
    [input.role, input.memberId, input.workspaceId],
  );
  if ((result.changes ?? 0) === 0) {
    return { ok: false, error: "Member not found" };
  }
  return { ok: true };
}

export async function revokeWorkspaceMember(input: {
  workspaceId: string;
  ownerUserId: string;
  memberId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ws = await getWorkspaceOwnerRow(input.workspaceId, input.ownerUserId);
  if (!ws) return { ok: false, error: "Workspace not found" };

  const result = await dbRun(
    `UPDATE workspace_members SET status = 'revoked', user_id = NULL, accepted_at = NULL
     WHERE id = ? AND workspace_id = ? AND status IN ('pending', 'accepted')`,
    [input.memberId, input.workspaceId],
  );
  if ((result.changes ?? 0) === 0) {
    return { ok: false, error: "Member not found" };
  }
  return { ok: true };
}

export type InvitePreview = {
  token: string;
  workspaceId: string;
  workspaceDomain: string;
  role: "viewer" | "editor";
  email: string;
  invitedAt: string;
  expired: boolean;
};

export async function getInviteByToken(
  token: string,
): Promise<InvitePreview | null> {
  const row = await dbGet<
    WorkspaceMemberRecord & { domain: string }
  >(
    `SELECT wm.*, w.domain
     FROM workspace_members wm
     JOIN workspaces w ON w.id = wm.workspace_id
     WHERE wm.token = ? AND wm.status = 'pending' AND w.archived_at IS NULL`,
    [token],
  );
  if (!row || !isInviteRole(row.role)) return null;

  return {
    token,
    workspaceId: row.workspace_id,
    workspaceDomain: row.domain,
    role: row.role,
    email: row.email,
    invitedAt: row.invited_at,
    expired: inviteExpired(row.invited_at),
  };
}

export async function acceptWorkspaceInvite(input: {
  token: string;
  userId: string;
  userEmail: string;
}): Promise<
  | { ok: true; workspaceId: string }
  | { ok: false; error: string; code?: string }
> {
  const invite = await getInviteByToken(input.token);
  if (!invite) {
    return { ok: false, error: "Invite not found or already used" };
  }
  if (invite.expired) {
    return { ok: false, error: "This invite has expired", code: "EXPIRED" };
  }

  const email = normalizeEmail(input.userEmail);
  if (email !== normalizeEmail(invite.email)) {
    return {
      ok: false,
      error: "Sign in with the email address that received this invite",
      code: "EMAIL_MISMATCH",
    };
  }

  const now = new Date().toISOString();
  const result = await dbRun(
    `UPDATE workspace_members
     SET status = 'accepted', user_id = ?, accepted_at = ?
     WHERE token = ? AND status = 'pending'`,
    [input.userId, now, input.token],
  );
  if ((result.changes ?? 0) === 0) {
    return { ok: false, error: "Invite not found or already used" };
  }

  return { ok: true, workspaceId: invite.workspaceId };
}

export async function listWorkspaceIdsForMember(userId: string): Promise<string[]> {
  const rows = await dbAll<{ workspace_id: string }>(
    `SELECT workspace_id FROM workspace_members
     WHERE user_id = ? AND status = 'accepted'`,
    [userId],
  );
  return rows.map((r) => r.workspace_id);
}
