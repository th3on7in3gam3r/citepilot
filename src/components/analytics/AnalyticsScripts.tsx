import Script from "next/script";
import { PostHogInit } from "@/components/analytics/PostHogInit";

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();

export function AnalyticsScripts() {
  return (
    <>
      {plausibleDomain && (
        <Script
          id="plausible-analytics"
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}
      {posthogKey ? <PostHogInit /> : null}
    </>
  );
}
