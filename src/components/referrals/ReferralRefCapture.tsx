"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE_SEC,
} from "@/lib/referrals/constants";
import { normalizeReferralCode } from "@/lib/referrals/code";

function setReferralCookie(code: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${REFERRAL_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

/** Capture ?ref= on any landing page — cookie + click tracking. */
export function ReferralRefCapture() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    const code = ref ? normalizeReferralCode(ref) : null;
    if (!code) return;
    tracked.current = true;

    setReferralCookie(code);
    trackEvent("referral_link_clicked", { referralCode: code });

    void fetch("/api/referrals/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {
      /* non-blocking */
    });
  }, []);

  return null;
}
