import type { WorkspaceSnapshotResponse } from "@/lib/api-types";

/** Compact JSON context for grounded copilot prompts — no PII beyond workspace data. */
export function buildCopilotContext(
  snapshot: WorkspaceSnapshotResponse,
): string {
  const promptResults = snapshot.promptResults ?? [];
  const cited = promptResults.filter((p) => p?.cited);
  const uncited = promptResults.filter((p) => p && !p.cited);

  const payload = {
    domain: snapshot.domain,
    businessType: snapshot.businessType ?? "",
    description: (snapshot.description ?? "").slice(0, 500),
    buyerQuestion: snapshot.buyerQuestion ?? "",
    competitors: (snapshot.competitors ?? []).slice(0, 8),
    citationScore: snapshot.citationScore,
    hasRealAudit: snapshot.hasRealAudit,
    auditMode: snapshot.auditMode,
    citedPlatforms: snapshot.citedPlatforms,
    totalPlatforms: snapshot.totalPlatforms,
    weeklyLift: snapshot.weeklyLiftAvailable ? snapshot.weeklyLift : null,
    citationHistoryPoints: (snapshot.citationHistory ?? []).map((p) => ({
      date: p.recordedAt,
      score: p.visibilityIndex,
    })),
    gaps: (snapshot.gaps ?? []).slice(0, 12),
    siteSignals: snapshot.siteSignals
      ? {
          geoScore: snapshot.siteSignals.geoScore,
          hasFaqSchema: snapshot.siteSignals.hasFaqSchema,
          hasJsonLd: snapshot.siteSignals.hasJsonLd,
          sitemapFound: snapshot.siteSignals.sitemapFound,
        }
      : null,
    promptsCited: cited.slice(0, 8).map((p) => ({
      prompt: p.prompt,
      reason: p.reason,
    })),
    promptsNotCited: uncited.slice(0, 8).map((p) => ({
      prompt: p.prompt,
      reason: p.reason,
    })),
    platformPresence: (snapshot.platformPresence ?? [])
      .slice(0, 10)
      .map((p) => ({ name: p.name, cited: p.present, share: p.share })),
  };

  return JSON.stringify(payload, null, 2);
}
