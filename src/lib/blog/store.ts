import { randomUUID } from "crypto";
import type {
  AudienceSegment,
  ContentType,
  EditorialPillarId,
} from "@/lib/content-strategy";
import { dbAll, dbGet, dbRun } from "@/lib/db";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { DEFAULT_BLOG_AUTHOR, type BlogPost } from "./types";

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pillar: string;
  audience: string;
  content_type: string;
  published_at: string;
  seo_title: string;
  tldr: string;
  markdown: string;
  reading_minutes: number;
  workspace_id: string | null;
  created_at: string;
  webflow_item_id: string | null;
  webflow_published_at: string | null;
  webflow_live_url: string | null;
};

export type SaveBlogPostInput = {
  slug: string;
  title: string;
  description: string;
  pillar: EditorialPillarId;
  audience: AudienceSegment;
  contentType: ContentType;
  seoTitle: string;
  tldr: string;
  markdown: string;
  readingMinutes: number;
  workspaceId?: string;
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "article";
  let n = 0;
  while (await dbGet(`SELECT 1 FROM blog_posts WHERE slug = ?`, [slug])) {
    n += 1;
    slug = `${slugify(base).slice(0, 70)}-${n}`;
  }
  return slug;
}

export function parseMarkdownMeta(markdown: string): {
  seoTitle?: string;
  description?: string;
  title?: string;
  tldr?: string;
} {
  const seoTitle = markdown.match(/<!--\s*seo-title:\s*(.+?)\s*-->/)?.[1]?.trim();
  const description = markdown
    .match(/<!--\s*meta-description:\s*(.+?)\s*-->/)?.[1]
    ?.trim();
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const tldrMatch = markdown.match(
    /(?:^|\n)(?:#{1,6}\s+)?(?:\*\*)?(?:TL;DR|Quick Summary)(?:\*\*)?[:\s—-]+\s*([\s\S]+?)(?=\n\n|\n#)/i,
  );
  const tldr = tldrMatch?.[1]?.replace(/\*\*/g, "").trim();
  return { seoTitle, description, title, tldr };
}

function estimateReadingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 200));
}

export async function listGeneratedPosts(): Promise<BlogPostRow[]> {
  return dbAll<BlogPostRow>(
    `SELECT * FROM blog_posts ORDER BY published_at DESC, created_at DESC`,
  );
}

export async function listWorkspacePosts(
  workspaceId: string,
): Promise<BlogPostRow[]> {
  return dbAll<BlogPostRow>(
    `SELECT * FROM blog_posts
     WHERE workspace_id = ?
     ORDER BY published_at DESC, created_at DESC`,
    [workspaceId],
  );
}

/** All generated posts linked to workspaces owned by this user. */
export async function listBlogPostsForUser(
  userId: string,
): Promise<BlogPostRow[]> {
  return dbAll<BlogPostRow>(
    `SELECT bp.* FROM blog_posts bp
     INNER JOIN workspaces w ON bp.workspace_id = w.id
     WHERE w.user_id = ?
     ORDER BY bp.published_at DESC, bp.created_at DESC`,
    [userId],
  );
}

export async function getGeneratedPostBySlug(
  slug: string,
): Promise<BlogPostRow | undefined> {
  return dbGet<BlogPostRow>(`SELECT * FROM blog_posts WHERE slug = ?`, [slug]);
}

