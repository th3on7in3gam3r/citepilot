"use client";

import { useState } from "react";
import Link from "next/link";
import { perplexityCitationPlaybook } from "@/lib/marketing/geo-playbook";

export function GeoGuidePerplexity() {
  const [openStep, setOpenStep] = useState(
    perplexityCitationPlaybook.steps[0]?.id ?? "",
  );

  const { pipeline, steps, intro, tagline, title } = perplexityCitationPlaybook;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Authoritative playbook
        </p>
        <h3 className="font-display mt-2 text-2xl font-bold text-ink sm:text-3xl">
          {title}
        </h3>
        <p className="mt-2 text-sm font-medium text-muted">{tagline}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">{intro}</p>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink">
            Perplexity citation pipeline
          </p>
          <ol className="mt-3 space-y-2">
            {pipeline.map((stage, i) => (
              <li
                key={stage}
                className="flex gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3 text-sm text-muted"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {i + 1}
                </span>
                {stage}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const isOpen = openStep === step.id;
          return (
            <article
              key={step.id}
              id={step.id}
              className="scroll-mt-28 overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenStep(isOpen ? "" : step.id)}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-surface/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-sm font-bold text-white">
                  {step.step}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-display block text-base font-bold text-ink sm:text-lg">
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-accent">
                    {step.subtitle}
                  </span>
                </span>
                <span className="shrink-0 text-accent" aria-hidden>
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="space-y-5 border-t border-border px-5 py-5">
                  <p className="text-sm leading-relaxed text-muted">{step.body}</p>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink">
                      Actions
                    </p>
                    <ul className="mt-2 space-y-2">
                      {step.actions.map((action) => (
                        <li
                          key={action}
                          className="flex gap-2 text-sm text-muted"
                        >
                          <span className="text-accent" aria-hidden>
                            ✓
                          </span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {step.technical && step.technical.length > 0 && (
                    <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                        Technical reference
                      </p>
                      <dl className="mt-3 space-y-3">
                        {step.technical.map((ref) => (
                          <div key={ref.label}>
                            <dt className="font-mono text-xs font-bold text-ink">
                              {ref.label}
                            </dt>
                            <dd className="mt-1 text-sm leading-relaxed text-muted">
                              {ref.detail}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted">
        Run a live Perplexity citation audit on your domain —{" "}
        <Link href="/audit" className="font-semibold text-accent hover:underline">
          free 60-second scan
        </Link>
        .
      </p>
    </div>
  );
}
