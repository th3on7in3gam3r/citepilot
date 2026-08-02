export type SentryIssueSummary = {
  title: string;
  count: number;
  lastSeen: string;
};

export type SentryOpsStats = {
  configured: boolean;
  errorRatePercent: number | null;
  totalEvents: number | null;
  topErrors: SentryIssueSummary[];
  detail?: string;
};

function sentryApiBase(): string {
  return (
    process.env.SENTRY_API_URL?.trim() || "https://sentry.io/api/0"
  ).replace(/\/$/, "");
}

function sentryAuthToken(): string | null {
  return (
    process.env.SENTRY_AUTH_TOKEN?.trim() ||
    process.env.SENTRY_API_TOKEN?.trim() ||
    null
  );
}

function sentryOrg(): string | null {
  return process.env.SENTRY_ORG?.trim() || null;
}

function sentryProject(): string | null {
  return process.env.SENTRY_PROJECT?.trim() || null;
}

export function isSentryApiConfigured(): boolean {
  return Boolean(sentryAuthToken() && sentryOrg() && sentryProject());
}

/** Weekly error stats from Sentry REST API (optional). */
export async function fetchSentryOpsStats(
  days = 7,
): Promise<SentryOpsStats> {
  const token = sentryAuthToken();
  const org = sentryOrg();
  const project = sentryProject();

  if (!token || !org || !project) {
    return {
      configured: false,
      errorRatePercent: null,
      totalEvents: null,
      topErrors: [],
      detail: "Set SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT",
    };
  }

  const statsPeriod = `${days}d`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const issuesUrl = new URL(
      `${sentryApiBase()}/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/issues/`,
    );
    issuesUrl.searchParams.set("statsPeriod", statsPeriod);
    issuesUrl.searchParams.set("query", "is:unresolved");
    issuesUrl.searchParams.set("sort", "freq");
    issuesUrl.searchParams.set("limit", "3");

    const issuesRes = await fetch(issuesUrl, { headers, cache: "no-store" });
    if (!issuesRes.ok) {
      return {
        configured: true,
        errorRatePercent: null,
        totalEvents: null,
        topErrors: [],
        detail: `Sentry API ${issuesRes.status}`,
      };
    }

    const issues = (await issuesRes.json()) as {
      title?: string;
      count?: string;
      lastSeen?: string;
    }[];

    const topErrors: SentryIssueSummary[] = issues.slice(0, 3).map((issue) => ({
      title: issue.title ?? "Unknown error",
      count: Number(issue.count ?? 0),
      lastSeen: issue.lastSeen ?? "",
    }));

    const totalEvents = topErrors.reduce((sum, i) => sum + i.count, 0);

    let errorRatePercent: number | null = null;
    const statsUrl = new URL(
      `${sentryApiBase()}/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/stats/`,
    );
    statsUrl.searchParams.set("stat", "received");
    statsUrl.searchParams.set("resolution", "1d");

    const statsRes = await fetch(statsUrl, { headers, cache: "no-store" });
    if (statsRes.ok) {
      const points = (await statsRes.json()) as [number, { received: number }][];
      const received = points.reduce((sum, [, row]) => sum + (row.received ?? 0), 0);
      const daysWithData = Math.max(1, Math.min(days, points.length));
      const dailyAvg = received / daysWithData;
      // Rough proxy: events per 10k requests if we lack request volume
      errorRatePercent =
        received > 0
          ? Math.min(100, Math.round((received / (dailyAvg * 100 + received)) * 1000) / 10)
          : 0;
      if (totalEvents === 0 && received > 0) {
        errorRatePercent = Math.min(100, Math.round((received / 1000) * 10) / 10);
      }
    }

    return {
      configured: true,
      errorRatePercent,
      totalEvents,
      topErrors,
    };
  } catch {
    return {
      configured: true,
      errorRatePercent: null,
      totalEvents: null,
      topErrors: [],
      detail: "Sentry API request failed",
    };
  }
}
