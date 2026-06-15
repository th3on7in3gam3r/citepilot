import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pillars } from "@/lib/content";
import type { ReactNode } from "react";

const icons: Record<string, ReactNode> = {
  radar: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12L12 3" />
      <path d="M12 12L18 16" />
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M16 8L10 14L8 10L14 8L16 8Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 18V6M10 18V10M16 18V14M22 18V4" strokeLinecap="round" />
    </svg>
  ),
};

export function Pillars() {
  return (
    <Section id="pillars" className="bg-white dark:bg-background">
      <SectionHeading
        eyebrow="Product"
        title="Three pillars. One outcome: more citations."
        description="Everything serves prompt-level citation lift — no feature buffet."
        align="center"
      />
      <div className="mt-14 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-6 lg:gap-8">
        {pillars.map((pillar) => (
          <article
            key={pillar.id}
            className="rounded-2xl border border-border bg-cream p-8 transition hover:border-accent/40 hover:shadow-md dark:border-[#222] dark:bg-card md:p-10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {icons[pillar.icon]}
            </div>
            <h3 className="font-display mt-6 text-xl font-bold text-ink">
              {pillar.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
              {pillar.description}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
