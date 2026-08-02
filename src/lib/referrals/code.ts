import { randomBytes } from "crypto";
import { REFERRAL_CODE_LENGTH } from "./constants";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** 8-char uppercase alphanumeric code (nanoid-style alphabet). */
export function generateReferralCode(): string {
  const bytes = randomBytes(REFERRAL_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return code;
}

export function normalizeReferralCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  if (code.length !== REFERRAL_CODE_LENGTH) return null;
  if (!/^[A-Z0-9]+$/.test(code)) return null;
  return code;
}
