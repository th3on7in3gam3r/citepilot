import { describe, expect, it } from "vitest";
import { buildDefaultSeedQueries } from "@/lib/money-prompts/seeds";
import { defaultWorkspacePreferences } from "@/lib/settings";

describe("buildDefaultSeedQueries", () => {
  it("builds seeds from domain, description, business type, and prefs", () => {
    const seeds = buildDefaultSeedQueries({
      domain: "getcitepilot.com",
      businessType: "GEO SaaS",
      description: "Track AI citations across ChatGPT and Perplexity",
      buyerQuestion: "How do I get cited in ChatGPT?",
      preferences: {
        ...defaultWorkspacePreferences,
        monitoredPrompts: ["best AI citation tools"],
      },
    });
    expect(seeds.length).toBeGreaterThanOrEqual(3);
    expect(seeds.some((s) => s.includes("ChatGPT"))).toBe(true);
    expect(seeds.some((s) => /GEO SaaS/i.test(s))).toBe(true);
    expect(seeds.some((s) => s.includes("getcitepilot.com"))).toBe(true);
  });

  it("returns at least domain-based seed when sparse", () => {
    const seeds = buildDefaultSeedQueries({ domain: "example.com" });
    expect(seeds.length).toBeGreaterThanOrEqual(1);
    expect(seeds[0]).toContain("example.com");
  });
});
