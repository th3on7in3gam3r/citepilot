import { listCmsConnections, listCmsPublicationsForPosts } from "@/lib/cms/store";
import type { CmsConnectionSummary, CmsProvider } from "@/lib/cms/types";
import { CMS_PROVIDERS } from "@/lib/cms/types";
import { testFramerConnection } from "@/lib/cms/framer";
import { testGhostConnection } from "@/lib/cms/ghost";
import { testHashnodeConnection } from "@/lib/cms/hashnode";
import { testShopifyConnection } from "@/lib/cms/shopify";
import { testWebflowConnection } from "@/lib/cms/webflow";
import { testWordPressConnection } from "@/lib/cms/wordpress";
import { testSignalDeskConnection } from "@/lib/cms/signaldesk";
import { maskSecret } from "@/lib/integrations/helpers";
import { getWebflowConfig } from "@/lib/webflow/config";
import { dbGet } from "@/lib/db";

export type IntegrationId = CmsProvider;

export type IntegrationStatus = {
  id: IntegrationId;
  name: string;
  description: string;
  configured: boolean;
  connected: boolean;
  status: "connected" | "disconnected" | "error";
  displayName?: string;
  siteUrl?: string;
  detail?: string;
  maskedSecret?: string;
  lastPublishTitle?: string;
  lastPublishAt?: string;
  snippetInstalled?: boolean;
};

const descriptions: Record<IntegrationId, string> = {
  webflow: "Publish articles directly to your Webflow site",
  wordpress: "Publish articles directly to your WordPress blog",
  ghost: "Publish articles directly to your Ghost site",
  hashnode: "Publish articles directly to your Hashnode blog",
  shopify: "Publish articles to your Shopify store blog",
  framer: "Install the CitePilot GEO snippet on your Framer site",
  signaldesk: "Publish citation-ready dispatches to Signal Desk",
};

const names: Record<IntegrationId, string> = {
  webflow: "Webflow",
  wordpress: "WordPress",
  ghost: "Ghost",
  hashnode: "Hashnode",
  shopify: "Shopify",
  framer: "Framer",
  signaldesk: "SignalDesk",
};

function maskedForProvider(
  provider: CmsProvider,
  credentials: Record<string, string>,
): string | undefined {
  if (provider === "webflow") return maskSecret(credentials.apiKey ?? "");
  if (provider === "wordpress") return maskSecret(credentials.appPassword ?? "");
  if (provider === "ghost") return maskSecret(credentials.adminApiKey ?? "");
  if (provider === "hashnode") return maskSecret(credentials.accessToken ?? "");
  if (provider === "shopify") return maskSecret(credentials.accessToken ?? "");
  if (provider === "framer") return maskSecret(credentials.apiKey ?? "");
  if (provider === "signaldesk") return maskSecret(credentials.appPassword ?? "");
  return undefined;
}

async function latestWebflowPublish(workspaceId: string): Promise<{
  title: string;
  publishedAt: string;
} | null> {
  const row = await dbGet<{ title: string; webflow_published_at: string }>(
    `SELECT title, webflow_published_at FROM blog_posts
     WHERE workspace_id = ? AND webflow_published_at IS NOT NULL
     ORDER BY webflow_published_at DESC LIMIT 1`,
    [workspaceId],
  );
  if (!row?.webflow_published_at) return null;
  return { title: row.title, publishedAt: row.webflow_published_at };
}

async function latestCmsPublish(
  workspaceId: string,
  provider: CmsProvider,
): Promise<{ title: string; publishedAt: string } | null> {
  const row = await dbGet<{ title: string; published_at: string }>(
    `SELECT bp.title, cp.published_at
     FROM cms_publications cp
     JOIN blog_posts bp ON bp.slug = cp.post_slug
     WHERE cp.workspace_id = ? AND cp.provider = ?
     ORDER BY cp.published_at DESC LIMIT 1`,
    [workspaceId, provider],
  );
  if (!row?.published_at) return null;
  return { title: row.title, publishedAt: row.published_at };
}

