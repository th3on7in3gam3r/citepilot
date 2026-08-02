import { PillButton } from "@/components/ui/PillButton";
import { ProductCTA } from "@/components/ui/ProductCTA";
import { Container } from "@/components/ui/Container";
import { localizedHref } from "@/lib/i18n/localized-href";
import { site } from "@/lib/site";
import { getLocale, getTranslations } from "next-intl/server";

export async function BottomCTA() {
  const t = await getTranslations("bottomCta");
  const locale = await getLocale();

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
          {t("heading", { siteName: site.name })}
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/65 md:mt-8">
          {t("body")}
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row md:mt-14">
          <PillButton href="/start" variant="light" size="lg">
            {t("primary")}
          </PillButton>
          <ProductCTA href="/audit" variant="outline-light" sublabel={t("quickAuditSublabel")}>
            {t("quickAudit")}
          </ProductCTA>
          <ProductCTA
            href={localizedHref(locale, "/pricing")}
            variant="outline-light"
            sublabel={t("pricingSublabel")}
          >
            {t("pricing")}
          </ProductCTA>
        </div>
      </Container>
    </section>
  );
}
