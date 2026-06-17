"use client";

import { useLocale, useTranslations } from "next-intl";
import { localizedPathnames, type AppLocale, routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALE_FLAGS: Record<AppLocale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
};

export function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("languageSwitcher");

  const isLocalized =
    pathname === "/" ||
    localizedPathnames.some((p) => p !== "/" && pathname === p);

  function switchLocale(next: AppLocale) {
    if (next === locale) return;
    const target = isLocalized ? pathname : "/";
    router.replace(target, { locale: next });
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-border bg-surface/80 p-0.5 text-xs font-semibold dark:border-white/15 dark:bg-white/[0.06]"
      role="group"
      aria-label={t("label")}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchLocale(code)}
            aria-current={active ? "true" : undefined}
            className={`rounded-full px-2.5 py-1 transition ${
              active
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
