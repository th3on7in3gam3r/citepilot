"use client";

import { BlogPostMeta } from "@/components/blog/BlogPostMeta";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { BlogPost } from "@/lib/blog/types";

export function ThemeAwareBlogPostMeta({ post }: { post: BlogPost }) {
  const { resolved } = useTheme();
  return <BlogPostMeta post={post} dark={resolved === "dark"} />;
}
