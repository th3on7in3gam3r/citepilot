"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

/** Client-side backup for ph_launch_signup_completed after redirect from sign-up. */
export function PhSignupTracker({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    trackEvent("ph_launch_signup_completed", { source: "start_page" });
  }, [enabled]);

  return null;
}
