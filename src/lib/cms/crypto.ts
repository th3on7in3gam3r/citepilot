import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function secretSeed(): string {
  return (
    process.env.CMS_ENCRYPTION_KEY?.trim() ||
    process.env.NEON_AUTH_COOKIE_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    "citepilot-local-cms-secret"
  );
}

function key(): Buffer {
  return createHash("sha256").update(secretSeed()).digest();
}

export function encryptCmsSecret(value: string): string {
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

export function decryptCmsSecret(value: string): string {
  const [ivPart, tagPart, payloadPart] = value.split(".");
  if (!ivPart || !tagPart || !payloadPart) {
    throw new Error("Invalid encrypted CMS secret");
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
