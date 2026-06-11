import { NextResponse } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import {
  deleteBlogPost,
  getGeneratedPostBySlug,
  updateBlogPost,
} from "@/lib/blog/store";
import { getWorkspaceById } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

/** Verify the caller owns the post (via workspace) or is admin. */
async function resolvePost(request: Request, slug: string) {
  const user = await requireApiUser(request);
  if (user instanceof NextResponse) return { error: user };
  const userId = apiUserId(user);

  const row = await getGeneratedPostBySlug(slug);
  if (!row) {
    return {
      error: NextResponse.json({ error: "Post not found" }, { status: 404 }),
    };
  }

  // If the post is tied to a workspace, verify ownership.
  if (row.workspace_id && userId) {
    const ws = await getWorkspaceById(row.workspace_id, userId);
    if (!ws) {
      return {
        error: NextResponse.json({ error: "Post not found" }, { status: 404 }),
      };
    }
  }

  return { row, userId };
}

/** PATCH /api/blog/posts/[slug] — edit title, description, seoTitle, markdown */
export async function PATCH(request: Request, { params }: Context) {
  const { slug } = await params;
  const resolved = await resolvePost(request, slug);
  if (resolved.error) return resolved.error;

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    seoTitle?: string;
    markdown?: string;
  };

  if (!body.title && !body.description && !body.seoTitle && !body.markdown) {
    return NextResponse.json(
      { error: "Provide at least one field to update" },
      { status: 400 },
    );
  }

  await updateBlogPost(slug, {
    title: body.title,
    description: body.description,
    seoTitle: body.seoTitle,
    markdown: body.markdown,
  });

  return NextResponse.json({ ok: true, slug });
}

/** DELETE /api/blog/posts/[slug] — permanently remove a post */
export async function DELETE(request: Request, { params }: Context) {
  const { slug } = await params;
  const resolved = await resolvePost(request, slug);
  if (resolved.error) return resolved.error;

  await deleteBlogPost(slug);
  return NextResponse.json({ ok: true, slug });
}
