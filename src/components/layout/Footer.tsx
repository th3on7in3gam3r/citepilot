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
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FooterLinks({ links }: { links: readonly FooterLink[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-sm text-white/65 transition hover:text-accent"
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
    <footer className="mt-auto border-t border-border bg-ink text-white">
      <Container className="py-14 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-5">
            <Logo light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              {site.description}
            </p>
            <p className="mt-6 text-sm text-white/50">
              A{" "}
              <a
                href={site.studio.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white/80 underline decoration-white/25 underline-offset-4 transition hover:text-accent hover:decoration-accent"
              >
                {site.studio.name}
              </a>{" "}
              brand
            </p>
          </div>

          <div className="lg:col-span-2 lg:col-start-7">
            <FooterColumn title="Product">
              <FooterLinks links={nav.footer.product} />
            </FooterColumn>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Resources">
              <FooterLinks links={nav.footer.resources} />
            </FooterColumn>
          </div>

          <div className="lg:col-span-3">
            <FooterColumn title="Contact">
              <ul className="space-y-2.5 text-sm text-white/65">
                <li>
                  <a
                    href={`mailto:${site.supportEmail}`}
                    className="transition hover:text-accent"
                  >
                    {site.supportEmail}
                  </a>
                </li>
                <li>
                  <a
                    href={site.studio.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-accent"
                  >
                    {site.studio.name}
                  </a>
                </li>
              </ul>
            </FooterColumn>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-white/45">
            © {year} {site.name}. Built for teams who care about AI discovery.
          </p>
          <nav
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/45"
            aria-label="Legal"
          >
            <Link href="/terms" className="transition hover:text-white/80">
              Terms
            </Link>
            <span className="text-white/20" aria-hidden>
              ·
            </span>
            <Link href="/privacy" className="transition hover:text-white/80">
              Privacy
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
