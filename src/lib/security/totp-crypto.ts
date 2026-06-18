import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function secretSeed(): string {
  return (
    process.env.TOTP_ENCRYPTION_KEY?.trim() ||
    process.env.CMS_ENCRYPTION_KEY?.trim() ||
    process.env.NEON_AUTH_COOKIE_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    "citepilot-local-totp-secret"
  );
}

function key(): Buffer {
  return createHash("sha256").update(secretSeed()).digest();
}

export function encryptTotpSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptTotpSecret(value: string): string {
  const [ivPart, tagPart, payloadPart] = value.split(".");
  if (!ivPart || !tagPart || !payloadPart) {
    throw new Error("Invalid encrypted TOTP secret");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadPart, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function signTotpPayload(payload: string): string {
  const sig = createHash("sha256")
    .update(`${secretSeed()}:${payload}`)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyTotpPayload(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = createHash("sha256")
    .update(`${secretSeed()}:${payload}`)
    .digest("base64url");
  if (sig !== expected) return null;
  return payload;
}

export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}
