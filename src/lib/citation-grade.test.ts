import { describe, expect, it } from "vitest";
import {
  buildExecutiveBriefingMetrics,
  scoreToLetterGrade,
} from "@/lib/citation-grade";
import { buildWorkspaceSnapshot } from "@/lib/dashboard";

describe("citation-grade", () => {
  it("maps scores to letter grades", () => {
    expect(scoreToLetterGrade(92)).toBe("A");
    expect(scoreToLetterGrade(85)).toBe("B");
    expect(scoreToLetterGrade(72)).toBe("C");
    expect(scoreToLetterGrade(61)).toBe("D");
    expect(scoreToLetterGrade(40)).toBe("F");
  });

  it("counts cited prompts from audit results", () => {
    const base = buildWorkspaceSnapshot({ domain: "citepilot.com" });
    const metrics = buildExecutiveBriefingMetrics({
      ...base,
      hasRealAudit: true,
      citedPlatforms: 3,
      totalPlatforms: 8,
      promptResults: [
        { prompt: "a", cited: true, reason: "" },
        { prompt: "b", cited: false, reason: "" },
        { prompt: "c", cited: true, reason: "" },
      ],
    });
    expect(metrics.promptsCited).toBe(2);
    expect(metrics.promptsTotal).toBe(3);
    expect(metrics.promptCitationPct).toBe(67);
    expect(metrics.platformCoveragePct).toBeGreaterThan(0);
  });

  it("reports actual audience count without a floor of 1", () => {
    const base = buildWorkspaceSnapshot({ domain: "example.com", audiences: [] });
    const metrics = buildExecutiveBriefingMetrics(base);
    expect(metrics.audienceCount).toBe(0);
    expect(metrics.primaryAudience).toBeNull();
  });
});
