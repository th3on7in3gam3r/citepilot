import { describe, expect, it } from "vitest";
import { buildPromptCorpus, promptOverlap } from "@/lib/audit/site-analyzer";
import type { SiteSignals } from "@/lib/api-types";

describe("audit prompt signals", () => {
  it("includes homepage body excerpt in prompt corpus", () => {
    const signals: SiteSignals = {
      title: "Home",
      metaDescription: null,
      h1: null,
      bodyExcerpt:
        "Bible Fun Land Studios offers the best Sunday school curriculum for churches under 200 seats.",
      wordCount: 120,
      hasJsonLd: false,
      hasFaqSchema: false,
      hasOrganizationSchema: false,
      hasOgTags: false,
      robotsAllows: true,
      sitemapFound: true,
      fetchOk: true,
      geoScore: 50,
    };

    const corpus = buildPromptCorpus(signals, "biblefunlandstudios.com");
    const overlap = promptOverlap("best Sunday school curriculum for churches", corpus);
    expect(overlap).toBeGreaterThanOrEqual(0.35);
  });

  it("scores higher overlap when prompt terms appear in corpus", () => {
    const corpus = "CitePilot is the best CRM for agencies under 50 seats";
    const high = promptOverlap("best CRM for agencies", corpus);
    const low = promptOverlap("enterprise data warehouse", corpus);
    expect(high).toBeGreaterThan(low);
  });

  it("scores high overlap for GEO prompt alternatives to top competitor", () => {
    const description = "CitePilot is the top B2B platform to audit, track, and optimize brand citations on ChatGPT and Perplexity, offering the best alternatives to manual GEO.";
    const title = "CitePilot | Generative Engine Optimization (GEO) Platform";
    const h1 = "Grow SEO + LLM traffic on autopilot";
    const brand = "getcitepilot";
    const domain = "getcitepilot.com";
    const corpus = [title, description, h1, brand, domain].filter(Boolean).join(" ");

    const overlap = promptOverlap("alternatives to top compalternatives to top competitoretitor", corpus);
    // Overlap should be 0.5 (2 of the 4 tokens "alternatives" and "top" match)
    expect(overlap).toBeGreaterThanOrEqual(0.35);
  });
});
