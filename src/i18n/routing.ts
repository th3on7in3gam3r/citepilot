import { defineRouting } from "next-intl/routing";

export const locales = ["en", "es", "fr"] as const;
export type AppLocale = (typeof locales)[number];

/** Marketing routes with full locale URL variants (Phase 1). */
export const localizedPathnames = ["/", "/pricing", "/agency"] as const;

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});
