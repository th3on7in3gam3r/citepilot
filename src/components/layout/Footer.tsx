import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import type { ReactNode } from "react";
import { localizedHref } from "@/lib/i18n/localized-href";
import { GROWTH_STACK, aiCmoAppHref, BIBLEFUNLAND_STUDIOS_URL } from "@/lib/growth-stack";
import { site } from "@/lib/site";
import { getLocale, getTranslations } from "next-intl/server";

type FooterLink = { label: string; href: string };

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const id = `footer-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div aria-labelledby={id}>
      <h3
        id={id}
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted dark:text-white/55"
      >
        {title}
      </h3>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

function FooterLinks({ links }: { links: readonly FooterLink[] }) {
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-sm text-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:text-white/70 dark:hover:text-white"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function Footer() {
  const year = new Date().getFullYear();
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const lh = (path: string) => localizedHref(locale, path);

  const productLinks: FooterLink[] = [
    { label: t("howItWorks"), href: `${lh("/")}#journey` },
    { label: t("features"), href: "/product" },
    { label: t("pricing"), href: lh("/pricing") },
    { label: t("dashboard"), href: "/dashboard" },
  ];

  const toolsLinks: FooterLink[] = [
    { label: t("citationChecker"), href: "/tools/citation-checker" },
    { label: t("citationAudit"), href: "/audit" },
    { label: t("gapCalculator"), href: "/tools/citation-gap-calculator" },
    { label: t("geoPlaybook"), href: "/tools/geo-playbook" },
    { label: t("chromeExtension"), href: "/chrome-extension" },
    { label: t("startAnalysis"), href: "/start" },
  ];

  const compareLinks: FooterLink[] = [
    { label: t("vsSemrush"), href: "/compare/semrush" },
    { label: t("vsAhrefs"), href: "/compare/ahrefs" },
    { label: t("vsMoz"), href: "/compare/moz" },
    { label: t("vsBrightEdge"), href: "/compare/brightedge" },
    { label: t("vsConductor"), href: "/compare/conductor" },
  ];

  const learnLinks: FooterLink[] = [
    { label: t("geoPlaybook"), href: "/tools/geo-playbook" },
    { label: t("chatgptPrompts"), href: "/chatgpt-prompts" },
    { label: t("aiVisibility"), href: "/ai-visibility" },
    { label: t("blog"), href: "/blog" },
    { label: t("cmsPublishing"), href: "/help/cms-publishing" },
  ];

  const companyLinks: FooterLink[] = [
    { label: t("systemStatus"), href: "/status" },
    { label: t("changelog"), href: "/changelog" },
    { label: t("press"), href: "/press" },
    { label: t("apiDocs"), href: "/docs/api" },
    { label: t("agencies"), href: lh("/agency") },
  ];

  const stackLinks = [
    { label: GROWTH_STACK.kerygma.name, href: GROWTH_STACK.kerygma.href },
    { label: GROWTH_STACK.aiCmo.name, href: aiCmoAppHref() },
    { label: GROWTH_STACK.aegis.name, href: GROWTH_STACK.aegis.href },
    { label: "Bible Funland Studios", href: BIBLEFUNLAND_STUDIOS_URL },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-surface text-ink dark:border-[#222] dark:bg-ink dark:text-white">
      <Container className="py-12 md:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12 xl:gap-16">
          <div className="lg:max-w-[280px] lg:shrink-0">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted dark:text-white/55">
              {t("tagline")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-full border border-accent/60 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                {t("freeCitationAudit")}
              </Link>
              <a
                href={`mailto:${site.supportEmail}`}
                className="text-sm text-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:text-white/55 dark:hover:text-white"
              >
                {site.supportEmail}
              </a>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6 xl:gap-8">
            <FooterColumn title={t("columns.product")}>
              <FooterLinks links={productLinks} />
            </FooterColumn>

            <FooterColumn title={t("columns.tools")}>
              <FooterLinks links={toolsLinks} />
            </FooterColumn>

            <FooterColumn title={t("columns.compare")}>
              <FooterLinks links={compareLinks} />
            </FooterColumn>

            <FooterColumn title={t("columns.learn")}>
              <FooterLinks links={learnLinks} />
            </FooterColumn>

            <FooterColumn title={t("columns.company")}>
              <FooterLinks links={companyLinks} />
            </FooterColumn>
          </div>
        </div>

        <div
          className="mt-10 border-t border-border pt-8 dark:border-white/10"
          aria-labelledby="footer-growth-stack"
        >
          <h3
            id="footer-growth-stack"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted dark:text-white/55"
          >
            {t("columns.growthStack")}
          </h3>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {stackLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:text-white/70 dark:hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-border pt-7 text-sm text-muted dark:border-white/10 dark:text-white/55 md:flex-row md:items-center md:justify-between">
          <p>{t("copyright", { year, siteName: site.name })}</p>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            aria-label={t("legalAriaLabel")}
          >
            <Link
              href="/terms"
              className="transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:hover:text-white/70"
            >
              {t("terms")}
            </Link>
            <Link
              href="/privacy"
              className="transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:hover:text-white/70"
            >
              {t("privacy")}
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