export async function saveGeneratedPost(
  input: SaveBlogPostInput,
): Promise<BlogPostRow> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const row: BlogPostRow = {
    id,
    slug: input.slug,
    title: input.title,
    description: clampMetaDescription(input.description),
    pillar: input.pillar,
    audience: input.audience,
    content_type: input.contentType,
    published_at: now,
    seo_title: clampSeoTitle(input.seoTitle),
    tldr: input.tldr,
    markdown: input.markdown,
    reading_minutes: input.readingMinutes,
    workspace_id: input.workspaceId ?? null,
    created_at: now,
    webflow_item_id: null,
    webflow_published_at: null,
    webflow_live_url: null,
  };

  await dbRun(
    `INSERT INTO blog_posts (
      id, slug, title, description, pillar, audience, content_type,
      published_at, seo_title, tldr, markdown, reading_minutes, workspace_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.slug,
      row.title,
      row.description,
      row.pillar,
      row.audience,
      row.content_type,
      row.published_at,
      row.seo_title,
      row.tldr,
      row.markdown,
      row.reading_minutes,
      row.workspace_id,
      row.created_at,
    ],
  );

  return row;
}

export type WebflowPublishMeta = {
  itemId: string;
  liveUrl?: string;
};

export async function markBlogPostWebflowPublish(
  slug: string,
  meta: WebflowPublishMeta,
): Promise<void> {
  const now = new Date().toISOString();
  await dbRun(
    `UPDATE blog_posts SET
      webflow_item_id = ?,
      webflow_published_at = ?,
      webflow_live_url = ?
     WHERE slug = ?`,
    [meta.itemId, now, meta.liveUrl ?? null, slug],
  );
}

export type UpdateBlogPostInput = {
  title?: string;
  description?: string;
  markdown?: string;
  seoTitle?: string;
};

export async function updateBlogPost(
  slug: string,
  input: UpdateBlogPostInput,
): Promise<void> {
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) {
    setClauses.push("title = ?");
    params.push(input.title.trim());
  }
  if (input.description !== undefined) {
    setClauses.push("description = ?");
    params.push(clampMetaDescription(input.description));
  }
  if (input.seoTitle !== undefined) {
    setClauses.push("seo_title = ?");
    params.push(clampSeoTitle(input.seoTitle));
  }
  if (input.markdown !== undefined) {
    setClauses.push("markdown = ?");
    params.push(input.markdown);
    setClauses.push("reading_minutes = ?");
    params.push(estimateReadingMinutes(input.markdown));
  }

  if (setClauses.length === 0) return;
  params.push(slug);
  await dbRun(
    `UPDATE blog_posts SET ${setClauses.join(", ")} WHERE slug = ?`,
    params,
  );
}

export async function deleteBlogPost(slug: string): Promise<void> {
  await dbRun(`DELETE FROM blog_posts WHERE slug = ?`, [slug]);
}


/** Keep one row per slug — prefer Webflow-published, then newest. */
export function dedupeBlogPostsBySlug(rows: BlogPostRow[]): BlogPostRow[] {
  const bySlug = new Map<string, BlogPostRow>();
  for (const row of rows) {
    const existing = bySlug.get(row.slug);
    if (!existing) {
      bySlug.set(row.slug, row);
      continue;
    }
    const rowHasWebflow = Boolean(row.webflow_published_at);
    const existingHasWebflow = Boolean(existing.webflow_published_at);
    const prefer =
      (rowHasWebflow && !existingHasWebflow) ||
      new Date(row.published_at).getTime() >
        new Date(existing.published_at).getTime();
    if (prefer) bySlug.set(row.slug, row);
  }
  return [...bySlug.values()].sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );
}

export function rowToBlogPost(row: BlogPostRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    pillar: row.pillar as EditorialPillarId,
    audience: row.audience as AudienceSegment,
    contentType: row.content_type as ContentType,
    author: DEFAULT_BLOG_AUTHOR,
    publishedAt: row.published_at,
    readingMinutes: row.reading_minutes,
    seoTitle: row.seo_title,
    tldr: row.tldr,
    sections: [],
    faqs: [],
    takeaways: [],
    markdown: row.markdown,
    source: "generated",
  };
}

export async function buildPostFromMarkdown(
  markdown: string,
  meta: {
    pillar: EditorialPillarId;
    audience: AudienceSegment;
    contentType: ContentType;
    suggestedTitle: string;
    metaTitle: string;
    metaDescription: string;
    workspaceId?: string;
  },
): Promise<{ post: BlogPost; row: BlogPostRow }> {
  const parsed = parseMarkdownMeta(markdown);
  const title = parsed.title ?? meta.suggestedTitle;
  const description = clampMetaDescription(
    parsed.description ?? meta.metaDescription,
  );
  const seoTitle = clampSeoTitle(parsed.seoTitle ?? meta.metaTitle);
  const tldr = parsed.tldr ?? description.slice(0, 280);
  const slug = await ensureUniqueSlug(title);
  const readingMinutes = estimateReadingMinutes(markdown);

  const row = await saveGeneratedPost({
    slug,
    title,
    description,
    pillar: meta.pillar,
    audience: meta.audience,
    contentType: meta.contentType,
    seoTitle,
    tldr,
    markdown,
    readingMinutes,
    workspaceId: meta.workspaceId,
  });

  return { post: rowToBlogPost(row), row };
}
