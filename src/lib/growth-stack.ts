/**
 * Cross-product URLs — Bible Funland growth stack (Phase 1).
 * Outbound sister-product links include UTM tags for Pulse attribution.
 */

export const BIBLEFUNLAND_STUDIOS_URL = "https://www.biblefunlandstudios.com/";

export const GROWTH_STACK = {
  kerygma: {
    name: "Kerygma Social",
    tagline: "A month of social posts from your URL",
    href: "https://kerygmasocial.com",
  },
  aiCmo: {
    name: "Cadence",
    tagline: "Marketing war room, SEO audits, and campaigns",
    href: "https://cadence.biblefunland.com/app",
  },
  aegis: {
    name: "Aegis Loop",
    tagline: "Security scanning in your pull requests",
    href: "https://aegis-loop.com",
  },
} as const;

/** Pulse-friendly sources for growth-stack campaigns. */
export type GrowthUtmSource = "cadence" | "kerygma" | "citepilot";

export type GrowthUtmMedium = "email" | "social" | "cpc" | "referral";

export type WithUtmOptions = {
  source: GrowthUtmSource | (string & {});
  campaign: string;
  medium?: GrowthUtmMedium | (string & {});
  content?: string;
};

/**
 * Append utm_* query params without stripping existing search params.
 * Overwrites utm_source / utm_campaign / utm_medium / utm_content when set.
 */
export function withUtm(url: string, opts: WithUtmOptions): string {
  const parsed = new URL(url);
  parsed.searchParams.set("utm_source", opts.source.toLowerCase());
  parsed.searchParams.set("utm_campaign", opts.campaign);
  if (opts.medium) {
    parsed.searchParams.set("utm_medium", opts.medium.toLowerCase());
  }
  if (opts.content) {
    parsed.searchParams.set("utm_content", opts.content);
  }
  return parsed.toString();
}

/** Kerygma marketing / product homepage from CitePilot (Pulse site: kerygmasocial-com). */
export function kerygmaAppHref(
  campaign: string,
  content?: string,
): string {
  return withUtm(GROWTH_STACK.kerygma.href, {
    source: "citepilot",
    campaign,
    medium: "referral",
    content,
  });
}

export function aiCmoAppHref(): string {
  return process.env.NEXT_PUBLIC_AI_CMO_APP_URL ?? GROWTH_STACK.aiCmo.href;
}

export function kerygmaSignUpUrl(
  websiteUrl: string,
  campaign = "audit-result",
): string {
  const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
  const base = new URL(`${GROWTH_STACK.kerygma.href}/sign-up`);
  base.searchParams.set("url", url);
  base.searchParams.set("redirect_url", "/onboarding");
  return withUtm(base.toString(), {
    source: "citepilot",
    campaign,
    medium: "referral",
    content: "audit-cta",
  });
}

export type StudioBundleId = "growth" | "social" | "devsec" | "studio";

export function aiCmoPublicOrigin(): string {
  const href = process.env.NEXT_PUBLIC_AI_CMO_APP_URL ?? GROWTH_STACK.aiCmo.href;
  return (
    href.replace(/\/app\/?$/, "").replace(/\/+$/, "") ||
    "https://cadence.biblefunland.com"
  );
}

/** Deep link to Cadence bundle checkout (Settings → Billing). */
export function aiCmoStudioBillingUrl(bundle?: StudioBundleId): string {
  const params = new URLSearchParams({ tab: "billing" });
  if (bundle) params.set("bundle", bundle);
  return `${aiCmoPublicOrigin()}/app/settings?${params.toString()}`;
}

export function aiCmoStudioHubUrl(): string {
  return `${aiCmoPublicOrigin()}/studio`;
}
