import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const BACKUP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += BACKUP_ALPHABET[bytes[i]! % BACKUP_ALPHABET.length];
  }
  return out;
}

export function generateBackupCode(): string {
  return `${randomSegment(5)}-${randomSegment(5)}`;
}

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => generateBackupCode());
}

export async function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code.replace(/\s+/g, "").toUpperCase(), 10);
}

export async function verifyBackupCode(
  code: string,
  hashes: string[],
): Promise<number> {
  const normalized = code.replace(/\s+/g, "").toUpperCase();
  for (let i = 0; i < hashes.length; i += 1) {
    const hash = hashes[i];
    if (!hash) continue;
    if (await bcrypt.compare(normalized, hash)) return i;
  }
  return -1;
}

export function formatTotpSecretForDisplay(secret: string): string {
  const clean = secret.replace(/\s+/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

export function normalizeTotpToken(token: string): string {
  return token.replace(/\D/g, "").slice(0, 6);
}

export function normalizeBackupCodeInput(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}
