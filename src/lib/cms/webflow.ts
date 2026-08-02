import type { WebflowCredentials } from "@/lib/cms/types";
import type { WebflowConfig } from "@/lib/webflow/config";
import { WebflowApiError } from "@/lib/webflow/client";

const API_BASE = "https://api.webflow.com/v2";

async function webflowApi<T>(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

export type WebflowSiteOption = {
  id: string;
  name: string;
  previewUrl?: string;
};

export type WebflowCollectionOption = {
  id: string;
  name: string;
  slug?: string;
};

export function webflowCredentialsToConfig(
  credentials: WebflowCredentials,
  defaults?: {
    siteName?: string;
    collectionName?: string;
    sitePreviewUrl?: string;
    fieldName?: string;
    fieldSlug?: string;
    fieldBody?: string;
  },
): WebflowConfig {
  return {
    apiKey: credentials.apiKey,
    siteId: credentials.siteId,
    collectionId: credentials.collectionId,
    fieldName: defaults?.fieldName ?? "name",
    fieldSlug: defaults?.fieldSlug ?? "slug",
    fieldBody: defaults?.fieldBody ?? "body-post",
    autoPublishSite: true,
    blogPathPrefix: "/blog",
    sitePreviewUrl: defaults?.sitePreviewUrl,
  };
}

export async function listWebflowSites(apiKey: string): Promise<WebflowSiteOption[]> {
  const data = await webflowApi<{ sites?: Array<{ id: string; displayName?: string; shortName?: string; previewUrl?: string }> }>(
    apiKey,
    "/sites",
  );
  return (data.sites ?? []).map((site) => ({
    id: site.id,
    name: site.displayName ?? site.shortName ?? site.id,
    previewUrl: site.previewUrl,
  }));
}

export async function listWebflowCollections(
  apiKey: string,
  siteId: string,
): Promise<WebflowCollectionOption[]> {
  const data = await webflowApi<{
    collections?: Array<{ id: string; displayName?: string; slug?: string }>;
  }>(apiKey, `/sites/${siteId}/collections`);
  return (data.collections ?? []).map((collection) => ({
    id: collection.id,
    name: collection.displayName ?? collection.slug ?? collection.id,
    slug: collection.slug,
  }));
}

export async function testWebflowConnection(
  credentials: WebflowCredentials,
): Promise<{
  displayName: string;
  siteUrl: string;
  detail: string;
  remoteDefaults: {
    siteName: string;
    collectionName: string;
    sitePreviewUrl?: string;
  };
}> {
  const sites = await listWebflowSites(credentials.apiKey);
  const site = sites.find((item) => item.id === credentials.siteId);
  if (!site) {
    throw new Error("Site ID not found for this API key");
  }

  const collections = await listWebflowCollections(
    credentials.apiKey,
    credentials.siteId,
  );
  const collection = collections.find((item) => item.id === credentials.collectionId);
  if (!collection) {
    throw new Error("Collection ID not found for this site");
  }

  await webflowApi(credentials.apiKey, `/collections/${credentials.collectionId}`);

  const siteUrl = site.previewUrl ?? `https://webflow.com/site/${site.id}`;
  return {
    displayName: site.name,
    siteUrl,
    detail: `Connected to ${site.name} · ${collection.name}`,
    remoteDefaults: {
      siteName: site.name,
      collectionName: collection.name,
      sitePreviewUrl: site.previewUrl,
    },
  };
}
