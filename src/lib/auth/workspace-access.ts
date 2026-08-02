import { dbGet } from "@/lib/db";

export type WorkspaceMemberRole = "owner" | "editor" | "viewer";

export type WorkspaceAccess = {
  workspaceId: string;
  role: WorkspaceMemberRole;
  isOwner: boolean;
};

const ROLE_RANK: Record<WorkspaceMemberRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

function isMemberRole(value: string): value is Exclude<WorkspaceMemberRole, "owner"> {
  return value === "viewer" || value === "editor";
}

/** Resolved role for a user on a workspace (owner or accepted member). */
export async function getWorkspaceAccess(
  userId: string | null,
  workspaceId: string,
): Promise<WorkspaceAccess | null> {
  const row = await dbGet<{ user_id: string | null; archived_at: string | null }>(
    `SELECT user_id, archived_at FROM workspaces WHERE id = ?`,
    [workspaceId],
  );
  if (!row || row.archived_at) return null;

  if (!userId) {
    if (!row.user_id) {
      return { workspaceId, role: "viewer", isOwner: false };
    }
    return null;
  }

  if (row.user_id === userId) {
    return { workspaceId, role: "owner", isOwner: true };
  }

  if (!row.user_id) {
    return { workspaceId, role: "viewer", isOwner: false };
  }

  const member = await dbGet<{ role: string }>(
    `SELECT role FROM workspace_members
     WHERE workspace_id = ? AND user_id = ? AND status = 'accepted'`,
    [workspaceId, userId],
  );
  if (!member || !isMemberRole(member.role)) return null;

  return { workspaceId, role: member.role, isOwner: false };
}

/** Returns access when the user meets the minimum role, otherwise null. */
export async function requireWorkspaceAccess(
  userId: string | null,
  workspaceId: string,
  minRole: WorkspaceMemberRole = "viewer",
): Promise<WorkspaceAccess | null> {
  const access = await getWorkspaceAccess(userId, workspaceId);
  if (!access) return null;
  if (ROLE_RANK[access.role] < ROLE_RANK[minRole]) return null;
  return access;
}

export async function userCanAccessWorkspace(
  workspaceId: string,
  userId: string | null,
): Promise<boolean> {
  return (await getWorkspaceAccess(userId, workspaceId)) != null;
}
