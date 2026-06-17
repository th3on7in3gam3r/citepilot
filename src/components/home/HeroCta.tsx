"use client";

import Link from "next/link";
import {
  FEATURE_FLAGS,
  HERO_CTA_VARIANT_STORAGE_KEY,
  heroCtaLabel,
} from "@/lib/analytics/feature-flags";
import { trackEvent } from "@/lib/analytics/track";
import { useFeatureFlagVariant } from "@/hooks/useFeatureFlagVariant";

export function HeroCta({ initialVariant }: { initialVariant?: string }) {
  const variant = useFeatureFlagVariant(FEATURE_FLAGS.HERO_CTA_TEXT, {
    initialVariant,
    fallback: "control",
  });
  const label = heroCtaLabel(variant);

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
      className="inline-flex w-full max-w-sm items-center justify-center rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-8 py-3.5 text-base font-bold text-white shadow-[0_4px_20px_rgba(14,165,233,0.3)] transition hover:scale-[1.02] hover:shadow-[0_6px_24px_rgba(14,165,233,0.35)] dark:shadow-[0_4px_24px_rgba(14,165,233,0.25)] dark:hover:shadow-[0_6px_28px_rgba(14,165,233,0.3)] sm:w-auto sm:min-w-[15rem]"
    >
      {label}
    </Link>
  );
}
