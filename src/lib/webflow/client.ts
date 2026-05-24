import { getWebflowConfig, type WebflowConfig } from "@/lib/webflow/config";
import { markdownToWebflowHtml } from "@/lib/webflow/markdown-to-html";

const API_BASE = "https://api.webflow.com/v2";

export type WebflowPublishInput = {
  title: string;
  slug: string;
  markdown: string;
  description?: string;
};

export type WebflowPublishResult = {
  itemId: string;
  itemPublished: boolean;
  sitePublishQueued: boolean;
  liveUrl?: string;
};

export class WebflowApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function webflowFetch<T>(
  config: WebflowConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      accept: "application/json",
      ...init?.headers,
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : text || `Webflow API error (${res.status})`;
    throw new WebflowApiError(message, res.status);
  }

  return body as T;
}

function isSiteNotPublishedError(error: WebflowApiError): boolean {
  return (
    error.status === 409 &&
    error.message.toLowerCase().includes("site is not published")
  );
}

async function publishWebflowSite(config: WebflowConfig): Promise<void> {
  await webflowFetch(config, `/sites/${config.siteId}/publish`, {
    method: "POST",
    body: JSON.stringify({ publishToWebflowSubdomain: true }),
  });
}

async function publishWebflowItems(
  config: WebflowConfig,
  itemIds: string[],
): Promise<void> {
  await webflowFetch(
    config,
    `/collections/${config.collectionId}/items/publish`,
    {
      method: "POST",
      body: JSON.stringify({ itemIds }),
    },
  );
}

function fieldSlugs(config: WebflowConfig): {
  name: string;
  slug: string;
  body: string;
} {
  return {
    name: config.fieldName,
    slug: config.fieldSlug,
    body: config.fieldBody,
  };
}

export async function getWebflowConnectionStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  collectionName?: string;
  siteName?: string;
  sitePreviewUrl?: string;
  detail?: string;
}> {
  const config = getWebflowConfig();
  if (!config) {
    return { configured: false, connected: false, detail: "Not configured" };
  }

  return {
    configured: true,
    connected: true,
    sitePreviewUrl: config.sitePreviewUrl,
    detail: `Ready — maps to ${config.fieldName}, ${config.fieldSlug}, ${config.fieldBody}`,
  };
}

export async function publishPostToWebflow(
  input: WebflowPublishInput,
  existingItemId?: string | null,
): Promise<WebflowPublishResult> {
  const config = getWebflowConfig();
  if (!config) {
    throw new WebflowApiError(
      "Webflow is not configured (WEBFLOW_API_KEY, WEBFLOW_SITE_ID, WEBFLOW_COLLECTION_ID)",
      503,
    );
  }

  const fields = fieldSlugs(config);
  const html = markdownToWebflowHtml(input.markdown);
  const fieldData: Record<string, unknown> = {
    [fields.name]: input.title,
    [fields.slug]: input.slug,
    [fields.body]: html,
  };

  let itemId: string;

  if (existingItemId) {
    await webflowFetch<{ id: string }>(
      config,
      `/collections/${config.collectionId}/items/${existingItemId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          isArchived: false,
          isDraft: false,
          fieldData,
        }),
      },
    );
    itemId = existingItemId;
  } else {
    const created = await webflowFetch<{ id: string }>(
      config,
      `/collections/${config.collectionId}/items`,
      {
        method: "POST",
        body: JSON.stringify({
          isArchived: false,
          isDraft: false,
          fieldData,
        }),
      },
    );
    itemId = created.id;
  }

  try {
    await publishWebflowItems(config, [itemId]);
  } catch (error) {
    if (error instanceof WebflowApiError && isSiteNotPublishedError(error)) {
      await publishWebflowSite(config);
      await publishWebflowItems(config, [itemId]);
    } else {
      throw error;
    }
  }

  let sitePublishQueued = false;
  if (config.autoPublishSite) {
    try {
      await publishWebflowSite(config);
      sitePublishQueued = true;
    } catch (error) {
      if (!(error instanceof WebflowApiError) || error.status !== 403) {
        throw error;
      }
    }
  }

  const prefix = config.blogPathPrefix.replace(/\/$/, "");
  const liveUrl = config.sitePreviewUrl
    ? `${config.sitePreviewUrl.replace(/\/$/, "")}${prefix}/${input.slug}`
    : undefined;

  return {
    itemId,
    itemPublished: true,
    sitePublishQueued,
    liveUrl,
  };
}
