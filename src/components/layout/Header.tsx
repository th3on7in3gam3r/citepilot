"use client";

import { Container } from "@/components/ui/Container";
import { HeaderAuthLinks } from "@/components/layout/HeaderAuthLinks";
import { HeaderMobileNav } from "@/components/layout/HeaderMobileNav";
import { HeaderNavDropdown } from "@/components/layout/HeaderNavDropdown";
import { HeaderStartButton } from "@/components/layout/HeaderStartButton";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site";

export function Header({
  light = false,
  overlay = false,
}: {
  light?: boolean;
  overlay?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { resolved } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !overlay;
  const onDark = light && !solid && resolved === "dark";

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
          {nav.main.map((item) =>
            "children" in item && item.children ? (
              <HeaderNavDropdown
                key={item.label}
                label={item.label}
                href={item.href}
                items={item.children}
                onDark={onDark}
              />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  onDark
                    ? "text-white/85 hover:text-white"
                    : "text-muted hover:text-ink dark:text-[#94a3b8] dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
