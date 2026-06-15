import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  dedupeBlogPostsBySlug,
  listBlogPostsForUser,
  listGeneratedPosts,
  listWorkspacePosts,
} from "@/lib/blog/store";
import { listCmsPublicationsForPosts } from "@/lib/cms/store";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";

export const GET = withApiLogging(async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim();
  const scope = searchParams.get("scope")?.trim();

  let rows;
  if (workspaceId) {
    const user = await requireApiUser(request);
    if (user instanceof NextResponse) return user;
    const userId = apiUserId(user);

    if (userId) {
      const ws = await getWorkspaceById(workspaceId, userId);
      if (!ws) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      // Show all articles across the user's workspaces unless scoped to one.
      rows =
        scope === "workspace"
          ? await listWorkspacePosts(workspaceId)
          : await listBlogPostsForUser(userId);
    } else {
      rows = await listWorkspacePosts(workspaceId);
    }
  } else {
    rows = await listGeneratedPosts();
  }

  const deduped = dedupeBlogPostsBySlug(rows);
  const publications = workspaceId
    ? await listCmsPublicationsForPosts(
        workspaceId,
        deduped.map((row) => row.slug),
      )
    : [];
  const publicationsBySlug = new Map<string, typeof publications>();
  for (const publication of publications) {
    const next = publicationsBySlug.get(publication.postSlug) ?? [];
    next.push(publication);
    publicationsBySlug.set(publication.postSlug, next);
  }

  return NextResponse.json({
    posts: deduped.map((r) => ({
      slug: r.slug,
      title: r.title,
      description: r.description,
      pillar: r.pillar,
      audience: r.audience,
      contentType: r.content_type,
      publishedAt: r.published_at,
      readingMinutes: r.reading_minutes,
      workspaceId: r.workspace_id,
      url: `/blog/${r.slug}`,
      coverImageUrl: r.cover_image_url,
      coverImageAlt: r.cover_image_alt,
      webflow: r.webflow_published_at
        ? {
            publishedAt: r.webflow_published_at,
            liveUrl: r.webflow_live_url,
            itemId: r.webflow_item_id,
          }
        : null,
      publications: (publicationsBySlug.get(r.slug) ?? []).map((item) => ({
        provider: item.provider,
        publishedAt: item.publishedAt,
        liveUrl: item.remoteUrl,
        remoteId: item.remoteId,
      })),
    })),
  });
});
