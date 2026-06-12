import { Container } from "@/components/ui/Container";
import { HeroProductBanner } from "@/components/home/HeroProductBanner";
import { AnswerCapsule } from "@/components/home/AnswerCapsule";
import Link from "next/link";

export function Hero() {
  return (
    <section className="hero-premium relative overflow-hidden text-white">
      <div className="hero-premium-grid" aria-hidden />
      <div className="hero-premium-orb hero-premium-orb--cyan" aria-hidden />
      <div className="hero-premium-orb hero-premium-orb--mint" aria-hidden />

      <Container className="relative z-10 px-4 pt-[5.25rem] pb-12 sm:pt-24 sm:pb-14 md:pt-28 md:pb-16 lg:pb-20">
        <header className="hero-rise mx-auto max-w-3xl text-center lg:max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-glow opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-glow" />
            </span>
            Citation intelligence for AI search
          </div>

          <h1 className="font-display mt-5 text-[2.125rem] font-bold leading-[1.08] tracking-[-0.02em] sm:mt-6 sm:text-5xl md:text-[3.5rem] lg:text-[3.75rem]">
            Grow SEO + LLM traffic
            <span className="mt-0.5 block text-shimmer">on autopilot</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/60 sm:mt-5 sm:max-w-2xl sm:text-lg">
            CitePilot audits your money prompts, tracks citation changes, and
            sends weekly action plans + proof reports so you can grow organic and
            AI visibility without constant manual work.
          </p>

          <AnswerCapsule variant="hero" />

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(107,140,255,0.3)] transition hover:opacity-95 sm:text-base"
            >
              Start free audit
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.08] sm:text-base"
            >
              See how Autopilot works
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/55">
            New —{" "}
            <Link
              href="/geo-playbook"
              className="font-semibold text-white/85 underline decoration-white/25 underline-offset-4 transition hover:text-glow hover:decoration-glow"
            >
              Read the complete GEO Playbook
            </Link>
            , including our Perplexity citation guide.
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] font-medium tracking-wide text-white/45 sm:text-xs">
            Weekly rescans • Citation delta tracking • Client-ready proof reports •
            No CMS auto-publish
          </p>
        </header>

        <div className="hero-rise hero-rise-delay-2 mt-8 sm:mt-10 md:mt-12">
          <HeroProductBanner />
        </div>
      </Container>
    </section>
  );
}
