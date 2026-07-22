import { describe, expect, it } from "vitest";
import { isCrawlerUserAgent } from "@/lib/crawler-ua";

describe("isCrawlerUserAgent", () => {
  it("detects common crawlers", () => {
    expect(isCrawlerUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(
      true,
    );
    expect(isCrawlerUserAgent("GPTBot")).toBe(true);
    expect(isCrawlerUserAgent("bingbot/2.0")).toBe(true);
  });

  it("allows human browsers", () => {
    expect(
      isCrawlerUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
      ),
    ).toBe(false);
    expect(isCrawlerUserAgent(null)).toBe(false);
    expect(isCrawlerUserAgent("")).toBe(false);
  });
});
