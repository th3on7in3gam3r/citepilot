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

      <Container className="relative z-10 px-4 py-14 text-center sm:py-16 md:py-20">
        {eyebrow && <p className="marketing-eyebrow">{eyebrow}</p>}
        <h1 className="font-display mx-auto mt-4 max-w-3xl text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-foreground dark:text-white sm:text-[2.375rem] md:text-[2.75rem] lg:text-[3rem]">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted dark:text-white/60 md:mt-5 md:text-lg">
          {description}
        </p>
        {children}
      </Container>
    </div>
  );
}
