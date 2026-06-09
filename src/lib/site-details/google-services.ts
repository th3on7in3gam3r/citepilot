export type GoogleServiceId = "analytics" | "my-business" | "search-console";

export type GoogleServiceState = Record<GoogleServiceId, boolean>;

export const GOOGLE_SERVICES: {
  id: GoogleServiceId;
  label: string;
  logo: string;
  learnHref: string;
}[] = [
  {
    id: "analytics",
    label: "Google Analytics",
    logo: "GA",
    learnHref: "/dashboard/analytics",
  },
  {
    id: "my-business",
    label: "Google My Business",
    logo: "GMB",
    learnHref: "/help/cms-publishing",
  },
  {
    id: "search-console",
    label: "Google Search Console",
    logo: "GSC",
    learnHref: "/dashboard/analytics",
  },
];

const STORAGE_PREFIX = "citepilot-google-services:";

export function loadGoogleServices(workspaceId: string): GoogleServiceState {
  if (typeof window === "undefined") {
    return { analytics: true, "my-business": false, "search-console": false };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${workspaceId}`);
    if (!raw) return { analytics: true, "my-business": false, "search-console": false };
    return { ...JSON.parse(raw) } as GoogleServiceState;
  } catch {
    return { analytics: true, "my-business": false, "search-console": false };
  }
}

export function saveGoogleServices(workspaceId: string, state: GoogleServiceState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${workspaceId}`, JSON.stringify(state));
}
