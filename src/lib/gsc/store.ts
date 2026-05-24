import { dbGet, dbRun } from "@/lib/db";

type GscRow = {
  workspace_id: string;
  user_id: string;
  site_url: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  updated_at: string;
};

export type GscConnection = {
  workspaceId: string;
  userId: string;
  siteUrl: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  updatedAt: string;
};

function rowToConnection(row: GscRow): GscConnection {
  return {
    workspaceId: row.workspace_id,
    userId: row.user_id,
    siteUrl: row.site_url,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  };
}

export async function getGscConnection(
  workspaceId: string,
): Promise<GscConnection | null> {
  const row = await dbGet<GscRow>(
    `SELECT * FROM gsc_connections WHERE workspace_id = ?`,
    [workspaceId],
  );
  return row ? rowToConnection(row) : null;
}

export async function upsertGscConnection(input: {
  workspaceId: string;
  userId: string;
  siteUrl: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
}): Promise<GscConnection> {
  const now = new Date().toISOString();
  const existing = await getGscConnection(input.workspaceId);

  if (!existing) {
    await dbRun(
      `INSERT INTO gsc_connections
       (workspace_id, user_id, site_url, access_token, refresh_token, expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.workspaceId,
        input.userId,
        input.siteUrl,
        input.accessToken,
        input.refreshToken ?? null,
        input.expiresAt ?? null,
        now,
      ],
    );
  } else {
    await dbRun(
      `UPDATE gsc_connections SET
        site_url = ?, access_token = ?, refresh_token = ?, expires_at = ?, updated_at = ?
       WHERE workspace_id = ?`,
      [
        input.siteUrl,
        input.accessToken,
        input.refreshToken ?? existing.refreshToken,
        input.expiresAt ?? existing.expiresAt,
        now,
        input.workspaceId,
      ],
    );
  }

  return (await getGscConnection(input.workspaceId))!;
}

export async function deleteGscConnection(workspaceId: string): Promise<void> {
  await dbRun(`DELETE FROM gsc_connections WHERE workspace_id = ?`, [workspaceId]);
}
