import type { AudienceSegment, ContentType, EditorialPillarId } from "@/lib/content-strategy";

export type BlogAuthor = {
  name: string;
  role?: string;
};

export const DEFAULT_BLOG_AUTHOR: BlogAuthor = {
  name: "CitePilot Editorial",
  role: "GEO & SEO team",
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  pillar: EditorialPillarId;
  audience: AudienceSegment;
  contentType: ContentType;
  author: BlogAuthor;
  publishedAt: string;
  readingMinutes: number;
  seoTitle: string;
  tldr: string;
  sections: BlogSection[];
  faqs: { q: string; a: string }[];
  takeaways: string[];
  /** Full markdown body for AI-generated posts */
  markdown?: string;
  source?: "static" | "generated";
  /** Hero cover for cards and social — absolute URL or site-relative path */
  coverImageUrl?: string;
  coverImageAlt?: string;
};

export type BlogSection =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; text: string };
