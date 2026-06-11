import { describe, expect, it } from "vitest";
import { buildCopilotContext } from "@/lib/copilot/workspace-context";
import { emptyScanDeltaSummary } from "@/lib/audit/scan-delta";
import {
  parseGaps,
  parsePromptResults,
  parseSiteSignals,
} from "@/lib/audit/safe-payload";
import type { WorkspaceSnapshotResponse } from "@/lib/api-types";
import { defaultWorkspacePreferences } from "@/lib/settings";

describe("safe-payload", () => {
  it("parseSiteSignals handles null raw", () => {
    const s = parseSiteSignals(null, 42);
    expect(s.geoScore).toBe(42);
    expect(s.hasJsonLd).toBe(false);
  });

  it("parseGaps handles invalid JSON", () => {
    expect(parseGaps("not-json")).toEqual([]);
  });

  it("parsePromptResults handles null", () => {
    expect(parsePromptResults(null)).toEqual([]);
  });

  it("parsePromptResults drops malformed rows", () => {
    const raw = JSON.stringify([
      { prompt: "valid", cited: true, reason: "ok" },
      { prompt: 42, cited: true },
      { cited: false },
      null,
    ]);
    expect(parsePromptResults(raw)).toEqual([
      { prompt: "valid", cited: true, reason: "ok" },
    ]);
  });
});

describe("buildCopilotContext", () => {
  it("does not throw when optional snapshot fields are empty", () => {
    const snapshot = {
      id: "ws1",
      domain: "example.com",
      businessType: "saas",
      description: "",
      audiences: [],
      competitors: [],
      buyerQuestion: "best tool",
      preferences: defaultWorkspacePreferences,
      updatedAt: new Date().toISOString(),
      citationScore: 50,
      citedPlatforms: 1,
      totalPlatforms: 8,
      promptsTracked: 1,
      contentDrafts: 0,
      sourceCount: 0,
      communityMentions: 0,
      weeklyLift: "—",
      domainRating: 35,
      visibilityScore: 50,
      gaps: ["missing schema"],
      auditId: "a1",
      auditMode: "live" as const,
      siteSignals: null,
      hasRealAudit: true,
      promptResults: [],
      platformPresence: [],
      citationHistory: [],
      contentStrategy: [],
      contentStrategyGeneratedAt: null,
      weeklyLiftAvailable: false,
      scanDelta: emptyScanDeltaSummary,
      freeExplainGapTeaserAvailable: false,
    } satisfies WorkspaceSnapshotResponse;

    expect(() => buildCopilotContext(snapshot)).not.toThrow();
    const json = buildCopilotContext(snapshot);
    expect(json).toContain("example.com");
  });
});
