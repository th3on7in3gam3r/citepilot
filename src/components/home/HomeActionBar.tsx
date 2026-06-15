import { PillButton } from "@/components/ui/PillButton";
import { ProductCTA } from "@/components/ui/ProductCTA";
import { Container } from "@/components/ui/Container";
import { nav } from "@/lib/site";

export function HomeActionBar() {
  return (
    <section
      id="get-started"
      className="relative z-10 border-t border-border/80 bg-background pb-14 pt-10 md:pb-16 md:pt-12"
      aria-label="Get started"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Get started
          </p>
          <p className="mt-2 text-lg text-muted">
            Run a free audit or build your full citation workspace.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-4xl flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <PillButton href={nav.startAnalysis.href} size="lg" className="sm:shrink-0">
            {nav.startAnalysis.label}
          </PillButton>
          <ProductCTA
            href="/citation-checker"
            variant="accent"
            sublabel="One prompt · no account"
          >
            Citation checker
          </ProductCTA>
          <ProductCTA
            href={nav.cta.href}
            variant="outline"
            sublabel="10 prompts · ~60 sec"
          >
            Full citation audit
          </ProductCTA>
          <ProductCTA
            href="/#journey"
            variant="outline"
            sublabel="See the product"
            showArrow={false}
            className="!border-border/80 !bg-surface/50 hover:!border-accent/40"
          >
            How it works
          </ProductCTA>
          <ProductCTA
            href="/ai-visibility"
            variant="outline"
            sublabel="Metrics · AEO · schema"
            showArrow={false}
            className="!border-border/80 !bg-surface/50 hover:!border-accent/40"
          >
            AI visibility
          </ProductCTA>
        </div>
      </Container>
    </section>
  );
}
