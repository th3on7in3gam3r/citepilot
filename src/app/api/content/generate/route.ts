import { NextResponse, after } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { ensureBlogCoverForPost } from "@/lib/blog/generate-cover";
import { getWorkspaceById } from "@/lib/server/workspace";
import {
  buildArticleBrief,
} from "@/lib/content-strategy";
import type { GeneratedArticleRequest } from "@/lib/content-strategy";
import { generateWorkspaceArticle } from "@/lib/content/generate-workspace-article";
import type { GeneratedWorkspaceArticle } from "@/lib/content/generate-workspace-article";
import { captureServerException } from "@/lib/observability/sentry";
import { withApiLogging } from "@/lib/observability/api-log";

export const runtime = "nodejs";
export const maxDuration = 300;

export const POST = withApiLogging(async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY required for article generation" },
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

    const body = (await request.json()) as Partial<GeneratedArticleRequest>;
    if (!body.topic?.trim() || !body.audience || !body.contentType) {
      return NextResponse.json(
        { error: "topic, audience, and contentType are required" },
        { status: 400 },
      );
    }

    const input: GeneratedArticleRequest = {
      topic: body.topic.trim(),
      audience: body.audience,
      contentType: body.contentType,
      angle: body.angle,
      pillar: body.pillar,
      workspaceId: body.workspaceId,
      publish: body.publish !== false,
    };

    if (input.workspaceId) {
      const ws = await getWorkspaceById(input.workspaceId, userId);
      if (!ws) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
    }

    const brief = buildArticleBrief(input);

    if (!input.publish) {
      const generated = await generateWorkspaceArticle({
        ...input,
        savePost: false,
      });
      return NextResponse.json({
        brief: generated.brief,
        markdown: generated.markdown,
      });
    }

    const generated = await generateWorkspaceArticle(input);
    const { post, row, markdown, brief: savedBrief } = generated as GeneratedWorkspaceArticle;

    // Cover art is slow (DALL·E); generate after responding so the client does not 502.
    after(() => {
      void ensureBlogCoverForPost(row).catch((err) => {
        console.warn(`[blog-cover] ${row.slug}:`, err);
      });
    });

    return NextResponse.json({
      brief: savedBrief,
      markdown,
      post: {
        slug: post.slug,
        title: post.title,
        url: `/blog/${post.slug}`,
        coverImageUrl: post.coverImageUrl ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        {
          error:
            "Article generation timed out. Try a shorter format (News or Tutorial) or retry in a minute.",
        },
        { status: 504 },
      );
    }
    captureServerException(error, { route: "POST /api/content/generate" });
    console.error("POST /api/content/generate", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
});
