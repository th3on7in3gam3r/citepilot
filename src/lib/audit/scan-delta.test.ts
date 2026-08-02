import { describe, expect, it } from "vitest";
import { buildScanDeltaSummary, formatScanDeltaChips } from "@/lib/audit/scan-delta";
import type { AuditPayload } from "@/lib/api-types";

function audit(overrides: Partial<AuditPayload> = {}): AuditPayload {
  return {
    id: "a1",
    domain: "example.com",
    score: 50,
    cited: 2,
    total: 4,
    platforms: [],
    gaps: ["gap a"],
    competitors: [],
    siteSignals: {
      title: null,
      metaDescription: null,
      h1: null,
      wordCount: 0,
      hasJsonLd: false,
      hasFaqSchema: false,
      hasOrganizationSchema: false,
      hasOgTags: false,
      robotsAllows: true,
      sitemapFound: false,
      fetchOk: true,
      geoScore: 50,
    },
    mode: "live",
    promptResults: [
      { prompt: "best tool", cited: true, reason: "" },
      { prompt: "pricing", cited: false, reason: "" },
    ],
    workspaceId: "ws1",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("formatScanDeltaChips", () => {
  it("formats net prompt and gap changes", () => {
    expect(
      formatScanDeltaChips({
        scoreDelta: -5,
        promptsCitedNet: -2,
        newGaps: 1,
        resolvedGaps: 0,
        platformSlips: 0,
      }),
    ).toEqual(["−2 prompts cited", "+1 gap", "-5 score"]);
  });
});

describe("buildScanDeltaSummary", () => {
  it("returns unavailable without a previous audit", () => {
    const summary = buildScanDeltaSummary({
      current: audit(),
      previous: null,
    });
    expect(summary.available).toBe(false);
    expect(summary.chips).toEqual([]);
  });

  it("tolerates malformed gap arrays", () => {
    const previous = audit({
      id: "prev",
      gaps: undefined as unknown as string[],
    });
    const current = audit({
      id: "curr",
      gaps: [null, "new gap", 42] as unknown as string[],
    });

    expect(() =>
      buildScanDeltaSummary({ current, previous }),
    ).not.toThrow();
  });

  it("detects lost citations and new gaps", () => {
    const previous = audit({
      id: "prev",
      score: 60,
      promptResults: [
        { prompt: "best tool", cited: true, reason: "" },
        { prompt: "pricing", cited: true, reason: "" },
      ],
      gaps: [],
    });
    const current = audit({
      id: "curr",
      score: 55,
      promptResults: [
        { prompt: "best tool", cited: false, reason: "" },
        { prompt: "pricing", cited: true, reason: "" },
      ],
      gaps: ["new gap"],
    });

    const summary = buildScanDeltaSummary({ current, previous });
    expect(summary.available).toBe(true);
    expect(summary.promptsLost).toBe(1);
    expect(summary.newGaps).toBe(1);
    expect(summary.chips).toContain("−1 prompt cited");
    expect(summary.chips).toContain("+1 gap");
    expect(summary.detail?.newGapLabels).toEqual(["new gap"]);
    expect(summary.detail?.fullyUnchanged).toBe(false);
  });

  it("marks fully unchanged scans in detail", () => {
    const previous = audit({ id: "prev", score: 45, cited: 2, gaps: ["gap a"] });
    const current = audit({
      id: "curr",
      score: 45,
      cited: 2,
      gaps: ["gap a"],
    });

    const summary = buildScanDeltaSummary({ current, previous });
    expect(summary.detail?.fullyUnchanged).toBe(true);
    expect(summary.chips).toEqual([]);
  });
});
