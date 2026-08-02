import type { AuditPayload } from "@/lib/api-types";
import { upsertContentStrategy } from "@/lib/content-strategy/store";
import { dbGet } from "@/lib/db";
import { parsePreferences } from "@/lib/settings";
import { toSnapshot } from "@/lib/server/workspace";

type WorkspaceRow = {
  id: string;
  domain: string;
  business_type: string | null;
  description: string | null;
  audiences: string;
  competitors: string;
  buyer_question: string | null;
  preferences: string;
  updated_at: string;
};

function parseStringArray(raw: string | null, fallback: string[] = []): string[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : fallback;
  } catch {
    return fallback;
  }
}

export async function regenerateContentStrategyForAudit(
  workspaceId: string,
  audit: AuditPayload,
): Promise<void> {
  const row = await dbGet<WorkspaceRow>(
    `SELECT id, domain, business_type, description, audiences, competitors,
            buyer_question, preferences, updated_at
     FROM workspaces WHERE id = ?`,
    [workspaceId],
  );
  if (!row) return;

  const snapshot = toSnapshot({
    id: row.id,
    domain: row.domain,
    businessType: row.business_type ?? "",
    description: row.description ?? "",
    audiences: parseStringArray(row.audiences),
    competitors: parseStringArray(row.competitors),
    buyerQuestion: row.buyer_question ?? "",
    referral: "",
    preferences: parsePreferences(row.preferences ?? "{}"),
    createdAt: row.updated_at,
    updatedAt: row.updated_at,
    latestAudit: audit,
  });

  await upsertContentStrategy(workspaceId, audit.id, snapshot);
}
