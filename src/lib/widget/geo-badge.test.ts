import { describe, expect, it } from "vitest";
import {
  parseBadgeStyle,
  renderGeoBadgeSvg,
  scoreColor,
  widgetPlatformSummary,
} from "@/lib/widget/geo-badge";

describe("geo-badge", () => {
  it("maps score to color bands", () => {
    expect(scoreColor(30)).toBe("#ef4444");
    expect(scoreColor(55)).toBe("#f59e0b");
    expect(scoreColor(85)).toBe("#22c55e");
  });

  it("renders CTA when no audit", () => {
    const svg = renderGeoBadgeSvg({
      domain: "example.com",
      score: null,
      hasAudit: false,
      platforms: [],
    });
    expect(svg).toContain("Get your score");
  });

  it("renders score when audit exists", () => {
    const svg = renderGeoBadgeSvg({
      domain: "example.com",
      score: 72,
      hasAudit: true,
      platforms: [],
    });
    expect(svg).toContain("72");
    expect(svg).toContain("#22c55e");
  });

  it("parses badge styles", () => {
    expect(parseBadgeStyle("shield")).toBe("shield");
    expect(parseBadgeStyle("nope")).toBe("flat");
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
