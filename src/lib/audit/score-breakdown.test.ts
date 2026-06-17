import { describe, expect, it } from "vitest";
import { auditScoreBreakdown } from "@/lib/audit/score-breakdown";

describe("auditScoreBreakdown", () => {
  it("matches runCitationAudit weighting", () => {
    const b = auditScoreBreakdown({ geoScore: 90, cited: 0, total: 7 });
    expect(b.technicalPoints).toBe(41);
    expect(b.citationPoints).toBe(0);
    expect(b.combinedScore).toBe(41);
  });

  it("weights citations at 55%", () => {
    const b = auditScoreBreakdown({ geoScore: 90, cited: 3, total: 7 });
    expect(b.citationPoints).toBe(Math.round((3 / 7) * 100 * 0.55));
    expect(b.combinedScore).toBe(
      Math.round(90 * 0.45 + (3 / 7) * 100 * 0.55),
    );
  });
});
