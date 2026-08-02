import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { generateBlogCoverDataUrl } from "@/lib/blog/generate-cover";
import { getGeneratedPostBySlug, updateBlogPost } from "@/lib/blog/store";
import { getWorkspaceById } from "@/lib/server/workspace";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 60;

type Context = { params: Promise<{ slug: string }> };

/** POST /api/blog/posts/[slug]/cover — AI-generate a cover image (DALL·E 3) */
export const POST = withApiLogging(async function POST(request: Request, { params }: Context) {
  const { slug } = await params;
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return user;
  const userId = apiUserId(user);

  const row = await getGeneratedPostBySlug(slug);
  if (!row) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (row.workspace_id && userId) {
    const ws = await getWorkspaceById(row.workspace_id, userId);
    if (!ws) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
  };

  const result = await generateBlogCoverDataUrl({
    title: body.title?.trim() || row.title,
    description: body.description?.trim() || row.description,
    pillar: row.pillar,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  await updateBlogPost(slug, {
    coverImageUrl: result.coverImageUrl,
    coverImageAlt: result.coverImageAlt,
  });

  return NextResponse.json({
    ok: true,
    slug,
    coverImageUrl: result.coverImageUrl,
    coverImageAlt: result.coverImageAlt,
  });
});
