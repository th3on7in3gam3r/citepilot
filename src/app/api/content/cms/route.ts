import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { getWorkspaceById } from "@/lib/server/workspace";
import { listCmsConnections } from "@/lib/cms/store";
import { CMS_PROVIDERS, type CmsConnectionSummary, type CmsProvider } from "@/lib/cms/types";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

function summaryDetail(provider: CmsProvider, defaults: unknown): string | undefined {
  if (!defaults || typeof defaults !== "object") return undefined;

  if (provider === "shopify") {
    const blog = defaults as { blogTitle?: string };
    return blog.blogTitle ? `Publishing to blog: ${blog.blogTitle}` : undefined;
  }

  if (provider === "framer") {
    const framer = defaults as { collectionName?: string };
    return framer.collectionName ? `Collection: ${framer.collectionName}` : undefined;
  }

  return undefined;
}

export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);
  const workspace = await getWorkspaceById(workspaceId, userId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const connections = await listCmsConnections(workspaceId);
  const byProvider = new Map(connections.map((item) => [item.provider, item]));

  const providers: CmsConnectionSummary[] = CMS_PROVIDERS.map((provider) => {
    const connection = byProvider.get(provider);
    if (!connection) {
      return {
        provider,
        configured: false,
        connected: false,
      };
    }

    return {
      provider,
      configured: true,
      connected: connection.status === "connected",
      displayName: connection.displayName,
      siteUrl: connection.siteUrl,
      detail: summaryDetail(provider, connection.remoteDefaults),
    };
  });

  return NextResponse.json({ providers });
});
