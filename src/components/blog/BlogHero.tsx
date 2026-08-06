import { Container } from "@/components/ui/Container";
import type { ReactNode } from "react";

export function BlogHero({
  eyebrow,
  title,
  description,
  stats,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  stats?: { label: string; value: string }[];
  children?: ReactNode;
}) {
  return (
    <div className="blog-hero relative overflow-hidden border-b border-border bg-background text-foreground dark:border-white/[0.06] dark:bg-[var(--hero-bg)] dark:text-white">
      <div className="hero-premium-orb hero-premium-orb--cyan opacity-40 dark:opacity-80" aria-hidden />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[rgba(16,185,129,0.06)] blur-[80px] dark:bg-[rgba(16,185,129,0.08)]"
        aria-hidden
      />
      <div className="hero-premium-grid opacity-40 dark:opacity-100" aria-hidden />

      <Container className="relative z-10 py-20 text-center md:py-24 lg:py-28">
        {eyebrow && (
          <p className="marketing-eyebrow text-accent-deep dark:text-glow">{eyebrow}</p>
        )}
        <h1 className="font-display mx-auto mt-4 max-w-3xl text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[2.375rem] md:text-[2.75rem] lg:text-[3rem] dark:text-white">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted md:mt-5 md:text-lg dark:text-white/60">
          {description}
        </p>

        {stats && stats.length > 0 && (
          <dl className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-2xl font-bold text-foreground dark:text-white">
                  {stat.value}
                </dd>
                <dd className="text-sm text-muted dark:text-white/45">{stat.label}</dd>
              </div>
            ))}
          </dl>
        )}

        {children}
      </Container>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background dark:to-[var(--hero-bg)]"
        aria-hidden
      />
    </div>
  );
}
