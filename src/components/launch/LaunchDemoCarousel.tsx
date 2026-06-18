"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";

const SLIDES = [
  {
    title: "Citation heatmap",
    caption: "See every prompt × platform at a glance",
    src: "/api/og/ph-gallery/2",
  },
  {
    title: "Weekly action plan",
    caption: "Ranked fixes — know exactly what to do next",
    src: "/api/og/ph-gallery/3",
  },
  {
    title: "Proof report",
    caption: "Share citation lift with clients in one link",
    src: "/api/og/ph-gallery/5",
  },
];

export function LaunchDemoCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = SLIDES[index]!;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="relative aspect-[1270/760] w-full bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.title}
            className="h-full w-full object-cover transition-opacity duration-500"
          />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4">
          <div>
            <p className="font-semibold text-ink">{slide.title}</p>
            <p className="text-sm text-muted">{slide.caption}</p>
          </div>
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === index ? "bg-accent w-6" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LaunchCtaLink({
  href,
  children,
  className,
  ctaId,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  ctaId: string;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackEvent("ph_launch_cta_clicked", { cta: ctaId })}
    >
      {children}
    </a>
  );
}
