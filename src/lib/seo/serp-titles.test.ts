import { describe, expect, it } from "vitest";
import { aiVisibilityLanding } from "@/lib/marketing/ai-visibility-landing";
import { auditLanding } from "@/lib/marketing/audit-landing";
import { chatgptPromptsLanding } from "@/lib/marketing/chatgpt-prompts-landing";
import { geoPlaybook } from "@/lib/marketing/geo-playbook";
import { productLanding } from "@/lib/marketing/product-landing";
import {
  citationCheckerTool,
  citationGapCalculatorTool,
  geoPlaybookTool,
} from "@/lib/marketing/tools-pages";
import { clampSeoTitle, SERP_TITLE_MAX } from "@/lib/seo/meta";
import { site } from "@/lib/site";

const SUFFIX = ` · ${site.name}`;

function serpLength(segment: string): number {
  return `${clampSeoTitle(segment)}${SUFFIX}`.length;
}

describe("marketing SERP title lengths", () => {
  it("keeps homepage absolute title in the ~45–60 band without double suffix", () => {
    expect(site.homeTitle.length).toBeGreaterThanOrEqual(45);
    expect(site.homeTitle.length).toBeLessThanOrEqual(SERP_TITLE_MAX);
    expect(site.homeTitle.endsWith(site.name)).toBe(true);
  });

  it.each([
    ["product", productLanding.shortTitle],
    ["audit", auditLanding.shortTitle],
    ["ai-visibility", aiVisibilityLanding.shortTitle],
    ["chatgpt-prompts", chatgptPromptsLanding.shortTitle],
    ["geo-playbook", geoPlaybook.shortTitle],
    ["citation-checker", citationCheckerTool.shortTitle],
    ["gap-calculator", citationGapCalculatorTool.shortTitle],
    ["geo-playbook-tool", geoPlaybookTool.shortTitle],
    ["agency", "GEO for Agencies: White-Label Fleet Plan"],
    ["blog", "GEO & AI Citation Guides for Growth Teams"],
    ["launch", "Product Hunt Launch: AI Citation Tracking"],
    ["start", "Start Free GEO & AI Citation Analysis"],
  ] as const)("%s SERP title is within 45–62 chars", (_label, segment) => {
    const len = serpLength(segment);
    expect(len).toBeGreaterThanOrEqual(45);
    expect(len).toBeLessThanOrEqual(62);
    expect(clampSeoTitle(segment).length).toBeLessThanOrEqual(
      SERP_TITLE_MAX - SUFFIX.length,
    );
  });
});
