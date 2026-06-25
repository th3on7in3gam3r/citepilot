import { NextResponse, after } from "next/server";
import { apiUserId, requireApiUser } from "@/lib/auth/api";
import { PILOT_UPGRADE_MESSAGE, userHasPilotAccess } from "@/lib/billing/access";
import { buildPostFromMarkdown } from "@/lib/blog/store";
import { ensureBlogCoverForPost } from "@/lib/blog/generate-cover";
import { getWorkspaceById } from "@/lib/server/workspace";
import {
  CONTENT_GENERATION_SYSTEM_PROMPT,
  WORD_TARGETS,
  buildArticleBrief,
} from "@/lib/content-strategy";
import type {
  EditorialPillarId,
  GeneratedArticleRequest,
} from "@/lib/content-strategy";
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
    const wordTarget = body.wordTarget ?? WORD_TARGETS[input.contentType];
    const pillar: EditorialPillarId = input.pillar ?? "geo";

    const userPrompt = `Write a publish-ready CitePilot article.

Topic: ${input.topic}
Audience: ${input.audience}
Content type: ${input.contentType}
${input.angle ? `Angle: ${input.angle}` : ""}
Primary keyword: ${brief.primaryKeyword}
Semantic keywords: ${brief.semanticKeywords.join(", ")}
Suggested title: ${brief.suggestedTitle}
Target length: ~${wordTarget} words

Follow the outline:
${brief.outline.map((s) => `## ${s.heading}\n- ${s.bullets.join("\n- ")}`).join("\n\n")}

FAQ questions to answer:
${brief.faqPrompts.map((q) => `- ${q}`).join("\n")}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: CONTENT_GENERATION_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8000,
        temperature: 0.65,
      }),
      signal: AbortSignal.timeout(240 /* seconds */ * 1000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI article generate", errText);
      let message = "Generation failed — try again in a minute.";
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        const openAiMsg = parsed.error?.message ?? "";
        if (/rate.?limit/i.test(openAiMsg)) {
          message = "OpenAI rate limit — wait a minute and try again.";
        } else if (/insufficient|quota|billing/i.test(openAiMsg)) {
          message = "OpenAI credits exhausted — check your API key billing.";
        } else if (openAiMsg) {
          message = `Generation failed: ${openAiMsg.slice(0, 160)}`;
        }
      } catch {
        /* non-JSON error body */
      }
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const markdown = data.choices?.[0]?.message?.content ?? "";
    if (!markdown.trim()) {
      return NextResponse.json({ error: "Empty generation response" }, { status: 502 });
    }

    if (!input.publish) {
      return NextResponse.json({ brief, markdown });
    }

    const { post, row } = await buildPostFromMarkdown(markdown, {
      pillar,
      audience: input.audience,
      contentType: input.contentType,
      suggestedTitle: brief.suggestedTitle,
      metaTitle: brief.metaTitle,
      metaDescription: brief.metaDescription,
      workspaceId: input.workspaceId,
    });

    // Cover art is slow (DALL·E); generate after responding so the client does not 502.
    after(() => {
      void ensureBlogCoverForPost(row).catch((err) => {
        console.warn(`[blog-cover] ${row.slug}:`, err);
      });
    });

    return NextResponse.json({
      brief,
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
