import { unstable_cache } from "next/cache";
import { dbGet } from "@/lib/db";

export type PublicPlatformStats = {
  domainsAudited: number;
  citationsTracked: number;
};

async function fetchPublicPlatformStats(): Promise<PublicPlatformStats> {
  const [domainsRow, citationsRow, citationsFromAudits] = await Promise.all([
    dbGet<{ c: number | string }>(
      `SELECT COUNT(DISTINCT domain) as c FROM audit_runs`,
    ),
    dbGet<{ c: number | string }>(
      `SELECT COUNT(*) as c FROM platform_citation_checks`,
    ),
    dbGet<{ c: number | string }>(
      `SELECT COALESCE(SUM(total_prompts), 0) as c FROM audit_runs`,
    ),
  ]);

  const platformChecks = Number(citationsRow?.c ?? 0);
  const citationsTracked =
    platformChecks > 0
      ? platformChecks
      : Number(citationsFromAudits?.c ?? 0);

  return {
    domainsAudited: Number(domainsRow?.c ?? 0),
    citationsTracked,
  };
}

/** Cached public stats — avoids cold DB hits on every homepage ISR miss. */
export const getPublicPlatformStats = unstable_cache(
  fetchPublicPlatformStats,
  ["public-platform-stats"],
  { revalidate: 3600 },
);

function formatStat(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatPublicStat(value: number): string {
  return formatStat(value);
}
