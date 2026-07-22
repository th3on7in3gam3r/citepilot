import { describe, expect, it } from "vitest";
import {
  aggregatePageSignals,
  maxPagesForPlan,
  mergeHomepageAndDeepCrawl,
  type CrawledPage,
} from "@/lib/audit/deep-crawl";
import type { SiteSignals } from "@/lib/api-types";

function page(
  url: string,
  overrides: Partial<CrawledPage["signals"]> = {},
): CrawledPage {
  return {
    url,
    signals: {
      title: "Page",
      metaDescription: null,
      h1: null,
      bodyExcerpt: "hello world",
      wordCount: 2,
      hasJsonLd: false,
      hasFaqSchema: false,
      hasOrganizationSchema: false,
      hasOgTags: false,
      ...overrides,
    },
  };
}

describe("maxPagesForPlan", () => {
  it("returns null for free", () => {
    expect(maxPagesForPlan("free")).toBeNull();
  });

  it("caps pilot at 20 and fleet at 50", () => {
    expect(maxPagesForPlan("pilot")).toBe(20);
    expect(maxPagesForPlan("fleet")).toBe(50);
  });
});

describe("aggregatePageSignals", () => {
  it("ORs schema flags and sums word counts across pages", () => {
    const aggregated = aggregatePageSignals(
      [
        page("https://example.com/", { wordCount: 100, hasJsonLd: true }),
        page("https://example.com/faq", {
          wordCount: 250,
          hasFaqSchema: true,
          title: "Longer FAQ title for buyers",
          metaDescription: "FAQ meta",
          h1: "FAQ",
        }),
      ],
      { robotsAllows: true, sitemapFound: true },
      20,
    );

    expect(aggregated.hasJsonLd).toBe(true);
    expect(aggregated.hasFaqSchema).toBe(true);
    expect(aggregated.wordCount).toBe(350);
    expect(aggregated.title).toBe("Longer FAQ title for buyers");
    expect(aggregated.metaDescription).toBe("FAQ meta");
    expect(aggregated.deepCrawl).toEqual({
      pagesCrawled: 2,
      maxPages: 20,
      urls: ["https://example.com/", "https://example.com/faq"],
    });
    expect(aggregated.fetchOk).toBe(true);
    expect(aggregated.geoScore).toBeGreaterThan(0);
  });

  it("caps body excerpt length", () => {
    const long = "word ".repeat(4000);
    const aggregated = aggregatePageSignals(
      [page("https://example.com/", { bodyExcerpt: long, wordCount: 4000 })],
      { robotsAllows: true, sitemapFound: false },
      20,
    );
    expect(aggregated.bodyExcerpt?.length).toBeLessThanOrEqual(12_000);
  });
});

describe("mergeHomepageAndDeepCrawl", () => {
  it("keeps homepage robots/sitemap and ORs schema with crawl", () => {
    const homepage: SiteSignals = {
      title: "Home",
      metaDescription: "Home meta",
      h1: "Welcome",
      bodyExcerpt: "home",
      wordCount: 50,
      hasJsonLd: false,
      hasFaqSchema: false,
      hasOrganizationSchema: true,
      hasOgTags: true,
      robotsAllows: false,
      sitemapFound: true,
      fetchOk: true,
      geoScore: 40,
      deepCrawl: null,
    };

    const merged = mergeHomepageAndDeepCrawl(homepage, {
      maxPages: 20,
      pages: [
        page("https://example.com/pricing", {
          hasFaqSchema: true,
          wordCount: 400,
          bodyExcerpt: "pricing body",
        }),
      ],
    });

    expect(merged.robotsAllows).toBe(false);
    expect(merged.sitemapFound).toBe(true);
    expect(merged.hasOrganizationSchema).toBe(true);
    expect(merged.hasFaqSchema).toBe(true);
    expect(merged.hasOgTags).toBe(true);
    expect(merged.deepCrawl?.pagesCrawled).toBe(1);
  });

  it("returns homepage when crawl has no pages", () => {
    const homepage: SiteSignals = {
      title: "Home",
      metaDescription: null,
      h1: null,
      wordCount: 10,
      hasJsonLd: false,
      hasFaqSchema: false,
      hasOrganizationSchema: false,
      hasOgTags: false,
      robotsAllows: true,
      sitemapFound: false,
      fetchOk: true,
      geoScore: 20,
    };
    expect(
      mergeHomepageAndDeepCrawl(homepage, { maxPages: 20, pages: [] }),
    ).toBe(homepage);
  });
});
