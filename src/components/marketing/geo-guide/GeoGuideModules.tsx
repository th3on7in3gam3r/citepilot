"use client";

import { useState } from "react";
import {
  geoPlaybookCurriculum,
  type GeoModule,
  type GeoModuleTopic,
} from "@/lib/marketing/geo-playbook";

function TopicPanel({ topic, index }: { topic: GeoModuleTopic; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface/60"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-xs font-bold text-accent">
          {index + 1}
        </span>
        <span className="font-display flex-1 text-sm font-bold text-ink sm:text-base">
          {topic.label}
        </span>
        <span className="text-accent" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border bg-surface/40 px-4 py-4">
          <p className="text-sm leading-relaxed text-muted">{topic.body}</p>
          {topic.example && (
            <blockquote className="rounded-xl border-l-4 border-accent bg-white px-4 py-3 text-sm italic text-ink">
              {topic.example}
            </blockquote>
          )}
          {topic.bullets && (
            <ul className="space-y-2 text-sm text-muted">
              {topic.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    •
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ModuleBlock({ mod }: { mod: GeoModule }) {
  const readMin = Math.max(3, mod.topics.length * 3);
  return (
    <section id={mod.id} className="scroll-mt-28">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent font-display text-lg font-bold text-white">
          {mod.number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {mod.title}
            </h3>
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
              ~{readMin} min read
            </span>
          </div>
          <p className="mt-3 text-base leading-relaxed text-muted">{mod.summary}</p>
          <div className="mt-5 space-y-3">
            {mod.topics.map((topic, i) => (
              <TopicPanel key={topic.label} topic={topic} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function GeoGuideModules() {
  return (
    <div className="space-y-14">
      <section id="geo-curriculum" className="scroll-mt-28">
        <h2 className="font-display text-xl font-bold text-ink">Six-module curriculum</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Expand each module for deep dives, examples, and tactical bullets. Work
          top-to-bottom or jump to your biggest citation gap.
        </p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {geoPlaybookCurriculum.map((mod) => (
            <li key={mod.id}>
              <a
                href={`#${mod.id}`}
                className="group flex gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition hover:border-accent/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 font-display text-sm font-bold text-accent">
                  {mod.number}
                </span>
                <span className="min-w-0">
                  <span className="font-display block font-bold text-ink group-hover:text-accent">
                    {mod.title}
                  </span>
                  <span className="mt-1 line-clamp-2 text-xs text-muted">
                    {mod.summary}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      {geoPlaybookCurriculum.map((mod) => (
        <ModuleBlock key={mod.id} mod={mod} />
      ))}
    </div>
  );
}
