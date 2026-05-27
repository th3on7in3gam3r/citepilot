import { createHash, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { FLEET_API_KEY_PREFIX, FLEET_API_KEYS_MAX } from "@/lib/fleet/constants";

export type FleetApiKeyRecord = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type CreatedFleetApiKey = FleetApiKeyRecord & {
  /** Shown once at creation */
  secret: string;
};

function hashKey(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function generateFleetApiKeySecret(): string {
  return `${FLEET_API_KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
}

export async function listFleetApiKeys(userId: string): Promise<FleetApiKeyRecord[]> {
  const rows = await dbAll<{
    id: string;
    user_id: string;
    name: string;
    key_prefix: string;
    created_at: string;
    last_used_at: string | null;
  }>(
    `SELECT id, user_id, name, key_prefix, created_at, last_used_at
     FROM fleet_api_keys WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  }));
}

export async function createFleetApiKey(
  userId: string,
  name: string,
): Promise<CreatedFleetApiKey | { error: "LIMIT_REACHED" }> {
  const count = await dbGet<{ c: number | string }>(
    `SELECT COUNT(*) as c FROM fleet_api_keys WHERE user_id = ?`,
    [userId],
  );
  if (Number(count?.c ?? 0) >= FLEET_API_KEYS_MAX) {
    return { error: "LIMIT_REACHED" };
  }

  const secret = generateFleetApiKeySecret();
  const id = uuidv4();
  const now = new Date().toISOString();
  const keyPrefix = secret.slice(0, 16);
  const keyHash = hashKey(secret);

  await dbRun(
    `INSERT INTO fleet_api_keys (id, user_id, name, key_prefix, key_hash, created_at, last_used_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [id, userId, name.trim() || "API key", keyPrefix, keyHash, now],
  );

  return {
    id,
    userId,
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
): Promise<{ userId: string; keyId: string } | null> {
  if (!secret.startsWith(FLEET_API_KEY_PREFIX)) return null;
  const keyHash = hashKey(secret);
  const row = await dbGet<{
    id: string;
    user_id: string;
  }>(
    `SELECT id, user_id FROM fleet_api_keys WHERE key_hash = ?`,
    [keyHash],
  );
  if (!row) return null;

  const now = new Date().toISOString();
  await dbRun(`UPDATE fleet_api_keys SET last_used_at = ? WHERE id = ?`, [
    now,
    row.id,
  ]);

  return { userId: row.user_id, keyId: row.id };
}
