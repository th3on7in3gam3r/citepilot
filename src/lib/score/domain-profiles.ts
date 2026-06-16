import { randomBytes } from "crypto";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { dbAll, dbGet, dbRun } from "@/lib/db";

export type DomainScoreProfile = {
  domain: string;
  isPublic: boolean;
  claimedByUserId: string | null;
  claimedAt: string | null;
  verifiedAt: string | null;
  verificationToken: string | null;
  updatedAt: string;
};

function rowToProfile(row: {
  domain: string;
  is_public: number;
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  verified_at: string | null;
  verification_token: string | null;
  updated_at: string;
}): DomainScoreProfile {
  return {
    domain: row.domain,
    isPublic: row.is_public !== 0,
    claimedByUserId: row.claimed_by_user_id,
    claimedAt: row.claimed_at,
    verifiedAt: row.verified_at,
    verificationToken: row.verification_token,
    updatedAt: row.updated_at,
  };
}

export async function getDomainScoreProfile(
  domain: string,
): Promise<DomainScoreProfile | null> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;

  const row = await dbGet<{
    domain: string;
    is_public: number;
    claimed_by_user_id: string | null;
    claimed_at: string | null;
    verified_at: string | null;
    verification_token: string | null;
    updated_at: string;
  }>(`SELECT * FROM domain_score_profiles WHERE domain = ?`, [normalized]);

  return row ? rowToProfile(row) : null;
}

/** Create or refresh a public profile when a domain is audited. */
export async function ensureDomainScoreProfile(domain: string): Promise<void> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return;

  const now = new Date().toISOString();
  const existing = await getDomainScoreProfile(normalized);

  if (existing) {
    await dbRun(
      `UPDATE domain_score_profiles SET updated_at = ? WHERE domain = ?`,
      [now, normalized],
    );
    return;
  }

  await dbRun(
    `INSERT INTO domain_score_profiles (
      domain, is_public, verification_token, updated_at
    ) VALUES (?, 1, ?, ?)`,
    [normalized, randomBytes(16).toString("hex"), now],
  );
}

export async function isDomainScorePublic(domain: string): Promise<boolean> {
  const profile = await getDomainScoreProfile(domain);
  return profile?.isPublic ?? true;
}

export async function listPublicScoreDomains(
  limit = 10_000,
): Promise<{ domain: string; lastModified: string }[]> {
  const rows = await dbAll<{ domain: string; last_modified: string }>(
    `SELECT ar.domain, MAX(ar.created_at) AS last_modified
     FROM audit_runs ar
     LEFT JOIN domain_score_profiles p ON p.domain = ar.domain
     WHERE COALESCE(p.is_public, 1) = 1
     GROUP BY ar.domain
     ORDER BY last_modified DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => ({
    domain: row.domain,
    lastModified: row.last_modified,
  }));
}

export async function getOrCreateVerificationToken(
  domain: string,
): Promise<string | null> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;

  await ensureDomainScoreProfile(normalized);
  const profile = await getDomainScoreProfile(normalized);
  if (profile?.verificationToken) return profile.verificationToken;

  const token = randomBytes(16).toString("hex");
  await dbRun(
    `UPDATE domain_score_profiles SET verification_token = ?, updated_at = ? WHERE domain = ?`,
    [token, new Date().toISOString(), normalized],
  );
  return token;
}

export async function markDomainClaimed(
  domain: string,
  userId: string,
): Promise<void> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return;

  const now = new Date().toISOString();
  await dbRun(
    `UPDATE domain_score_profiles
     SET claimed_by_user_id = ?, claimed_at = ?, verified_at = ?, updated_at = ?
     WHERE domain = ?`,
    [userId, now, now, now, normalized],
  );
}

export async function setDomainScoreVisibility(
  domain: string,
  isPublic: boolean,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return { ok: false, error: "Invalid domain" };

  const profile = await getDomainScoreProfile(normalized);
  if (!profile?.verifiedAt || profile.claimedByUserId !== userId) {
    return { ok: false, error: "Not authorized" };
  }

  await dbRun(
    `UPDATE domain_score_profiles SET is_public = ?, updated_at = ? WHERE domain = ?`,
    [isPublic ? 1 : 0, new Date().toISOString(), normalized],
  );
  return { ok: true };
}
