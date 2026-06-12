import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MarketingDarkHero } from "@/components/marketing/MarketingDarkHero";
import { Container } from "@/components/ui/Container";
import type { VsCompetitor } from "@/lib/marketing/vs-competitors";
import { vsCompetitors } from "@/lib/marketing/vs-competitors";

export function VsCompetitorPage({ competitor }: { competitor: VsCompetitor }) {
  const others = vsCompetitors.filter((c) => c.slug !== competitor.slug);

  return (
    <>
      <Header light overlay />
      <main className="bg-[#04060c]">
        <MarketingDarkHero
          eyebrow="Compare"
          title={competitor.title}
          description={competitor.description}
        >
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/audit"
              className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-bold text-white"
            >
              Run free citation audit
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80"
            >
              View pricing
            </Link>
          </div>
        </MarketingDarkHero>

        <Container className="py-14 md:py-20">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                {competitor.name}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {competitor.theirStrength}
              </p>
            </div>
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-glow">
                CitePilot
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {competitor.citePilotEdge}
              </p>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  <th className="px-4 py-3 font-semibold text-white/50">Feature</th>
                  <th className="px-4 py-3 font-semibold text-white/50">
                    {competitor.name}
                  </th>
                  <th className="px-4 py-3 font-semibold text-glow">CitePilot</th>
                </tr>
              </thead>
              <tbody>
                {competitor.rows.map((row) => (
                  <tr key={row.feature} className="border-b border-white/5">
                    <td className="px-4 py-3 font-medium text-white/80">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3 text-white/55">{row.them}</td>
                    <td className="px-4 py-3 text-white/75">{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mx-auto mt-12 max-w-3xl space-y-4">
            {competitor.faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <dt className="font-display font-bold text-white">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-white/60">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>

          {others.length > 0 && (
            <div className="mx-auto mt-12 max-w-3xl text-center">
              <p className="text-sm text-white/45">Also compare</p>
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                {others.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/vs/${c.slug}`}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-accent/40 hover:text-white"
                  >
                    vs {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
