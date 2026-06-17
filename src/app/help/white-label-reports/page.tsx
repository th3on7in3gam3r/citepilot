import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { reportsCnameTarget } from "@/lib/white-label/dns-guide";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

const CNAME_TARGET = reportsCnameTarget();

export const metadata: Metadata = {
  title: "White-Label Report Domain (CNAME) Setup",
  description: `How to point your agency subdomain (e.g. reports.youragency.com) to ${site.name} for branded proof report links.`,
};

const mistakes = [
  {
    wrong: "Adding the CNAME in getcitepilot.com DNS",
    right: "Add the CNAME in DNS for the domain you own (e.g. youragency.com in Cloudflare, Vercel, or GoDaddy).",
  },
  {
    wrong: `CNAME Value = reports.youragency.com (your own subdomain)`,
    right: `CNAME Value = ${CNAME_TARGET} (CitePilot's report server)`,
  },
  {
    wrong: "Entering reports.getcitepilot.com in CitePilot Settings",
    right: "Enter your subdomain in Settings, e.g. reports.youragency.com",
  },
] as const;

export default function WhiteLabelReportsHelpPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pt-24">
        <Container className="pb-16">
          <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Help · Fleet
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              White-label report domain (CNAME)
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
              Fleet lets you serve proof report links on <strong>your</strong> subdomain —
              for example <code className="rounded bg-cream px-1">reports.biblefunlandstudios.com</code>{" "}
              instead of getcitepilot.com. You configure this in two places: CitePilot Settings
              and your own domain&apos;s DNS. They are not the same thing.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/settings"
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              >
                Open Settings → White Label
              </Link>
              <Link
                href="/dashboard/help"
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface"
              >
                Help center
              </Link>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
                Step 1 · In CitePilot
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink">
                Go to <strong>Settings → White Label</strong> and enter{" "}
                <em>your</em> custom report subdomain:
              </p>
              <p className="mt-3 rounded-lg bg-white px-4 py-3 font-mono text-sm text-ink">
                reports.youragency.com
              </p>
              <p className="mt-3 text-sm text-muted">
                Replace <code>youragency.com</code> with the domain you control. Do{" "}
                <strong>not</strong> enter <code>{CNAME_TARGET}</code> here — that is
                CitePilot&apos;s server, not yours.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-900">
                Step 2 · In your DNS provider
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink">
                Log in where you manage DNS for <strong>youragency.com</strong> (Vercel
                Domains, Cloudflare, GoDaddy, Namecheap, etc.). Add one CNAME record:
              </p>
              <dl className="mt-3 overflow-hidden rounded-lg border border-border bg-white text-sm">
                <div className="grid grid-cols-[5rem_1fr] border-b border-border">
                  <dt className="border-r border-border px-3 py-2 font-semibold">Name</dt>
                  <dd className="px-3 py-2 font-mono">reports</dd>
                </div>
                <div className="grid grid-cols-[5rem_1fr] border-b border-border">
                  <dt className="border-r border-border px-3 py-2 font-semibold">Type</dt>
                  <dd className="px-3 py-2 font-mono">CNAME</dd>
                </div>
                <div className="grid grid-cols-[5rem_1fr]">
                  <dt className="border-r border-border px-3 py-2 font-semibold">Value</dt>
                  <dd className="px-3 py-2 font-mono">{CNAME_TARGET}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-muted">
                <strong>Name</strong> is only the subdomain part (<code>reports</code>).
                <strong> Value</strong> is always <code>{CNAME_TARGET}</code> — never your
                own domain.
              </p>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-red-200 bg-red-50/40 p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-ink">
              Common mistakes (and the errors they cause)
            </h2>
            <ul className="mt-4 space-y-4">
              {mistakes.map((item) => (
                <li
                  key={item.wrong}
                  className="rounded-xl border border-border bg-white p-4 text-sm"
                >
                  <p className="font-semibold text-red-700">✗ {item.wrong}</p>
                  <p className="mt-2 text-muted">
                    <span className="font-semibold text-emerald-700">✓ Instead:</span>{" "}
                    {item.right}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong>Vercel DNS error:</strong> &quot;The specified CNAME target cannot equal
              itself&quot; means you entered your own subdomain (e.g.{" "}
              <code>reports.youragency.com</code>) as the <strong>Value</strong>. Change
              Value to <code>{CNAME_TARGET}</code>.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-ink">Example walkthrough</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Agency domain: <code>biblefunlandstudios.com</code>, managed in Vercel Domains.
            </p>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
              <li>
                In CitePilot Settings → White Label, enter{" "}
                <code className="text-ink">reports.biblefunlandstudios.com</code>
              </li>
              <li>
                In Vercel → Domains → biblefunlandstudios.com → DNS Records → Add: Name{" "}
                <code className="text-ink">reports</code>, Type <code className="text-ink">CNAME</code>
                , Value <code className="text-ink">{CNAME_TARGET}</code>
              </li>
              <li>Wait 5–30 minutes for DNS to propagate</li>
              <li>Back in CitePilot, click <strong>Verify CNAME</strong></li>
            </ol>
            <p className="mt-4 text-sm text-muted">
              After verification, share links look like{" "}
              <code className="rounded bg-cream px-1">
                https://reports.biblefunlandstudios.com/r/abc123
              </code>
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-surface/40 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Still stuck?</h2>
            <p className="mt-2 text-sm text-muted">
              Email{" "}
              <a href={`mailto:${site.supportEmail}`} className="font-semibold text-accent">
                {site.supportEmail}
              </a>{" "}
              with your domain, DNS provider, and a screenshot of the CNAME record you added.
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
