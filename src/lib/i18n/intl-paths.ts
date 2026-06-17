import { localizedPathnames, routing } from "@/i18n/routing";

const SKIP_PREFIXES = [
  "/api",
  "/dashboard",
  "/auth",
  "/admin",
  "/geo",
  "/report",
  "/r/",
  "/_next",
  "/_vercel",
];

function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

function isLocalizedMarketingPath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  if (path === "/") return true;
  return localizedPathnames.some(
    (segment) => segment !== "/" && (path === segment || path.startsWith(`${segment}/`)),
  );
}

export function shouldRunIntl(pathname: string): boolean {
  if (pathname.includes(".")) return false;
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  return isLocalizedMarketingPath(pathname);
}
