"use client";

import { useEffect, useState } from "react";
import { TestimonialAvatar } from "@/components/ui/TestimonialAvatar";
import { testimonials } from "@/lib/data/testimonials";

function Stars() {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const TRUST_POINTS = [
  "8 AI platforms scanned per audit",
  "Free baseline in under 60 seconds",
  "Weekly action plan when you upgrade",
] as const;

export function OnboardingAsidePanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  const review = testimonials[index]!;

  return (
    <div className="relative z-10 flex flex-1 flex-col justify-center px-8 py-16 sm:px-12 lg:px-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/80">
        Trusted by growth teams
      </p>
      <h2 className="font-display mt-3 max-w-md text-2xl font-bold leading-tight text-white sm:text-[1.75rem]">
        Know if ChatGPT cites your brand — and what to fix next
      </h2>

      <article
        key={review.author}
        className="glass-dark mt-8 max-w-md rounded-2xl px-6 py-5 animate-[hero-rise_0.45s_ease-out_both]"
        aria-live="polite"
      >
        <Stars />
        <p className="mt-3 text-sm leading-relaxed text-white/90">
          &ldquo;{review.text}&rdquo;
        </p>
        <footer className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
          <TestimonialAvatar author={review.author} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{review.author}</p>
            <p className="truncate text-xs text-white/55">
              {review.role}
              {review.company ? ` · ${review.company}` : ""}
            </p>
          </div>
        </footer>
      </article>

      <ul className="mt-8 max-w-md space-y-2.5">
        {TRUST_POINTS.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm text-white/70">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs text-emerald-300"
              aria-hidden
            >
              ✓
            </span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
