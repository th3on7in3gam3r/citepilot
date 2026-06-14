import { describe, expect, it } from "vitest";
import { promptOverlap } from "@/lib/audit/site-analyzer";

describe("audit prompt signals", () => {
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
