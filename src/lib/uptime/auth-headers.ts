import { createHash, randomBytes } from "crypto";
import type { AuthType, UptimeAuthConfig } from "@/lib/uptime/types";

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

function parseDigestChallenge(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  const match = header.match(/^Digest\s+(.+)$/i);
  const body = match?.[1] ?? header;
  for (const part of body.split(",")) {
    const m = part.trim().match(/^(\w+)="?([^"]+)"?$/);
    if (m) out[m[1]!.toLowerCase()] = m[2]!;
  }
  return out;
}

function buildDigestAuthorization(input: {
  username: string;
  password: string;
  method: string;
  uri: string;
  challenge: Record<string, string>;
}): string {
  const realm = input.challenge.realm ?? "";
  const nonce = input.challenge.nonce ?? "";
  const qop = input.challenge.qop?.split(",")[0]?.trim();
  const opaque = input.challenge.opaque;
  const algorithm = (input.challenge.algorithm ?? "MD5").toUpperCase();
  const ha1 = md5(`${input.username}:${realm}:${input.password}`);
  const ha2 = md5(`${input.method}:${input.uri}`);
  const nc = "00000001";
  const cnonce = randomBytes(8).toString("hex");
  let response: string;
  if (qop === "auth" || qop === "auth-int") {
    response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  } else {
    response = md5(`${ha1}:${nonce}:${ha2}`);
  }
  const parts = [
    `username="${input.username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${input.uri}"`,
    `response="${response}"`,
    `algorithm=${algorithm}`,
  ];
  if (qop) {
    parts.push(`qop=${qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
  }
  if (opaque) parts.push(`opaque="${opaque}"`);
  return `Digest ${parts.join(", ")}`;
}

export function buildAuthHeaders(
  authType: AuthType,
  auth: UptimeAuthConfig | null | undefined,
): Record<string, string> {
  if (!auth || authType === "none") return {};

  if (authType === "basic" && auth.username && auth.password) {
    const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString(
      "base64",
    );
    return { Authorization: `Basic ${encoded}` };
  }

  if (authType === "jwt" && auth.token) {
    const headerName = auth.jwtHeader?.trim() || "Authorization";
    if (headerName.toLowerCase() === "authorization") {
      const value = auth.token.startsWith("Bearer ")
        ? auth.token
        : `Bearer ${auth.token}`;
      return { Authorization: value };
    }
    return { [headerName]: auth.token };
  }

  return {};
}

export async function fetchWithAuth(
  url: string,
  init: RequestInit & { timeoutMs?: number },
  authType: AuthType,
  auth: UptimeAuthConfig | null | undefined,
  customHeaders: Record<string, string>,
): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? 10_000;
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(customHeaders)) {
    if (value.trim()) headers.set(key, value);
  }
  for (const [key, value] of Object.entries(buildAuthHeaders(authType, auth))) {
    headers.set(key, value);
  }

  const signal = AbortSignal.timeout(timeoutMs);
  const first = await fetch(url, { ...init, method, headers, signal });

  if (
    authType !== "digest" ||
    first.status !== 401 ||
    !auth?.username ||
    !auth.password
  ) {
    return first;
  }

  const wwwAuth =
    first.headers.get("www-authenticate") ??
    first.headers.get("WWW-Authenticate");
  if (!wwwAuth?.toLowerCase().includes("digest")) {
    return first;
  }

  const parsed = new URL(url);
  const challenge = parseDigestChallenge(wwwAuth);
  const digestHeader = buildDigestAuthorization({
    username: auth.username,
    password: auth.password,
    method,
    uri: `${parsed.pathname}${parsed.search}`,
    challenge,
  });

  const retryHeaders = new Headers(init.headers);
  for (const [key, value] of Object.entries(customHeaders)) {
    if (value.trim()) retryHeaders.set(key, value);
  }
  retryHeaders.set("Authorization", digestHeader);

  return fetch(url, { ...init, method, headers: retryHeaders, signal });
}
