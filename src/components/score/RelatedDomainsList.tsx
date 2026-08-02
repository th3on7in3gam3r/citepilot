import Link from "next/link";
import { scoreColor } from "@/lib/widget/geo-badge";
import type { RelatedDomain } from "@/lib/score/related-domains";

export function RelatedDomainsList({
  domains,
  categoryLabel = "recently audited",
}: {
  domains: RelatedDomain[];
  categoryLabel?: string;
}) {
  if (domains.length === 0) return null;

  return (
    <aside className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Benchmark
      </p>
      <h2 className="font-display mt-1 text-sm font-bold text-ink">
        Other domains {categoryLabel}
      </h2>
      <ul className="mt-4 space-y-1">
        {domains.map((item) => (
          <li key={item.domain}>
            <Link
              href={`/score/${encodeURIComponent(item.domain)}`}
              className="group flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-surface"
            >
              <span className="truncate text-sm font-medium text-ink group-hover:text-accent">
                {item.domain}
              </span>
              <span
                className="ml-3 shrink-0 text-sm font-bold tabular-nums"
                style={{ color: scoreColor(item.score) }}
              >
                {item.score}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
