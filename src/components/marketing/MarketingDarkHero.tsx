import { Container } from "@/components/ui/Container";
import type { ReactNode } from "react";

export function MarketingDarkHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="hero-premium relative overflow-hidden border-b border-border dark:border-white/[0.06]">
      <div className="hero-premium-orb hero-premium-orb--cyan" aria-hidden />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[rgba(16,185,129,0.08)] blur-[80px]"
        aria-hidden
      />
      <div className="hero-premium-grid" aria-hidden />

      <Container className="relative z-10 py-16 text-center md:py-20 lg:py-24">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-foreground dark:text-white md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted dark:text-white/60 md:text-lg">
          {description}
        </p>
        {children}
      </Container>
    </div>
  );
}
