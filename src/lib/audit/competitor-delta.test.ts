import { describe, expect, it } from "vitest";
import type { AuditPayload } from "@/lib/api-types";
import { buildDeltaFromAudits } from "@/lib/audit/competitor-delta";

function audit(
  overrides: Partial<AuditPayload> & Pick<AuditPayload, "id" | "score">,
): AuditPayload {
  return {
    id: overrides.id,
    domain: "acme.com",
    score: overrides.score,
    cited: overrides.cited ?? 1,
    total: overrides.total ?? 2,
    platforms: [],
    gaps: overrides.gaps ?? [],
    competitors: overrides.competitors ?? ["rival.com"],
    siteSignals: overrides.siteSignals ?? {
      title: "Acme",
      metaDescription: "x",
      hasJsonLd: true,
      hasFaqSchema: false,
      sitemapFound: true,
      wordCount: 500,
      geoScore: 60,
    },
    mode: "technical",
    promptResults: overrides.promptResults ?? [
      { prompt: "best crm", cited: true, reason: "ok" },
      { prompt: "crm pricing", cited: false, reason: "missing" },
    ],
    workspaceId: "ws-1",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

describe("buildDeltaFromAudits", () => {
  it("detects prompt loss between audits", () => {
    const previous = audit({
      id: "a1",
      score: 70,
      promptResults: [
        { prompt: "best crm", cited: true, reason: "ok" },
        { prompt: "crm pricing", cited: true, reason: "ok" },
      ],
    });
    const current = audit({
      id: "a2",
      score: 55,
      promptResults: [
        { prompt: "best crm", cited: true, reason: "ok" },
        { prompt: "crm pricing", cited: false, reason: "lost" },
      ],
    });

    const delta = buildDeltaFromAudits(current, previous, ["rival.com"]);
    expect(delta.hasChanges).toBe(true);
    expect(delta.promptsLost).toHaveLength(1);
    expect(delta.scoreDelta).toBe(-15);
  });
});
