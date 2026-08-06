"use client";

import { ArticleBody } from "@/components/blog/ArticleBody";
import { MarkdownArticle } from "@/components/blog/MarkdownArticle";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { BlogPost } from "@/lib/blog/types";

type Props = {
  post: BlogPost;
};

/** Renders article body following the live html.dark theme preference. */
export function ThemeAwareArticle({ post }: Props) {
  const { resolved } = useTheme();
  const dark = resolved === "dark";

  if (post.markdown) {
    return <MarkdownArticle markdown={post.markdown} dark={dark} />;
  }
  return <ArticleBody post={post} dark={dark} />;
}
