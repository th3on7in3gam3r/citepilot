"use client";

import { useState } from "react";
import {
  promptIntentTaxonomy,
  type PromptIntent,
} from "@/lib/marketing/chatgpt-prompts-landing";

function IntentPanel({ intent }: { intent: PromptIntent }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="text-sm leading-relaxed text-muted">{intent.description}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink">
          Example ChatGPT prompts
        </p>
        <ul className="mt-2 space-y-2">
          {intent.examples.map((ex) => (
            <li
              key={ex}
              className="rounded-xl border-l-4 border-accent bg-surface px-4 py-3 text-sm italic text-ink"
            >
              &ldquo;{ex}&rdquo;
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-border bg-surface/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Workspace optimization playbook
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {intent.optimizeWith.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent" aria-hidden>
                →
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ChatGptPromptIntentExplorer() {
  const [activeId, setActiveId] = useState(promptIntentTaxonomy[0]?.id ?? "");

  const active =
    promptIntentTaxonomy.find((i) => i.id === activeId) ??
    promptIntentTaxonomy[0];

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Money prompt intent categories"
        className="flex flex-wrap gap-2"
      >
        {promptIntentTaxonomy.map((intent) => (
          <button
            key={intent.id}
            type="button"
            role="tab"
            aria-selected={activeId === intent.id}
            onClick={() => setActiveId(intent.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeId === intent.id
                ? "bg-accent text-white shadow-sm"
                : "border border-border bg-white text-muted hover:border-accent/40 hover:text-ink"
            }`}
          >
            {intent.label}
          </button>
        ))}
      </div>

      {active && (
        <div role="tabpanel" className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-xl font-bold text-ink">
              {active.label} prompts
            </h3>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {active.tag}
            </span>
          </div>
          <div className="mt-5">
            <IntentPanel intent={active} />
          </div>
        </div>
      )}
    </div>
  );
}
