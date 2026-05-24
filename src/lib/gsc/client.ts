import { googleClientId, googleClientSecret, GSC_SCOPE } from "@/lib/gsc/config";
import { getGscConnection, upsertGscConnection } from "@/lib/gsc/store";
import { appBaseUrl } from "@/lib/stripe/config";

export type GscMetrics = {
  connected: boolean;
  siteUrl: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  clicksDelta: string | null;
  impressionsDelta: string | null;
};

function redirectUri(): string {
  return `${appBaseUrl()}/api/gsc/callback`;
}

export function buildGscAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: googleClientId()!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GSC_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGscCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: googleClientId()!,
      client_secret: googleClientSecret()!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error("Google token exchange failed");
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
  };
}

async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: string | null;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId()!,
      client_secret: googleClientSecret()!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
  };
}

async function getValidAccessToken(
  conn: Awaited<ReturnType<typeof getGscConnection>>,
): Promise<string | null> {
  if (!conn) return null;
  if (
    conn.expiresAt &&
    new Date(conn.expiresAt).getTime() - Date.now() < 60_000 &&
    conn.refreshToken
  ) {
    const refreshed = await refreshAccessToken(conn.refreshToken);
    await upsertGscConnection({
      workspaceId: conn.workspaceId,
      userId: conn.userId,
      siteUrl: conn.siteUrl,
      accessToken: refreshed.accessToken,
      refreshToken: conn.refreshToken,
      expiresAt: refreshed.expiresAt,
    });
    return refreshed.accessToken;
  }
  return conn.accessToken;
}

export async function listGscSites(accessToken: string): Promise<string[]> {
  const res = await fetch(
    "https://www.googleapis.com/webmasters/v3/sites",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    siteEntry?: { siteUrl?: string }[];
  };
  return (data.siteEntry ?? [])
    .map((e) => e.siteUrl)
    .filter(Boolean) as string[];
}

function pickSiteForDomain(sites: string[], domain: string): string | null {
  const clean = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const match =
    sites.find((s) => s.includes(clean)) ??
    sites.find((s) => s === `sc-domain:${clean}`) ??
    sites[0];
  return match ?? null;
}

export async function connectGscForWorkspace(input: {
  workspaceId: string;
  userId: string;
  domain: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
}): Promise<string | null> {
  const sites = await listGscSites(input.accessToken);
  const siteUrl = pickSiteForDomain(sites, input.domain);
  if (!siteUrl) return null;

  await upsertGscConnection({
    workspaceId: input.workspaceId,
    userId: input.userId,
    siteUrl,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: input.expiresAt,
  });
  return siteUrl;
}

export async function fetchGscMetrics(
  workspaceId: string,
): Promise<GscMetrics> {
  const conn = await getGscConnection(workspaceId);
  if (!conn) {
    return {
      connected: false,
      siteUrl: null,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      clicksDelta: null,
      impressionsDelta: null,
    };
  }

  const token = await getValidAccessToken(conn);
  if (!token) {
    return {
      connected: false,
      siteUrl: conn.siteUrl,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      clicksDelta: null,
      impressionsDelta: null,
    };
  }

  const end = new Date();
  const start = new Date(end.getTime() - 28 * 86400000);
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - 28 * 86400000);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const siteUrl = conn.siteUrl;

  async function queryRange(startDate: string, endDate: string) {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: [],
        }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      rows?: { clicks?: number; impressions?: number; ctr?: number; position?: number }[];
    };
    return data.rows?.[0] ?? null;
  }

  const [current, previous] = await Promise.all([
    queryRange(fmt(start), fmt(end)),
    queryRange(fmt(prevStart), fmt(prevEnd)),
  ]);

  const clicks = Math.round(current?.clicks ?? 0);
  const impressions = Math.round(current?.impressions ?? 0);
  const prevClicks = previous?.clicks ?? 0;
  const prevImpressions = previous?.impressions ?? 0;

  return {
    connected: true,
    siteUrl: conn.siteUrl,
    clicks,
    impressions,
    ctr: current?.ctr ?? 0,
    position: current?.position ?? 0,
    clicksDelta:
      previous != null
        ? `${clicks - prevClicks >= 0 ? "+" : ""}${Math.round(clicks - prevClicks)}`
        : null,
    impressionsDelta:
      previous != null
        ? `${impressions - prevImpressions >= 0 ? "+" : ""}${Math.round(impressions - prevImpressions).toLocaleString()}`
        : null,
  };
}
