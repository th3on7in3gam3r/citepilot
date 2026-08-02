import { Container } from "@/components/ui/Container";
import { HeroProductBanner } from "@/components/home/HeroProductBanner";
import { HeroCta } from "@/components/home/HeroCta";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section
      className="hero-premium marketing-hero-viewport relative overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="hero-premium-grid" aria-hidden />
      <div className="hero-premium-orb hero-premium-orb--cyan" aria-hidden />
      <div className="hero-premium-orb hero-premium-orb--mint" aria-hidden />

      <Container className="relative z-10 flex min-h-[inherit] flex-col justify-center px-4 pt-[4.75rem] pb-8 sm:pt-20 sm:pb-10 lg:pt-[5.25rem] lg:pb-12">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 xl:gap-12">
          <header className="hero-rise mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <p className="marketing-eyebrow">{t("brand")}</p>

            <h1
              id="hero-heading"
              className="mt-3 font-display text-[1.875rem] font-bold leading-[1.08] tracking-[-0.025em] text-foreground dark:text-white sm:mt-3.5 sm:text-[2.5rem] md:text-[2.875rem] lg:text-[3rem] xl:text-[3.25rem]"
            >
              {t("headline")}{" "}
              <span className="text-shimmer">{t("headlineAccent")}</span>
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted dark:text-white/60 sm:mt-5 lg:mx-0 lg:max-w-sm lg:text-[1.0625rem]">
              {t("subheadline")}
            </p>

            <div className="mt-6 flex flex-col items-center sm:mt-7 lg:items-start">
              <HeroCta />
              <p className="mt-2.5 text-xs text-muted dark:text-white/50">
                {t("noCard")}{" "}
                <Link
                  href="/tools/citation-checker"
                  className="text-muted underline decoration-border underline-offset-2 hover:text-ink dark:text-white/50 dark:decoration-white/20 dark:hover:text-white/75"
                >
                  {t("tryOnePrompt")}
                </Link>
              </p>
            </div>
          </header>

          <div className="hero-rise hero-rise-delay-2 min-w-0">
            <HeroProductBanner />
          </div>
        </div>
      </Container>
    </section>
  );
}
