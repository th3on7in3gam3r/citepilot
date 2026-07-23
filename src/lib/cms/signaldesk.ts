import { markdownToCmsHtml } from "@/lib/cms/markdown-to-html";
import type { SignalDeskCredentials } from "@/lib/cms/types";
import { site } from "@/lib/site";

const META_MIN = 40;
const ANSWER_MIN = 40;

export class SignalDeskApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function normalizeSignalDeskSiteUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function signalDeskAuthHeader(credentials: SignalDeskCredentials): string {
  return `Basic ${Buffer.from(
    `${credentials.username}:${credentials.appPassword}`,
    "utf8",
  ).toString("base64")}`;
}

function restPaths(route: string): string[] {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  return [`/wp-json${normalized}`];
}

function looksLikeHtml(text: string, contentType: string): boolean {
  if (contentType.includes("text/html")) return true;
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

async function deskFetch<T>(
  credentials: SignalDeskCredentials,
  route: string,
  init?: RequestInit,
): Promise<T> {
  const siteUrl = normalizeSignalDeskSiteUrl(credentials.siteUrl);
  let lastError: SignalDeskApiError | null = null;

  for (const path of restPaths(route)) {
    const res = await fetch(`${siteUrl}${path}`, {
      ...init,
      headers: {
        Authorization: signalDeskAuthHeader(credentials),
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init?.headers,
      },
    });
    const text = await res.text();
    const contentType = res.headers.get("content-type") ?? "";

    if (looksLikeHtml(text, contentType)) {
      lastError = new SignalDeskApiError(
        "Signal Desk returned HTML instead of JSON. Confirm the site URL is your deployed Signal Desk origin.",
        502,
      );
      continue;
    }

    let body: { message?: string; code?: string } | null = null;
    try {
      body = text ? (JSON.parse(text) as { message?: string; code?: string }) : null;
    } catch {
      lastError = new SignalDeskApiError(
        "Signal Desk returned an invalid response. Check the site URL and credentials.",
        502,
      );
      continue;
    }

    if (!res.ok) {
      const message =
        body?.message ||
        body?.code ||
        `Signal Desk request failed (${res.status})`;
      throw new SignalDeskApiError(message, res.status);
    }

    return body as T;
  }

  throw (
    lastError ??
    new SignalDeskApiError(
      "Could not reach Signal Desk. Confirm the site URL and publisher credentials.",
      502,
    )
  );
}

/** Ensure text meets Signal Desk live-publish minimums without inventing content. */
export function ensureMinLength(value: string, min: number, padWith: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= min) return trimmed;
  if (!trimmed) {
    const base = padWith.trim() || "CitePilot citation brief.";
    return base.length >= min ? base : `${base}${".".repeat(min - base.length)}`;
  }
  const filler = ` ${padWith.trim() || "CitePilot GEO dispatch."}`;
  let out = trimmed;
  while (out.length < min) out += filler;
  return out.slice(0, Math.max(min, trimmed.length));
}

