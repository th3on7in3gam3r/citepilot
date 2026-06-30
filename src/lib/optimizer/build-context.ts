import type { WorkspaceSnapshotResponse } from "@/lib/api-types";

/** Rich audit context for Claude Site Optimizer — grounded in workspace data only. */
export function buildOptimizerContext(
  snapshot: WorkspaceSnapshotResponse,
): string {
  const promptResults = snapshot.promptResults ?? [];
  const cited = promptResults.filter((p) => p?.cited);
  const uncited = promptResults.filter((p) => p && !p.cited);
  const signals = snapshot.siteSignals;

  const payload = {
    domain: snapshot.domain,
    businessType: snapshot.businessType ?? "",
    description: (snapshot.description ?? "").slice(0, 600),
    buyerQuestion: snapshot.buyerQuestion ?? "",
    competitors: (snapshot.competitors ?? []).slice(0, 8),
    citationScore: snapshot.citationScore,
    geoScore: signals?.geoScore ?? null,
    hasRealAudit: snapshot.hasRealAudit,
    auditMode: snapshot.auditMode,
    gaps: (snapshot.gaps ?? []).slice(0, 15),
    monitoredPrompts: uncited
      .concat(cited)
      .map((p) => p.prompt)
      .slice(0, 12),
    siteSignals: signals
      ? {
          title: signals.title,
          metaDescription: signals.metaDescription,
          h1: signals.h1,
          wordCount: signals.wordCount,
          hasJsonLd: signals.hasJsonLd,
          hasFaqSchema: signals.hasFaqSchema,
          hasOrganizationSchema: signals.hasOrganizationSchema,
          hasOgTags: signals.hasOgTags,
          robotsAllows: signals.robotsAllows,
          sitemapFound: signals.sitemapFound,
          fetchOk: signals.fetchOk,
          geoScore: signals.geoScore,
          bodyExcerpt: (signals.bodyExcerpt ?? "").slice(0, 800),
        }
      : null,
    promptsCited: cited.slice(0, 8).map((p) => ({
      prompt: p.prompt,
      reason: p.reason,
    })),
    promptsNotCited: uncited.slice(0, 10).map((p) => ({
      prompt: p.prompt,
      reason: p.reason,
    })),
    platformPresence: (snapshot.platformPresence ?? [])
      .slice(0, 10)
      .map((p) => ({ name: p.name, cited: p.present, share: p.share })),
    scanDelta: snapshot.scanDelta
      ? {
          scoreDelta: snapshot.scanDelta.scoreDelta,
          newGaps: snapshot.scanDelta.detail?.newGapLabels?.slice(0, 6),
          resolvedGaps: snapshot.scanDelta.detail?.resolvedGapLabels?.slice(0, 6),
        }
      : null,
  };

  return JSON.stringify(payload, null, 2);
}
