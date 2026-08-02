import type { BlogPost } from "@/lib/blog/types";
import { formatBlogDate, formatReadTime } from "@/lib/blog/utils";

export function BlogPostMeta({
  post,
  dark = true,
}: {
  post: BlogPost;
  dark?: boolean;
}) {
  const muted = dark ? "text-white/50" : "text-muted";
  const text = dark ? "text-white/70" : "text-ink";

  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${muted}`}>
      <time dateTime={post.publishedAt} className={text}>
        {formatBlogDate(post.publishedAt)}
      </time>
      <span aria-hidden>·</span>
      <span>{formatReadTime(post.readingMinutes)}</span>
      <span aria-hidden>·</span>
      <span>
        <span className={dark ? "text-white/80" : "font-medium text-ink"}>
          {post.author.name}
        </span>
        {post.author.role && (
          <span className={muted}> · {post.author.role}</span>
        )}
      </span>
    </p>
  );
}
