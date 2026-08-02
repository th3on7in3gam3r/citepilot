import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";

/** hreflang alternates for localized marketing pages. */
export function localeAlternates(path: string = "") {
  const base = site.wwwUrl.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    const prefix =
      locale === routing.defaultLocale ? "" : `/${locale}`;
    languages[locale] = `${base}${prefix}${normalized}`;
  }

  languages["x-default"] = `${base}${normalized}`;

  return { languages };
}
