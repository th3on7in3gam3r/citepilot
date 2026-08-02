import { site } from "@/lib/site";

/** Product Hunt promo — create coupon in Stripe via scripts/create-ph-coupon.mjs */
export const PH_PROMO_CODE = "PRODUCTHUNT30";
export const PH_PROMO_LABEL = "30% off Pilot for 3 months";
export const PH_PROMO_MAX_REDEMPTIONS = 30;

export const PH_UTM = {
  source: "producthunt",
  medium: "referral",
  campaign: "ph_launch_2026",
} as const;

export function phUtmQuery(extra?: Record<string, string>): string {
  const params = new URLSearchParams({
    utm_source: PH_UTM.source,
    utm_medium: PH_UTM.medium,
    utm_campaign: PH_UTM.campaign,
    ...extra,
  });
  return params.toString();
}

export function phLaunchUrl(path: string, extra?: Record<string, string>): string {
  const base = path.startsWith("http") ? path : `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${phUtmQuery(extra)}`;
}

/** Set PH_PRODUCT_HUNT_URL in env before launch day. */
export function productHuntListingUrl(): string {
  return (
    process.env.PH_PRODUCT_HUNT_URL?.trim() ||
    process.env.NEXT_PUBLIC_PH_PRODUCT_HUNT_URL?.trim() ||
    "https://www.producthunt.com"
  );
}

export function phLaunchDateLabel(): string {
  const raw =
    process.env.PH_LAUNCH_DATE?.trim() ||
    process.env.NEXT_PUBLIC_PH_LAUNCH_DATE?.trim() ||
    "launch day";
  if (raw === "launch day") return raw;
  try {
    return new Date(raw).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

export function isLaunchMode(): boolean {
  return process.env.LAUNCH_MODE === "true" || process.env.LAUNCH_MODE === "1";
}

export function founderName(): string {
  return (
    process.env.NEXT_PUBLIC_FOUNDER_NAME?.trim() ||
    process.env.FOUNDER_NAME?.trim() ||
    "The CitePilot team"
  );
}

export function founderEmail(): string {
  return process.env.FOUNDER_EMAIL?.trim() || site.supportEmail;
}
