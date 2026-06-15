import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CompareJsonLd } from "@/components/marketing/CompareJsonLd";
import { Container } from "@/components/ui/Container";
import {
  COMPARISON_ROW_LABELS,
  COMPARISON_ROW_ORDER,
  comparisonCellClass,
  competitorPageTitle,
  formatComparisonCell,
  competitors,
  type Competitor,
} from "@/lib/data/competitors";

function ComparisonTable({ competitor }: { competitor: Competitor }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04]">
            <th className="px-4 py-3.5 font-semibold text-white/50">Feature</th>
            <th className="px-4 py-3.5 font-semibold text-glow">CitePilot</th>
            <th className="px-4 py-3.5 font-semibold text-white/50">
              {competitor.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROW_ORDER.map((key) => {
            const row = competitor.comparisonRows[key];
            return (
              <tr key={key} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3.5 font-medium text-white/85">
                  {COMPARISON_ROW_LABELS[key]}
                </td>
                <td
                  className={`px-4 py-3.5 ${comparisonCellClass(row.citepilot)}`}
                >
                  {formatComparisonCell(row.citepilot)}
                </td>
                <td
                  className={`px-4 py-3.5 ${comparisonCellClass(row.competitor)}`}
                >
                  {formatComparisonCell(row.competitor)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Callout({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <article
      className={
        accent
          ? "rounded-2xl border border-accent/30 bg-accent/10 p-6 md:p-7"
          : "rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-7"
      }
    >
      <h3
        className={`font-display text-lg font-bold ${accent ? "text-glow" : "text-white"}`}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-base">
        {body}
      </p>
    </article>
  );
}

export function ComparisonPage({ competitor }: { competitor: Competitor }) {
  const others = competitors.filter((c) => c.slug !== competitor.slug);

  return (
    <>
      <CompareJsonLd competitor={competitor} />
      <Header light overlay />
      <main className="bg-[#04060c]">
        <div className="relative overflow-hidden border-b border-white/[0.06]">
          <div className="hero-premium-orb hero-premium-orb--cyan" aria-hidden />
          <div className="hero-premium-grid" aria-hidden />
          <Container className="relative z-10 py-16 md:py-20 lg:py-24">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/45">
              <Link href="/" className="hover:text-white/70">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white/60">Compare</span>
              <span className="mx-2">/</span>
              <span className="text-white/80">{competitor.name}</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-glow">
              {competitor.tagline}
            </p>
            <h1 className="font-display mt-4 max-w-4xl text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
              {competitorPageTitle(competitor.name)}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/65 md:text-lg">
              {competitor.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/audit"
                className="inline-flex rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_32px_rgba(14,165,233,0.3)] transition hover:bg-accent-deep"
              >
                Run a free citation audit — no {competitor.name} account needed
              </Link>
              <Link
                href="/pricing"
                className="inline-flex rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/40"
              >
                View pricing
              </Link>
            </div>
          </Container>
        </div>

        <Container className="py-14 md:py-20">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                {competitor.name} strengths
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {competitor.strengths.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="text-emerald-400/80">+</span>
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-white/45">{competitor.pricingNote}</p>
            </div>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-300/80">
                GEO gaps
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {competitor.limitations.map((l) => (
                  <li key={l} className="flex gap-2">
                    <span className="text-red-400/80">−</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <section className="mx-auto mt-14 max-w-5xl" aria-labelledby="compare-table">
            <h2
              id="compare-table"
              className="font-display text-center text-2xl font-bold text-white md:text-3xl"
            >
              Feature comparison
            </h2>
            <div className="mt-8">
              <ComparisonTable competitor={competitor} />
            </div>
          </section>

          <section
            className="mx-auto mt-14 grid max-w-5xl gap-6 md:mt-16 md:grid-cols-3"
            aria-labelledby="compare-callouts"
          >
            <h2 id="compare-callouts" className="sr-only">
              When to choose each tool
            </h2>
            <Callout
              title={`When to choose ${competitor.name}`}
              body={competitor.whenChooseThem}
            />
            <Callout title="When to choose CitePilot" body={competitor.whenChooseUs} accent />
            <Callout title="Use both together" body={competitor.useBothTogether} />
          </section>

          <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="compare-faq">
            <h2
              id="compare-faq"
              className="font-display text-center text-2xl font-bold text-white"
            >
              Frequently asked questions
            </h2>
            <dl className="mt-8 space-y-4">
              {competitor.faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <dt className="font-display font-bold text-white">{faq.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-white/60">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {others.length > 0 && (
            <div className="mx-auto mt-14 max-w-3xl text-center">
              <p className="text-sm text-white/45">Also compare</p>
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                {others.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/compare/${c.slug}`}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-accent/40 hover:text-white"
                  >
                    vs {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-accent/30 bg-gradient-to-b from-accent/15 to-transparent p-8 text-center md:p-10">
            <p className="font-display text-xl font-bold text-white md:text-2xl">
              See your citation baseline in 60 seconds
            </p>
            <p className="mt-3 text-sm text-white/60">
              No {competitor.name} subscription required — run a free GEO audit on your domain.
            </p>
            <Link
              href="/audit"
              className="mt-6 inline-flex rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-white"
            >
              Start free audit →
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
