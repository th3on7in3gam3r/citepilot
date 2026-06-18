export const PH_ATTRIBUTION_COOKIE = "citepilot_ph_attribution";
export const PH_PROMO_COOKIE = "citepilot_promo_code";
export const PH_ATTRIBUTION_MAX_AGE_SEC = 60 * 60 * 24 * 14;

export type PhAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  promo?: string;
};

export function parseAttributionFromSearch(search: string): PhAttribution | null {
  const params = new URLSearchParams(search);
  const source = params.get("utm_source") ?? undefined;
  const medium = params.get("utm_medium") ?? undefined;
  const campaign = params.get("utm_campaign") ?? undefined;
  const promo = params.get("promo") ?? undefined;
  if (!source && !medium && !campaign && !promo) return null;
  return { source, medium, campaign, promo };
}

export function serializeAttributionCookie(data: PhAttribution): string {
  return encodeURIComponent(JSON.stringify(data));
}

export function parseAttributionCookie(raw: string | undefined): PhAttribution | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as PhAttribution;
  } catch {
    return null;
  }
}

export function isProductHuntAttribution(data: PhAttribution | null): boolean {
  return data?.source?.toLowerCase() === "producthunt";
}
