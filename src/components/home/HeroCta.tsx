"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  FEATURE_FLAGS,
  HERO_CTA_VARIANT_STORAGE_KEY,
  heroCtaLabel,
} from "@/lib/analytics/feature-flags";
import { trackEvent } from "@/lib/analytics/track";
import { useFeatureFlagVariant } from "@/hooks/useFeatureFlagVariant";

export function HeroCta({ initialVariant }: { initialVariant?: string }) {
  const t = useTranslations("hero");
  const variant = useFeatureFlagVariant(FEATURE_FLAGS.HERO_CTA_TEXT, {
    initialVariant,
    fallback: "control",
  });
  const label =
    variant === "variant_a" || variant === "variant_b"
      ? heroCtaLabel(variant)
      : t("ctaPrimary");

  function handleClick() {
    try {
      sessionStorage.setItem(HERO_CTA_VARIANT_STORAGE_KEY, variant);
    } catch {
      /* ignore */
    }

    trackEvent("hero_cta_clicked", { variant });
  }

  return (
    <Link
      href="/audit"
      onClick={handleClick}
      className="btn-marketing-primary w-full max-w-sm px-8 py-4 text-base shadow-[0_6px_28px_color-mix(in_srgb,var(--color-accent)_45%,transparent)] ring-2 ring-accent/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50 sm:w-auto sm:min-w-[16rem]"
    >
      {label}
    </Link>
  );
}
