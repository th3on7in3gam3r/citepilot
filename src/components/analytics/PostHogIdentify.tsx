"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth/client";
import { useBilling } from "@/contexts/BillingContext";

export function PostHogIdentify() {
  const billing = useBilling();

  useEffect(() => {
    if (!billing.ready) return;

    let cancelled = false;

    async function identify() {
      if (!posthog.__loaded) return;

      const { data } = await authClient.getSession();
      const user = data?.user;
      if (!user?.id || cancelled) return;

      let daysActive = 0;
      try {
        const res = await fetch("/api/user/activity", { credentials: "include" });
        if (res.ok) {
          const activity = (await res.json()) as { daysActive?: number };
          daysActive = activity.daysActive ?? 0;
        }
      } catch {
        /* ignore */
      }

      const plan = billing.isFleet ? "fleet" : billing.isPilot ? "pilot" : "free";

      posthog.identify(user.id, {
        email: user.email,
        plan,
        userPlan: plan,
        is_paid: billing.isPaid,
        is_pilot: billing.isPilot,
        is_fleet: billing.isFleet,
        days_active: daysActive,
        daysActive,
      });

      posthog.reloadFeatureFlags?.();
    }

    void identify();

    return () => {
      cancelled = true;
    };
  }, [billing.ready, billing.isPaid, billing.isPilot, billing.isFleet]);

  return null;
}
