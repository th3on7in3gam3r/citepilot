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

/** Root paths served outside `[locale]` — must not run locale middleware. */
export const NON_LOCALIZED_ROOT_SEGMENTS = new Set([
  "launch",
  "press",
  "audit",
  "start",
  "product",
  "changelog",
  "blog",
  "terms",
  "privacy",
  "status",
  "docs",
  "tools",
  "compare",
  "help",
  "feedback",
  "badge",
  "invite",
  "account",
  "chrome-extension",
  "citation-checker",
  "chatgpt-prompts",
  "ai-visibility",
  "geo-playbook",
  "cancel-survey",
  "score",
]);

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

export function isNonLocalizedRootPath(pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean)[0];
  return Boolean(segment && NON_LOCALIZED_ROOT_SEGMENTS.has(segment));
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
  if (isNonLocalizedRootPath(pathname)) return false;
  return isLocalizedMarketingPath(pathname);
}
