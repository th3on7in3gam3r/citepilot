"use client";

import Link from "next/link";
import {
  downloadGeoPlaybook,
  geoPlaybook,
  geoPlaybookModules,
} from "@/lib/marketing/geo-playbook";

export function GeoPlaybookSection() {
  return (
    <section
      id="geo-playbook"
      className="scroll-mt-28 rounded-3xl border-2 border-accent/40 bg-white shadow-md"
    >
      <div className="rounded-t-[1.35rem] bg-gradient-to-br from-ink via-ink to-accent/40 px-6 py-8 text-white sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
          Your download
        </p>
        <h2 className="font-display mt-2 text-2xl font-bold leading-tight sm:text-3xl">
          GEO Strategy Playbook: Winning the AI Answer Engine
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
          {geoPlaybook.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadGeoPlaybook}
            className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
          >
            Download playbook (.md)
          </button>
          <Link
            href="/audit"
            className="inline-flex rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Run free citation audit
          </Link>
        </div>
      </div>

      <div className="space-y-6 p-6 sm:p-10">
        {geoPlaybookModules.map((mod) => (
          <article
            key={mod.number}
            className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 font-display text-sm font-bold text-accent">
                {mod.number}
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">
                  {mod.title}
                </h3>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                  {mod.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
