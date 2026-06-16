/** Shared helpers for CitePilot Chrome extension (MV3). */
export const CACHE_TTL_MS = 60 * 60 * 1000;
export const CACHE_PREFIX = "citepilot:domain:";

export function normalizeDomain(input) {
  if (!input) return "";
  let value = String(input).trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0] || "";
  value = value.split(":")[0] || "";
  if (value.startsWith("www.")) value = value.slice(4);
  return value;
}

export function domainFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith("http")) return "";
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".test") ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host)
    ) {
      return "";
    }
    return normalizeDomain(host);
  } catch {
    return "";
  }
}

export function cacheKey(domain) {
  return `${CACHE_PREFIX}${domain}`;
}

export function isCitedPayload(data) {
  if (!data) return false;
  if (data.cited) return true;
  if (data.hasAudit && data.score != null && data.score > 0) {
    return (data.platforms || []).some((p) => p.cited);
  }
  return false;
}

export async function getApiOrigin() {
  const stored = await chrome.storage.local.get(["citepilot_api_origin"]);
  return stored.citepilot_api_origin || "https://getcitepilot.com";
}

export async function buildCookieHeader(origin) {
  const url = origin.replace(/\/$/, "");
  const cookies = await chrome.cookies.getAll({ url });
  if (!cookies.length) return "";
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

export async function apiFetch(path, options = {}) {
  const origin = await getApiOrigin();
  const cookie = await buildCookieHeader(origin);
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${origin.replace(/\/$/, "")}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = new Error(`API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function fetchDomainReport(domain) {
  const origin = await getApiOrigin();
  const cookie = await buildCookieHeader(origin);
  const headers = cookie ? { Cookie: cookie } : {};

  const scoreUrl =
    `${origin.replace(/\/$/, "")}/api/widget/score/` +
    encodeURIComponent(domain) +
    "?format=json&platforms=4";

  const [scoreRes, contextRes] = await Promise.allSettled([
    fetch(scoreUrl, { headers }),
    apiFetch(`/api/extension/context?domain=${encodeURIComponent(domain)}`),
  ]);

  let scoreData = null;
  if (scoreRes.status === "fulfilled" && scoreRes.value.ok) {
    scoreData = await scoreRes.value.json();
  }

  let contextData = null;
  if (contextRes.status === "fulfilled") {
    contextData = contextRes.value;
  }

  return {
    domain,
    score: scoreData?.score ?? contextData?.score ?? null,
    hasAudit: Boolean(scoreData?.hasAudit ?? contextData?.hasAudit),
    platforms: scoreData?.platforms ?? contextData?.platforms ?? [],
    cited: isCitedPayload({
      cited: contextData?.cited,
      hasAudit: scoreData?.hasAudit ?? contextData?.hasAudit,
      score: scoreData?.score ?? contextData?.score,
      platforms: scoreData?.platforms ?? contextData?.platforms,
    }),
    signedIn: Boolean(contextData?.signedIn),
    isPaid: Boolean(contextData?.isPaid),
    workspace: contextData?.workspace ?? null,
    fetchedAt: Date.now(),
  };
}
