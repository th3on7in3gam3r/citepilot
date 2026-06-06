"use client";

import { useState } from "react";
import { geoPlaybook } from "@/lib/marketing/geo-playbook";

export function GeoGuideFaq() {
  const [openId, setOpenId] = useState<string | null>(geoPlaybook.faqs[0]?.q ?? null);

  return (
    <dl className="space-y-3">
      {geoPlaybook.faqs.map((faq) => {
        const isOpen = openId === faq.q;
        return (
          <div
            key={faq.q}
            className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
          >
            <dt>
              <button
                type="button"
                id={`faq-${faq.q.slice(0, 24)}`}
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : faq.q)}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface/50"
              >
                <span className="font-display text-sm font-bold text-ink sm:text-base">
                  {faq.q}
                </span>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
                  aria-hidden
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </dt>
            {isOpen && (
              <dd className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted">
                {faq.a}
              </dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}
