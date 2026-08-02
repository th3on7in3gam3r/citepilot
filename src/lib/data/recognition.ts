import { productHuntListingUrl } from "@/lib/launch/config";
import {
  pressCoverage,
  pressEmail,
  pressMediaInquiryMailto,
} from "@/lib/press/content";

export type RecognitionItem = {
  id: string;
  label: string;
  href: string;
  kind: "product_hunt" | "press" | "listing_cta" | "media_inquiry" | "coverage";
  external?: boolean;
};

/** True only for a concrete Product Hunt posts/products listing — not the bare homepage. */
export function isRealProductHuntListingUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (!/(^|\.)producthunt\.com$/i.test(parsed.hostname)) return false;
    const path = parsed.pathname.replace(/\/+$/, "");
    return (
      /^\/posts\/[^/]+$/i.test(path) ||
      /^\/products\/[^/]+$/i.test(path)
    );
  } catch {
    return false;
  }
}

export function getRecognitionItems(
  productHuntUrl: string = productHuntListingUrl(),
): RecognitionItem[] {
  const items: RecognitionItem[] = [];

  if (isRealProductHuntListingUrl(productHuntUrl)) {
    items.push({
      id: "product-hunt",
      label: "Product Hunt",
      href: productHuntUrl.trim(),
      kind: "product_hunt",
      external: true,
    });
  }

  items.push({
    id: "press-kit",
    label: "Press & media kit",
    href: "/press",
    kind: "press",
  });

  items.push({
    id: "directory-listings",
    label: "Request directory listings",
    href: `mailto:${pressEmail}?subject=${encodeURIComponent(
      "CitePilot directory listing applications (Trustpilot, G2, etc.)",
    )}`,
    kind: "listing_cta",
    external: true,
  });

  items.push({
    id: "media-inquiry",
    label: "Book podcast / interview",
    href: pressMediaInquiryMailto(),
    kind: "media_inquiry",
    external: true,
  });

  for (const row of pressCoverage) {
    items.push({
      id: `coverage-${row.outlet.toLowerCase().replace(/\s+/g, "-")}-${row.url}`,
      label: row.outlet,
      href: row.url,
      kind: "coverage",
      external: true,
    });
  }

  return items;
}
