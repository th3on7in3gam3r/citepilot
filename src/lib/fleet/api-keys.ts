import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import {
  FLEET_API_KEY_PREFIX,
  FLEET_API_KEYS_MAX,
  isFleetApiKeySecret,
} from "@/lib/fleet/constants";

export type FleetApiKeyRecord = {
  id: string;
  userId: string;
  workspaceId: string | null;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type CreatedFleetApiKey = FleetApiKeyRecord & {
  /** Shown once at creation */
  secret: string;
};

const BCRYPT_ROUNDS = 12;
const PREFIX_LENGTH = 16;

async function hashKey(secret: string): Promise<string> {
  return bcrypt.hash(secret, BCRYPT_ROUNDS);
}

async function verifyKeyHash(secret: string, hash: string): Promise<boolean> {
  if (hash.startsWith("$2")) {
    return bcrypt.compare(secret, hash);
  }
  // Legacy SHA-256 hex hashes (pre-bcrypt migration)
  const { createHash } = await import("crypto");
  const legacy = createHash("sha256").update(secret).digest("hex");
  return legacy === hash;
}

export function generateFleetApiKeySecret(): string {
  return `${FLEET_API_KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
}

type KeyRow = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  key_prefix: string;
  key_hash: string;
  created_at: string;
  last_used_at: string | null;
};

function mapKeyRow(row: KeyRow): FleetApiKeyRecord {
  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

export async function listFleetApiKeys(
  userId: string,
  workspaceId?: string,
): Promise<FleetApiKeyRecord[]> {
  const rows = workspaceId
    ? await dbAll<KeyRow>(
        `SELECT id, user_id, workspace_id, name, key_prefix, created_at, last_used_at
         FROM fleet_api_keys WHERE user_id = ? AND (workspace_id = ? OR workspace_id IS NULL)
         ORDER BY created_at DESC`,
        [userId, workspaceId],
      )
    : await dbAll<KeyRow>(
        `SELECT id, user_id, workspace_id, name, key_prefix, created_at, last_used_at
         FROM fleet_api_keys WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
      );
  return rows.map(mapKeyRow);
}

export async function createFleetApiKey(
  userId: string,
  name: string,
  workspaceId?: string | null,
): Promise<CreatedFleetApiKey | { error: "LIMIT_REACHED" }> {
  const countSql = workspaceId
    ? `SELECT COUNT(*) as c FROM fleet_api_keys WHERE user_id = ? AND workspace_id = ?`
    : `SELECT COUNT(*) as c FROM fleet_api_keys WHERE user_id = ?`;
  const countParams = workspaceId ? [userId, workspaceId] : [userId];
  const count = await dbGet<{ c: number | string }>(countSql, countParams);
  if (Number(count?.c ?? 0) >= FLEET_API_KEYS_MAX) {
    return { error: "LIMIT_REACHED" };
  }

  const secret = generateFleetApiKeySecret();
  const id = uuidv4();
  const now = new Date().toISOString();
  const keyPrefix = secret.slice(0, PREFIX_LENGTH);
  const keyHash = await hashKey(secret);

  await dbRun(
    `INSERT INTO fleet_api_keys (id, user_id, workspace_id, name, key_prefix, key_hash, created_at, last_used_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      id,
      userId,
      workspaceId ?? null,
      name.trim() || "API key",
      keyPrefix,
      keyHash,
      now,
    ],
  );

  return {
    id,
    userId,
    workspaceId: workspaceId ?? null,
    name: name.trim() || "API key",
    keyPrefix,
    createdAt: now,
    lastUsedAt: null,
    secret,
  };
}

export async function revokeFleetApiKey(
  userId: string,
  keyId: string,
): Promise<boolean> {
  const result = await dbRun(
    `DELETE FROM fleet_api_keys WHERE id = ? AND user_id = ?`,
    [keyId, userId],
  );
  return result.changes > 0;
}

export async function verifyFleetApiKey(
  secret: string,
): Promise<{
  userId: string;
  keyId: string;
  workspaceId: string | null;
} | null> {
  if (!isFleetApiKeySecret(secret)) return null;

  const keyPrefix = secret.slice(0, PREFIX_LENGTH);
  const rows = await dbAll<KeyRow>(
    `SELECT id, user_id, workspace_id, name, key_prefix, key_hash, created_at, last_used_at
     FROM fleet_api_keys WHERE key_prefix = ?`,
    [keyPrefix],
  );

  for (const row of rows) {
    const valid = await verifyKeyHash(secret, row.key_hash);
    if (!valid) continue;

    const now = new Date().toISOString();
    await dbRun(`UPDATE fleet_api_keys SET last_used_at = ? WHERE id = ?`, [
      now,
      row.id,
    ]);

    return {
      userId: row.user_id,
      keyId: row.id,
      workspaceId: row.workspace_id,
    };
  }

  return null;
}

export function assertWorkspaceScope(
  keyWorkspaceId: string | null,
  requestedWorkspaceId: string,
): boolean {
  if (!keyWorkspaceId) return true;
  return keyWorkspaceId === requestedWorkspaceId;
}
