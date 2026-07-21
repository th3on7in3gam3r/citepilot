import { unstable_cache } from "next/cache";
import { dbGet } from "@/lib/db";

export type PublicPlatformStats = {
  domainsAudited: number;
  citationsTracked: number;
};

const EMPTY_STATS: PublicPlatformStats = {
  domainsAudited: 0,
  citationsTracked: 0,
};

async function fetchPublicPlatformStats(): Promise<PublicPlatformStats> {
  try {
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
  } catch (error) {
    // Homepage must stay up when Postgres is misconfigured / empty / unreachable.
    console.error(
      "[public-stats] failed",
      error instanceof Error ? error.message : "unknown",
    );
    return EMPTY_STATS;
  }
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
