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

async function wpFetch<T>(
  credentials: WordPressCredentials,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const siteUrl = normalizeSiteUrl(credentials.siteUrl);
  const res = await fetch(`${siteUrl}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(credentials),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      body?.message ||
      body?.code ||
      `WordPress request failed (${res.status})`;
    throw new WordPressApiError(message, res.status);
  }
  return body as T;
}

export async function testWordPressConnection(
  credentials: WordPressCredentials,
): Promise<{ displayName: string; siteUrl: string; detail: string }> {
  const siteUrl = normalizeSiteUrl(credentials.siteUrl);
  const [user, root] = await Promise.all([
    wpFetch<{ name?: string }>(credentials, "/wp-json/wp/v2/users/me"),
    fetch(`${siteUrl}/wp-json`).then((res) => res.json() as Promise<{ name?: string }>),
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
  const methodPath = input.existingRemoteId
    ? `/wp-json/wp/v2/posts/${input.existingRemoteId}`
    : "/wp-json/wp/v2/posts";

  const post = await wpFetch<{ id: number | string; link?: string }>(
    input.credentials,
    methodPath,
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
