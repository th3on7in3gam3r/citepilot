import { buildPostFromMarkdown } from "@/lib/blog/store";
import type { BlogPostRow } from "@/lib/blog/store";
import type { BlogPost } from "@/lib/blog/types";
import {
  CONTENT_GENERATION_SYSTEM_PROMPT,
  WORD_TARGETS,
  buildArticleBrief,
} from "@/lib/content-strategy";
import type {
  EditorialPillarId,
  GeneratedArticleRequest,
} from "@/lib/content-strategy";

export type GeneratedWorkspaceArticle = {
  brief: ReturnType<typeof buildArticleBrief>;
  markdown: string;
  post: BlogPost;
  row: BlogPostRow;
};

async function fetchArticleMarkdown(
  input: GeneratedArticleRequest,
  brief: ReturnType<typeof buildArticleBrief>,
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY required for article generation");
  }

  const wordTarget = WORD_TARGETS[input.contentType];
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
    signal: AbortSignal.timeout(240 * 1000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("OpenAI article generate", errText);
    throw new Error("Article generation failed upstream");
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const markdown = data.choices?.[0]?.message?.content ?? "";
  if (!markdown.trim()) {
    throw new Error("Empty generation response");
  }

  return markdown;
}

export async function generateWorkspaceArticle(
  input: GeneratedArticleRequest & { savePost?: boolean },
): Promise<GeneratedWorkspaceArticle | { brief: ReturnType<typeof buildArticleBrief>; markdown: string }> {
  const brief = buildArticleBrief(input);
  const markdown = await fetchArticleMarkdown(input, brief);

  if (input.savePost === false) {
    return { brief, markdown };
  }

  const pillar: EditorialPillarId = input.pillar ?? "geo";
  const { post, row } = await buildPostFromMarkdown(markdown, {
    pillar,
    audience: input.audience,
    contentType: input.contentType,
    suggestedTitle: brief.suggestedTitle,
    metaTitle: brief.metaTitle,
    metaDescription: brief.metaDescription,
    workspaceId: input.workspaceId,
  });

  return { brief, markdown, post, row };
}
