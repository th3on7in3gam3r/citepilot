import type { DeepCrawlMeta, SiteSignals } from "@/lib/api-types";
import type { BillingPlan } from "@/lib/billing/types";
import {
  analyzeHtml,
  computeGeoScore,
  normalizeDomain,
  type PageHtmlSignals,
} from "@/lib/audit/site-analyzer";

export const DEEP_CRAWL_TIMEOUT_MS = 90_000;
export const DEEP_CRAWL_BODY_EXCERPT_CAP = 12_000;

export type CrawledPage = {
  url: string;
  signals: PageHtmlSignals;
};

export type DeepCrawlResult = {
  pages: CrawledPage[];
  maxPages: number;
};

/** Pilot 20 / Fleet 50 — free returns null (homepage-only). */
export function maxPagesForPlan(plan: BillingPlan): number | null {
  if (plan === "fleet") return 50;
  if (plan === "pilot") return 20;
  return null;
}

function pickRichest(
  pages: CrawledPage[],
  key: "title" | "metaDescription" | "h1",
): string | null {
  let best: string | null = null;
  for (const page of pages) {
    const value = page.signals[key];
    if (!value) continue;
    if (!best || value.length > best.length) best = value;
  }
  return best;
}

/** Pure aggregation — unit-tested without Playwright. */
export function aggregatePageSignals(
  pages: CrawledPage[],
  base: Pick<SiteSignals, "robotsAllows" | "sitemapFound">,
  maxPages: number,
): SiteSignals {
  const urls = pages.map((p) => p.url).slice(0, maxPages);
  const deepCrawl: DeepCrawlMeta = {
    pagesCrawled: pages.length,
    maxPages,
    urls,
  };

  if (pages.length === 0) {
    const empty: Omit<SiteSignals, "geoScore"> = {
      title: null,
      metaDescription: null,
      h1: null,
      bodyExcerpt: null,
      wordCount: 0,
      hasJsonLd: false,
      hasFaqSchema: false,
      hasOrganizationSchema: false,
      hasOgTags: false,
      robotsAllows: base.robotsAllows,
      sitemapFound: base.sitemapFound,
      fetchOk: false,
      deepCrawl,
    };
    return { ...empty, geoScore: computeGeoScore(empty) };
  }

  let wordCount = 0;
  let hasJsonLd = false;
  let hasFaqSchema = false;
  let hasOrganizationSchema = false;
  let hasOgTags = false;
  const excerpts: string[] = [];

  for (const page of pages) {
    const s = page.signals;
    wordCount += s.wordCount;
    hasJsonLd = hasJsonLd || s.hasJsonLd;
    hasFaqSchema = hasFaqSchema || s.hasFaqSchema;
    hasOrganizationSchema = hasOrganizationSchema || s.hasOrganizationSchema;
    hasOgTags = hasOgTags || s.hasOgTags;
    if (s.bodyExcerpt) excerpts.push(s.bodyExcerpt);
  }

  const bodyExcerpt =
    excerpts.join(" ").slice(0, DEEP_CRAWL_BODY_EXCERPT_CAP) || null;

  const partial: Omit<SiteSignals, "geoScore"> = {
    title: pickRichest(pages, "title"),
    metaDescription: pickRichest(pages, "metaDescription"),
    h1: pickRichest(pages, "h1"),
    bodyExcerpt,
    wordCount,
    hasJsonLd,
    hasFaqSchema,
    hasOrganizationSchema,
    hasOgTags,
    robotsAllows: base.robotsAllows,
    sitemapFound: base.sitemapFound,
    fetchOk: true,
    deepCrawl,
  };

  return {
    ...partial,
    geoScore: computeGeoScore(partial),
  };
}

/** Merge homepage fetch (robots/sitemap/snippet fixes) with deep-crawl aggregate. */
export function mergeHomepageAndDeepCrawl(
  homepage: SiteSignals,
  crawl: DeepCrawlResult,
): SiteSignals {
  if (crawl.pages.length === 0) return homepage;

  const aggregated = aggregatePageSignals(
    crawl.pages,
    {
      robotsAllows: homepage.robotsAllows,
      sitemapFound: homepage.sitemapFound,
    },
    crawl.maxPages,
  );

  const partial: Omit<SiteSignals, "geoScore"> = {
    title: aggregated.title ?? homepage.title,
    metaDescription: aggregated.metaDescription ?? homepage.metaDescription,
    h1: aggregated.h1 ?? homepage.h1,
    bodyExcerpt: aggregated.bodyExcerpt ?? homepage.bodyExcerpt,
    wordCount: Math.max(aggregated.wordCount, homepage.wordCount),
    hasJsonLd: aggregated.hasJsonLd || homepage.hasJsonLd,
    hasFaqSchema: aggregated.hasFaqSchema || homepage.hasFaqSchema,
    hasOrganizationSchema:
      aggregated.hasOrganizationSchema || homepage.hasOrganizationSchema,
    hasOgTags: aggregated.hasOgTags || homepage.hasOgTags,
    robotsAllows: homepage.robotsAllows,
    sitemapFound: homepage.sitemapFound,
    fetchOk: homepage.fetchOk || aggregated.fetchOk,
    deepCrawl: aggregated.deepCrawl,
  };

  return {
    ...partial,
    geoScore: computeGeoScore(partial),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Same-domain Playwright deep crawl. Soft-fails by returning null
 * (caller keeps homepage-only analyzeSite).
 */
export async function deepCrawlSite(
  domainInput: string,
  options: { maxPages: number; timeoutMs?: number },
): Promise<DeepCrawlResult | null> {
  const domain = normalizeDomain(domainInput);
  const maxPages = Math.max(1, options.maxPages);
  const timeoutMs = options.timeoutMs ?? DEEP_CRAWL_TIMEOUT_MS;
  const pages: CrawledPage[] = [];

  try {
    const { PlaywrightCrawler, Configuration, MemoryStorage } =
      await import("crawlee");

    const storage = new MemoryStorage({ persistStorage: false });
    const config = new Configuration({
      storageClient: storage,
      persistStorage: false,
    });

    const crawler = new PlaywrightCrawler(
      {
        maxRequestsPerCrawl: maxPages,
        requestHandlerTimeoutSecs: 30,
        navigationTimeoutSecs: 20,
        headless: true,
        async requestHandler({ request, page, enqueueLinks }) {
          const html = await page.content();
          const url = request.loadedUrl ?? request.url;
          pages.push({ url, signals: analyzeHtml(html) });
          await enqueueLinks({ strategy: "same-domain" });
        },
      },
      config,
    );

    const startUrl = `https://${domain}`;
    await Promise.race([
      crawler.run([startUrl]),
      sleep(timeoutMs).then(() => {
        throw new Error("deep crawl timeout");
      }),
    ]);

    if (pages.length === 0) return null;
    return { pages: pages.slice(0, maxPages), maxPages };
  } catch {
    return null;
  }
}
