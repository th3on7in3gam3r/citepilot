import { describe, expect, it } from "vitest";
import {
  parseBadgeStyle,
  parseBadgeTheme,
  renderGeoBadgeSvg,
  scoreColor,
  widgetPlatformSummary,
} from "@/lib/widget/geo-badge";

const scored = {
  domain: "example.com",
  score: 72,
  hasAudit: true,
  platforms: [] as { name: string; present: boolean }[],
};

const unscored = {
  domain: "example.com",
  score: null,
  hasAudit: false,
  platforms: [] as { name: string; present: boolean }[],
};

describe("geo-badge", () => {
  it("maps score to color bands", () => {
    expect(scoreColor(30)).toBe("#ef4444");
    expect(scoreColor(55)).toBe("#f59e0b");
    expect(scoreColor(85)).toBe("#22c55e");
  });

  it("renders CTA when no audit", () => {
    const svg = renderGeoBadgeSvg(unscored);
    expect(svg).toContain("Get score");
  });

  it("renders score when audit exists", () => {
    const svg = renderGeoBadgeSvg(scored);
    expect(svg).toContain("72");
    expect(svg).toContain("#22c55e");
  });

  it("renders each style with expected labels", () => {
    const flat = renderGeoBadgeSvg(scored, "flat");
    expect(flat).toContain("GEO Score");
    expect(flat).toContain("72");

    const shield = renderGeoBadgeSvg(scored, "shield");
    expect(shield).toContain("GEO SCORE");
    expect(shield).toContain("CitePilot");
    expect(shield).toContain("72");

    const badge = renderGeoBadgeSvg(scored, "badge");
    expect(badge).toContain("GEO Score");
    expect(badge).toContain("72/100");
  });

  it("theme=light uses light chrome fill", () => {
    const dark = renderGeoBadgeSvg(scored, "flat", "dark");
    const light = renderGeoBadgeSvg(scored, "flat", "light");
    expect(dark).toContain('fill="#070b14"');
    expect(light).toContain('fill="#f8fafc"');
    expect(light).not.toBe(dark);
  });

  it("parses badge styles", () => {
    expect(parseBadgeStyle("shield")).toBe("shield");
    expect(parseBadgeStyle("badge")).toBe("badge");
    expect(parseBadgeStyle("flat")).toBe("flat");
    expect(parseBadgeStyle("nope")).toBe("flat");
    expect(parseBadgeStyle(null)).toBe("flat");
  });

  it("parses badge themes", () => {
    expect(parseBadgeTheme("light")).toBe("light");
    expect(parseBadgeTheme("dark")).toBe("dark");
    expect(parseBadgeTheme("nope")).toBe("dark");
    expect(parseBadgeTheme(null)).toBe("dark");
  });

  it("summarizes ChatGPT and Perplexity", () => {
    const rows = widgetPlatformSummary([
      { name: "ChatGPT", present: true },
      { name: "Perplexity", present: false },
    ]);
    expect(rows).toEqual([
      { name: "ChatGPT", cited: true },
      { name: "Perplexity", cited: false },
    ]);
  });
});
