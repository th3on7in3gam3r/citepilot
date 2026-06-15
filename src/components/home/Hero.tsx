import { Container } from "@/components/ui/Container";
import { HeroProductBanner } from "@/components/home/HeroProductBanner";
import Link from "next/link";

export function Hero() {
  return (
    <section className="hero-premium relative overflow-hidden">
      <div className="hero-premium-grid" aria-hidden />
      <div className="hero-premium-orb hero-premium-orb--cyan" aria-hidden />
      <div className="hero-premium-orb hero-premium-orb--mint" aria-hidden />

      <Container className="relative z-10 px-4 pt-[5.25rem] pb-10 sm:pt-24 sm:pb-12 md:pt-28 md:pb-14">
        <header className="hero-rise mx-auto max-w-3xl text-center lg:max-w-4xl">
          <h1 className="font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-foreground dark:text-white sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.5rem]">
            Track when ChatGPT, Perplexity, and Google AI cite you
            <span className="mt-1 inline-block text-shimmer sm:mt-1.5">
              then close the gap weekly
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted dark:text-white/60 sm:mt-5 sm:text-lg">
            Free citation audit in ~60 seconds. Weekly monitoring on Pilot.
          </p>

          <div className="mt-7 flex flex-col items-center sm:mt-8">
            <Link
              href="/audit"
              className="inline-flex w-full max-w-sm items-center justify-center rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-8 py-3.5 text-base font-bold text-white shadow-[0_4px_20px_rgba(14,165,233,0.3)] transition hover:scale-[1.02] hover:shadow-[0_6px_24px_rgba(14,165,233,0.35)] dark:shadow-[0_4px_24px_rgba(14,165,233,0.25)] dark:hover:shadow-[0_6px_28px_rgba(14,165,233,0.3)] sm:w-auto sm:min-w-[15rem]"
            >
              Start free audit
            </Link>
            <p className="mt-3 text-xs text-muted dark:text-white/40">
              No credit card ·{" "}
              <Link
                href="/tools/citation-checker"
                className="text-muted underline decoration-border underline-offset-2 hover:text-ink dark:text-white/55 dark:decoration-white/20 dark:hover:text-white/75"
              >
                Or try one prompt
              </Link>
            </p>
          </div>
        </header>

        <div className="hero-rise hero-rise-delay-2 mt-10 sm:mt-12 md:mt-14">
          <HeroProductBanner />
        </div>
      </Container>
    </section>
  );
}
