"use client";

import type { SiteSignals } from "@/lib/api-types";
import { Panel } from "@/components/dashboard/DashboardUI";

type SignalRow = {
  label: string;
  ok: boolean;
  detail: string;
};

function rows(signals: SiteSignals): SignalRow[] {
  const deep = signals.deepCrawl;
  const items: SignalRow[] = [
    {
      label: "Homepage reachable",
      ok: signals.fetchOk,
      detail: signals.fetchOk ? "Live crawl succeeded" : "Could not fetch homepage",
    },
  ];

  if (deep && deep.pagesCrawled > 0) {
    items.push({
      label: "Deep crawl",
      ok: deep.pagesCrawled >= 1,
      detail: `${deep.pagesCrawled} / ${deep.maxPages} pages (Pilot+)`,
    });
  }

  items.push(
    {
      label: "Meta description",
      ok: Boolean(signals.metaDescription),
      detail: signals.metaDescription ? "Present on live page" : "Missing — add in CMS",
    },
    {
      label: "JSON-LD",
      ok: signals.hasJsonLd,
      detail: signals.hasJsonLd
        ? deep && deep.pagesCrawled > 1
          ? "Structured data detected across crawl"
          : "Structured data detected"
        : "Not found in HTML",
    },
    {
      label: "FAQ schema",
      ok: signals.hasFaqSchema,
      detail: signals.hasFaqSchema ? "FAQPage detected" : "Missing — Quick Fix or manual paste",
    },
    {
      label: "Organization schema",
      ok: signals.hasOrganizationSchema,
      detail: signals.hasOrganizationSchema ? "Organization detected" : "Missing",
    },
    {
      label: "H1 heading",
      ok: Boolean(signals.h1),
      detail: signals.h1
        ? `"${signals.h1.slice(0, 48)}${signals.h1.length > 48 ? "…" : ""}"`
        : "Missing",
    },
    {
      label: "Content depth",
      ok: signals.wordCount >= 300,
      detail: `${signals.wordCount} words${signals.wordCount >= 300 ? "" : " — aim for 300+"}`,
    },
    {
      label: "Sitemap",
      ok: signals.sitemapFound,
      detail: signals.sitemapFound ? "sitemap.xml found" : "Not found",
    },
    {
      label: "robots.txt",
      ok: signals.robotsAllows,
      detail: signals.robotsAllows ? "Crawlers allowed" : "May block crawlers",
    },
  );

  return items;
}

export function GeoAuditSiteSignals({ signals }: { signals: SiteSignals }) {
  const items = rows(signals);
  const passed = items.filter((r) => r.ok).length;
  const deep = signals.deepCrawl;

  return (
    <Panel title="Live site signals" className="mt-6">
      <p className="mb-4 text-sm text-muted">
        {deep && deep.pagesCrawled > 1
          ? `Pulled from a same-domain deep crawl of ${deep.pagesCrawled} pages on the last audit (${passed}/${items.length} passing). Re-run after publishing changes to refresh.`
          : `Pulled from your homepage on the last audit (${passed}/${items.length} passing). Re-run after publishing changes to refresh.`}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((row) => (
          <li
            key={row.label}
            className={`rounded-xl border px-4 py-3 ${
              row.ok ? "border-emerald-200/80 bg-emerald-50/30" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`mt-0.5 text-sm font-bold ${row.ok ? "text-emerald-700" : "text-muted"}`}
                aria-hidden
              >
                {row.ok ? "✓" : "○"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{row.label}</p>
                <p className="mt-0.5 text-xs text-muted">{row.detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
