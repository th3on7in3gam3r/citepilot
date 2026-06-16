import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { dbAll, dbGet } from "@/lib/db";

export type RelatedDomain = {
  domain: string;
  score: number;
};

export async function getRelatedScoreDomains(
  domain: string,
  limit = 4,
): Promise<RelatedDomain[]> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return [];

  const categoryRow = await dbGet<{ business_type: string | null }>(
    `SELECT business_type FROM workspaces
     WHERE domain = ? AND business_type IS NOT NULL AND business_type != ''
     ORDER BY updated_at DESC LIMIT 1`,
    [normalized],
  );

  const category = categoryRow?.business_type?.trim();

  if (category) {
    const rows = await dbAll<{ domain: string; score: number }>(
      `SELECT ar.domain, ar.score
       FROM audit_runs ar
       INNER JOIN (
         SELECT domain, MAX(created_at) AS latest
         FROM audit_runs
         GROUP BY domain
       ) latest ON latest.domain = ar.domain AND latest.latest = ar.created_at
       INNER JOIN workspaces w ON w.domain = ar.domain
       LEFT JOIN domain_score_profiles p ON p.domain = ar.domain
       WHERE w.business_type = ?
         AND ar.domain != ?
         AND COALESCE(p.is_public, 1) = 1
       GROUP BY ar.domain, ar.score
       ORDER BY ar.created_at DESC
       LIMIT ?`,
      [category, normalized, limit],
    );
    if (rows.length > 0) {
      return rows.map((row) => ({
        domain: row.domain,
        score: Number(row.score),
      }));
    }
  }

  const fallback = await dbAll<{ domain: string; score: number }>(
    `SELECT ar.domain, ar.score
     FROM audit_runs ar
     INNER JOIN (
       SELECT domain, MAX(created_at) AS latest
       FROM audit_runs
       GROUP BY domain
     ) latest ON latest.domain = ar.domain AND latest.latest = ar.created_at
     LEFT JOIN domain_score_profiles p ON p.domain = ar.domain
     WHERE ar.domain != ?
       AND COALESCE(p.is_public, 1) = 1
     ORDER BY ar.created_at DESC
     LIMIT ?`,
    [normalized, limit],
  );

  return fallback.map((row) => ({
    domain: row.domain,
    score: Number(row.score),
  }));
}
