import Link from "next/link";
import { pillarHref } from "@/lib/blog/utils";
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
    <div className="mt-10">
      <h2 className="font-display text-lg font-bold text-white">Browse by topic</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => (
          <Link
            key={p.id}
            href={pillarHref(p.id)}
            className="group rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm transition hover:border-accent/40 hover:bg-white/[0.06]"
          >
            <p className="font-semibold text-white group-hover:text-glow">
              {p.title}
            </p>
            <p className="mt-1 text-xs text-white/50">{p.description}</p>
            <p className="mt-2 text-[11px] font-medium text-white/35">
              {counts[p.id]} article{counts[p.id] === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Compact pillar chips when full grid is hidden (< 2 posts per pillar). */
export function BlogPillarChips({
  activePillarId,
}: {
  activePillarId?: EditorialPillarId;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          !activePillarId
            ? "border-accent/40 bg-accent/15 text-glow"
            : "border-white/15 text-white/55 hover:border-white/30 hover:text-white"
        }`}
      >
        All articles
      </Link>
      {EDITORIAL_PILLARS.map((p) => (
        <Link
          key={p.id}
          href={pillarHref(p.id)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            activePillarId === p.id
              ? "border-accent/40 bg-accent/15 text-glow"
              : "border-white/15 text-white/55 hover:border-white/30 hover:text-white"
          }`}
        >
          {p.title}
        </Link>
      ))}
    </div>
  );
}
