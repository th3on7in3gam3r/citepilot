import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { VERIFICATION_DNS_PREFIX } from "@/lib/score/verification-constants";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Public GEO Score Pages & Domain Claiming",
  description: `How CitePilot public score pages work, where to find yours, and how to verify domain ownership with DNS TXT or a meta tag.`,
};

const mistakes = [
  {
    wrong: "Adding the TXT record in getcitepilot.com DNS",
    right: "Add DNS at your domain registrar or host — e.g. Cloudflare or Vercel DNS for biblefunlandstudios.com.",
  },
  {
    wrong: "Creating both @ and _citepilot-verify TXT records",
    right: "Pick one host option only. Either @ (root) or _citepilot-verify — not both.",
  },
  {
    wrong: "Putting only the token in the Value field",
    right: `Paste the full value including the prefix, e.g. ${VERIFICATION_DNS_PREFIX}abc123…`,
  },
] as const;

export default function PublicScorePagesHelpPage() {
  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1} className="min-h-screen bg-cream pt-24">
        <Container className="pb-16">
          <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Help
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              Public GEO score pages
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
              After you run a GEO audit, CitePilot publishes a free SEO landing page at{" "}
              <code className="rounded bg-cream px-1">/score/yourdomain.com</code>. It shows
              your headline GEO score and platform presence — useful for search and sharing.
              Your private proof report link (password optional) is separate.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/geo-audit"
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              >
                Open GEO Audit
              </Link>
              <Link
                href="/dashboard/help"
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface"
              >
                Help center
              </Link>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-ink">Where to find your page</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
              <li>
                Run an audit from <strong>Dashboard → GEO Audit</strong> (or onboarding).
              </li>
              <li>
                Open the <strong>Public score page</strong> link on that screen — or use{" "}
                <code className="rounded bg-cream px-1 text-ink">
                  {site.url.replace(/^https?:\/\//, "")}/score/yourdomain.com
                </code>
              </li>
              <li>
                Post-audit emails include links to your <strong>proof report</strong> and your{" "}
                <strong>public score page</strong>.
              </li>
            </ol>
          </section>

          <section className="mt-8 rounded-2xl border border-border bg-white p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-ink">Claim this page (verify ownership)</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              On your score page, scroll to <strong>Claim this page</strong>. After verification
              you can hide the page from Google or keep it public.
            </p>

            <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                DNS TXT — what to enter
              </p>
              <p className="mt-2 text-sm text-muted">
                Log in where you manage DNS for <em>your</em> domain (not {site.name}). Create{" "}
                <strong>one</strong> new record:
              </p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[7rem_1fr]">
                <dt className="font-semibold text-ink">Type</dt>
                <dd className="text-muted">TXT</dd>
                <dt className="font-semibold text-ink">Host / Name</dt>
                <dd className="text-muted">
                  Choose <strong>one</strong> option (depends on your DNS provider):
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>
                      <code className="text-ink">@</code> or leave blank → verifies{" "}
                      <code className="text-ink">yourdomain.com</code> (most common)
                    </li>
                    <li>
                      <code className="text-ink">_citepilot-verify</code> → verifies{" "}
                      <code className="text-ink">_citepilot-verify.yourdomain.com</code>{" "}
                      (use if @ is not allowed)
                    </li>
                  </ul>
                </dd>
                <dt className="font-semibold text-ink">Value</dt>
                <dd className="break-all font-mono text-xs text-ink">
                  {VERIFICATION_DNS_PREFIX}
                  <span className="text-muted">your-token-from-the-score-page</span>
                </dd>
              </dl>
              <p className="mt-4 text-sm text-muted">
                After saving DNS, wait a few minutes (up to an hour), then click{" "}
                <strong>Verify ownership</strong> on the score page.
              </p>
            </div>

            <p className="mt-6 text-sm text-muted">
              Prefer not to touch DNS? Use the <strong>Meta tag</strong> tab on the claim panel
              and add the tag to your homepage HTML.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/40 p-6 md:p-8">
            <h2 className="font-display text-lg font-bold text-ink">Common mistakes</h2>
            <ul className="mt-4 space-y-4">
              {mistakes.map((item) => (
                <li key={item.wrong} className="text-sm">
                  <p className="font-medium text-rose-800">✗ {item.wrong}</p>
                  <p className="mt-1 text-muted">✓ {item.right}</p>
                </li>
              ))}
            </ul>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
