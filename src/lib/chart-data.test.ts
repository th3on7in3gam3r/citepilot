import { describe, expect, it } from "vitest";
import { buildPlatformVisibilityBars } from "@/lib/chart-data";

describe("buildPlatformVisibilityBars", () => {
  it("uses share when present and clamps to 0–100", () => {
    const bars = buildPlatformVisibilityBars([
      { name: "ChatGPT", cited: true, share: 72 },
      { name: "Perplexity", cited: false, share: 0 },
    ]);
    expect(bars[0]?.value).toBe(72);
    expect(bars[0]?.shortLabel).toBe("GPT");
    expect(bars[1]?.value).toBe(0);
  });

  it("falls back to cited boolean when share is missing", () => {
    const bars = buildPlatformVisibilityBars([
      { name: "Google AI Overviews", cited: true },
      { name: "Grok", cited: false },
    ]);
    expect(bars[0]?.value).toBe(100);
    expect(bars[1]?.value).toBe(0);
  });
});
