import Link from "next/link";
import { pillarHref } from "@/lib/blog/utils";
import { PILLAR_GRADIENTS } from "@/lib/blog/covers";
import { PillarIcon } from "@/lib/blog/pillar-icons";
import type { EditorialPillarId } from "@/lib/content-strategy";
import { EDITORIAL_PILLARS } from "@/lib/content-strategy";

export function BlogCategoryGrid({
  pillars,
  counts,
}: {
  pillars: { id: EditorialPillarId; title: string; description: string }[];
  counts: Record<EditorialPillarId, number>;
}) {
  if (pillars.length === 0) return null;

  return (
    <section className="mt-16" aria-labelledby="blog-topics-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="blog-section-eyebrow">Topics</p>
          <h2
            id="blog-topics-heading"
            className="blog-section-title mt-1"
          >
            Explore by category
          </h2>
        </div>
        <p className="text-sm text-white/45">
          {pillars.length} active topic{pillars.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => {
          const colors = PILLAR_GRADIENTS[p.id];
          const count = counts[p.id];

          return (
            <Link
              key={p.id}
              href={pillarHref(p.id)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(14,165,233,0.12)]"
            >
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition group-hover:opacity-35"
                style={{
                  background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                }}
                aria-hidden
              />

              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${colors.from}22, ${colors.to}33)`,
                }}
              >
                <PillarIcon pillarId={p.id} className={`h-5 w-5 ${colors.accent}`} />
              </div>

              <p className="mt-4 font-display text-base font-bold text-white transition group-hover:text-glow">
                {p.title}
              </p>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/50">
                {p.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <span className="text-xs font-medium text-white/40">
                  {count} article{count === 1 ? "" : "s"}
                </span>
                <span className="text-xs font-semibold text-glow opacity-0 transition group-hover:opacity-100">
                  Browse →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function BlogPillarChips({
  activePillarId,
}: {
  activePillarId?: EditorialPillarId;
}) {
  return (
    <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filter by topic"
      >
        <Link
          href="/blog"
          role="tab"
          aria-selected={!activePillarId}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
            !activePillarId
              ? "border-accent/40 bg-accent/15 text-glow shadow-[0_0_20px_rgba(14,165,233,0.15)]"
              : "border-white/12 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white"
          }`}
        >
          All articles
        </Link>
        {EDITORIAL_PILLARS.map((p) => (
          <Link
            key={p.id}
            href={pillarHref(p.id)}
            role="tab"
            aria-selected={activePillarId === p.id}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              activePillarId === p.id
                ? "border-accent/40 bg-accent/15 text-glow shadow-[0_0_20px_rgba(14,165,233,0.15)]"
                : "border-white/12 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white"
            }`}
          >
            {p.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
