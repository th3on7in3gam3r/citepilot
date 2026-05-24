import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  listBlogPostsForUser,
  listGeneratedPosts,
  listWorkspacePosts,
} from "@/lib/blog/store";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

  return NextResponse.json({
    posts: rows.map((r) => ({
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
    })),
  });
}
