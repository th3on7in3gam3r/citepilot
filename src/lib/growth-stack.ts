/**
 * Cross-product URLs — Bible Funland growth stack (Phase 1).
 */

export const BIBLEFUNLAND_STUDIOS_URL = "https://www.biblefunlandstudios.com/";

export const GROWTH_STACK = {
  kerygma: {
    name: "Kerygma Social",
    tagline: "A month of social posts from your URL",
    href: "https://kerygmasocial.com",
  },
  aiCmo: {
    name: "AI CMO",
    tagline: "Marketing war room, SEO audits, and campaigns",
  },
  aegis: {
    name: "Aegis Loop",
    tagline: "Security scanning in your pull requests",
    href: "https://aegis-loop.com",
  },
} as const;

export function aiCmoAppHref(): string {
  return process.env.NEXT_PUBLIC_AI_CMO_APP_URL ?? "http://localhost:3000/app";
}

export function kerygmaSignUpUrl(websiteUrl: string): string {
  const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
  const params = new URLSearchParams({ url, redirect_url: "/onboarding" });
  return `${GROWTH_STACK.kerygma.href}/sign-up?${params.toString()}`;
}

export type StudioBundleId = "growth" | "social" | "devsec" | "studio";

export function aiCmoPublicOrigin(): string {
  const href = process.env.NEXT_PUBLIC_AI_CMO_APP_URL ?? "http://localhost:3000/app";
  return href.replace(/\/app\/?$/, "").replace(/\/+$/, "") || "http://localhost:3000";
}

/** Deep link to AI CMO bundle checkout (Settings → Billing). */
export function aiCmoStudioBillingUrl(bundle?: StudioBundleId): string {
  const params = new URLSearchParams({ tab: "billing" });
  if (bundle) params.set("bundle", bundle);
  return `${aiCmoPublicOrigin()}/app/settings?${params.toString()}`;
}

export function aiCmoStudioHubUrl(): string {
  return `${aiCmoPublicOrigin()}/studio`;
}
