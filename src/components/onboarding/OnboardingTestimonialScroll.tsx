"use client";

import { useEffect, useState } from "react";
import { TestimonialAvatar } from "@/components/ui/TestimonialAvatar";
import { testimonials } from "@/lib/data/testimonials";

const CARD_WIDTH = 300;
const CARD_GAP = 24;
const STEP = CARD_WIDTH + CARD_GAP;
const HOLD_MS = 4200;
const SCROLL_MS = 900;

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

function TestimonialCard({
  author,
  role,
  text,
  variant,
}: {
  author: string;
  role: string;
  text: string;
  variant: "light" | "dark";
}) {
  const dark = variant === "dark";

  return (
    <article
      className={`shrink-0 rounded-2xl px-6 py-5 ${
        dark
          ? "glass"
          : "glass-light border border-border"
      }`}
      style={{ width: CARD_WIDTH }}
    >
      <Stars />
      <p
        className={`mt-3 text-sm leading-relaxed ${
          dark ? "text-white/85" : "text-ink/90"
        }`}
      >
        &ldquo;{text}&rdquo;
      </p>
      <footer
        className={`mt-4 flex items-center gap-3 border-t pt-4 ${
          dark ? "border-white/10" : "border-border/60"
        }`}
      >
        <TestimonialAvatar author={author} size="sm" />
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-semibold ${
              dark ? "text-white" : "text-ink"
            }`}
          >
            {author}
          </p>
          <p
            className={`truncate text-xs ${
              dark ? "text-white/50" : "text-muted"
            }`}
          >
            {role}
          </p>
        </div>
      </footer>
    </article>
  );
}

export function OnboardingTestimonialScroll({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const count = testimonials.length;
  const loop = [...testimonials, ...testimonials];
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const dark = variant === "dark";

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setIndex((prev) => (prev >= count ? prev : prev + 1));
        timer = setTimeout(step, SCROLL_MS + HOLD_MS);
      }, HOLD_MS);
    };

    timer = setTimeout(step, HOLD_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [count]);

  const handleTransitionEnd = () => {
    if (index !== count) return;
    setAnimate(false);
    setIndex(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimate(true));
    });
  };

  const offset = index * STEP;

  return (
    <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col justify-center overflow-hidden py-16">
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-20 w-20 sm:w-28 ${
          dark
            ? "bg-gradient-to-r from-[#0c1424] via-[#0c1424]/85 to-transparent"
            : "bg-gradient-to-r from-surface via-surface/80 to-transparent"
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-20 w-20 sm:w-28 ${
          dark
            ? "bg-gradient-to-l from-[#0a101c] via-[#0a101c]/85 to-transparent"
            : "bg-gradient-to-l from-cream via-cream/80 to-transparent"
        }`}
        aria-hidden
      />

      <div className="flex min-h-0 flex-1 items-center overflow-hidden">
        <div
          className="flex w-max items-stretch px-8 sm:px-12"
          style={{
            gap: CARD_GAP,
            transform: `translateX(-${offset}px)`,
            transition: animate
              ? `transform ${SCROLL_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
              : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {loop.map((review, i) => (
            <TestimonialCard
              key={`${review.author}-${i}`}
              author={review.author}
              role={review.role}
              text={review.text}
              variant={variant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
