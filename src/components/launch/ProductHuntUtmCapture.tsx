"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track";
import {
  PH_ATTRIBUTION_COOKIE,
  PH_ATTRIBUTION_MAX_AGE_SEC,
  PH_PROMO_COOKIE,
  parseAttributionFromSearch,
  serializeAttributionCookie,
} from "@/lib/launch/utm";
import { PH_PROMO_CODE } from "@/lib/launch/config";

function setCookie(name: string, value: string, maxAge: number): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/** Capture Product Hunt UTM params and promo codes from any landing URL. */
export function ProductHuntUtmCapture() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    const params = new URLSearchParams(window.location.search);
    const attribution = parseAttributionFromSearch(window.location.search);
    const promo = params.get("promo");

    if (window.location.pathname === "/launch") {
      trackEvent("ph_launch_page_visited", {
        utm_source: attribution?.source,
        utm_campaign: attribution?.campaign,
      });
    }

    if (!attribution && !promo) return;
    tracked.current = true;

    if (attribution) {
      setCookie(
        PH_ATTRIBUTION_COOKIE,
        serializeAttributionCookie(attribution),
        PH_ATTRIBUTION_MAX_AGE_SEC,
      );
    }

    const promoCode = promo?.trim().toUpperCase() || attribution?.promo?.toUpperCase();
    if (promoCode) {
      setCookie(PH_PROMO_COOKIE, encodeURIComponent(promoCode), PH_ATTRIBUTION_MAX_AGE_SEC);
    }

    if (promoCode === PH_PROMO_CODE || attribution?.source === "producthunt") {
      trackEvent("ph_launch_cta_clicked", { cta: "utm_capture" });
    }
  }, []);

  return null;
}
