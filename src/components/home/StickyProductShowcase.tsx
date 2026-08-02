"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { ProductCTA } from "@/components/ui/ProductCTA";
import { PromptQuizMock } from "@/components/home/mockups/PromptQuizMock";
import { ScanMock } from "@/components/home/mockups/ScanMock";
import { FullAnalysisMock } from "@/components/home/mockups/FullAnalysisMock";
import { nav } from "@/lib/site";

const steps = [
  {
    id: "scan",
    number: "01",
    eyebrow: "Scan and analyze",
    title: "See exactly where AI cites you",
    description:
      "Our engine maps citation presence across ChatGPT, Perplexity, Gemini, Google AI, Grok, and DeepSeek — with precision for each money prompt.",
    sublabel: "Free · ~60 seconds",
    Mock: ScanMock,
  },
  {
    id: "prompts",
    number: "02",
    eyebrow: "Configure",
    title: "Set your money prompts",
    description:
      "Tell us the commercial questions buyers ask AI. We build your citation baseline and competitor map from real intent.",
    sublabel: "No credit card required",
    Mock: PromptQuizMock,
  },
  {
    id: "analysis",
    number: "03",
    eyebrow: "Prove lift",
    title: "View your citation breakdown",
    description:
      "Citation score, platform presence, gap list, and weekly actions — one dashboard built to close the loop on AI visibility.",
    sublabel: "See your citation map",
    Mock: FullAnalysisMock,
  },
];

export function StickyProductShowcase() {
  const [active, setActive] = useState(0);
  const step = steps[active];

  return (
    <section id="journey" className="relative overflow-hidden bg-[#04060c]" aria-labelledby="journey-heading">
      {/* Ambient glows */}
      <div className="hero-premium-orb hero-premium-orb--cyan" aria-hidden />
      <div
        className="pointer-events-none absolute bottom-1/3 right-0 h-[360px] w-[360px] rounded-full bg-[rgba(16,185,129,0.07)] blur-[90px]"
        aria-hidden
      />
      <div className="hero-premium-grid" aria-hidden />

      <Container className="relative z-10 py-24 md:py-32">

        {/* ── Section header ── */}
        <div className="mb-14 text-center md:mb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Go beyond dashboards
          </p>
          <h2 id="journey-heading" className="font-display mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            CitePilot{" "}
            <span className="text-shimmer">has it all</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/55 md:text-lg">
            From first scan to weekly proof reports — every step of the GEO workflow in one place.
          </p>
        </div>

        {/* ── Step tab pills ── */}
        <div
          className="mb-10 flex flex-wrap justify-center gap-2"
          role="tablist"
          aria-label="Product steps"
        >
          {steps.map((s, i) => (
            <button
              key={s.id}
              id={`journey-tab-${s.id}`}
              role="tab"
              aria-selected={active === i}
              aria-controls={`journey-panel-${s.id}`}
              type="button"
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold transition-all duration-300 ${
                active === i
                  ? "border-accent/60 bg-accent/15 text-accent shadow-[0_0_20px_rgba(14,165,233,0.2)]"
                  : "border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white/80"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                  active === i ? "bg-accent" : "bg-white/25"
                }`}
              />
              {s.number} · {s.eyebrow}
            </button>
          ))}
        </div>

        {/* ── Main product panel ── */}
        <div
          className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm md:p-6 lg:p-8"
          role="tabpanel"
          id={`journey-panel-${step.id}`}
          aria-labelledby={`journey-tab-${step.id}`}
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12 xl:gap-16">

            {/* Left — mockup */}
            <div className="order-2 lg:order-1">
              <div className="relative mx-auto h-[340px] max-w-md sm:h-[400px] md:h-[460px]">
                {steps.map((s, index) => (
                  <div
                    key={s.id}
                    className={`absolute inset-0 transition-all duration-500 ease-out ${
                      active === index
                        ? "z-10 translate-y-0 scale-100 opacity-100"
                        : "z-0 translate-y-3 scale-[0.98] opacity-0 pointer-events-none"
                    }`}
                    aria-hidden={active !== index}
                  >
                    {/* Gradient border frame */}
                    <div
                      className={`h-full rounded-2xl p-px transition-all duration-500 ${
                        active === index
                          ? "bg-gradient-to-br from-glow/40 via-white/8 to-accent/25 shadow-[0_0_60px_-15px_rgba(14,165,233,0.35)]"
                          : "bg-white/5"
                      }`}
                    >
                      <div className="h-full overflow-hidden rounded-[calc(1rem-1px)] bg-[#0c1220] p-3">
                        <s.Mock />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress dots */}
              <div className="mt-5 flex justify-center gap-2">
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={`rounded-full transition-all duration-400 ${
                      active === i ? "h-2 w-8 bg-accent" : "h-2 w-2 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right — copy */}
            <div className="order-1 flex flex-col justify-center lg:order-2 lg:py-6">
              {/* Eyebrow */}
              <div className="flex items-center gap-3">
                <span className="font-display text-[11px] font-bold tracking-[0.15em] text-accent">
                  {step.number}
                </span>
                <span className="h-px w-6 bg-accent/50" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent/70">
                  {step.eyebrow}
                </span>
              </div>

              {/* Title — animated swap */}
              <div className="relative mt-5 min-h-[5rem]">
                {steps.map((s, i) => (
                  <h3
                    key={s.id}
                    className={`font-display absolute inset-x-0 top-0 text-3xl font-bold leading-tight text-white transition-all duration-400 md:text-4xl lg:text-[2.4rem] lg:leading-[1.15] ${
                      active === i
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0 pointer-events-none"
                    }`}
                  >
                    {s.title}
                  </h3>
                ))}
              </div>

              {/* Description — animated swap */}
              <div className="relative mt-6 min-h-[5rem]">
                {steps.map((s, i) => (
                  <p
                    key={s.id}
                    className={`absolute inset-x-0 top-0 max-w-md text-base leading-relaxed text-white/55 transition-all duration-400 md:text-lg ${
                      active === i
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0 pointer-events-none"
                    }`}
                  >
                    {s.description}
                  </p>
                ))}
              </div>

              {/* Accent divider */}
              <div className="mt-8 h-px w-10 bg-gradient-to-r from-accent/60 to-transparent" />

              {/* CTA */}
              <div className="mt-8">
                <ProductCTA
                  href={nav.startAnalysis.href}
                  variant="accent"
                  sublabel={step.sublabel}
                >
                  Start Analysis
                </ProductCTA>
              </div>

              {/* Step counter */}
              <p className="mt-6 text-[11px] font-medium text-white/45">
                {active + 1} of {steps.length} steps
              </p>
            </div>
          </div>
        </div>

      </Container>
    </section>
  );
}
