import { dbGet, dbRun } from "@/lib/db";
import {
  decryptTotpSecret,
  encryptTotpSecret,
} from "@/lib/security/totp-crypto";
import {
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from "@/lib/security/totp-codes";
import { generateSecret, verify } from "otplib";

export type UserTotpRow = {
  user_id: string;
  totp_secret: string | null;
  pending_secret: string | null;
  totp_enabled: number | boolean;
  totp_backup_codes: string;
  totp_enabled_at: string | null;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
};

export type TotpPublicStatus = {
  enabled: boolean;
  enabledAt: string | null;
  backupCodesRemaining: number;
  lockedUntil: string | null;
};

const LOCKOUT_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 3;

function nowIso(): string {
  return new Date().toISOString();
}

function parseBackupHashes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function isEnabled(row: UserTotpRow | undefined): boolean {
  if (!row) return false;
  return row.totp_enabled === true || row.totp_enabled === 1;
}

export async function getUserTotpRow(userId: string): Promise<UserTotpRow | undefined> {
  return dbGet<UserTotpRow>(`SELECT * FROM user_totp WHERE user_id = ?`, [userId]);
}

export async function isTotpEnabledForUser(userId: string): Promise<boolean> {
  const row = await getUserTotpRow(userId);
  return isEnabled(row);
}

export async function getTotpPublicStatus(userId: string): Promise<TotpPublicStatus> {
  const row = await getUserTotpRow(userId);
  const hashes = parseBackupHashes(row?.totp_backup_codes);
  return {
    enabled: isEnabled(row),
    enabledAt: row?.totp_enabled_at ?? null,
    backupCodesRemaining: hashes.length,
    lockedUntil: row?.locked_until ?? null,
  };
}

async function ensureUserTotpRow(userId: string): Promise<UserTotpRow> {
  const existing = await getUserTotpRow(userId);
  if (existing) return existing;
  const now = nowIso();
  await dbRun(
    `INSERT INTO user_totp (user_id, totp_enabled, totp_backup_codes, failed_attempts, created_at, updated_at)
     VALUES (?, 0, '[]', 0, ?, ?)`,
    [userId, now, now],
  );
  const row = await getUserTotpRow(userId);
  if (!row) throw new Error("Failed to initialize TOTP row");
  return row;
}

export async function beginTotpSetup(userId: string): Promise<{ secret: string }> {
  const secret = generateSecret();
  const encrypted = encryptTotpSecret(secret);
  const now = nowIso();
  await ensureUserTotpRow(userId);
  await dbRun(
    `UPDATE user_totp SET pending_secret = ?, updated_at = ? WHERE user_id = ?`,
    [encrypted, now, userId],
  );
  return { secret };
}

export async function verifyAndEnableTotp(
  userId: string,
  token: string,
): Promise<{ backupCodes: string[] } | { error: string }> {
  const row = await getUserTotpRow(userId);
  if (!row?.pending_secret) {
    return { error: "Start setup before verifying a code" };
  }
  const secret = decryptTotpSecret(row.pending_secret);
  const result = await verify({ secret, token: token.replace(/\D/g, "") });
  if (!result.valid) {
    return { error: "Invalid code — check your authenticator app and try again" };
  }

  const backupCodes = generateBackupCodes();
  const hashed = await Promise.all(backupCodes.map((code) => hashBackupCode(code)));
  const now = nowIso();

  await dbRun(
    `UPDATE user_totp
     SET totp_secret = ?, pending_secret = NULL, totp_enabled = 1,
         totp_backup_codes = ?, totp_enabled_at = ?, failed_attempts = 0,
         locked_until = NULL, updated_at = ?
     WHERE user_id = ?`,
    [row.pending_secret, JSON.stringify(hashed), now, now, userId],
  );

  return { backupCodes };
}

export async function disableTotpForUser(
  userId: string,
  token: string,
): Promise<{ ok: true } | { error: string }> {
  const row = await getUserTotpRow(userId);
  if (!row || !isEnabled(row) || !row.totp_secret) {
    return { error: "Two-factor authentication is not enabled" };
  }

  const valid = await verifyTotpOrBackup(userId, token, row);
  if ("error" in valid) return { error: valid.error };

  const now = nowIso();
  await dbRun(
    `UPDATE user_totp
     SET totp_secret = NULL, pending_secret = NULL, totp_enabled = 0,
         totp_backup_codes = '[]', totp_enabled_at = NULL,
         failed_attempts = 0, locked_until = NULL, updated_at = ?
     WHERE user_id = ?`,
    [now, userId],
  );

  return { ok: true };
}

export async function regenerateBackupCodes(
  userId: string,
  token: string,
): Promise<{ backupCodes: string[] } | { error: string }> {
  const row = await getUserTotpRow(userId);
  if (!row || !isEnabled(row)) {
    return { error: "Two-factor authentication is not enabled" };
  }

  const valid = await verifyTotpOrBackup(userId, token, row);
  if ("error" in valid) return { error: valid.error };

  const backupCodes = generateBackupCodes();
  const hashed = await Promise.all(backupCodes.map((code) => hashBackupCode(code)));
  await dbRun(
    `UPDATE user_totp SET totp_backup_codes = ?, updated_at = ? WHERE user_id = ?`,
    [JSON.stringify(hashed), nowIso(), userId],
  );

  return { backupCodes };
}

function isLocked(row: UserTotpRow): boolean {
  if (!row.locked_until) return false;
  return Date.parse(row.locked_until) > Date.now();
}

async function recordFailedAttempt(userId: string, row: UserTotpRow): Promise<string> {
  const attempts = (row.failed_attempts ?? 0) + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_MS).toISOString();
    await dbRun(
      `UPDATE user_totp SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE user_id = ?`,
      [attempts, lockedUntil, nowIso(), userId],
    );
    return "Too many failed attempts. Try again in 5 minutes.";
  }
  await dbRun(
    `UPDATE user_totp SET failed_attempts = ?, updated_at = ? WHERE user_id = ?`,
    [attempts, nowIso(), userId],
  );
  return `Invalid code. ${MAX_FAILED_ATTEMPTS - attempts} attempt(s) remaining.`;
}

