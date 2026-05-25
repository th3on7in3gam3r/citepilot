import { createHmac } from "crypto";
import { markdownToCmsHtml } from "@/lib/cms/markdown-to-html";
import type { GhostCredentials } from "@/lib/cms/types";

export class GhostApiError extends Error {
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

function base64Url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function ghostJwt(adminApiKey: string): string {
  const [id, secret] = adminApiKey.trim().split(":");
  if (!id || !secret) {
    throw new GhostApiError("Ghost Admin API key must be in id:secret format", 400);
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 5;
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id }));
  const payload = base64Url(JSON.stringify({ iat, exp, aud: "/admin/" }));
  const signature = createHmac("sha256", Buffer.from(secret, "hex"))
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

async function ghostFetch<T>(
  credentials: GhostCredentials,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${normalizeSiteUrl(credentials.siteUrl)}${path}`, {
    ...init,
    headers: {
      Authorization: `Ghost ${ghostJwt(credentials.adminApiKey)}`,
      "Content-Type": "application/json",
      "Accept-Version": "v5.0",
      ...init?.headers,
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      body?.errors?.[0]?.message ||
      body?.message ||
      `Ghost request failed (${res.status})`;
    throw new GhostApiError(message, res.status);
  }
  return body as T;
}

export async function testGhostConnection(
  credentials: GhostCredentials,
): Promise<{ displayName: string; siteUrl: string; detail: string }> {
  const siteUrl = normalizeSiteUrl(credentials.siteUrl);
  const body = await ghostFetch<{
    site?: { title?: string; description?: string };
  }>(credentials, "/ghost/api/admin/site/");

  return {
    displayName: body.site?.title?.trim() || "Ghost site",
    siteUrl,
    detail: body.site?.description?.trim() || "Ghost Admin API verified",
  };
}

async function getGhostPostForUpdate(
  credentials: GhostCredentials,
  postId: string,
): Promise<{ updated_at: string }> {
  const body = await ghostFetch<{ posts: { updated_at: string }[] }>(
    credentials,
    `/ghost/api/admin/posts/${postId}/`,
  );
  const post = body.posts?.[0];
  if (!post) throw new GhostApiError("Ghost post not found", 404);
  return post;
}

export async function publishPostToGhost(input: {
  credentials: GhostCredentials;
  title: string;
  slug: string;
  markdown: string;
  description: string;
  existingRemoteId?: string | null;
}): Promise<{ remoteId: string; liveUrl: string | null }> {
  const html = markdownToCmsHtml(input.markdown);

  if (input.existingRemoteId) {
    const existing = await getGhostPostForUpdate(
      input.credentials,
      input.existingRemoteId,
    );
    const body = await ghostFetch<{
      posts: { id: string; url?: string | null }[];
    }>(
      input.credentials,
      `/ghost/api/admin/posts/${input.existingRemoteId}/?source=html`,
      {
        method: "PUT",
        body: JSON.stringify({
          posts: [
            {
              title: input.title,
              slug: input.slug,
              html,
              excerpt: input.description,
              status: "published",
              updated_at: existing.updated_at,
            },
          ],
        }),
      },
    );

    const post = body.posts?.[0];
    if (!post) throw new GhostApiError("Ghost update failed", 500);
    return { remoteId: post.id, liveUrl: post.url ?? null };
  }

  const body = await ghostFetch<{
    posts: { id: string; url?: string | null }[];
  }>(input.credentials, "/ghost/api/admin/posts/?source=html", {
    method: "POST",
    body: JSON.stringify({
      posts: [
        {
          title: input.title,
          slug: input.slug,
          html,
          excerpt: input.description,
          status: "published",
        },
      ],
    }),
  });

  const post = body.posts?.[0];
  if (!post) throw new GhostApiError("Ghost publish failed", 500);
  return { remoteId: post.id, liveUrl: post.url ?? null };
}
