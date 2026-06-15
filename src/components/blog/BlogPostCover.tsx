import Link from "next/link";
import type { EditorialPillarId } from "@/lib/content-strategy";
import { EDITORIAL_PILLARS } from "@/lib/content-strategy";
import { PILLAR_GRADIENTS } from "@/lib/blog/covers";

export function BlogPostCover({
  pillarId,
  className = "",
}: {
  pillarId: EditorialPillarId;
  className?: string;
}) {
  const colors = PILLAR_GRADIENTS[pillarId];
  const pillar = EDITORIAL_PILLARS.find((p) => p.id === pillarId);

  return (
    <div
      className={`relative aspect-[16/9] w-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.via} 45%, ${colors.to} 100%)`,
      }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)",
        }}
      />
      {pillar && (
        <span
          className={`absolute bottom-4 left-4 inline-flex rounded-full border border-white/25 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${colors.accent} backdrop-blur-sm`}
        >
          {pillar.title}
        </span>
      )}
    </div>
  );
}

export function BlogArticleCta() {
  return (
    <aside className="rounded-2xl border border-accent/35 bg-gradient-to-br from-accent/20 via-accent/10 to-white/[0.04] p-8 text-center shadow-[0_0_40px_rgba(14,165,233,0.12)] md:p-10">
      <p className="font-display text-xl font-bold text-white md:text-2xl">
        See where you stand in AI search — run a free citation audit
      </p>
      <Link
        href="/audit"
        className="mt-6 inline-flex rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
      >
        Start free audit →
      </Link>
    </aside>
  );
}
