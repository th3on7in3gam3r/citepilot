"use client";

import { useState } from "react";
import { usePathname as useNextPathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type AppLocale, routing } from "@/i18n/routing";
import { getPathname, usePathname } from "@/i18n/navigation";
import {
  isLocalizedMarketingPathname,
  localizedMarketingTarget,
  stripLocaleFromPathname,
} from "@/lib/i18n/localized-path";

const LOCALE_FLAGS: Record<AppLocale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
};

function resolvePathname(intlPathname: string, nextPathname: string | null): string {
  const candidates = [intlPathname, nextPathname ?? ""].filter(Boolean);
  for (const candidate of candidates) {
    const stripped = stripLocaleFromPathname(candidate);
    if (isLocalizedMarketingPathname(stripped)) return stripped;
  }
  return stripLocaleFromPathname(nextPathname ?? intlPathname);
}

export function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const locale = useLocale() as AppLocale;
  const intlPathname = usePathname();
  const nextPathname = useNextPathname();
  const t = useTranslations("languageSwitcher");
  const [pending, setPending] = useState<AppLocale | null>(null);

  const pathname = resolvePathname(intlPathname, nextPathname);
  const isLocalized = isLocalizedMarketingPathname(pathname);
  const rawPath = nextPathname ?? intlPathname;
  const urlLocale =
    routing.locales.find((code) => {
      const prefix = `/${code}`;
      return rawPath === prefix || rawPath.startsWith(`${prefix}/`);
    }) ?? (isLocalized ? routing.defaultLocale : locale);
  const activeLocale: AppLocale = isLocalized ? urlLocale : routing.defaultLocale;
  const target = localizedMarketingTarget(pathname);

  function switchLocale(next: AppLocale) {
    if (next === activeLocale || pending) return;
    setPending(next);
    const href = getPathname({
      href: target,
      locale: next,
      forcePrefix: next !== routing.defaultLocale,
    });
    window.location.assign(href);
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-border bg-surface/80 p-0.5 text-xs font-semibold dark:border-white/15 dark:bg-white/[0.06]"
      role="group"
      aria-label={t("label")}
      aria-busy={pending != null ? true : undefined}
    >
      {routing.locales.map((code) => {
        const active = code === activeLocale;
        const switching = pending === code;
        return (
          <button
            key={code}
            type="button"
            disabled={pending != null}
            onClick={() => switchLocale(code)}
            aria-current={active ? "true" : undefined}
            className={`rounded-full px-2.5 py-1 transition disabled:cursor-wait ${
              active || switching
                ? "bg-accent text-white shadow-sm"
                : onDark
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-muted hover:bg-background hover:text-ink dark:text-white/60 dark:hover:text-white"
            }`}
          >
            <span aria-hidden>{LOCALE_FLAGS[code]}</span>{" "}
            <span className="uppercase">{code}</span>
          </button>
        );
      })}
    </div>
  );
}
