import { describe, expect, it } from "vitest";
import {
  buildCitationHeatmapData,
  buildCompetitorSovData,
} from "@/lib/citations/viz-data";
import type { WorkspaceSnapshot } from "@/lib/dashboard";

function baseWorkspace(overrides: Partial<WorkspaceSnapshot> = {}): WorkspaceSnapshot {
  return {
    domain: "acme.com",
    businessType: "saas",
    description: "",
    audiences: [],
    competitors: ["rival.com"],
    buyerQuestion: "best CRM for startups",
    preferences: {} as WorkspaceSnapshot["preferences"],
    updatedAt: new Date().toISOString(),
    citationScore: 62,
    citedPlatforms: 2,
    totalPlatforms: 6,
    promptsTracked: 1,
    contentDrafts: 0,
    sourceCount: 0,
    communityMentions: 0,
    weeklyLift: "—",
    domainRating: 40,
    visibilityScore: 55,
    gaps: [],
    auditId: "audit_1",
    auditMode: "live",
    hasRealAudit: true,
    promptResults: [
      { prompt: "best CRM for startups", cited: true, reason: "live" },
    ],
    platformPresence: [
      { name: "ChatGPT", present: true, share: 80 },
      { name: "Perplexity", present: false, share: 0 },
    ],
    citationHistory: [
      { recordedAt: "2026-01-01", visibilityIndex: 40 },
      { recordedAt: "2026-01-08", visibilityIndex: 48 },
      { recordedAt: "2026-01-15", visibilityIndex: 52 },
      { recordedAt: "2026-01-22", visibilityIndex: 55 },
    ],
    ...overrides,
  };
}

describe("buildCitationHeatmapData", () => {
  it("marks live cited checks as green cited cells", () => {
    const data = buildCitationHeatmapData({
      workspace: baseWorkspace(),
      checks: [
        {
          platform: "ChatGPT",
          promptIndex: 0,
          prompt: "best CRM for startups",
          cited: true,
          checkMode: "live",
        },
      ],
    });

    const chatgpt = data.rows[0]?.cells.find((c) => c.platformId === "chatgpt");
    expect(chatgpt?.status).toBe("cited");
    expect(data.platformRates.find((p) => p.platformId === "chatgpt")?.rate).toBeGreaterThan(0);
  });
});

describe("buildCompetitorSovData", () => {
  it("returns SOV cards for your domain and competitors", () => {
    const data = buildCompetitorSovData(baseWorkspace());
    expect(data.available).toBe(true);
    expect(data.cards.some((c) => c.domain === "acme.com" && c.isYou)).toBe(true);
    expect(data.cards.some((c) => c.domain === "rival.com")).toBe(true);
    expect(data.bars.length).toBeGreaterThan(0);
  });
});