async function clearFailedAttempts(userId: string): Promise<void> {
  await dbRun(
    `UPDATE user_totp SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE user_id = ?`,
    [nowIso(), userId],
  );
}

export async function verifyTotpOrBackup(
  userId: string,
  code: string,
  rowOverride?: UserTotpRow,
): Promise<{ ok: true; usedBackup?: boolean } | { error: string }> {
  const row = rowOverride ?? (await getUserTotpRow(userId));
  if (!row || !isEnabled(row)) {
    return { error: "Two-factor authentication is not enabled" };
  }
  if (isLocked(row)) {
    return { error: "Too many failed attempts. Try again in 5 minutes." };
  }

  const normalized = code.replace(/\s+/g, "");
  const isBackup = normalized.includes("-") || normalized.length > 6;

  if (isBackup) {
    const hashes = parseBackupHashes(row.totp_backup_codes);
    const index = await verifyBackupCode(normalized, hashes);
    if (index < 0) {
      const error = await recordFailedAttempt(userId, row);
      return { error };
    }
    hashes.splice(index, 1);
    await dbRun(
      `UPDATE user_totp SET totp_backup_codes = ?, updated_at = ? WHERE user_id = ?`,
      [JSON.stringify(hashes), nowIso(), userId],
    );
    await clearFailedAttempts(userId);
    return { ok: true, usedBackup: true };
  }

  if (!row.totp_secret) {
    return { error: "Two-factor authentication is misconfigured" };
  }

  const secret = decryptTotpSecret(row.totp_secret);
  const result = await verify({ secret, token: normalized.replace(/\D/g, "") });
  if (!result.valid) {
    const error = await recordFailedAttempt(userId, row);
    return { error };
  }

  await clearFailedAttempts(userId);
  return { ok: true };
}

export async function getMaskedBackupCodes(userId: string): Promise<string[]> {
  const row = await getUserTotpRow(userId);
  const count = parseBackupHashes(row?.totp_backup_codes).length;
  return Array.from({ length: count }, () => "*****-*****");
}
