import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownArticle({
  markdown,
  dark = false,
}: {
  markdown: string;
  dark?: boolean;
}) {
  const body = markdown
    .replace(
      /<!--\s*(?:seo-title|meta-description|internal-links|schema):[^>]*-->\s*/gi,
      "",
    )
    .replace(/^#\s+.+$/m, "")
    .replace(/^(#{1,6}\s+)TL;DR\b/gm, "$1Quick Summary")
    .replace(/^(?:\*\*)?TL;DR(?:\*\*)?([:\s—-]+)/gm, "Quick Summary$1")
    .trim();

  const ink = dark ? "text-white" : "text-ink";
  const muted = dark ? "text-white/65" : "text-muted";
  const border = dark ? "border-white/15" : "border-border";
  const surface = dark ? "bg-white/10" : "bg-surface";

  return (
    <article className="prose-citepilot mx-auto max-w-3xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className={`font-display mt-8 text-3xl font-bold ${ink}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`font-display mt-10 text-2xl font-bold ${ink}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`font-display mt-6 text-lg font-bold ${ink}`}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className={`mt-4 text-base leading-relaxed ${muted}`}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className={`mt-4 list-disc space-y-2 pl-6 ${muted}`}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={`mt-4 list-decimal space-y-2 pl-6 ${muted}`}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className={`font-semibold ${ink}`}>{children}</strong>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-accent underline-offset-2 hover:underline"
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              target={href?.startsWith("http") ? "_blank" : undefined}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={`mt-4 border-l-4 border-accent/40 pl-4 italic ${muted}`}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className={`border ${border} ${surface} px-3 py-2 text-left font-semibold ${ink}`}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={`border ${border} px-3 py-2 ${muted}`}>
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className={`rounded ${surface} px-1.5 py-0.5 text-sm ${ink}`}>
              {children}
            </code>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
}
