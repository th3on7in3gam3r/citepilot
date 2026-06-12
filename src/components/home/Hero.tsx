import { Container } from "@/components/ui/Container";
import { HeroProductBanner } from "@/components/home/HeroProductBanner";
import { HeroSocialProof } from "@/components/home/HeroSocialProof";
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

          <h1 className="font-display mt-5 text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] sm:mt-6 sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.5rem]">
            Get cited by ChatGPT, Perplexity, and Google AI
            <span className="mt-1 block text-shimmer sm:mt-1.5">automatically</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/60 sm:mt-5 sm:max-w-2xl sm:text-lg">
            Audit your money prompts, track when citations change, and get weekly
            fixes with proof reports — without manual GEO busywork.
          </p>

          <HeroSocialProof />

          <div className="mt-8 flex flex-col items-center sm:mt-10">
            <Link
              href="/audit"
              className="inline-flex w-full max-w-sm items-center justify-center rounded-full bg-gradient-to-r from-[#7b93f0] via-[#6b8cff] to-accent px-8 py-3.5 text-base font-bold text-white shadow-[0_8px_32px_rgba(14,165,233,0.45)] transition hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(14,165,233,0.5)] sm:w-auto sm:min-w-[15rem]"
            >
              Start free audit
            </Link>
            <Link
              href="/dashboard/settings"
              className="mt-4 text-sm font-medium text-white/45 underline decoration-white/15 underline-offset-4 transition hover:text-white/70 hover:decoration-white/30"
            >
              See how Autopilot works →
            </Link>
          </div>

          <p className="mt-5 text-sm text-white/45">
            New —{" "}
            <Link
              href="/geo-playbook"
              className="font-medium text-white/65 underline decoration-white/20 underline-offset-4 transition hover:text-glow hover:decoration-glow/50"
            >
              Read the complete GEO Playbook
            </Link>
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] font-medium tracking-wide text-white/35 sm:text-xs">
            Weekly rescans • Citation delta tracking • Client-ready proof reports •
            No credit card
          </p>
        </header>

        <div className="hero-rise hero-rise-delay-2 mt-8 sm:mt-10 md:mt-12">
          <HeroProductBanner />
        </div>
      </Container>
    </section>
  );
}
