import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { getGeneratedPostBySlug, markBlogPostWebflowPublish } from "@/lib/blog/store";
import { WebflowApiError, publishPostToWebflow } from "@/lib/webflow/client";
import { formatWebflowError } from "@/lib/webflow/errors";
import { isWebflowConfigured } from "@/lib/webflow/config";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = withApiLogging(async function POST(request: Request) {
  if (!isWebflowConfigured()) {
    return NextResponse.json(
      {
        error:
          "Webflow not configured — set WEBFLOW_API_KEY, WEBFLOW_SITE_ID, and WEBFLOW_COLLECTION_ID",
      },
      { status: 503 },
    );
  }

  try {
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
    if (!row) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    if (row.workspace_id && userId) {
      const ws = await getWorkspaceById(row.workspace_id, userId);
      if (!ws) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }
    }

    const result = await publishPostToWebflow(
      {
        title: row.title,
        slug: row.slug,
        markdown: row.markdown,
        description: row.description,
      },
      row.webflow_item_id,
    );

    await markBlogPostWebflowPublish(row.slug, {
      itemId: result.itemId,
      liveUrl: result.liveUrl,
    });

    return NextResponse.json({
      ok: true,
      slug: row.slug,
      title: row.title,
      alreadyPublished: Boolean(row.webflow_published_at),
      ...result,
    });
  } catch (error) {
    if (error instanceof WebflowApiError) {
      console.error("POST /api/content/publish/webflow", error.message);
      return NextResponse.json(
        { error: formatWebflowError(error.message) },
        { status: error.status },
      );
    }
    console.error("POST /api/content/publish/webflow", error);
    return NextResponse.json({ error: "Webflow publish failed" }, { status: 500 });
  }
});
