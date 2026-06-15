import { updateBlogPost, type BlogPostRow } from "./store";
import { captureServerException } from "@/lib/observability/sentry";

export type GenerateCoverInput = {
  title: string;
  description?: string;
  pillar?: string;
};

/** Generate a blog cover via DALL·E 3; returns a data URL suitable for cover_image_url. */
export async function generateBlogCoverDataUrl(
  input: GenerateCoverInput,
): Promise<{ coverImageUrl: string; coverImageAlt: string } | { error: string }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return { error: "OPENAI_API_KEY is not configured on the server." };
  }

  const topic = input.title.trim();
  const context = input.description?.trim().slice(0, 200);
  const pillar = input.pillar?.trim();

  const prompt = [
    "Editorial blog hero illustration for a B2B SaaS marketing article.",
    `Topic: ${topic}.`,
    context ? `Context: ${context}.` : "",
    pillar ? `Category: ${pillar}.` : "",
    "Abstract, modern, clean tech aesthetic. Cyan and emerald accents on a dark navy background.",
    "No text, no logos, no watermarks. 16:9 composition.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
        response_format: "b64_json",
        quality: "standard",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { error: `Image generation failed (${res.status}): ${errText.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      data?: { b64_json?: string }[];
    };
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      return { error: "Image generation returned no image data." };
    }

    const coverImageAlt = `Cover illustration for ${topic}`;
    return {
      coverImageUrl: `data:image/png;base64,${b64}`,
      coverImageAlt,
    };
  } catch (err) {
    captureServerException(err, { tags: { area: "blog-cover-generate" } });
    return { error: "Image generation request failed." };
  }
}

/** Generate and persist a cover when the post has none (non-fatal on failure). */
export async function ensureBlogCoverForPost(
  row: Pick<
    BlogPostRow,
    "slug" | "title" | "description" | "pillar" | "cover_image_url"
  >,
): Promise<{ coverImageUrl: string; coverImageAlt: string } | null> {
  if (row.cover_image_url?.trim()) return null;

  const result = await generateBlogCoverDataUrl({
    title: row.title,
    description: row.description,
    pillar: row.pillar,
  });
  if ("error" in result) {
    console.warn(`[blog-cover] ${row.slug}: ${result.error}`);
    return null;
  }

  await updateBlogPost(row.slug, {
    coverImageUrl: result.coverImageUrl,
    coverImageAlt: result.coverImageAlt,
  });
  return result;
}
