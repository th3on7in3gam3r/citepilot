import { localizedPathnames, routing } from "@/i18n/routing";

/** Strip any locale prefix from a pathname (works even if useLocale() is stale). */
export function stripLocaleFromPathname(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;

  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (path === prefix) return "/";
    if (path.startsWith(`${prefix}/`)) {
      return path.slice(prefix.length) || "/";
    }
  }

  return path;
}

export function isLocalizedMarketingPathname(pathname: string): boolean {
  const path = stripLocaleFromPathname(pathname);
  return (
    path === "/" ||
    localizedPathnames.some((segment) => segment !== "/" && path === segment)
  );
}

/** Path to preserve when switching locale on marketing pages; otherwise home. */
export function localizedMarketingTarget(pathname: string): string {
  const path = stripLocaleFromPathname(pathname);
  if (
    path === "/" ||
    localizedPathnames.some((segment) => segment !== "/" && path === segment)
  ) {
    return path;
  }
  return "/";
}
