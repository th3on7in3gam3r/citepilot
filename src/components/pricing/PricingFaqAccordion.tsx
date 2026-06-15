"use client";

import { useId, useState } from "react";
import type { FaqItem } from "@/lib/marketing/site-faq";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-white/45 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PricingFaqAccordion({ items }: { items: FaqItem[] }) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm"
          >
            <button
              id={buttonId}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? null : index)}
              className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/[0.03]"
            >
              <span className="font-display font-bold text-white">{item.q}</span>
              <Chevron open={open} />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="border-t border-white/10 px-6 pb-5 pt-1"
            >
              <p className="text-sm leading-relaxed text-white/60">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
