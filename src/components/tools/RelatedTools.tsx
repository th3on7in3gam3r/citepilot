import Link from "next/link";
import { relatedTools, type MarketingToolId } from "@/lib/marketing/tools-pages";
import { PillButton } from "@/components/ui/PillButton";

export function RelatedTools({ currentId }: { currentId: MarketingToolId }) {
  const tools = relatedTools(currentId);

  return (
    <section
      className="mt-16 border-t border-border pt-12"
      aria-labelledby="related-tools-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            More free tools
          </p>
          <h2
            id="related-tools-heading"
            className="font-display mt-1 text-xl font-bold text-ink"
          >
            Related free tools
          </h2>
        </div>
        <PillButton href="/start" size="md" variant="light">
          Start workspace setup
        </PillButton>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.path}
            className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
          >
            <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
              {tool.badge}
            </span>
            <p className="font-display mt-2 font-bold text-ink group-hover:text-accent">
              {tool.shortTitle}
            </p>
            <p className="mt-1 text-sm text-muted">{tool.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
