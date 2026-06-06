import { describe, expect, it } from "vitest";
import { clampMetaDescription, clampSeoTitle, SERP_TITLE_MAX } from "@/lib/seo/meta";
import { site } from "@/lib/site";

describe("clampMetaDescription", () => {
  it("returns short text unchanged", () => {
    const s = "Short GEO citation meta.";
    expect(clampMetaDescription(s)).toBe(s);
  });

  it("trims long text on a word boundary under 160 chars", () => {
    const long =
      "Tool A vs Tool B for SEO teams: a complete comparison of GEO citation tracking, AI visibility dashboards, money prompts, weekly rescans, and proof reports for agencies managing multiple client workspaces in 2026.";
    const result = clampMetaDescription(long);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.length).toBeGreaterThan(100);
    expect(long.startsWith(result.slice(0, 24))).toBe(true);
  });

  it("clamps money-prompts workflow guide title without dangling stop words", () => {
    const long =
      "How to Track if ChatGPT Mentions Your Brand in AI Answers: A Step-By-Step Guide";
    const result = clampSeoTitle(long);
    const rendered = `${result} · ${site.name}`;
    expect(rendered.length).toBeLessThanOrEqual(SERP_TITLE_MAX);
    expect(result).toBe("How to Track if ChatGPT Mentions Your Brand");
    expect(result.endsWith(" in")).toBe(false);
  });

  it("clamps long blog seo titles for the layout suffix", () => {
    const long =
      "How to Track ChatGPT Citations for Your Brand: The Complete Guide for 2026";
    const result = clampSeoTitle(long);
    const rendered = `${result} · ${site.name}`;
    expect(rendered.length).toBeLessThanOrEqual(SERP_TITLE_MAX);
    expect(result).toBe("How to Track ChatGPT Citations for Your Brand");
  });

  it("prefers a complete sentence when trimming crawlability checklist copy", () => {
    const long =
      "Discover a comprehensive checklist for enhancing crawlability and implementing schema markup to boost your site's visibility on Google and AI engines. Perfect for solo founders aiming for better rankings and citations.";
    const result = clampMetaDescription(long);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith(".")).toBe(true);
    expect(result).toBe(
      "Discover a comprehensive checklist for enhancing crawlability and implementing schema markup to boost your site's visibility on Google and AI engines.",
    );
  });

  it("trims money-prompts workflow guide meta to one sentence", () => {
    const long =
      "Learn how to track if ChatGPT mentions your brand in AI answers with our comprehensive guide. Discover a step-by-step setup using money prompts and a weekly re-scan workflow for solo founders.";
    const result = clampMetaDescription(long);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith(".")).toBe(true);
    expect(result).toBe(
      "Learn how to track if ChatGPT mentions your brand in AI answers with our comprehensive guide.",
    );
  });

  it("trims ChatGPT workflow checklist meta to one sentence", () => {
    const long =
      "Discover free tools, a practical workflow, and a 7-day checklist to effectively track ChatGPT citations for your brand. Perfect for solo founders aiming for AI search visibility and better rankings.";
    const result = clampMetaDescription(long);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.length).toBeGreaterThanOrEqual(110);
    expect(result.endsWith(".")).toBe(true);
  });
});
