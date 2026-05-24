"use client";

import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCTA } from "@/components/ui/ProductCTA";
import { PromptQuizMock } from "@/components/home/mockups/PromptQuizMock";
import { ScanMock } from "@/components/home/mockups/ScanMock";
import { FullAnalysisMock } from "@/components/home/mockups/FullAnalysisMock";
import { useActiveStep } from "@/hooks/useActiveStep";
import { nav } from "@/lib/site";

const steps = [
  {
    id: "scan",
    eyebrow: "01 · Scan and analyze",
    title: "Scan your prompts",
    description:
      "Our engine maps citation presence across ChatGPT, Perplexity, Gemini, and Google AI — with precision for each money prompt.",
    Mock: ScanMock,
  },
  {
    id: "prompts",
    eyebrow: "02 · Configure",
    title: "Set your money prompts",
    description:
      "Tell us the commercial questions buyers ask AI. We build your citation baseline and competitor map from real intent.",
    Mock: PromptQuizMock,
  },
  {
    id: "analysis",
    eyebrow: "03 · Prove lift",
    title: "View your citation breakdown",
    description:
      "Citation score, platform presence, gap list, and weekly actions — one dashboard built to close the loop.",
    Mock: FullAnalysisMock,
  },
];

export function StickyProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const active = useActiveStep(containerRef, steps.length);

  return (
    <section id="journey" className="bg-cream">
      <Container className="py-20 md:py-28 lg:py-32">
        <SectionHeading
          eyebrow="Go beyond dashboards"
          title="CitePilot has it all"
          description="Scroll each step — one product view updates as you go."
          align="center"
        />
      </Container>

      <div ref={containerRef} className="relative">
        <Container>
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 xl:gap-24">
            <div className="relative hidden lg:block">
              <div className="sticky top-28 pb-16">
                <div className="relative mx-auto h-[min(520px,68vh)] w-full max-w-md">
                  {steps.map((step, index) => {
                    const isActive = active === index;
                    return (
                      <div
                        key={step.id}
                        className={`absolute inset-0 transition-all duration-700 ease-out ${
                          isActive
                            ? "z-10 translate-y-0 opacity-100"
                            : "z-0 translate-y-3 opacity-0 pointer-events-none"
                        }`}
                        aria-hidden={!isActive}
                      >
                        <div
                          className={`h-full rounded-3xl border bg-white p-3 shadow-xl ${
                            isActive
                              ? "border-accent/40 shadow-[0_24px_60px_-12px_rgba(14,165,233,0.2)]"
                              : "border-border"
                          }`}
                        >
                          <step.Mock />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="mt-8 flex justify-center gap-3"
                  role="tablist"
                  aria-label="Product steps"
                >
                  {steps.map((step, index) => (
                    <span
                      key={step.id}
                      role="tab"
                      aria-selected={active === index}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-500 ${
                        active === index
                          ? "bg-accent text-white"
                          : "bg-white text-muted ring-1 ring-border"
                      }`}
                    >
                      Step {index + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pb-20 md:pb-28">
              {steps.map((step, index) => (
                <article
                  key={step.id}
                  data-step-panel
                  data-step-index={index}
                  className="flex min-h-[82vh] flex-col justify-center py-12 md:py-16 lg:min-h-[85vh]"
                >
                  <div className="mb-10 lg:hidden">
                    <div
                      className={`transition-opacity duration-500 ${
                        active === index ? "opacity-100" : "opacity-30"
                      }`}
                    >
                      <step.Mock />
                    </div>
                  </div>

                  <p className="text-sm font-bold uppercase tracking-wider text-accent">
                    {step.eyebrow}
                  </p>
                  <h3 className="font-display mt-4 text-3xl font-bold leading-tight text-ink md:text-4xl lg:text-5xl">
                    {step.title}
                  </h3>
                  <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                    {step.description}
                  </p>
                  <div className="mt-10">
                  <ProductCTA
                    href={nav.startAnalysis.href}
                    variant={index === steps.length - 1 ? "accent" : "primary"}
                      sublabel={
                        index === 0
                          ? "Free · ~60 seconds"
                          : index === 1
                            ? "No credit card"
                            : "See your citation map"
                      }
                    >
                    Start Analysis
                  </ProductCTA>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
