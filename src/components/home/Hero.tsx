import { Container } from "@/components/ui/Container";
import { HeroProductBanner } from "@/components/home/HeroProductBanner";

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
            Analyze your
            <span className="mt-0.5 block text-shimmer">AI citations</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/60 sm:mt-5 sm:max-w-2xl sm:text-lg">
            Track where ChatGPT, Perplexity, and Google AI mention your brand —
            per money prompt, with proof of citation lift.
          </p>
        </header>

        <div className="hero-rise hero-rise-delay-2 mt-8 sm:mt-10 md:mt-12">
          <HeroProductBanner />
        </div>
      </Container>
    </section>
  );
}
