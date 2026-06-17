import { describe, expect, it } from "vitest";
import {
  heroCtaLabel,
  normalizeFlagVariant,
} from "@/lib/analytics/feature-flags";

describe("feature-flags", () => {
  it("normalizeFlagVariant falls back to control", () => {
    expect(normalizeFlagVariant(undefined)).toBe("control");
    expect(normalizeFlagVariant(null)).toBe("control");
    expect(normalizeFlagVariant("")).toBe("control");
    expect(normalizeFlagVariant("variant_a")).toBe("variant_a");
  });

  it("heroCtaLabel maps variants", () => {
    expect(heroCtaLabel("control")).toBe("Start free audit");
    expect(heroCtaLabel("variant_a")).toBe("See where AI cites you");
    expect(heroCtaLabel("variant_b")).toBe("Get your GEO score free");
    expect(heroCtaLabel(undefined)).toBe("Start free audit");
  });
});
