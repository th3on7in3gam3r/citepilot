"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { GeoGuideCapture } from "@/components/marketing/geo-guide/GeoGuideCapture";
import { GeoGuideChecklist } from "@/components/marketing/geo-guide/GeoGuideChecklist";
import { GeoGuideFaq } from "@/components/marketing/geo-guide/GeoGuideFaq";
import { GeoGuideFrameworks } from "@/components/marketing/geo-guide/GeoGuideFrameworks";
import { GeoGuideModules } from "@/components/marketing/geo-guide/GeoGuideModules";
import { GeoGuidePerplexity } from "@/components/marketing/geo-guide/GeoGuidePerplexity";
import { GeoGuideSevenDay } from "@/components/marketing/geo-guide/GeoGuideSevenDay";
import {
  useReadTimeFromRef,
  type ReadTimeTrackerState,
} from "@/hooks/useReadTimeTracker";
import {
  downloadGeoPlaybook,
  geoEngines,
  geoGuideNavSections,
  geoPlaybook,
} from "@/lib/marketing/geo-playbook";

const GUIDE_TABS = [
  { id: "geo-overview", label: "Overview" },
  { id: "geo-frameworks", label: "Frameworks" },
  { id: "geo-perplexity", label: "Perplexity" },
  { id: "geo-curriculum", label: "Modules" },
  { id: "geo-seven-day", label: "7-day plan" },
  { id: "geo-checklist", label: "Checklist" },
  { id: "geo-faq", label: "FAQ" },
] as const;

function ReadTimeRail({
  tracker,
  sections,
}: {
  tracker: ReadTimeTrackerState;
  sections: readonly { id: string; label: string }[];
}) {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - tracker.progress);

  return (
    <aside
      className="sticky top-24 hidden shrink-0 lg:block lg:w-56"
      aria-label="Reading progress"
    >
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40" aria-hidden>
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              className="stroke-border"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              className="stroke-accent transition-[stroke-dashoffset] duration-300"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Read time
            </p>
            <p className="font-display text-lg font-bold text-ink">
              {tracker.minutes} min
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          <span className="font-semibold text-ink">{tracker.percentRead}%</span>{" "}
          complete
        </p>
        <nav className="mt-4 max-h-[50vh] space-y-1 overflow-y-auto border-t border-border pt-3">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`block truncate rounded-lg px-2 py-1 text-xs transition ${
                tracker.activeSectionId === s.id
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-white hover:text-ink"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function MobileReadBar({ tracker }: { tracker: ReadTimeTrackerState }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
      <div
        className="h-1 bg-accent transition-[width] duration-300"
        style={{ width: `${tracker.percentRead}%` }}
      />
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted">
        <span>
          {tracker.percentRead}% · {tracker.minutes} min
        </span>
        <span className="truncate pl-4 text-ink">
          {tracker.activeSectionLabel ?? "GEO Playbook"}
        </span>
      </div>
    </div>
  );
}

function StickyTabNav({ activeId }: { activeId: string | null }) {
  return (
    <nav
      aria-label="Guide sections"
      className="sticky top-16 z-30 -mx-4 border-b border-border bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-[4.5rem]"
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {GUIDE_TABS.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeId === tab.id
                ? "bg-accent text-white"
                : "border border-border bg-white text-muted hover:border-accent/40 hover:text-ink"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function GeoGuideArticle() {
  const articleRef = useRef<HTMLElement>(null);
  const tracker = useReadTimeFromRef(articleRef, {
    sections: [...geoGuideNavSections],
  });

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  return (
    <div className="relative pb-20 lg:pb-0">
      <MobileReadBar tracker={tracker} />

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <ReadTimeRail tracker={tracker} sections={geoGuideNavSections} />

        <article ref={articleRef} className="min-w-0 flex-1 space-y-14">
          <header
            id="geo-overview"
            className="scroll-mt-28 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-ink via-ink to-accent/35 text-white"
          >
            <div className="p-6 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                Complete interactive guide · {geoPlaybook.readingMinutes} min
              </p>
              <h1 className="font-display mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.65rem]">
                {geoPlaybook.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
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
                <a
                  href="#geo-checklist"
                  className="inline-flex rounded-xl border border-accent/50 bg-accent/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/35"
                >
                  Open checklist
                </a>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { stat: "6", label: "Deep-dive modules" },
                  { stat: "5", label: "GEO frameworks" },
                  { stat: "7", label: "Day rollout plan" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3"
                  >
                    <p className="font-display text-2xl font-bold">{item.stat}</p>
                    <p className="text-xs text-white/70">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <StickyTabNav activeId={tracker.activeSectionId} />

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-lg font-bold text-ink">
              Why GEO now
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <blockquote className="rounded-xl border-l-4 border-accent bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
                <strong className="text-ink">74%+</strong> of brands ranking on
                Google Page 1 can be omitted from AI recommendations on the same
                commercial intent — the citation gap.
              </blockquote>
              <blockquote className="rounded-xl border-l-4 border-accent bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
                Buyers ask ChatGPT, Perplexity, and Gemini for shortlists before
                they click. If you are not cited, you are not in the consideration
                set.
              </blockquote>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              This guide walks the full stack: RAG mechanics, money prompts, technical
              audits, answer engineering, authority loops, and Share of Model
              measurement — with interactive checklists you can execute this week.
            </p>
          </section>

          <section id="geo-frameworks" className="scroll-mt-28 space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">
                Optimization frameworks
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Five frameworks used by GEO practitioners in 2026 — select a tab to
                explore pillars and when to apply each model.
              </p>
            </div>
            <GeoGuideFrameworks />
          </section>

          <section id="geo-engines" className="scroll-mt-28 space-y-4">
            <h2 className="font-display text-2xl font-bold text-ink">
              AI engine landscape
            </h2>
            <p className="max-w-2xl text-sm text-muted">
              Retrieval and citation behavior differs by engine — optimize for the
              surfaces your ICP actually uses.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 font-display font-bold text-ink">
                      Engine
                    </th>
                    <th className="px-4 py-3 font-display font-bold text-ink">
                      Retrieval
                    </th>
                    <th className="px-4 py-3 font-display font-bold text-ink">
                      Citation style
                    </th>
                    <th className="px-4 py-3 font-display font-bold text-ink">
                      Priority prompts
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted">
                  {geoEngines.map((engine) => (
                    <tr key={engine.id} className="hover:bg-surface/40">
                      <td className="px-4 py-3 font-medium text-ink">
                        {engine.name}
                      </td>
                      <td className="px-4 py-3">{engine.retrieval}</td>
                      <td className="px-4 py-3">{engine.citationStyle}</td>
                      <td className="px-4 py-3">{engine.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="geo-perplexity" className="scroll-mt-28 space-y-4">
            <GeoGuidePerplexity />
          </section>

          <GeoGuideModules />

          <section id="geo-seven-day" className="scroll-mt-28 space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">
                7-day implementation plan
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                A day-by-day rollout from baseline audit to executive proof report.
                Mark days complete — progress saves locally.
              </p>
            </div>
            <GeoGuideSevenDay />
          </section>

          <section id="geo-checklist" className="scroll-mt-28 space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">
                GEO implementation checklist
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Strategy, technical, content, off-site, and measurement items —
                check off as you ship.
              </p>
            </div>
            <GeoGuideChecklist />
          </section>

          <section id="geo-faq" className="scroll-mt-28 space-y-4">
            <h2 className="font-display text-2xl font-bold text-ink">
              Frequently asked questions
            </h2>
            <GeoGuideFaq />
          </section>

          <GeoGuideCapture />
        </article>
      </div>
    </div>
  );
}
