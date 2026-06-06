import { describe, expect, it } from "vitest";
import { clampMetaDescription } from "@/lib/seo/meta";

describe("clampMetaDescription", () => {
  it("returns short text unchanged", () => {
    const s = "Short GEO citation meta.";
    expect(clampMetaDescription(s)).toBe(s);
  });

  it("trims long text on a word boundary under 170 chars", () => {
    const long =
      "Tool A vs Tool B for SEO teams: a complete comparison of GEO citation tracking, AI visibility dashboards, money prompts, weekly rescans, and proof reports for agencies managing multiple client workspaces in 2026.";
    const result = clampMetaDescription(long);
    expect(result.length).toBeLessThanOrEqual(170);
    expect(result.length).toBeGreaterThan(100);
    expect(long.startsWith(result.slice(0, 24))).toBe(true);
  });
});
