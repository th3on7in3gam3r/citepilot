import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-ink text-white">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              {site.description}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Product</p>
            <ul className="mt-4 space-y-3">
              {nav.main.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/audit"
                  className="text-sm text-white/60 transition hover:text-accent"
                >
                  Free citation audit
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Contact</p>
            <p className="mt-4 text-sm text-white/60">
              <a
                href={`mailto:${site.supportEmail}`}
                className="transition hover:text-accent"
              >
                {site.supportEmail}
              </a>
            </p>
          </div>
        </div>
        <p className="mt-14 border-t border-white/10 pt-8 text-center text-sm text-white/40">
          © {new Date().getFullYear()} {site.name}. Built for teams who care
          about AI discovery.
          <span className="mt-2 block">
            <Link href="/terms" className="transition hover:text-white/70">
              Terms
            </Link>
            <span className="mx-2">·</span>
            <Link href="/privacy" className="transition hover:text-white/70">
              Privacy
            </Link>
          </span>
        </p>
      </Container>
    </footer>
  );
}
