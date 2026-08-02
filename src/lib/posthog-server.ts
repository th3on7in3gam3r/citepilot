import { cookies } from "next/headers";
import { PostHog } from "posthog-node";
import { normalizeFlagVariant } from "@/lib/analytics/feature-flags";

function posthogHost(): string {
  return (
    process.env.POSTHOG_HOST?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
    "https://us.i.posthog.com"
  );
}

function posthogKey(): string | null {
  return process.env.POSTHOG_KEY?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || null;
}

function createPostHogClient(): PostHog | null {
  const key = posthogKey();
  if (!key) return null;

  return new PostHog(key, {
    host: posthogHost(),
    flushAt: 1,
    flushInterval: 0,
  });
}

/** Read PostHog distinct_id from the browser cookie when present. */
export async function readPostHogDistinctId(): Promise<string | undefined> {
  const jar = await cookies();
  for (const [name, cookie] of jar) {
    if (!name.startsWith("ph_") || !name.endsWith("_posthog")) continue;
    try {
      const parsed = JSON.parse(cookie.value) as { distinct_id?: unknown };
      if (typeof parsed.distinct_id === "string" && parsed.distinct_id.trim()) {
        return parsed.distinct_id.trim();
      }
    } catch {
      /* ignore malformed cookie */
    }
  }
  return undefined;
}

/** Evaluate all feature flags server-side for a distinct id. */
export async function getServerSidePostHogFlags(
  distinctId?: string,
): Promise<Record<string, string | boolean>> {
  const client = createPostHogClient();
  if (!client) return {};

  const id = distinctId?.trim() || (await readPostHogDistinctId());
  if (!id) {
    await client.shutdown();
    return {};
  }

  try {
    const flags = await client.getAllFlags(id);
    return flags ?? {};
  } catch {
    return {};
  } finally {
    await client.shutdown();
  }
}

/** Evaluate a single multivariate flag server-side; defaults to control on failure. */
export async function getServerSideFlagVariant(
  flag: string,
  distinctId?: string,
  fallback = "control",
  timeoutMs = 2000,
): Promise<string> {
  const client = createPostHogClient();
  if (!client) return fallback;

  const id = distinctId?.trim() || (await readPostHogDistinctId());
  if (!id) {
    await client.shutdown();
    return fallback;
  }

  try {
    const value = await Promise.race([
      client.getFeatureFlag(flag, id),
      new Promise<undefined>((resolve) => {
        setTimeout(() => resolve(undefined), timeoutMs);
      }),
    ]);
    return normalizeFlagVariant(value, fallback);
  } catch {
    return fallback;
  } finally {
    await client.shutdown();
  }
}
