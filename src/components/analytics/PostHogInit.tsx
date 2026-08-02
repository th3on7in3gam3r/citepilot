"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import type posthogType from "posthog-js";

const POSTHOG_DEFAULTS = "2026-01-30" as const;

let initPromise: Promise<typeof posthogType | null> | null = null;
let initialized = false;

function loadPostHog(): Promise<typeof posthogType | null> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
    if (!key || typeof window === "undefined") return null;

    const posthog = (await import("posthog-js")).default;
    if (!initialized) {
      posthog.init(key, {
        api_host: host,
        defaults: POSTHOG_DEFAULTS,
        person_profiles: "identified_only",
      });
      initialized = true;
    }
    return posthog;
  })();

  return initPromise;
}

function scheduleDeferredBoot(boot: () => void): () => void {
  const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
  const onInteraction = () => {
    boot();
    for (const event of events) {
      window.removeEventListener(event, onInteraction, { capture: true });
    }
  };

  for (const event of events) {
    window.addEventListener(event, onInteraction, {
      once: true,
      capture: true,
      passive: true,
    });
  }

  let idleHandle: number | undefined;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  if (typeof window.requestIdleCallback === "function") {
    idleHandle = window.requestIdleCallback(boot, { timeout: 5000 });
  } else {
    timeoutHandle = setTimeout(boot, 4000);
  }

  return () => {
    for (const event of events) {
      window.removeEventListener(event, onInteraction, { capture: true });
    }
    if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleHandle);
    }
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  };
}

/** @deprecated Use PostHogProvider — kept for AnalyticsScripts import compatibility. */
export function PostHogInit() {
  useEffect(() => scheduleDeferredBoot(() => void loadPostHog()), []);
  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<typeof posthogType | null>(null);

  useEffect(
    () =>
      scheduleDeferredBoot(() => {
        void loadPostHog().then(setClient);
      }),
    [],
  );

  if (!client) return <>{children}</>;
  return <PHProvider client={client}>{children}</PHProvider>;
}
