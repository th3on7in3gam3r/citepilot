import { Container } from "@/components/ui/Container";
import { PillButton } from "@/components/ui/PillButton";
import { ProductCTA } from "@/components/ui/ProductCTA";
import { localizedHref } from "@/lib/i18n/localized-href";
import { getLocale, getTranslations } from "next-intl/server";

export async function HomeActionBar() {
  const t = await getTranslations("homeActionBar");
  const nav = await getTranslations("nav");
  const locale = await getLocale();

  return (
    <section
      id="get-started"
      className="relative z-10 border-t border-border/80 bg-background pb-14 pt-10 md:pb-16 md:pt-12"
      aria-labelledby="get-started-heading"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            {t("eyebrow")}
          </p>
          <h2 id="get-started-heading" className="mt-2 text-lg font-semibold text-ink">
            {t("title")}
          </h2>
        </div>

        <div className="mx-auto mt-8 flex max-w-4xl flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <PillButton href="/start" size="lg" className="sm:shrink-0">
            {nav("startAnalysis")}
          </PillButton>
          <ProductCTA
            href="/tools/citation-checker"
            variant="accent"
            sublabel={nav("tools.citationCheckerDesc")}
          >
            {nav("tools.citationChecker")}
          </ProductCTA>
          <ProductCTA href="/audit" variant="outline" sublabel={nav("tools.fullAuditDesc")}>
            {nav("tools.fullAudit")}
          </ProductCTA>
          <ProductCTA
            href={`${localizedHref(locale, "/")}#journey`}
            variant="outline"
            sublabel="See the product"
            showArrow={false}
            className="!border-border/80 !bg-surface/50 hover:!border-accent/40"
          >
            {nav("howItWorks")}
          </ProductCTA>
          <ProductCTA
            href="/ai-visibility"
            variant="outline"
            sublabel="Metrics · AEO · schema"
            showArrow={false}
            className="!border-border/80 !bg-surface/50 hover:!border-accent/40"
          >
            {nav("aiVisibility")}
          </ProductCTA>
        </div>
      </Container>
    </section>
  );
}
