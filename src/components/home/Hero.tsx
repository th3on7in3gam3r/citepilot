import { Container } from "@/components/ui/Container";
import { HeroProductBanner } from "@/components/home/HeroProductBanner";
import { HeroCta } from "@/components/home/HeroCta";
import { heroGeoAnswer } from "@/lib/marketing/answer-capsule";
import Link from "next/link";

export function Hero({ heroCtaVariant }: { heroCtaVariant?: string }) {
  return (
    <section className="hero-premium relative overflow-hidden" aria-labelledby="hero-heading">
      <div className="hero-premium-grid" aria-hidden />
      <div className="hero-premium-orb hero-premium-orb--cyan" aria-hidden />
      <div className="hero-premium-orb hero-premium-orb--mint" aria-hidden />

      <Container className="relative z-10 px-4 pt-[5.25rem] pb-10 sm:pt-24 sm:pb-12 md:pt-28 md:pb-14">
        <header className="hero-rise mx-auto max-w-3xl text-center lg:max-w-4xl">
          <h1 id="hero-heading" className="font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-foreground dark:text-white sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.5rem]">
            Track when ChatGPT, Perplexity, and Google AI cite you
            <span className="mt-1 inline-block text-shimmer sm:mt-1.5">
              then close the gap weekly
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted dark:text-white/60 sm:mt-5 sm:text-lg">
            Free citation audit in ~60 seconds. Weekly monitoring on Pilot.
          </p>

          <div
            id="what-is-citepilot"
            className="hero-rise hero-rise-delay-1 mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-left backdrop-blur-sm sm:mt-7"
            aria-labelledby="hero-geo-answer-heading"
          >
            <h2
              id="hero-geo-answer-heading"
              className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/45"
            >
              What is CitePilot?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/75">{heroGeoAnswer}</p>
          </div>

          <div className="mt-7 flex flex-col items-center sm:mt-8">
            <HeroCta initialVariant={heroCtaVariant} />
            <p className="mt-3 text-xs text-muted dark:text-white/55">
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

        <div className="hero-rise hero-rise-delay-2 mt-10 hidden sm:mt-12 sm:block md:mt-14">
          <HeroProductBanner />
        </div>
      </Container>
    </section>
  );
}
