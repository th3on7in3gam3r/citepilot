"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import {
  BADGE_REF_COOKIE,
  BADGE_REF_COOKIE_MAX_AGE_SEC,
  BADGE_REF_QUERY,
} from "@/lib/widget/constants";

function setBadgeRefCookie(domain: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${BADGE_REF_COOKIE}=${encodeURIComponent(domain)}; Path=/; Max-Age=${BADGE_REF_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

/** Capture ?ref=badge&domain= on landing pages for signup attribution. */
export function BadgeRefCapture() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref !== BADGE_REF_QUERY) return;

    const domainParam = params.get("domain");
    const domain = domainParam ? normalizeDomain(domainParam) : "";
    if (!domain) return;

    tracked.current = true;
    setBadgeRefCookie(domain);
    trackEvent("badge_click", { badge_domain: domain, source: "landing" });
  }, []);

  return null;
}

export function readBadgeRefCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${BADGE_REF_COOKIE}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(BADGE_REF_COOKIE.length + 1));
  } catch {
    return null;
  }
}

export function clearBadgeRefCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${BADGE_REF_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
