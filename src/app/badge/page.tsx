import { BadgeEmbedClient } from "@/components/badge/BadgeEmbedClient";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { getSessionUserId } from "@/lib/auth/server";
import { getLatestAuditByDomain } from "@/lib/audit/run-audit";
import { normalizeDomain } from "@/lib/audit/site-analyzer";
import { listWorkspacesForUser } from "@/lib/server/workspace";
import { clampMetaDescription, clampSeoTitle } from "@/lib/seo/meta";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: clampSeoTitle("Embed your GEO Score badge"),
  description: clampMetaDescription(
    "Add a live GEO Score badge to your website. Show visitors your AI citation score and drive signups with CitePilot.",
  ),
  alternates: { canonical: `${site.url}/badge` },
  robots: { index: false, follow: true },
};

export default async function BadgePage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const params = await searchParams;
  const userId = await getSessionUserId();
  let domain = params.domain ? normalizeDomain(params.domain) : "";

  if (!domain && userId) {
    const workspaces = await listWorkspacesForUser(userId, 1);
    domain = workspaces[0]?.domain ? normalizeDomain(workspaces[0].domain) : "";
  }

  const hasAudit = domain ? Boolean(await getLatestAuditByDomain(domain)) : false;

  return (
    <>
      <Header />
      <main className="bg-background pt-16 md:pt-[4.5rem]">
        <Container className="py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Viral GEO badge
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
              Embed your GEO Score
            </h1>
            <p className="mt-3 text-muted">
              Show your live citation score on your site. When visitors click through, they land on
              CitePilot — a free acquisition loop for you and us.
            </p>

            {!userId ? (
              <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <p className="text-sm text-muted">
                  Sign in to get embed code for your audited domain.
                </p>
                <Link
                  href="/auth/sign-in?next=/badge"
                  className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
                >
                  Sign in →
                </Link>
              </div>
            ) : !domain ? (
              <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <p className="text-sm text-muted">
                  Add a domain in your workspace, then run an audit to generate your badge.
                </p>
                <Link
                  href="/dashboard/geo-audit"
                  className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
                >
                  Run audit →
                </Link>
              </div>
            ) : !hasAudit ? (
              <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8">
                <p className="text-sm text-ink">
                  No audit found for <strong>{domain}</strong> yet. Run an audit first — the badge
                  will show your live score once data exists.
                </p>
                <Link
                  href="/dashboard/geo-audit"
                  className="mt-4 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep"
                >
                  Run audit for {domain} →
                </Link>
                <div className="mt-8 border-t border-border pt-8">
                  <BadgeEmbedClient domain={domain} />
                </div>
              </div>
            ) : (
              <div className="mt-10">
                <p className="mb-6 text-sm text-muted">
                  Domain: <span className="font-semibold text-ink">{domain}</span>
                </p>
                <BadgeEmbedClient domain={domain} />
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
