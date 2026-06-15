import Link from "next/link";
import { relatedTools, type MarketingToolId } from "@/lib/marketing/tools-pages";

export function RelatedTools({ currentId }: { currentId: MarketingToolId }) {
  const tools = relatedTools(currentId);

  return (
    <section
      className="mt-16 border-t border-white/10 pt-12 dark:border-border"
      aria-labelledby="related-tools-heading"
    >
      <h2
        id="related-tools-heading"
        className="font-display text-xl font-bold text-ink dark:text-white"
      >
        Related free tools
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.path}
            className="group rounded-2xl border border-border bg-white p-5 transition hover:border-accent/40 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-accent/30"
          >
            <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
              {tool.badge}
            </span>
            <p className="font-display mt-2 font-bold text-ink group-hover:text-accent dark:text-white">
              {tool.shortTitle}
            </p>
            <p className="mt-1 text-sm text-muted dark:text-white/55">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
