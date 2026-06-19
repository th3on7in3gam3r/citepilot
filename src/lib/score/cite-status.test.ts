import { describe, expect, it } from "vitest";
import {
  citeStatusMilestones,
  citeStatusTier,
  isCiteStatusUpgrade,
  progressWithinTier,
} from "@/lib/score/cite-status";
import type { WorkspaceSnapshot } from "@/lib/dashboard";
import { emptyScanDeltaSummary } from "@/lib/audit/scan-delta";

function workspace(overrides: Partial<WorkspaceSnapshot>): WorkspaceSnapshot {
  return {
    domain: "example.com",
    businessType: "saas",
    description: "",
    audiences: [],
    competitors: [],
    buyerQuestion: "best tool",
    preferences: {} as WorkspaceSnapshot["preferences"],
    updatedAt: new Date().toISOString(),
    citationScore: 50,
    citedPlatforms: 1,
    totalPlatforms: 8,
    promptsTracked: 5,
    contentDrafts: 0,
    sourceCount: 0,
    communityMentions: 0,
    weeklyLift: "+0",
    domainRating: 0,
    visibilityScore: 0,
    gaps: [],
    auditId: "a1",
    auditMode: "live",
    hasRealAudit: true,
    ...overrides,
  };
}

describe("citeStatusTier", () => {
  it("maps scores to four tiers", () => {
    expect(citeStatusTier(25).id).toBe("gap");
    expect(citeStatusTier(55).id).toBe("emerging");
    expect(citeStatusTier(78).id).toBe("cite-ready");
    expect(citeStatusTier(90).id).toBe("highly-citeable");
  });
});

describe("progressWithinTier", () => {
  it("reports progress toward the next tier", () => {
    expect(progressWithinTier(50).label).toContain("Cite-ready");
    expect(progressWithinTier(90).label).toBe("Top tier unlocked");
  });
});

describe("citeStatusMilestones", () => {
  it("unlocks milestones from workspace signals", () => {
    const milestones = citeStatusMilestones(
      workspace({
        citationScore: 88,
        citedPlatforms: 4,
        scanDelta: { ...emptyScanDeltaSummary, scoreDelta: 12 },
      }),
    );

    expect(milestones.find((m) => m.id === "cite-ready")?.unlocked).toBe(true);
    expect(milestones.find((m) => m.id === "highly-citeable")?.unlocked).toBe(true);
    expect(milestones.find((m) => m.id === "score-lift")?.unlocked).toBe(true);
  });
});

describe("isCiteStatusUpgrade", () => {
  it("detects tier upgrades only when rank increases", () => {
    expect(isCiteStatusUpgrade("emerging", 75).upgraded).toBe(true);
    expect(isCiteStatusUpgrade("cite-ready", 72).upgraded).toBe(false);
    expect(isCiteStatusUpgrade(null, 80).upgraded).toBe(false);
  });
});
