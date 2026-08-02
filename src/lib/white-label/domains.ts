import "server-only";
import { promises as dns } from "dns";
import { dbGet, dbRun } from "@/lib/db";
import { appBaseUrl } from "@/lib/stripe/config";
import type { WorkspacePreferences } from "@/lib/settings";
import {
  normalizeReportDomain,
  reportsCnameTarget,
} from "@/lib/white-label/dns-guide";

export { normalizeReportDomain, reportsCnameTarget } from "@/lib/white-label/dns-guide";

type DomainRow = {
  domain: string;
  workspace_id: string;
  user_id: string;
  verified_at: string;
};

export async function verifyReportDomainCname(domain: string): Promise<{
  ok: boolean;
  target: string;
  resolved: string[];
  error?: string;
}> {
  const normalized = normalizeReportDomain(domain);
  if (!normalized || normalized.includes("/") || !normalized.includes(".")) {
    return { ok: false, target: reportsCnameTarget(), resolved: [], error: "Invalid domain" };
  }

  const target = reportsCnameTarget().toLowerCase();

  try {
    let resolved: string[] = [];
    try {
      const cnames = await dns.resolveCname(normalized);
      resolved = cnames.map((c) => c.toLowerCase().replace(/\.$/, ""));
    } catch {
      const records = await dns.resolve4(normalized);
      resolved = records;
    }

    const ok = resolved.some(
      (r) => r === target || r.endsWith(`.${target}`) || r.endsWith(target),
    );

    return { ok, target, resolved };
  } catch (err) {
    return {
      ok: false,
      target,
      resolved: [],
      error: err instanceof Error ? err.message : "DNS lookup failed",
    };
  }
}

export async function upsertVerifiedReportDomain(input: {
  domain: string;
  workspaceId: string;
  userId: string;
}): Promise<void> {
  const normalized = normalizeReportDomain(input.domain);
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO white_label_domains (domain, workspace_id, user_id, verified_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (domain) DO UPDATE SET
       workspace_id = excluded.workspace_id,
       user_id = excluded.user_id,
       verified_at = excluded.verified_at`,
    [normalized, input.workspaceId, input.userId, now],
  );
}

export async function isVerifiedReportHost(host: string): Promise<boolean> {
  const normalized = normalizeReportDomain(host);
  const primary = normalizeReportDomain(new URL(appBaseUrl()).hostname);
  if (normalized === primary || normalized.endsWith(".vercel.app")) return true;

  const row = await dbGet<DomainRow>(
    `SELECT domain FROM white_label_domains WHERE domain = ?`,
    [normalized],
  );
  return Boolean(row);
}

export async function getVerifiedDomainForWorkspace(
  workspaceId: string,
): Promise<string | null> {
  const row = await dbGet<DomainRow>(
    `SELECT domain FROM white_label_domains WHERE workspace_id = ? ORDER BY verified_at DESC LIMIT 1`,
    [workspaceId],
  );
  return row?.domain ?? null;
}

export function buildProofShareUrl(
  token: string,
  prefs: WorkspacePreferences,
): string {
  const domain = prefs.whiteLabel.customReportDomain.trim();
  if (prefs.whiteLabel.customDomainVerified && domain) {
    return `https://${normalizeReportDomain(domain)}/r/${token}`;
  }
  return `${appBaseUrl()}/report/proof/${token}`;
}
