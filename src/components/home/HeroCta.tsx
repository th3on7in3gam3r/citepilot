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
      className="btn-marketing-primary w-full max-w-sm px-8 py-3.5 text-base sm:w-auto sm:min-w-[15rem]"
    >
      {label}
    </Link>
  );
}
