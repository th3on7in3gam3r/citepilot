"use client";

import { useFeatureFlagVariantKey } from "posthog-js/react";
import {
  normalizeFlagVariant,
  type FeatureFlagKey,
} from "@/lib/analytics/feature-flags";

/**
 * Client-side multivariate flag with a safe control fallback.
 * Pass `initialVariant` from SSR to reduce layout flash before flags load.
 */
export function useFeatureFlagVariant(
  flag: FeatureFlagKey,
  options?: { initialVariant?: string; fallback?: string },
): string {
  const fallback = options?.fallback ?? "control";
  const clientVariant = useFeatureFlagVariantKey(flag);
  const resolved = clientVariant ?? options?.initialVariant;
  return normalizeFlagVariant(resolved, fallback);
}
