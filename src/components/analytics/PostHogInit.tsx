"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

const POSTHOG_DEFAULTS = "2026-01-30" as const;

let initialized = false;

export function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
      "https://us.i.posthog.com";

    if (!key || initialized) return;

    posthog.init(key, {
      api_host: host,
      defaults: POSTHOG_DEFAULTS,
      person_profiles: "identified_only",
    });

    initialized = true;
  }, []);

  return null;
}
