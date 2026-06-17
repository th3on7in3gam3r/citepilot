"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, type ReactNode } from "react";

const POSTHOG_DEFAULTS = "2026-01-30" as const;

let initialized = false;

function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

  if (!key || initialized || typeof window === "undefined") return;

  posthog.init(key, {
    api_host: host,
    defaults: POSTHOG_DEFAULTS,
    person_profiles: "identified_only",
  });

  initialized = true;
}

/** @deprecated Use PostHogProvider — kept for AnalyticsScripts import compatibility. */
export function PostHogInit() {
  useEffect(() => {
    initPostHog();
  }, []);
  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
