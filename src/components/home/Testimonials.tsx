"use client";

import { useState } from "react";
import { Section } from "@/components/ui/Section";
import { testimonials } from "@/lib/testimonials";

export function Testimonials() {
  const [active, setActive] = useState(0);
  const review = testimonials[active];

  return (
    <Section className="bg-cream">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl lg:text-[2.75rem]">
          From early access teams
        </h2>
        <p className="mt-3 text-lg text-muted">
          Quotes from Pilot and Fleet users during private beta — not paid endorsements.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-2xl md:mt-16">
        <article className="rounded-3xl border border-border bg-white p-8 md:p-12 lg:p-14">
          <div className="flex gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="mt-8 text-lg leading-relaxed text-ink/90 md:text-xl md:leading-relaxed">
            &ldquo;{review.text}&rdquo;
          </p>
          <footer className="mt-10 flex items-center gap-4 border-t border-border pt-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 font-display text-lg font-bold text-accent">
              {review.author.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-ink">{review.author}</p>
              <p className="text-sm text-muted">{review.role}</p>
              <p className="mt-0.5 text-xs text-muted/80">
                {review.date}
                {review.verified === false ? " · Illustrative" : ""}
              </p>
            </div>
          </footer>
        </article>

        <div className="mt-10 flex justify-center gap-2.5">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Review ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-8 bg-accent" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
