import { PillButton } from "@/components/ui/PillButton";
import { ProductCTA } from "@/components/ui/ProductCTA";
import { Container } from "@/components/ui/Container";
import { nav, site } from "@/lib/site";

export function BottomCTA() {
  return (
    <section
      className="relative overflow-hidden bg-ink py-24 text-white dark:bg-[#050505] md:py-32 lg:py-36"
      aria-labelledby="bottom-cta-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(14,165,233,0.4), transparent)",
        }}
      />
      <Container className="relative text-center">
        <h2 id="bottom-cta-heading" className="font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Start {site.name} today
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/65 md:mt-8">
          Run your free citation audit. No credit card. See where AI answers
          mention you — and where they don&apos;t.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row md:mt-14">
          <PillButton href={nav.startAnalysis.href} variant="light" size="lg">
            {nav.startAnalysis.label}
          </PillButton>
          <ProductCTA href="/audit" variant="outline-light" sublabel="Skip setup">
            Quick audit
          </ProductCTA>
          <ProductCTA
            href="/pricing"
            variant="outline-light"
            sublabel="Pilot & Fleet plans"
          >
            View pricing
          </ProductCTA>
        </div>
      </Container>
    </section>
  );
}
