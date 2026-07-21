/**
 * Neon Auth (Managed Better Auth) production diagnostics — no secrets returned.
 * Live 404 "endpoint not found" usually means NEON_AUTH_BASE_URL is wrong or Auth is down/quota.
 */

export type NeonAuthEnvCheck = {
  ok: boolean;
  detail: string;
};

export type NeonAuthUpstreamCheck = {
  ok: boolean;
  detail: string;
  status?: number;
};

/** Neon Console Auth URL looks like …neonauth….neon.tech/…/auth */
export function neonAuthBaseUrlLooksValid(baseUrl: string): boolean {
  try {
    const parsed = new URL(baseUrl.trim());
    const hostOk =
      parsed.hostname.includes("neonauth") ||
      parsed.hostname.endsWith(".neon.tech");
    const pathOk = /\/auth\/?$/i.test(parsed.pathname);
    return hostOk && pathOk && parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function neonAuthEnvCheck(): NeonAuthEnvCheck {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const secret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();

  if (!baseUrl && !secret) {
    return {
      ok: false,
      detail: "Missing NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET",
    };
  }
  if (!baseUrl) {
    return { ok: false, detail: "Missing NEON_AUTH_BASE_URL" };
  }
  if (!secret) {
    return {
      ok: false,
      detail: "Missing NEON_AUTH_COOKIE_SECRET (generate: openssl rand -base64 32)",
    };
  }
  if (secret.length < 32) {
    return {
      ok: false,
      detail: `NEON_AUTH_COOKIE_SECRET too short (${secret.length} chars, need 32+)`,
    };
  }
  if (!neonAuthBaseUrlLooksValid(baseUrl)) {
    return {
      ok: false,
      detail:
        "NEON_AUTH_BASE_URL shape invalid — copy Auth URL from Neon Console (must be https, neonauth host, path ending in /auth)",
    };
  }
  return {
    ok: true,
    detail: "Env present — Dashboard + workspace APIs require sign-in",
  };
}

/**
 * Probe Managed Auth get-session (no cookies). 200/empty session is healthy;
 * 404 = wrong base URL; 429 = rate limit / compute quota.
 */
export async function probeNeonAuthUpstream(): Promise<NeonAuthUpstreamCheck> {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!baseUrl) {
    return { ok: false, detail: "Missing NEON_AUTH_BASE_URL" };
  }

  const url = `${baseUrl.replace(/\/$/, "")}/get-session`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (res.status === 429) {
      return {
        ok: false,
        status: 429,
        detail:
          "Neon Auth upstream 429 — rate limit or COMPUTE_QUOTA_EXCEEDED; upgrade Neon or wait for reset",
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        status: 404,
        detail:
          "Neon Auth upstream 404 endpoint not found — re-copy NEON_AUTH_BASE_URL from Console → Auth → Configuration",
      };
    }
    if (res.ok || res.status === 401 || res.status === 403) {
      return {
        ok: true,
        status: res.status,
        detail: `Neon Auth upstream reachable (HTTP ${res.status})`,
      };
    }
    return {
      ok: false,
      status: res.status,
      detail: `Neon Auth upstream HTTP ${res.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return {
      ok: false,
      detail: `Neon Auth upstream unreachable (${message})`,
    };
  }
}