export async function buildIntegrationStatuses(input: {
  workspaceId: string;
  verify?: boolean;
}): Promise<IntegrationStatus[]> {
  const connections = await listCmsConnections(input.workspaceId);
  const byProvider = new Map(connections.map((item) => [item.provider, item]));
  const framerConnection = byProvider.get("framer");
  const framerSnippetInstalled = Boolean(
    framerConnection?.remoteDefaults &&
      "snippetInstalled" in framerConnection.remoteDefaults &&
      framerConnection.remoteDefaults.snippetInstalled,
  );

  const statuses: IntegrationStatus[] = [];

  for (const provider of CMS_PROVIDERS) {
    const connection = byProvider.get(provider);

    if (provider === "framer" && framerSnippetInstalled && !connection) {
      statuses.push({
        id: provider,
        name: names[provider],
        description: descriptions[provider],
        configured: true,
        connected: true,
        status: "connected",
        displayName: "GEO snippet installed",
        detail: "Framer snippet marked as installed",
        snippetInstalled: true,
      });
      continue;
    }

    if (!connection) {
      const envWebflow = provider === "webflow" && getWebflowConfig();
      statuses.push({
        id: provider,
        name: names[provider],
        description: descriptions[provider],
        configured: Boolean(envWebflow),
        connected: Boolean(envWebflow),
        status: envWebflow ? "connected" : "disconnected",
        displayName: envWebflow ? "Env configuration" : undefined,
        detail: envWebflow ? "Using server env vars (legacy)" : undefined,
      });
      continue;
    }

    const credentials = connection.credentials as Record<string, string>;
    let connected = connection.status === "connected";
    let status: IntegrationStatus["status"] = connected ? "connected" : "error";
    let detail = connection.status === "error" ? "Connection needs attention" : undefined;

    if (input.verify && connected) {
      try {
        if (provider === "webflow") {
          await testWebflowConnection(connection.credentials as never);
        } else if (provider === "wordpress") {
          await testWordPressConnection(connection.credentials as never);
        } else if (provider === "signaldesk") {
          await testSignalDeskConnection(connection.credentials as never);
        } else if (provider === "ghost") {
          await testGhostConnection(connection.credentials as never);
        } else if (provider === "hashnode") {
          await testHashnodeConnection(connection.credentials as never);
        } else if (provider === "shopify") {
          await testShopifyConnection(connection.credentials as never);
        } else if (provider === "framer" && !framerSnippetInstalled) {
          await testFramerConnection(connection.credentials as never);
        }
        status = "connected";
      } catch (error) {
        connected = false;
        status = "error";
        detail = error instanceof Error ? error.message : "Connection failed";
      }
    }

    const latest =
      provider === "webflow"
        ? await latestWebflowPublish(input.workspaceId)
        : await latestCmsPublish(input.workspaceId, provider);

    statuses.push({
      id: provider,
      name: names[provider],
      description: descriptions[provider],
      configured: true,
      connected,
      status,
      displayName: connection.displayName,
      siteUrl: connection.siteUrl,
      detail,
      maskedSecret: maskedForProvider(provider, credentials),
      lastPublishTitle: latest?.title,
      lastPublishAt: latest?.publishedAt,
      snippetInstalled: provider === "framer" ? framerSnippetInstalled : undefined,
    });
  }

  return statuses;
}

export function integrationSummariesFromStatuses(
  statuses: IntegrationStatus[],
): CmsConnectionSummary[] {
  return statuses.map((item) => ({
    provider: item.id,
    configured: item.configured,
    connected: item.connected,
    displayName: item.displayName,
    siteUrl: item.siteUrl,
    detail: item.detail,
    status: item.status,
    maskedSecret: item.maskedSecret,
    lastPublishTitle: item.lastPublishTitle,
    lastPublishAt: item.lastPublishAt,
  }));
}

export async function publicationsForWorkspacePosts(
  workspaceId: string,
  postSlugs: string[],
) {
  return listCmsPublicationsForPosts(workspaceId, postSlugs);
}
