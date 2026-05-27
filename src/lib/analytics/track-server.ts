import type { AnalyticsEvent } from "@/lib/analytics/track";

type ServerTrackProps = Record<string, string | number | boolean | undefined>;

function posthogHost(): string {
  return (
    process.env.POSTHOG_HOST?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
    "https://us.i.posthog.com"
  );
}

function posthogKey(): string | null {
  return (
    process.env.POSTHOG_KEY?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ||
    null
  );
}

/** Server-side PostHog capture for API routes (complements client Plausible/PostHog). */
export async function trackServerEvent(
  name: AnalyticsEvent,
  props?: ServerTrackProps & { distinctId?: string },
): Promise<void> {
  const apiKey = posthogKey();
  if (!apiKey) return;

  const { distinctId, ...rest } = props ?? {};
  const properties = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  );

  try {
    await fetch(`${posthogHost().replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event: name,
        distinct_id: distinctId ?? "server",
        properties: {
          ...properties,
          $lib: "citepilot-server",
        },
      }),
    });
  } catch (err) {
    console.warn("[analytics] PostHog server capture failed", err);
  }
}
