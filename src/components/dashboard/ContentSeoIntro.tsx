import { DismissibleSeoIntro } from "@/components/dashboard/DismissibleSeoIntro";
import Link from "next/link";

type ContentSeoIntroProps = {
  /** `header` renders above the workspace UI; `footer` renders deep sections below it. */
  section?: "header" | "footer";
};

/** Server-rendered Content Studio overview for SEO and orientation. */
export function ContentSeoIntro({ section = "header" }: ContentSeoIntroProps) {
  if (section === "footer") {
    return (
      <DismissibleSeoIntro id="content-footer" className="mt-10">
        <div className="space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              CMS publishing and the citation feedback loop
            </h2>
            <p className="mt-2">
              Connect Webflow, WordPress, Ghost, Shopify, or Framer to push
              approved articles from the queue directly to your site. Publishing is
              deliberate — nothing auto-goes live without your review. After publish,
              re-run a GEO audit from{" "}
              <Link href="/dashboard/geo-audit" className="font-semibold text-accent">
                GEO Audit
              </Link>{" "}
              or{" "}
              <Link href="/dashboard" className="font-semibold text-accent">
                Overview
              </Link>{" "}
              to measure whether citation rate moved on the prompts you targeted.
            </p>
            <p className="mt-2">
              Field mapping and provider quirks are documented in the{" "}
              <Link href="/help/cms-publishing" className="font-semibold text-accent">
                CMS publishing guide
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">
              Content Studio vs Site Optimizer
            </h2>
            <p className="mt-2">
              <Link href="/dashboard/optimizer" className="font-semibold text-accent">
                Site Optimizer
              </Link>{" "}
              produces fix plans — copy-paste schema, robots.txt, and briefs for
              money-prompt gaps. Content Studio turns those briefs into full
              articles, manages your queue, and publishes to CMS.{" "}
              <Link href="/dashboard/growth-loop" className="font-semibold text-accent">
                Growth Loop
              </Link>{" "}
              automates daily generation on Pilot+.
            </p>
            <p className="mt-2">
              Competitor gaps live in{" "}
              <Link href="/dashboard/competitors" className="font-semibold text-accent">
                Competitors
              </Link>
              ; prompt trends in{" "}
              <Link href="/dashboard/analytics" className="font-semibold text-accent">
                Analytics
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="content-faq">
            <h2
              id="content-faq"
              className="font-display text-lg font-bold text-ink"
            >
              Content Studio FAQ
            </h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-semibold text-ink">
                  How does the content calendar pick topics?
                </dt>
                <dd className="mt-1">
                  The 30-day calendar ranks topics by citation gap impact from your
                  latest audit — comparison angles, answer guides, and FAQ hubs most
                  likely to move share on monitored money prompts.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  Can I start from a Site Optimizer brief?
                </dt>
                <dd className="mt-1">
                  Yes. Open a money-prompt fix in Site Optimizer and click
                  Generate article — the brief pre-fills the generator here.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">
                  Which CMS platforms are supported?
                </dt>
                <dd className="mt-1">
                  Webflow, WordPress, Ghost, Shopify, and Framer. Connect from CMS
                  &amp; publish, map fields once, then ship from your article queue.
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </DismissibleSeoIntro>
    );
  }

  return (
    <DismissibleSeoIntro id="content-header" className="mb-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
        Content Studio — generate, queue, and publish
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        Content Studio is where citation gaps become shipped articles. Generate
        branded GEO content from audit gaps or{" "}
        <Link href="/dashboard/optimizer" className="font-semibold text-accent">
          Site Optimizer
        </Link>{" "}
        briefs, review drafts in your article queue, and publish to Webflow,
        WordPress, Ghost, Shopify, or Framer.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        Use the sidebar to move through Create → Publish → Setup. For competitor
        intelligence and prompt analytics, open{" "}
        <Link href="/dashboard/competitors" className="font-semibold text-accent">
          Competitors
        </Link>{" "}
        and{" "}
        <Link href="/dashboard/analytics" className="font-semibold text-accent">
          Analytics
        </Link>
        . Baseline gaps with the{" "}
        <Link href="/audit" className="font-semibold text-accent">
          free citation audit
        </Link>{" "}
        before upgrading to Pilot for CMS publish and Growth Loop.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Create — generate and calendar
          </h2>
          <p className="mt-2">
            Generate drafts from money prompts, calendar slots, or Optimizer
            briefs. The 30-day content calendar ranks topics by gap impact so you
            ship comparison pages and answer guides that move citation share.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Publish — queue and CMS
          </h2>
          <p className="mt-2">
            Every draft lands in the article queue for review. Connect your CMS
            once, map fields, and publish approved posts without leaving the
            dashboard. Nothing goes live until you approve it.
          </p>
        </section>
      </div>
    </DismissibleSeoIntro>
  );
}
