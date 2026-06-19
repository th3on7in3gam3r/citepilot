import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimDomainPanel } from "@/components/score/ClaimDomainPanel";
import { RelatedDomainsList } from "@/components/score/RelatedDomainsList";
import { ScorePageCta } from "@/components/score/ScorePageCta";
import { ScorePlatformGrid } from "@/components/score/ScorePlatformGrid";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { CiteStatusBadge } from "@/components/dashboard/CiteStatusBadge";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import {
  faviconUrl,
  formatScoreDate,
  scoreBandLabel,
} from "@/lib/score/score-labels";
import { getPublicScorePageData } from "@/lib/score/public-score";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain: rawDomain } = await params;
  const data = await getPublicScorePageData(rawDomain);
  if (!data) {
    return { title: "GEO Score", robots: { index: false, follow: false } };
  }

  const { domain, audit } = data;
  const title = clampSeoTitle(`${domain} GEO Score | CitePilot`);
  const description = clampMetaDescription(
    `See ${domain}'s AI citation score on ChatGPT, Perplexity, and Google AI — tracked by CitePilot.`,
  );
  const ogImage = `/api/og/score/${encodeURIComponent(domain)}`;
  const canonical = `${site.url}/score/${encodeURIComponent(domain)}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PublicScorePage({ params }: Props) {
  const { domain: rawDomain } = await params;
  const data = await getPublicScorePageData(rawDomain);
  if (!data) notFound();

  const { domain, audit, profile, platforms, relatedDomains } = data;
  const band = scoreBandLabel(audit.score);
  const verified = Boolean(profile?.verifiedAt);

  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1} className="bg-cream pt-16 md:pt-[4.5rem]">
        <Container className="py-10 md:py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
            <div className="min-w-0 space-y-10">
              {/* Header */}
              <header className="rounded-3xl border border-border bg-white p-8 shadow-sm md:p-10">
                <div className="flex flex-wrap items-start gap-4">
                  <Image
                    src={faviconUrl(domain)}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-xl border border-border bg-cream"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display truncate text-3xl font-bold text-ink md:text-4xl">
                        {domain}
                      </h1>
                      {verified && (
                        <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-xs font-semibold text-mint">
                          Verified owner
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      Last updated: {formatScoreDate(audit.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                      GEO Score
                    </p>
                    <p
                      className="font-display text-6xl font-bold tabular-nums md:text-7xl"
                      style={{ color: band.color }}
                    >
                      {audit.score}
                      <span className="text-3xl text-muted md:text-4xl">/100</span>
                    </p>
                  </div>
                  <div className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CiteStatusBadge score={audit.score} />
                      <p className="font-display text-lg font-bold text-ink">{band.label}</p>
                    </div>
                    <p className="mt-1 max-w-md text-sm text-muted">{band.description}</p>
                  </div>
                </div>
              </header>

              {/* Platform grid */}
              <section aria-labelledby="platform-grid-heading">
                <h2
                  id="platform-grid-heading"
                  className="font-display text-xl font-bold text-ink"
                >
                  AI platform presence
                </h2>
                <p className="mt-2 text-sm text-muted">
                  High-level citation status across six major AI answer engines.
                  Specific prompts and fix lists are available in the full report.
                </p>
                <div className="mt-5">
                  <ScorePlatformGrid platforms={platforms} />
                </div>
              </section>

              {/* Educational */}
              <section className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
                <h2 className="font-display text-xl font-bold text-ink">
                  What this means
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                  <p>
                    Your GEO score reflects how often AI engines like ChatGPT and
                    Perplexity cite your brand when buyers ask category questions —
                    not just how well you rank on Google.
                  </p>
                  <p>
                    B2B buyers increasingly shortlist vendors from AI answers before
                    they ever visit your site. If you&apos;re not cited, competitors
                    capture that discovery moment.
                  </p>
                  <p>
                    CitePilot tracks citation presence over time so you can measure
                    whether content and technical fixes actually move the needle.
                  </p>
                </div>
              </section>

              <ScorePageCta domain={domain} />

              <ClaimDomainPanel
                domain={domain}
                initialVerified={verified}
                initialIsPublic={profile?.isPublic ?? true}
              />
            </div>

            <div className="space-y-6">
              <RelatedDomainsList domains={relatedDomains} />

              <div className="rounded-2xl border border-border bg-white p-6 text-sm shadow-sm">
                <p className="font-semibold text-ink">Run your own audit</p>
                <p className="mt-2 text-muted">
                  Free 60-second scan across ChatGPT, Perplexity, and Google AI.
                </p>
                <Link
                  href={`/audit?domain=${encodeURIComponent(domain)}`}
                  className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline"
                >
                  Audit any domain →
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
