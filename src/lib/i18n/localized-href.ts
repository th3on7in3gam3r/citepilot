import { routing } from "@/i18n/routing";

/** Build a locale-prefixed path for marketing routes (server-safe). */
export function localizedHref(locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === routing.defaultLocale) return normalized;
  return `/${locale}${normalized}`;
}

/** Paths with full locale URL variants in Phase 1. */
export function isLocalizedMarketingPath(path: string): boolean {
  const normalized = path.split("#")[0].split("?")[0] || "/";
  return normalized === "/" || normalized === "/pricing" || normalized === "/agency";
}
