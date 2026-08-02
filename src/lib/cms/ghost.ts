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

function parseGhostResponse(text: string): Record<string, unknown> | null {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new GhostApiError(
      `Ghost returned an unexpected response: ${text.slice(0, 180)}`,
      502,
    );
  }
}

function ghostErrorMessage(
  body: Record<string, unknown> | null,
  status: number,
): string {
  const errors = body?.errors;
  if (Array.isArray(errors) && errors[0] && typeof errors[0] === "object") {
    const message = (errors[0] as { message?: string }).message;
    if (message) return message;
  }
  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message;
  }
  return `Ghost request failed (${status})`;
}

export function ghostJwt(adminApiKey: string): string {
  const [id, secret] = adminApiKey.trim().split(":");
  if (!id || !secret) {
    throw new GhostApiError(
      "Ghost Admin API key must be in id:secret format. Copy the full key from Ghost → Settings → Integrations.",
      400,
    );
  }
  if (!/^[0-9a-f]+$/i.test(secret)) {
    throw new GhostApiError(
      "Ghost Admin API key looks invalid. Paste the full Admin API key from your Ghost custom integration.",
      400,
    );
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
  const siteUrl = normalizeSiteUrl(credentials.siteUrl);
  const res = await fetch(`${siteUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Ghost ${ghostJwt(credentials.adminApiKey)}`,
      "Content-Type": "application/json",
      "Accept-Version": "v5.0",
      ...init?.headers,
    },
  });
  const text = await res.text();
  const body = parseGhostResponse(text);
  if (!res.ok) {
    throw new GhostApiError(ghostErrorMessage(body, res.status), res.status);
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

function ghostPostPayload(input: {
  title: string;
  slug: string;
  markdown: string;
  description: string;
}) {
  const html = markdownToCmsHtml(input.markdown) || "<p></p>";
  const excerpt = input.description?.trim();
  return {
    title: input.title,
    slug: input.slug,
    html,
    status: "published" as const,
    ...(excerpt ? { custom_excerpt: excerpt } : {}),
  };
}

async function createGhostPost(
  credentials: GhostCredentials,
  input: {
    title: string;
    slug: string;
    markdown: string;
    description: string;
  },
): Promise<{ remoteId: string; liveUrl: string | null }> {
  const body = await ghostFetch<{
    posts: { id: string; url?: string | null }[];
  }>(credentials, "/ghost/api/admin/posts/?source=html", {
    method: "POST",
    body: JSON.stringify({
      posts: [ghostPostPayload(input)],
    }),
  });

  const post = body.posts?.[0];
  if (!post) throw new GhostApiError("Ghost publish failed", 500);
  return { remoteId: post.id, liveUrl: post.url ?? null };
}

async function updateGhostPost(
  credentials: GhostCredentials,
  input: {
    remoteId: string;
    title: string;
    slug: string;
    markdown: string;
    description: string;
  },
): Promise<{ remoteId: string; liveUrl: string | null }> {
  const existing = await getGhostPostForUpdate(credentials, input.remoteId);
  const body = await ghostFetch<{
    posts: { id: string; url?: string | null }[];
  }>(credentials, `/ghost/api/admin/posts/${input.remoteId}/?source=html`, {
    method: "PUT",
    body: JSON.stringify({
      posts: [
        {
          ...ghostPostPayload(input),
          updated_at: existing.updated_at,
        },
      ],
    }),
  });

  const post = body.posts?.[0];
  if (!post) throw new GhostApiError("Ghost update failed", 500);
  return { remoteId: post.id, liveUrl: post.url ?? null };
}

export async function publishPostToGhost(input: {
  credentials: GhostCredentials;
  title: string;
  slug: string;
  markdown: string;
  description: string;
  existingRemoteId?: string | null;
}): Promise<{ remoteId: string; liveUrl: string | null }> {
  if (input.existingRemoteId) {
    try {
      return await updateGhostPost(input.credentials, {
        remoteId: input.existingRemoteId,
        title: input.title,
        slug: input.slug,
        markdown: input.markdown,
        description: input.description,
      });
    } catch (error) {
      if (!(error instanceof GhostApiError) || error.status !== 404) {
        throw error;
      }
    }
  }

  return createGhostPost(input.credentials, input);
}
