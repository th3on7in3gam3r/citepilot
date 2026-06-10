export type GoogleServiceId = "analytics" | "search-console";

export type GoogleServiceState = Record<GoogleServiceId, boolean>;

export const GOOGLE_SERVICES: {
  id: GoogleServiceId;
  label: string;
  logo: string;
  learnHref: string;
  description: string;
}[] = [
  {
    id: "analytics",
    label: "Google Analytics",
    logo: "GA",
    learnHref: "/dashboard/analytics",
    description: "View traffic, engagement, and conversion data alongside your AI citation scores.",
  },
  {
    id: "search-console",
    label: "Google Search Console",
    logo: "GSC",
    learnHref: "/dashboard/analytics",
    description: "Connect GSC to see impressions, clicks, CTR, and avg. position in your dashboard.",
  },
];

const STORAGE_PREFIX = "citepilot-google-services:";

export function loadGoogleServices(workspaceId: string): GoogleServiceState {
  if (typeof window === "undefined") {
    return { analytics: true, "search-console": false };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${workspaceId}`);
    if (!raw) return { analytics: true, "search-console": false };
    const parsed = JSON.parse(raw) as Partial<GoogleServiceState>;
    // Drop any legacy "my-business" key
    return {
      analytics: parsed.analytics ?? true,
      "search-console": parsed["search-console"] ?? false,
    };
  } catch {
    return { analytics: true, "search-console": false };
  }
}

export function saveGoogleServices(workspaceId: string, state: GoogleServiceState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${workspaceId}`, JSON.stringify(state));
}
