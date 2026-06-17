"use client";

import { Container } from "@/components/ui/Container";
import { HeaderAuthLinks } from "@/components/layout/HeaderAuthLinks";
import { HeaderMobileNav } from "@/components/layout/HeaderMobileNav";
import { HeaderNavDropdown } from "@/components/layout/HeaderNavDropdown";
import { HeaderStartButton } from "@/components/layout/HeaderStartButton";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Link as LocaleLink } from "@/i18n/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function Header({
  light = false,
  overlay = false,
}: {
  light?: boolean;
  overlay?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { resolved } = useTheme();
  const t = useTranslations("nav");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !overlay;
  const onDark = light && !solid && resolved === "dark";

  const linkClass = `text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
    onDark
      ? "text-white/85 hover:text-white"
      : "text-muted hover:text-ink dark:text-[#94a3b8] dark:hover:text-white"
  }`;

  const freeToolsItems = [
    {
      label: t("tools.citationChecker"),
      href: "/tools/citation-checker",
      description: t("tools.citationCheckerDesc"),
    },
    {
      label: t("tools.fullAudit"),
      href: "/audit",
      description: t("tools.fullAuditDesc"),
    },
    {
      label: t("tools.gapCalculator"),
      href: "/tools/citation-gap-calculator",
      description: t("tools.gapCalculatorDesc"),
    },
    {
      label: t("tools.geoPlaybook"),
      href: "/tools/geo-playbook",
      description: t("tools.geoPlaybookDesc"),
    },
    {
      label: t("tools.chromeExtension"),
      href: "/chrome-extension",
      description: t("tools.chromeExtensionDesc"),
    },
  ] as const;

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-md dark:border-[#222] dark:bg-[#0a0a0a]/95 dark:shadow-black/20"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
        <Logo light={onDark} />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          <LocaleLink href="/#journey" className={linkClass}>
            {t("howItWorks")}
          </LocaleLink>
          <Link href="/product" className={linkClass}>
            {t("product")}
          </Link>
          <HeaderNavDropdown
            label={t("freeTools")}
            href="/tools/citation-checker"
            items={freeToolsItems}
            onDark={onDark}
          />
          <LocaleLink href="/agency" className={linkClass}>
            {t("agencies")}
          </LocaleLink>
          <LocaleLink href="/pricing" className={linkClass}>
            {t("pricing")}
          </LocaleLink>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher onDark={onDark} />
          </div>
          <div className="hidden lg:block">
            <ThemeToggle onDark={onDark} />
          </div>
          <div className="hidden sm:contents">
            <HeaderAuthLinks onDark={onDark} />
          </div>
          <HeaderStartButton onDark={onDark} />
          <HeaderMobileNav onDark={onDark} />
        </div>
      </Container>
    </header>
  );
}
