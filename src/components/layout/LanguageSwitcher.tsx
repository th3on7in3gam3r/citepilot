"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { localizedPathnames, type AppLocale, routing } from "@/i18n/routing";
import { getPathname, usePathname } from "@/i18n/navigation";

const LOCALE_FLAGS: Record<AppLocale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
};

export function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const t = useTranslations("languageSwitcher");
  const [pending, setPending] = useState<AppLocale | null>(null);

  const isLocalized =
    pathname === "/" ||
    localizedPathnames.some((p) => p !== "/" && pathname === p);

  const target = isLocalized ? pathname : "/";

  function switchLocale(next: AppLocale) {
    if (next === locale || pending) return;
    setPending(next);
    const href = getPathname({ href: target, locale: next, forcePrefix: true });
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
        const active = code === locale;
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
