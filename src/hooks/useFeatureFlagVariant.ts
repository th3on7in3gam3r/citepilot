"use client";

import { useContext, useEffect, useState } from "react";
import { PostHogContext } from "posthog-js/react";
import {
  normalizeFlagVariant,
  type FeatureFlagKey,
} from "@/lib/analytics/feature-flags";

/**
 * Multivariate flag with SSR/initial fallback.
 * Safe when PostHog is deferred (provider mounts after idle/interaction) —
 * never call posthog-js hooks that assume `client` is already defined.
 */
export function useFeatureFlagVariant(
  flag: FeatureFlagKey,
  options?: { initialVariant?: string; fallback?: string },
): string {
  const fallback = options?.fallback ?? "control";
  const { client } = useContext(PostHogContext);
  const [variant, setVariant] = useState(() =>
    normalizeFlagVariant(options?.initialVariant, fallback),
  );

  useEffect(() => {
    if (!client) return;

    const apply = () => {
      setVariant(normalizeFlagVariant(client.getFeatureFlag(flag), fallback));
    };

    apply();
    return client.onFeatureFlags(apply);
  }, [client, flag, fallback]);

  return variant;
}
