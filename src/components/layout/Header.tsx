"use client";

import { Container } from "@/components/ui/Container";
import { HeaderAuthLinks } from "@/components/layout/HeaderAuthLinks";
import { HeaderStartButton } from "@/components/layout/HeaderStartButton";
import { Logo } from "@/components/ui/Logo";
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !overlay;
  const onDark = light && !solid;

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-border bg-white/95 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
        <Logo light={onDark} />
        <nav className="hidden items-center gap-10 md:flex">
          {nav.main.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition ${
                onDark
                  ? "text-white/75 hover:text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-4 sm:gap-6">
          <HeaderAuthLinks onDark={onDark} />
          <HeaderStartButton onDark={onDark} />
        </div>
      </Container>
    </header>
  );
}