export function firstParagraphFromMarkdown(markdown: string): string {
  const lines = markdown
    .split(/\n+/)
    .map((l) => l.replace(/^#+\s*/, "").replace(/[*_`]/g, "").trim())
    .filter((l) => l.length > 20 && !l.startsWith("|") && !l.startsWith("- "));
  return lines[0] ?? "";
}

export function resolveAbsoluteCoverUrl(
  cover: string | null | undefined,
  deskSiteUrl: string,
  assetOrigin: string = site.url,
): string | null {
  const raw = cover?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:image/")) return raw;
  if (raw.startsWith("/")) {
    const origin = normalizeSignalDeskSiteUrl(assetOrigin || deskSiteUrl);
    return `${origin}${raw}`;
  }
  return null;
}

export type SignalDeskPublishBody = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "publish" | "review";
  featured_media_url?: string;
  meta: {
    description: string;
    answer_block: string;
    canonical_url: string;
    cover_image_url?: string;
    byline: string;
    topics: string[];
  };
};

export function buildSignalDeskPublishBody(input: {
  siteUrl: string;
  title: string;
  slug: string;
  html: string;
  description: string;
  coverImageUrl?: string | null;
  byline?: string;
  topics?: string[];
}): SignalDeskPublishBody {
  const siteUrl = normalizeSignalDeskSiteUrl(input.siteUrl);
  const excerptBase =
    input.description.trim() || firstParagraphFromMarkdown(input.html) || input.title;
  const answerBase =
    input.description.trim() ||
    firstParagraphFromMarkdown(input.html) ||
    `Key takeaway from ${input.title}`;
  const excerpt = ensureMinLength(excerptBase, META_MIN, input.title);
  const metaDescription = ensureMinLength(excerptBase, META_MIN, input.title);
  const answerBlock = ensureMinLength(answerBase, ANSWER_MIN, input.title);
  const cover = resolveAbsoluteCoverUrl(input.coverImageUrl, siteUrl, site.url);
  const canonical = `${siteUrl}/posts/${input.slug}`;
  const canPublishLive = Boolean(cover);

  return {
    title: input.title,
    slug: input.slug,
    content: input.html,
    excerpt,
    status: canPublishLive ? "publish" : "review",
    ...(cover ? { featured_media_url: cover } : {}),
    meta: {
      description: metaDescription,
      answer_block: answerBlock,
      canonical_url: canonical,
      ...(cover ? { cover_image_url: cover } : {}),
      byline: input.byline?.trim() || "CitePilot",
      topics: input.topics?.filter(Boolean).slice(0, 8) ?? [],
    },
  };
}

export async function testSignalDeskConnection(
  credentials: SignalDeskCredentials,
): Promise<{ displayName: string; siteUrl: string; detail: string }> {
  const siteUrl = normalizeSignalDeskSiteUrl(credentials.siteUrl);
  const [user, root] = await Promise.all([
    deskFetch<{ name?: string; slug?: string }>(credentials, "/wp/v2/users/me"),
    deskFetch<{ name?: string; description?: string }>(credentials, "/"),
  ]);

  const displayName =
    root?.name?.trim() ||
    user?.name?.trim() ||
    user?.slug?.trim() ||
    "Signal Desk";

  return {
    displayName,
    siteUrl,
    detail: user?.name?.trim()
      ? `Authenticated as ${user.name}`
      : "Publisher credentials verified",
  };
}

export async function publishPostToSignalDesk(input: {
  credentials: SignalDeskCredentials;
  title: string;
  slug: string;
  markdown: string;
  description: string;
  coverImageUrl?: string | null;
  byline?: string;
  topics?: string[];
  existingRemoteId?: string | null;
}): Promise<{ remoteId: string; liveUrl: string | null; status: "publish" | "review" }> {
  const html = markdownToCmsHtml(input.markdown);
  const body = buildSignalDeskPublishBody({
    siteUrl: input.credentials.siteUrl,
    title: input.title,
    slug: input.slug,
    html,
    description: input.description,
    coverImageUrl: input.coverImageUrl,
    byline: input.byline,
    topics: input.topics,
  });

  const restRoute = input.existingRemoteId
    ? `/wp/v2/posts/${input.existingRemoteId}`
    : "/wp/v2/posts";

  const post = await deskFetch<{ id: number | string; link?: string }>(
    input.credentials,
    restRoute,
    {
      method: input.existingRemoteId ? "PATCH" : "POST",
      body: JSON.stringify(body),
    },
  );

  const siteUrl = normalizeSignalDeskSiteUrl(input.credentials.siteUrl);
  return {
    remoteId: String(post.id),
    liveUrl:
      post.link ??
      (body.status === "publish"
        ? `${siteUrl}/posts/${input.slug}`
        : `${siteUrl}/publisher`),
    status: body.status,
  };
}
