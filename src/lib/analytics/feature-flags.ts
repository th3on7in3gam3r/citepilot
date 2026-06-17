/** PostHog multivariate feature flag keys (configure variants in PostHog UI). */
export const FEATURE_FLAGS = {
  HERO_CTA_TEXT: "hero-cta-text",
  PRICING_PAGE_LAYOUT: "pricing-page-layout",
  ONBOARDING_PROMPT_SUGGESTIONS: "onboarding-prompt-suggestions",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export const HERO_CTA_LABELS = {
  control: "Start free audit",
  variant_a: "See where AI cites you",
  variant_b: "Get your GEO score free",
} as const;

export type HeroCtaVariant = keyof typeof HERO_CTA_LABELS;

export const ONBOARDING_PROMPT_EXAMPLES = [
  "best CRM for agencies under 50 seats",
  "how to improve AI citation visibility for my brand",
  "top GEO tools for SaaS marketing teams",
] as const;

export const HERO_CTA_VARIANT_STORAGE_KEY = "citepilot_hero_cta_variant";

/** Normalize PostHog variant keys; always fall back to control on missing/invalid values. */
export function normalizeFlagVariant(
  value: unknown,
  fallback: string = "control",
): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

export function heroCtaLabel(variant: string | null | undefined): string {
  if (variant === "variant_a") return HERO_CTA_LABELS.variant_a;
  if (variant === "variant_b") return HERO_CTA_LABELS.variant_b;
  return HERO_CTA_LABELS.control;
}

export function isHeroCtaVariant(value: string): value is HeroCtaVariant {
  return value === "control" || value === "variant_a" || value === "variant_b";
}
