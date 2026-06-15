import { dbGet } from "@/lib/db";

export type PublicPlatformStats = {
  domainsAudited: number;
  citationsTracked: number;
};

export async function getPublicPlatformStats(): Promise<PublicPlatformStats> {
  const domainsRow = await dbGet<{ c: number | string }>(
    `SELECT COUNT(DISTINCT domain) as c FROM audit_runs`,
  );

  const citationsRow = await dbGet<{ c: number | string }>(
    `SELECT COUNT(*) as c FROM platform_citation_checks`,
  );

  const citationsFromAudits = await dbGet<{ c: number | string }>(
    `SELECT COALESCE(SUM(total_prompts), 0) as c FROM audit_runs`,
  );

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

function formatStat(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatPublicStat(value: number): string {
  return formatStat(value);
}
