import type { BlogPostRow } from "@/lib/blog/store";
import { markBlogPostWebflowPublish } from "@/lib/blog/store";
import { publishPostToFramer } from "@/lib/cms/framer";
import { publishPostToGhost } from "@/lib/cms/ghost";
import { publishPostToHashnode } from "@/lib/cms/hashnode";
import {
  getCmsConnection,
  getCmsPublication,
  listCmsConnections,
  upsertCmsPublication,
} from "@/lib/cms/store";
import { publishPostToShopify } from "@/lib/cms/shopify";
import {
  CMS_PROVIDERS,
  type CmsProvider,
  type CmsRemoteDefaultsByProvider,
  type FramerCredentials,
  type GhostCredentials,
  type HashnodeCredentials,
  type ShopifyCredentials,
  type WordPressCredentials,
} from "@/lib/cms/types";
import { publishPostToWordPress } from "@/lib/cms/wordpress";
import { publishPostToWebflow } from "@/lib/webflow/client";
import { resolveWebflowConfig } from "@/lib/webflow/resolve-config";

const PUBLISH_ORDER: CmsProvider[] = [
  "wordpress",
  "webflow",
  "ghost",
  "hashnode",
  "shopify",
];

export type CmsPublishResult = {
  provider: CmsProvider | "webflow";
  liveUrl: string | null;
  error?: string;
};

export async function resolveFirstPublishProvider(
  workspaceId: string,
): Promise<CmsProvider | "webflow" | null> {
  const webflow = await resolveWebflowConfig(workspaceId);
  if (webflow) return "webflow";

  const connections = await listCmsConnections(workspaceId);
  const connected = new Set(connections.map((c) => c.provider));

  for (const provider of PUBLISH_ORDER) {
    if (provider === "webflow") continue;
    if (connected.has(provider) && provider !== "framer") {
      return provider;
    }
  }

  return null;
}

export async function publishBlogPostToCms(input: {
  workspaceId: string;
  row: BlogPostRow;
}): Promise<CmsPublishResult | null> {
  const provider = await resolveFirstPublishProvider(input.workspaceId);
  if (!provider) return null;

  const { row, workspaceId } = input;

  try {
    if (provider === "webflow") {
      const config = await resolveWebflowConfig(workspaceId);
      if (!config) {
        return { provider, liveUrl: null, error: "Webflow not connected" };
      }

      const result = await publishPostToWebflow(
        {
          title: row.title,
          slug: row.slug,
          markdown: row.markdown,
          description: row.description,
        },
        row.webflow_item_id ?? null,
        config,
      );

      await markBlogPostWebflowPublish(row.slug, {
        itemId: result.itemId,
        liveUrl: result.liveUrl,
      });

      return { provider: "webflow", liveUrl: result.liveUrl ?? null };
    }

    const connection = await getCmsConnection(workspaceId, provider);
    if (!connection) {
      return { provider, liveUrl: null, error: `${provider} not connected` };
    }

    const existing = await getCmsPublication({
      workspaceId,
      provider,
      postSlug: row.slug,
    });

    let result: { remoteId: string; liveUrl: string | null };

    if (provider === "wordpress") {
      result = await publishPostToWordPress({
        credentials: connection.credentials as WordPressCredentials,
        title: row.title,
        slug: row.slug,
        markdown: row.markdown,
        description: row.description,
        existingRemoteId: existing?.remoteId,
      });
    } else if (provider === "ghost") {
      result = await publishPostToGhost({
        credentials: connection.credentials as GhostCredentials,
        title: row.title,
        slug: row.slug,
        markdown: row.markdown,
        description: row.description,
        existingRemoteId: existing?.remoteId,
      });
    } else if (provider === "hashnode") {
      result = await publishPostToHashnode({
        credentials: connection.credentials as HashnodeCredentials,
        title: row.title,
        slug: row.slug,
        markdown: row.markdown,
        description: row.description,
        existingRemoteId: existing?.remoteId,
      });
    } else if (provider === "shopify") {
      const defaults =
        connection.remoteDefaults as CmsRemoteDefaultsByProvider["shopify"];
      result = await publishPostToShopify({
        credentials: connection.credentials as ShopifyCredentials,
        blogId: defaults.blogId,
        blogHandle: defaults.blogHandle,
        authorName: defaults.shopName,
        title: row.title,
        slug: row.slug,
        markdown: row.markdown,
        description: row.description,
        existingRemoteId: existing?.remoteId,
      });
    } else {
      result = await publishPostToFramer({
        credentials: connection.credentials as FramerCredentials,
        title: row.title,
        slug: row.slug,
        markdown: row.markdown,
        description: row.description,
        existingRemoteId: existing?.remoteId,
      });
    }

    await upsertCmsPublication({
      workspaceId,
      provider,
      postSlug: row.slug,
      remoteId: result.remoteId,
      remoteUrl: result.liveUrl,
    });

    return { provider, liveUrl: result.liveUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    return { provider, liveUrl: null, error: message };
  }
}

export function cmsProviderLabel(provider: CmsProvider | "webflow"): string {
  const labels: Record<string, string> = {
    webflow: "Webflow",
    wordpress: "WordPress",
    ghost: "Ghost",
    hashnode: "Hashnode",
    shopify: "Shopify",
    framer: "Framer",
  };
  return labels[provider] ?? provider;
}

/** Providers that can receive blog posts (excludes Framer-only snippet). */
export function isArticlePublishProvider(
  provider: string,
): provider is CmsProvider | "webflow" {
  return provider === "webflow" || CMS_PROVIDERS.includes(provider as CmsProvider);
}
