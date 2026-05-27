import type { AuditPayload } from "@/lib/api-types";
import { upsertContentStrategy } from "@/lib/content-strategy/store";
import { dbGet } from "@/lib/db";
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
    audiences: JSON.parse(row.audiences) as string[],
    competitors: JSON.parse(row.competitors) as string[],
    buyerQuestion: row.buyer_question ?? "",
    referral: "",
    preferences: JSON.parse(row.preferences || "{}"),
    createdAt: row.updated_at,
    updatedAt: row.updated_at,
    latestAudit: audit,
  });

  await upsertContentStrategy(workspaceId, audit.id, snapshot);
}
