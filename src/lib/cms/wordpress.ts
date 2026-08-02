import { markdownToCmsHtml } from "@/lib/cms/markdown-to-html";
import type { WordPressCredentials } from "@/lib/cms/types";

export class WordPressApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function authHeader(credentials: WordPressCredentials): string {
  return `Basic ${Buffer.from(
    `${credentials.username}:${credentials.appPassword}`,
    "utf8",
  ).toString("base64")}`;
}

/** REST route without /wp-json prefix, e.g. `/wp/v2/users/me`. */
function restPaths(route: string): string[] {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  return [
    `/wp-json${normalized}`,
    `/index.php?rest_route=${encodeURIComponent(normalized)}`,
  ];
}

function looksLikeHtml(text: string, contentType: string): boolean {
  if (contentType.includes("text/html")) return true;
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

async function wpFetch<T>(
  credentials: WordPressCredentials,
  route: string,
  init?: RequestInit,
): Promise<T> {
  const siteUrl = normalizeSiteUrl(credentials.siteUrl);
  let lastError: WordPressApiError | null = null;

  for (const path of restPaths(route)) {
    const res = await fetch(`${siteUrl}${path}`, {
      ...init,
      headers: {
        Authorization: authHeader(credentials),
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init?.headers,
      },
    });
    const text = await res.text();
    const contentType = res.headers.get("content-type") ?? "";

    if (looksLikeHtml(text, contentType)) {
      lastError = new WordPressApiError(
        "WordPress REST API returned HTML instead of JSON. In wp-admin open Settings → Permalinks, choose Post name, and click Save Changes.",
        502,
      );
      continue;
    }

    let body: { message?: string; code?: string } | null = null;
    try {
      body = text ? (JSON.parse(text) as { message?: string; code?: string }) : null;
    } catch {
      lastError = new WordPressApiError(
        "WordPress REST API returned an invalid response. Check the site URL and try saving Permalinks in WordPress.",
        502,
      );
      continue;
    }

    if (!res.ok) {
      const message =
        body?.message ||
        body?.code ||
        `WordPress request failed (${res.status})`;
      throw new WordPressApiError(message, res.status);
    }

    return body as T;
  }

  throw (
    lastError ??
    new WordPressApiError(
      "Could not reach the WordPress REST API. Confirm the site URL and Application Password.",
      502,
    )
  );
}

export async function testWordPressConnection(
  credentials: WordPressCredentials,
): Promise<{ displayName: string; siteUrl: string; detail: string }> {
  const siteUrl = normalizeSiteUrl(credentials.siteUrl);
  const [user, root] = await Promise.all([
    wpFetch<{ name?: string }>(credentials, "/wp/v2/users/me"),
    wpFetch<{ name?: string }>(credentials, "/"),
  ]);

  return {
    displayName: root?.name?.trim() || user?.name?.trim() || "WordPress site",
    siteUrl,
    detail: user?.name?.trim()
      ? `Authenticated as ${user.name}`
      : "Application Password verified",
  };
}

export async function publishPostToWordPress(input: {
  credentials: WordPressCredentials;
  title: string;
  slug: string;
  markdown: string;
  description: string;
  existingRemoteId?: string | null;
}): Promise<{ remoteId: string; liveUrl: string | null }> {
  const html = markdownToCmsHtml(input.markdown);
  const restRoute = input.existingRemoteId
    ? `/wp/v2/posts/${input.existingRemoteId}`
    : "/wp/v2/posts";

  const post = await wpFetch<{ id: number | string; link?: string }>(
    input.credentials,
    restRoute,
    {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        slug: input.slug,
        content: html,
        excerpt: input.description,
        status: "publish",
      }),
    },
  );

  return {
    remoteId: String(post.id),
    liveUrl: post.link ?? `${normalizeSiteUrl(input.credentials.siteUrl)}/${input.slug}/`,
  };
}
