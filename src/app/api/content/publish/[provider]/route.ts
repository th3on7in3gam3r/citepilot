import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { getGeneratedPostBySlug } from "@/lib/blog/store";
import { publishPostToFramer } from "@/lib/cms/framer";
import { publishPostToGhost, GhostApiError } from "@/lib/cms/ghost";
import { publishPostToHashnode, HashnodeApiError } from "@/lib/cms/hashnode";
import {
  getCmsConnection,
  getCmsPublication,
  upsertCmsPublication,
} from "@/lib/cms/store";
import { publishPostToShopify } from "@/lib/cms/shopify";
import {
  publishPostToSignalDesk,
  SignalDeskApiError,
} from "@/lib/cms/signaldesk";
import {
  CMS_PROVIDERS,
  type CmsProvider,
  type CmsRemoteDefaultsByProvider,
  type FramerCredentials,
  type GhostCredentials,
  type HashnodeCredentials,
  type ShopifyCredentials,
  type SignalDeskCredentials,
  type WordPressCredentials,
} from "@/lib/cms/types";
import { publishPostToWordPress } from "@/lib/cms/wordpress";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 120;

type Params = { params: Promise<{ provider: string }> };

function parseProvider(value: string): CmsProvider | null {
  return CMS_PROVIDERS.includes(value as CmsProvider) ? (value as CmsProvider) : null;
}

export const POST = withApiLogging(async function POST(request: Request, { params }: Params) {
  try {
    const { provider: rawProvider } = await params;
    const provider = parseProvider(rawProvider);
    if (!provider) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 404 });
    }
    if (provider === "webflow") {
      return NextResponse.json(
        { error: "Use /api/content/publish/webflow for Webflow publishing" },
        { status: 400 },
      );
    }

    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    if (!(await userHasPilotAccess(userId))) {
      return NextResponse.json(
        { error: PILOT_UPGRADE_MESSAGE, upgradeUrl: "/pricing" },
        { status: 402 },
      );
    }

    const body = (await request.json()) as { slug?: string };
    const slug = body.slug?.trim();
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const row = await getGeneratedPostBySlug(slug);
    if (!row || !row.workspace_id) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const workspace = await getWorkspaceById(row.workspace_id, userId);
    if (!workspace) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const connection = await getCmsConnection(row.workspace_id, provider);
    if (!connection) {
      return NextResponse.json(
        { error: `${provider} is not connected for this workspace` },
        { status: 404 },
      );
    }

    const existing = await getCmsPublication({
      workspaceId: row.workspace_id,
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
    } else if (provider === "signaldesk") {
      result = await publishPostToSignalDesk({
        credentials: connection.credentials as SignalDeskCredentials,
        title: row.title,
        slug: row.slug,
        markdown: row.markdown,
        description: row.description,
        coverImageUrl: row.cover_image_url,
        byline: "CitePilot",
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
      const defaults = connection.remoteDefaults as CmsRemoteDefaultsByProvider["shopify"];
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
      workspaceId: row.workspace_id,
      provider,
      postSlug: row.slug,
      remoteId: result.remoteId,
      remoteUrl: result.liveUrl,
    });

    return NextResponse.json({
      ok: true,
      provider,
      slug: row.slug,
      title: row.title,
      alreadyPublished: Boolean(existing),
      remoteId: result.remoteId,
      liveUrl: result.liveUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    console.error("POST /api/content/publish/[provider]", error);
    const status =
      error instanceof GhostApiError ||
      error instanceof HashnodeApiError ||
      error instanceof SignalDeskApiError
        ? Math.min(502, Math.max(400, error.status))
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
});
