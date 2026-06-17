import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import type { ReactNode } from "react";
import { nav, site } from "@/lib/site";

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

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface text-ink dark:border-[#222] dark:bg-ink dark:text-white">
      <Container className="py-12 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted dark:text-white/55">
              {site.tagline}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={nav.cta.href}
                className="inline-flex items-center justify-center rounded-full border border-accent/60 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                {nav.cta.label}
              </Link>
              <a
                href={`mailto:${site.supportEmail}`}
                className="text-sm text-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:text-white/55 dark:hover:text-white"
              >
                {site.supportEmail}
              </a>
            </div>
          </div>

          <FooterColumn title="Product">
            <FooterLinks links={nav.footer.product} />
          </FooterColumn>

          <FooterColumn title="Tools">
            <FooterLinks links={nav.footer.tools} />
          </FooterColumn>

          <FooterColumn title="Compare">
            <FooterLinks links={nav.footer.compare} />
          </FooterColumn>

          <FooterColumn title="Learn">
            <FooterLinks links={nav.footer.learn} />
          </FooterColumn>

          <FooterColumn title="Company">
            <FooterLinks links={nav.footer.company} />
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-7 text-sm text-muted dark:border-white/10 dark:text-white/55 md:flex-row md:items-center md:justify-between">
          <p>© {year} {site.name}</p>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            aria-label="Legal"
          >
            <Link
              href="/terms"
              className="transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:hover:text-white/70"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:hover:text-white/70"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
