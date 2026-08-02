import { site } from "@/lib/site";
import { platformHost } from "@/lib/env/runtime";

const LOCAL_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
] as const;

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Trusted browser origins for same-site dashboard + marketing API calls. */
export function allowedCorsOrigins(): Set<string> {
  const origins = new Set<string>([
    normalizeOrigin(site.url)!,
    "https://www.getcitepilot.com",
    "https://citepilot.vercel.app",
    ...LOCAL_DEV_ORIGINS,
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    const normalized = normalizeOrigin(appUrl);
    if (normalized) origins.add(normalized);
  }

  const host = platformHost();
  if (host) {
    origins.add(`https://${host}`);
  }

  return origins;
}

export function isAllowedCorsOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return allowedCorsOrigins().has(normalized);
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Api-Key, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
